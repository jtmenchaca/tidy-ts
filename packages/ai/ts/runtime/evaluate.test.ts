import { ai, build, tool } from "../../mod.ts";
import { aiTest } from "./testing.ts";
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";


const MODEL = "gpt-5.4-nano";
const openai = build.llmConfig({ modelId: MODEL });

// ─────────────────────────────────────────────────────────────────────────
// Example 1: single LlmNode — structured extraction inside mutateAsync
// ─────────────────────────────────────────────────────────────────────────

const SeverityInputSchema = z.object({ note: z.string() });
const SeverityOutputSchema = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
  confidence: z.number().min(0).max(1),
});

function buildSeverityTopology(model = MODEL) {
  const startNode = build.start({ name: "start", inputSchema: SeverityInputSchema });
  const llmNode = build.agentNode({
    name: "extract_severity",
    agent: build.agent({
      name: "extract_severity",
      llmConfig: build.llmConfig({ modelId: model }),
      systemPromptTemplate: `You are a clinical NLP system. Extract the dominant symptom severity from a clinical note.\n\nRead the clinical note and report the dominant symptom severity and your confidence.\n\nNote:\n{{note}}`,
      inputSchema: SeverityInputSchema,
      outputSchema: SeverityOutputSchema,
    }),
  });
  const endNode = build.end({ name: "end", outputSchema: SeverityOutputSchema });
  return build.create({
    id: "EXTRACT_SYMPTOM_SEVERITY",
    name: "EXTRACT_SYMPTOM_SEVERITY",
    startNode,
    endNode,
    nodes: [startNode, llmNode, endNode],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: startNode, toNode: llmNode }),
      build.controlFlowEdge({ name: "l->e", fromNode: llmNode, toNode: endNode }),
    ],
  });
}

aiTest({
  name: "ai.evaluate (single LlmNode) inside mutateAsync — structured extraction",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const topology = buildSeverityTopology();
    const df = createDataFrame([
      { id: 1, note: "Patient reports severe chest pain radiating to the left arm." },
      { id: 2, note: "Patient mentions occasional mild headaches, no other complaints." },
    ]);
    const result = await df.mutateAsync({
      extracted: (r) => ai.evaluate({ topology, input: { note: r.note } }),
    });
    const rows = result.toRows();
    expect(rows.length).toBe(2);
    for (const row of rows) {
      // Default `includeUsage: true` wraps the topology output in
      // `{ result, usage }` — read `row.extracted.result.severity`.
      const e = row.extracted.result;
      expect(["mild", "moderate", "severe"]).toContain(e.severity);
      expect(e.confidence).toBeGreaterThanOrEqual(0);
      expect(e.confidence).toBeLessThanOrEqual(1);
      expect(row.extracted.usage.totalTokens).toBeGreaterThan(0);
    }
  },
});

aiTest({
  name: "ai.evaluate — Result mode catches transport failures",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const topology = buildSeverityTopology("definitely-not-a-real-model-xyz");
    const r = await ai.evaluate({
      topology,
      input: { note: "test" },
      onError: "result",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(["LlmTransportError", "OutputParseError"]).toContain(r.error.name);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 2: multi-step LlmNode pipeline
//   Start → extract → critique → End
// First node extracts the raw answer; second node sanity-checks it and
// flags whether revision is needed. The second node's output is the
// topology output.
// ─────────────────────────────────────────────────────────────────────────

const TwoStepInputSchema = z.object({ question: z.string() });
const RawAnswerSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
const CritiqueSchema = z.object({
  question: z.string(),
  answer: z.string(),
  confident: z.boolean(),
});

aiTest({
  name: "ai.evaluate — multi-step LlmNode pipeline (pass-through data flow)",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const startNode = build.start({ name: "start", inputSchema: TwoStepInputSchema });
    const extractNode = build.agentNode({
      name: "answer",
      agent: build.agent({
        name: "answer",
        llmConfig: openai,
        systemPromptTemplate: `Answer the user's question concisely.\n\nQuestion: {{question}}`,
        inputSchema: TwoStepInputSchema,
        outputSchema: RawAnswerSchema,
      }),
    });
    const critiqueNode = build.agentNode({
      name: "critique",
      agent: build.agent({
        name: "critique",
        llmConfig: openai,
        systemPromptTemplate: `Given a Q/A pair, report whether the answer is confidently correct.\n\nQuestion: {{question}}\nAnswer: {{answer}}`,
        inputSchema: RawAnswerSchema,
        outputSchema: CritiqueSchema,
      }),
    });
    const endNode = build.end({ name: "end", outputSchema: CritiqueSchema });

    const topology = build.create({
      id: "ANSWER_AND_CRITIQUE",
      name: "ANSWER_AND_CRITIQUE",
      startNode,
      endNode,
      nodes: [startNode, extractNode, critiqueNode, endNode],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->a", fromNode: startNode, toNode: extractNode }),
        build.controlFlowEdge({ name: "a->c", fromNode: extractNode, toNode: critiqueNode }),
        build.controlFlowEdge({ name: "c->e", fromNode: critiqueNode, toNode: endNode }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: { question: "What is the capital of France?" },
    });

    expect(typeof out.result.question).toBe("string");
    expect(typeof out.result.answer).toBe("string");
    expect(typeof out.result.confident).toBe("boolean");
    expect(out.result.answer.toLowerCase()).toContain("paris");
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 3: AgentNode with a tool
//   Start → AgentNode (calculator tool) → End
// The agent is asked an arithmetic question; it must call the calculator
// tool to get the answer, then return the result in structured form.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — AgentNode with a calculator tool",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const InputSchema = z.object({ problem: z.string() });
    const OutputSchema = z.object({
      problem: z.string(),
      result: z.number(),
    });
    const CalcParamsSchema = z.object({
      a: z.number(),
      b: z.number(),
      op: z.enum(["add", "multiply"]),
    });
    const CalcResultSchema = z.object({ value: z.number() });

    let toolCalls = 0;
    const calculator = tool.server({
      name: "calculator",
      description:
        "Perform a single arithmetic operation. Always use this tool to compute the result.",
      paramsSchema: CalcParamsSchema,
      resultSchema: CalcResultSchema,
      execute: ({ a, b, op }) => {
        toolCalls++;
        return { value: op === "add" ? a + b : a * b };
      },
    });

    const agent = build.agent({
      name: "calc_agent",
      llmConfig: openai,
      systemPromptTemplate:
        "You answer arithmetic questions. You MUST call the calculator tool to compute the result — never compute by yourself. Then reply with the final answer in the required JSON shape.\n\nProblem: {{problem}}",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      tools: [calculator],
    });

    const startNode = build.start({ name: "start", inputSchema: InputSchema });
    const agentNode = build.agentNode({ name: "agent", agent });
    const endNode = build.end({ name: "end", outputSchema: OutputSchema });

    const topology = build.create({
      id: "CALC_WITH_TOOL",
      name: "CALC_WITH_TOOL",
      startNode,
      endNode,
      nodes: [startNode, agentNode, endNode],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->a", fromNode: startNode, toNode: agentNode }),
        build.controlFlowEdge({ name: "a->e", fromNode: agentNode, toNode: endNode }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: { problem: "What is 17 multiplied by 4?" },
    });

    expect(out.result.result).toBe(68);
    expect(toolCalls).toBeGreaterThanOrEqual(1);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 4: DAG with explicit data-flow edges
//   Start → sentiment → topic → combine → End
// The combine node consumes outputs from both prior nodes via explicit
// DataFlowEdges, demonstrating non-adjacent data flow (combine doesn't
// just pass through from topic — it pulls fields from both sentiment AND
// topic, plus original input).
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — DAG with explicit data-flow edges (non-adjacent fan-in)",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const InputSchema = z.object({ text: z.string() });
    const SentimentSchema = z.object({
      sentiment: z.enum(["positive", "negative", "neutral"]),
    });
    const TopicSchema = z.object({ topic: z.string() });
    const CombineInputSchema = z.object({
      text: z.string(),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      topic: z.string(),
    });
    const CombineOutputSchema = z.object({
      summary: z.string(),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      topic: z.string(),
    });

    const startNode = build.start({ name: "start", inputSchema: InputSchema });
    const sentimentNode = build.agentNode({
      name: "sentiment",
      agent: build.agent({
        name: "sentiment",
        llmConfig: openai,
        systemPromptTemplate: `Classify the sentiment of the text.\n\nText: {{text}}`,
        inputSchema: InputSchema,
        outputSchema: SentimentSchema,
      }),
    });
    const topicNode = build.agentNode({
      name: "topic",
      agent: build.agent({
        name: "topic",
        llmConfig: openai,
        systemPromptTemplate: `Identify the topic of the text in one short noun phrase.\n\nText: {{text}}`,
        inputSchema: InputSchema,
        outputSchema: TopicSchema,
      }),
    });
    const combineNode = build.agentNode({
      name: "combine",
      agent: build.agent({
        name: "combine",
        llmConfig: openai,
        systemPromptTemplate: `Given a text, its sentiment, and its topic, write a one-sentence summary that reflects all three. Preserve the provided sentiment and topic in the output.\n\nText: {{text}}\nSentiment: {{sentiment}}\nTopic: {{topic}}`,
        inputSchema: CombineInputSchema,
        outputSchema: CombineOutputSchema,
      }),
    });
    const endNode = build.end({ name: "end", outputSchema: CombineOutputSchema });

    const topology = build.create({
      id: "ANALYZE_TEXT_DAG",
      name: "ANALYZE_TEXT_DAG",
      startNode,
      endNode,
      nodes: [startNode, sentimentNode, topicNode, combineNode, endNode],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->sent", fromNode: startNode, toNode: sentimentNode }),
        build.controlFlowEdge({ name: "sent->top", fromNode: sentimentNode, toNode: topicNode }),
        build.controlFlowEdge({ name: "top->comb", fromNode: topicNode, toNode: combineNode }),
        build.controlFlowEdge({ name: "comb->e", fromNode: combineNode, toNode: endNode }),
      ],
      dataFlowConnections: [
        // sentiment reads `text` from start
        build.dataFlowEdge({
          name: "start.text->sentiment.text",
          sourceNode: startNode,
          sourceOutput: "text",
          destinationNode: sentimentNode,
          destinationInput: "text",
        }),
        // topic also reads `text` from start (not from sentiment's outputs)
        build.dataFlowEdge({
          name: "start.text->topic.text",
          sourceNode: startNode,
          sourceOutput: "text",
          destinationNode: topicNode,
          destinationInput: "text",
        }),
        // combine pulls `text` from startNode's outputs
        build.dataFlowEdge({
          name: "start.text->combine.text",
          sourceNode: startNode,
          sourceOutput: "text",
          destinationNode: combineNode,
          destinationInput: "text",
        }),
        // combine pulls `sentiment` from sentimentNode's outputs
        build.dataFlowEdge({
          name: "sent.sentiment->combine.sentiment",
          sourceNode: sentimentNode,
          sourceOutput: "sentiment",
          destinationNode: combineNode,
          destinationInput: "sentiment",
        }),
        // combine pulls `topic` from topicNode's outputs
        build.dataFlowEdge({
          name: "top.topic->combine.topic",
          sourceNode: topicNode,
          sourceOutput: "topic",
          destinationNode: combineNode,
          destinationInput: "topic",
        }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: { text: "I love the new espresso machine — best purchase this year." },
    });

    expect(typeof out.result.summary).toBe("string");
    expect(["positive", "negative", "neutral"]).toContain(out.result.sentiment);
    expect(typeof out.result.topic).toBe("string");
    expect(out.result.topic.length).toBeGreaterThan(0);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 5: BranchingNode — route to different LLM extractors based on
// an upstream classification.
//
//   Start → classify → Branch → (urgent | routine) → End
//
// classify produces { kind: "urgent" | "routine" }. The BranchingNode
// reads `kind` and chooses which extractor runs next.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — BranchingNode routes to different downstream nodes",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const InputSchema = z.object({ message: z.string() });
    const ClassifySchema = z.object({
      kind: z.enum(["urgent", "routine"]),
    });
    const UrgentSchema = z.object({
      kind: z.literal("urgent"),
      action: z.string(),
    });
    const RoutineSchema = z.object({
      kind: z.literal("routine"),
      action: z.string(),
    });
    const OutputSchema = z.object({
      kind: z.enum(["urgent", "routine"]),
      action: z.string(),
    });

    const startNode = build.start({ name: "start", inputSchema: InputSchema });
    const classifyNode = build.agentNode({
      name: "classify",
      agent: build.agent({
        name: "classify",
        llmConfig: openai,
        systemPromptTemplate: `Classify the message as 'urgent' (life/safety-critical) or 'routine' (everything else).\n\nMessage: {{message}}`,
        inputSchema: InputSchema,
        outputSchema: ClassifySchema,
      }),
    });
    const branchNode = build.branching({
      name: "branch_on_kind",
      mapping: { urgent: "urgent", routine: "routine" },
      inputs: [{
        jsonSchema: { title: "kind", type: "string" },
        title: "kind",
        type: "string",
      }],
    });
    const urgentNode = build.agentNode({
      name: "urgent_extract",
      agent: build.agent({
        name: "urgent_extract",
        llmConfig: openai,
        systemPromptTemplate: `Produce a single short next-action sentence for an URGENT issue. Set kind to 'urgent'.\n\nMessage: {{message}}\nKind: {{kind}}`,
        inputSchema: z.object({ message: z.string(), kind: z.string() }),
        outputSchema: UrgentSchema,
      }),
    });
    const routineNode = build.agentNode({
      name: "routine_extract",
      agent: build.agent({
        name: "routine_extract",
        llmConfig: openai,
        systemPromptTemplate: `Produce a single short next-action sentence for a ROUTINE issue. Set kind to 'routine'.\n\nMessage: {{message}}\nKind: {{kind}}`,
        inputSchema: z.object({ message: z.string(), kind: z.string() }),
        outputSchema: RoutineSchema,
      }),
    });
    const endNode = build.end({ name: "end", outputSchema: OutputSchema });

    const topology = build.create({
      id: "BRANCH_ON_URGENCY",
      name: "BRANCH_ON_URGENCY",
      startNode,
      endNode,
      nodes: [
        startNode,
        classifyNode,
        branchNode,
        urgentNode,
        routineNode,
        endNode,
      ],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->c", fromNode: startNode, toNode: classifyNode }),
        build.controlFlowEdge({ name: "c->b", fromNode: classifyNode, toNode: branchNode }),
        // Branch routes: the runner picks the edge whose fromBranch matches
        // the value of mapping[input.kind].
        build.controlFlowEdge({ name: "b->urgent", fromNode: branchNode, toNode: urgentNode, fromBranch: "urgent" }),
        build.controlFlowEdge({ name: "b->routine", fromNode: branchNode, toNode: routineNode, fromBranch: "routine" }),
        build.controlFlowEdge({ name: "urgent->e", fromNode: urgentNode, toNode: endNode }),
        build.controlFlowEdge({ name: "routine->e", fromNode: routineNode, toNode: endNode }),
      ],
      dataFlowConnections: [
        // branch reads `kind` from classifyNode
        build.dataFlowEdge({
          name: "classify.kind->branch.kind",
          sourceNode: classifyNode,
          sourceOutput: "kind",
          destinationNode: branchNode,
          destinationInput: "kind",
        }),
        // urgent/routine each need both `message` from start and `kind` from classify
        build.dataFlowEdge({
          name: "start.message->urgent.message",
          sourceNode: startNode,
          sourceOutput: "message",
          destinationNode: urgentNode,
          destinationInput: "message",
        }),
        build.dataFlowEdge({
          name: "classify.kind->urgent.kind",
          sourceNode: classifyNode,
          sourceOutput: "kind",
          destinationNode: urgentNode,
          destinationInput: "kind",
        }),
        build.dataFlowEdge({
          name: "start.message->routine.message",
          sourceNode: startNode,
          sourceOutput: "message",
          destinationNode: routineNode,
          destinationInput: "message",
        }),
        build.dataFlowEdge({
          name: "classify.kind->routine.kind",
          sourceNode: classifyNode,
          sourceOutput: "kind",
          destinationNode: routineNode,
          destinationInput: "kind",
        }),
      ],
    });

    const urgent = await ai.evaluate({
      topology,
      input: { message: "Patient unresponsive, no pulse — need immediate help." },
    });
    expect(urgent.result.kind).toBe("urgent");
    expect(urgent.result.action.length).toBeGreaterThan(0);

    const routine = await ai.evaluate({
      topology,
      input: { message: "Reminder: please confirm your next appointment date." },
    });
    expect(routine.result.kind).toBe("routine");
    expect(routine.result.action.length).toBeGreaterThan(0);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 6: MapNode — run a per-note extraction subflow over a list of
// clinical notes, then reduce.
//
//   Outer: Start → MapNode(subflow) → End
//   Inner subflow: Start → LlmNode (extract severity score) → End
//
// The outer input is { notes: string[] }. The MapNode iterates over
// `notes`, runs the subflow on each, and reduces `score` via average.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — MapNode iterates a subflow over a list (average reducer)",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const SubInputSchema = z.object({ note: z.string() });
    const SubOutputSchema = z.object({
      score: z.number().min(0).max(10),
    });
    const OuterInputSchema = z.object({ notes: z.array(z.string()) });
    const OuterOutputSchema = z.object({ score: z.number() });

    // Inner subflow: rate the note's symptom severity on a 0–10 scale.
    const subStart = build.start({ name: "sub_start", inputSchema: SubInputSchema });
    const subLlm = build.agentNode({
      name: "rate_note",
      agent: build.agent({
        name: "rate_note",
        llmConfig: openai,
        systemPromptTemplate: `Rate the dominant symptom severity in the clinical note on an integer 0–10 scale. 0 = none, 10 = life-threatening. Return only the score.\n\nNote: {{note}}`,
        inputSchema: SubInputSchema,
        outputSchema: SubOutputSchema,
      }),
    });
    const subEnd = build.end({ name: "sub_end", outputSchema: SubOutputSchema });
    const subflow = build.create({
      id: "RATE_NOTE",
      name: "RATE_NOTE",
      startNode: subStart,
      endNode: subEnd,
      nodes: [subStart, subLlm, subEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "ss->sl", fromNode: subStart, toNode: subLlm }),
        build.controlFlowEdge({ name: "sl->se", fromNode: subLlm, toNode: subEnd }),
      ],
    });

    // Outer: pipe the list of notes through a MapNode, average the scores.
    const outerStart = build.start({ name: "start", inputSchema: OuterInputSchema });
    const mapNode = build.map({
      name: "map_over_notes",
      subflow,
      iterateOver: "note", // sub-input field name
      reducers: { score: "average" },
      // outer input has `notes: string[]`; map node treats `note` as the
      // iteration target. We re-map the outer input via a data-flow edge below.
      inputs: [{
        jsonSchema: { title: "note", type: "array" },
        title: "note",
        type: "array",
      }],
      outputs: [{
        jsonSchema: { title: "score", type: "number" },
        title: "score",
        type: "number",
      }],
    });
    const outerEnd = build.end({ name: "end", outputSchema: OuterOutputSchema });

    const topology = build.create({
      id: "RATE_NOTES",
      name: "RATE_NOTES",
      startNode: outerStart,
      endNode: outerEnd,
      nodes: [outerStart, mapNode, outerEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->m", fromNode: outerStart, toNode: mapNode }),
        build.controlFlowEdge({ name: "m->e", fromNode: mapNode, toNode: outerEnd }),
      ],
      dataFlowConnections: [
        // Wire outerStart.notes (string[]) to mapNode.note (the iteration list).
        build.dataFlowEdge({
          name: "start.notes->map.note",
          sourceNode: outerStart,
          sourceOutput: "notes",
          destinationNode: mapNode,
          destinationInput: "note",
        }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: {
        notes: [
          "Patient reports severe chest pain radiating to the left arm.",
          "Patient mentions a mild headache, otherwise feels well.",
        ],
      },
    });

    expect(typeof out.result.score).toBe("number");
    // Average of one severe + one mild note — expect somewhere in the
    // middle range. Loose bounds because the model has interpretive room.
    expect(out.result.score).toBeGreaterThan(0);
    expect(out.result.score).toBeLessThanOrEqual(10);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 7: retry — flaky tool succeeds after a transient failure.
//
// We make the tool throw on its first call and succeed on the second.
// With retry enabled (and the default policy that retries non-parse
// errors), the topology completes successfully.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — retry recovers from a transient tool failure",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const InputSchema = z.object({ q: z.string() });
    const OutputSchema = z.object({ answer: z.string() });
    const ToolParams = z.object({ n: z.number() });
    const ToolResult = z.object({ ok: z.boolean(), n: z.number() });

    let calls = 0;
    const flakyTool = tool.server({
      name: "flaky",
      description: "Call this once to get the value of n. Always invoke it.",
      paramsSchema: ToolParams,
      resultSchema: ToolResult,
      execute: ({ n }) => {
        calls++;
        if (calls === 1) {
          throw new Error("transient failure");
        }
        return { ok: true, n };
      },
    });

    const agent = build.agent({
      name: "flaky_agent",
      llmConfig: openai,
      systemPromptTemplate:
        "Use the `flaky` tool once with n=42, then reply with the answer string '42 confirmed'.\n\nQuestion: {{q}}",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      tools: [flakyTool],
    });

    const startNode = build.start({ name: "start", inputSchema: InputSchema });
    const agentNode = build.agentNode({ name: "agent", agent });
    const endNode = build.end({ name: "end", outputSchema: OutputSchema });

    const topology = build.create({
      id: "RETRY_RECOVERY",
      name: "RETRY_RECOVERY",
      startNode,
      endNode,
      nodes: [startNode, agentNode, endNode],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->a", fromNode: startNode, toNode: agentNode }),
        build.controlFlowEdge({ name: "a->e", fromNode: agentNode, toNode: endNode }),
      ],
    });

    // ToolError is not retried by the default policy (tool failures can be
    // deterministic — retrying could mask real bugs). Opt in explicitly via
    // a custom shouldRetry that demonstrates the surface.
    const out = await ai.evaluate({
      topology,
      input: { q: "What is the value?" },
      retry: {
        backoff: "exponential",
        maxRetries: 2,
        baseDelay: 10,
        shouldRetry: (error) =>
          error.name === "ToolError" || error.name === "LlmTransportError",
      },
    });

    expect(typeof out.result.answer).toBe("string");
    // The flaky tool must have been called at least twice — once failing,
    // once succeeding under retry.
    expect(calls).toBeGreaterThanOrEqual(2);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 9: usage telemetry — opt-in via `includeUsage: true`.
// Returns { result, usage } with per-node latency + token counts.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — includeUsage returns per-node tokens and latency",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const topology = buildSeverityTopology();
    const out = await ai.evaluate({
      topology,
      input: { note: "Patient reports mild headache." },
      includeUsage: true,
    });

    // `result` is the topology's structured output, type-inferred.
    expect(["mild", "moderate", "severe"]).toContain(out.result.severity);
    expect(out.result.confidence).toBeGreaterThanOrEqual(0);

    // `usage` has shape we promised.
    expect(out.usage.perNode.length).toBe(1); // one AgentNode in this topology
    const llm = out.usage.perNode[0];
    expect(llm.componentType).toBe("AgentNode");
    expect(llm.nodeName).toBe("extract_severity");
    expect(llm.model).toBe(MODEL);
    expect(llm.latencyMs).toBeGreaterThan(0);
    // Token counts come from the OpenAI response. They should be positive.
    expect(llm.totalTokens).toBeGreaterThan(0);
    expect(out.usage.totalLatencyMs).toBeGreaterThan(0);
    expect(out.usage.totalTokens).toBeGreaterThan(0);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 10: ParallelMapNode — same subflow as MapNode, but iterations
// run concurrently. Asserts that wall-clock latency is less than the
// equivalent serial run.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — ParallelMapNode runs subflows concurrently",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const SubInputSchema = z.object({ note: z.string() });
    const SubOutputSchema = z.object({ score: z.number().min(0).max(10) });
    const OuterInputSchema = z.object({ notes: z.array(z.string()) });
    const OuterOutputSchema = z.object({ score: z.number() });

    const subStart = build.start({ name: "sub_start", inputSchema: SubInputSchema });
    const subLlm = build.agentNode({
      name: "rate_note",
      agent: build.agent({
        name: "rate_note",
        llmConfig: openai,
        systemPromptTemplate: `Rate the dominant symptom severity on an integer 0–10 scale. Return only the score.\n\nNote: {{note}}`,
        inputSchema: SubInputSchema,
        outputSchema: SubOutputSchema,
      }),
    });
    const subEnd = build.end({ name: "sub_end", outputSchema: SubOutputSchema });
    const subflow = build.create({
      id: "RATE_NOTE",
      name: "RATE_NOTE",
      startNode: subStart,
      endNode: subEnd,
      nodes: [subStart, subLlm, subEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "ss->sl", fromNode: subStart, toNode: subLlm }),
        build.controlFlowEdge({ name: "sl->se", fromNode: subLlm, toNode: subEnd }),
      ],
    });

    const outerStart = build.start({ name: "start", inputSchema: OuterInputSchema });
    const pmap = build.parallelMap({
      name: "pmap_over_notes",
      subflow,
      iterateOver: "note",
      reducers: { score: "average" },
      concurrency: 4,
      inputs: [{
        jsonSchema: { title: "note", type: "array" },
        title: "note",
        type: "array",
      }],
      outputs: [{
        jsonSchema: { title: "score", type: "number" },
        title: "score",
        type: "number",
      }],
    });
    const outerEnd = build.end({ name: "end", outputSchema: OuterOutputSchema });
    const topology = build.create({
      id: "RATE_NOTES_PARALLEL",
      name: "RATE_NOTES_PARALLEL",
      startNode: outerStart,
      endNode: outerEnd,
      nodes: [outerStart, pmap, outerEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->pm", fromNode: outerStart, toNode: pmap }),
        build.controlFlowEdge({ name: "pm->e", fromNode: pmap, toNode: outerEnd }),
      ],
      dataFlowConnections: [
        build.dataFlowEdge({
          name: "start.notes->pmap.note",
          sourceNode: outerStart,
          sourceOutput: "notes",
          destinationNode: pmap,
          destinationInput: "note",
        }),
      ],
    });

    // Four notes — with concurrency 4 they should overlap heavily.
    const t0 = performance.now();
    const out = await ai.evaluate({
      topology,
      input: {
        notes: [
          "Patient reports severe chest pain radiating to the left arm.",
          "Patient mentions occasional mild headaches.",
          "Patient with intermittent moderate joint stiffness.",
          "Patient reports a mild dry cough lasting two days.",
        ],
      },
      includeUsage: true,
    });
    const elapsedMs = performance.now() - t0;

    expect(typeof out.result.score).toBe("number");
    expect(out.result.score).toBeGreaterThanOrEqual(0);
    expect(out.result.score).toBeLessThanOrEqual(10);

    // Sanity: 4 LlmNodes ran (one per subflow iteration). Their summed
    // per-node latency should noticeably exceed wall-clock, indicating
    // concurrency. (`totalLatencyMs` is sum across nodes.)
    expect(out.usage.perNode.length).toBe(4);
    expect(out.usage.totalLatencyMs).toBeGreaterThan(elapsedMs);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 11: ParallelFlowNode — runs two independent subflows on the same
// input, merging their outputs.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — ParallelFlowNode merges concurrent subflow outputs",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const InputSchema = z.object({ text: z.string() });
    const SentimentSchema = z.object({
      sentiment: z.enum(["positive", "negative", "neutral"]),
    });
    const TopicSchema = z.object({ topic: z.string() });
    const MergedSchema = z.object({
      sentiment: z.enum(["positive", "negative", "neutral"]),
      topic: z.string(),
    });

    // Subflow A: sentiment.
    const sStart = build.start({ name: "s_start", inputSchema: InputSchema });
    const sLlm = build.agentNode({
      name: "sentiment",
      agent: build.agent({
        name: "sentiment",
        llmConfig: openai,
        systemPromptTemplate: `Classify the sentiment of the text.\n\nText: {{text}}`,
        inputSchema: InputSchema,
        outputSchema: SentimentSchema,
      }),
    });
    const sEnd = build.end({ name: "s_end", outputSchema: SentimentSchema });
    const sentimentFlow = build.create({
      id: "SENTIMENT_FLOW",
      name: "SENTIMENT_FLOW",
      startNode: sStart,
      endNode: sEnd,
      nodes: [sStart, sLlm, sEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "ss->sl", fromNode: sStart, toNode: sLlm }),
        build.controlFlowEdge({ name: "sl->se", fromNode: sLlm, toNode: sEnd }),
      ],
    });

    // Subflow B: topic.
    const tStart = build.start({ name: "t_start", inputSchema: InputSchema });
    const tLlm = build.agentNode({
      name: "topic",
      agent: build.agent({
        name: "topic",
        llmConfig: openai,
        systemPromptTemplate: `Identify the topic of the text in one short noun phrase.\n\nText: {{text}}`,
        inputSchema: InputSchema,
        outputSchema: TopicSchema,
      }),
    });
    const tEnd = build.end({ name: "t_end", outputSchema: TopicSchema });
    const topicFlow = build.create({
      id: "TOPIC_FLOW",
      name: "TOPIC_FLOW",
      startNode: tStart,
      endNode: tEnd,
      nodes: [tStart, tLlm, tEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "ts->tl", fromNode: tStart, toNode: tLlm }),
        build.controlFlowEdge({ name: "tl->te", fromNode: tLlm, toNode: tEnd }),
      ],
    });

    const outerStart = build.start({ name: "start", inputSchema: InputSchema });
    const pflow = build.parallelFlow({
      name: "pflow",
      subflows: [sentimentFlow, topicFlow],
      inputs: [{
        jsonSchema: { title: "text", type: "string" },
        title: "text",
        type: "string",
      }],
      outputs: [
        {
          jsonSchema: { title: "sentiment", type: "string" },
          title: "sentiment",
          type: "string",
        },
        { jsonSchema: { title: "topic", type: "string" }, title: "topic", type: "string" },
      ],
    });
    const outerEnd = build.end({ name: "end", outputSchema: MergedSchema });

    const topology = build.create({
      id: "ANALYZE_PARALLEL",
      name: "ANALYZE_PARALLEL",
      startNode: outerStart,
      endNode: outerEnd,
      nodes: [outerStart, pflow, outerEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->p", fromNode: outerStart, toNode: pflow }),
        build.controlFlowEdge({ name: "p->e", fromNode: pflow, toNode: outerEnd }),
      ],
      dataFlowConnections: [
        build.dataFlowEdge({
          name: "start.text->pflow.text",
          sourceNode: outerStart,
          sourceOutput: "text",
          destinationNode: pflow,
          destinationInput: "text",
        }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: { text: "I love the new espresso machine — best purchase this year." },
    });

    expect(["positive", "negative", "neutral"]).toContain(out.result.sentiment);
    expect(typeof out.result.topic).toBe("string");
    expect(out.result.topic.length).toBeGreaterThan(0);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 12: CatchExceptionNode — subflow throws (bad model), control
// routes to the caught_exception_branch path, which writes a fallback.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — CatchExceptionNode routes failure to fallback path",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const InputSchema = z.object({ note: z.string() });
    const SuccessShape = z.object({
      severity: z.enum(["mild", "moderate", "severe"]),
      confidence: z.number(),
    });
    const FallbackShape = z.object({
      severity: z.literal("unknown"),
      reason: z.string(),
    });
    const OutputSchema = z.union([SuccessShape, FallbackShape]);

    // Inner subflow that will fail: bad model name.
    const subStart = build.start({ name: "sub_start", inputSchema: InputSchema });
    const subLlm = build.agentNode({
      name: "broken_extractor",
      agent: build.agent({
        name: "broken_extractor",
        llmConfig: build.llmConfig({ modelId: "definitely-not-a-real-model-xyz" }),
        systemPromptTemplate: "Analyze: {{note}}",
        inputSchema: InputSchema,
        outputSchema: SuccessShape,
      }),
    });
    const subEnd = build.end({ name: "sub_end", outputSchema: SuccessShape });
    const innerFlow = build.create({
      id: "BROKEN_EXTRACT",
      name: "BROKEN_EXTRACT",
      startNode: subStart,
      endNode: subEnd,
      nodes: [subStart, subLlm, subEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "ss->sl", fromNode: subStart, toNode: subLlm }),
        build.controlFlowEdge({ name: "sl->se", fromNode: subLlm, toNode: subEnd }),
      ],
    });

    // Fallback path: a single LlmNode embedded in the outer topology (no
    // nested StartNode/EndNode — those exist only at topology boundaries).
    const fbLlm = build.agentNode({
      name: "fallback_explain",
      agent: build.agent({
        name: "fallback_explain",
        llmConfig: openai,
        systemPromptTemplate: `You produce a fallback record when extraction failed. Return severity='unknown' and a one-sentence reason summary derived from the exception info string.\n\nException info: {{caught_exception_info}}`,
        inputSchema: z.object({ caught_exception_info: z.string().nullable() }),
        outputSchema: FallbackShape,
      }),
    });

    const outerStart = build.start({ name: "start", inputSchema: InputSchema });
    const catchNode = build.catchException({
      name: "catch",
      subflow: innerFlow,
    });
    const outerEnd = build.end({ name: "end", outputSchema: OutputSchema });

    const topology = build.create({
      id: "EXTRACT_WITH_FALLBACK",
      name: "EXTRACT_WITH_FALLBACK",
      startNode: outerStart,
      endNode: outerEnd,
      nodes: [outerStart, catchNode, fbLlm, outerEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->c", fromNode: outerStart, toNode: catchNode }),
        // success path: catch → end
        build.controlFlowEdge({ name: "c->e:next", fromNode: catchNode, toNode: outerEnd, fromBranch: "next" }),
        // exception path: catch → fallback LLM → end
        build.controlFlowEdge({
          name: "c->fb:exception",
          fromNode: catchNode,
          toNode: fbLlm,
          fromBranch: build.CAUGHT_EXCEPTION_BRANCH,
        }),
        build.controlFlowEdge({ name: "fb_llm->end", fromNode: fbLlm, toNode: outerEnd }),
      ],
      dataFlowConnections: [
        // The catch node's caught_exception_info feeds the fallback LLM directly.
        // (StartNodes expose their topology's inputs as outputs, not inputs —
        // they don't receive data-flow edges.)
        build.dataFlowEdge({
          name: "catch.exinfo->fb_llm.exinfo",
          sourceNode: catchNode,
          sourceOutput: "caught_exception_info",
          destinationNode: fbLlm,
          destinationInput: "caught_exception_info",
        }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: { note: "Patient reports severe chest pain." },
    });

    // The broken model causes the catch to fire — fallback path runs.
    const r = out.result;
    if (r.severity === "unknown") {
      expect(typeof r.reason).toBe("string");
      expect(r.reason.length).toBeGreaterThan(0);
    } else {
      throw new Error(
        `Expected fallback path to fire (severity='unknown'); got: ${JSON.stringify(r)}`,
      );
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 13: FlowNode — embed a published, versioned subflow inside an
// outer build.
//
//   EXTRACT_SYMPTOM_SEVERITY (versioned subflow, citable)
//   becomes one node inside ANALYZE_PATIENT_NOTE.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — FlowNode composes a versioned subflow",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    // ── Inner subflow (publishable; has id + version + citation) ─────
    const InnerInputSchema = z.object({ note: z.string() });
    const InnerOutputSchema = z.object({
      severity: z.enum(["mild", "moderate", "severe"]),
      confidence: z.number().min(0).max(1),
    });
    const innerStart = build.start({ name: "i_start", inputSchema: InnerInputSchema });
    const innerLlm = build.agentNode({
      name: "rate",
      agent: build.agent({
        name: "rate",
        llmConfig: openai,
        systemPromptTemplate: `Extract dominant symptom severity from the note.\n\nNote: {{note}}`,
        inputSchema: InnerInputSchema,
        outputSchema: InnerOutputSchema,
      }),
    });
    const innerEnd = build.end({ name: "i_end", outputSchema: InnerOutputSchema });
    const innerFlow = build.create({
      id: "EXTRACT_SYMPTOM_SEVERITY",
      name: "EXTRACT_SYMPTOM_SEVERITY",
      version: "1.0.0",
      citation: "Menchaca et al., 2026 (tidy-ts/ai v0.1)",
      startNode: innerStart,
      endNode: innerEnd,
      nodes: [innerStart, innerLlm, innerEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "is->il", fromNode: innerStart, toNode: innerLlm }),
        build.controlFlowEdge({ name: "il->ie", fromNode: innerLlm, toNode: innerEnd }),
      ],
    });

    // Confirm citable identity round-trips on the value.
    expect(innerFlow.id).toBe("EXTRACT_SYMPTOM_SEVERITY");
    expect(innerFlow.version).toBe("1.0.0");
    expect(innerFlow.citation).toBe("Menchaca et al., 2026 (tidy-ts/ai v0.1)");

    // ── Outer topology embeds innerFlow as a FlowNode ──────────────
    const OuterInputSchema = z.object({ note: z.string() });
    const OuterOutputSchema = z.object({
      severity: z.enum(["mild", "moderate", "severe"]),
      confidence: z.number(),
      flagged_urgent: z.boolean(),
    });
    const outerStart = build.start({ name: "o_start", inputSchema: OuterInputSchema });
    const inner = build.flow({ name: "inner_extract", subflow: innerFlow });
    const decide = build.agentNode({
      name: "flag",
      agent: build.agent({
        name: "flag",
        llmConfig: openai,
        systemPromptTemplate: `Given an extracted severity + confidence, return the original severity, confidence, and whether the case warrants urgent escalation.\n\nSeverity: {{severity}}\nConfidence: {{confidence}}`,
        inputSchema: InnerOutputSchema,
        outputSchema: OuterOutputSchema,
      }),
    });
    const outerEnd = build.end({ name: "o_end", outputSchema: OuterOutputSchema });

    const outer = build.create({
      id: "ANALYZE_PATIENT_NOTE",
      name: "ANALYZE_PATIENT_NOTE",
      version: "0.1.0",
      startNode: outerStart,
      endNode: outerEnd,
      nodes: [outerStart, inner, decide, outerEnd],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->i", fromNode: outerStart, toNode: inner }),
        build.controlFlowEdge({ name: "i->d", fromNode: inner, toNode: decide }),
        build.controlFlowEdge({ name: "d->e", fromNode: decide, toNode: outerEnd }),
      ],
    });

    const out = await ai.evaluate({
      topology: outer,
      input: { note: "Patient unresponsive, pulseless. Need immediate response." },
    });

    expect(["mild", "moderate", "severe"]).toContain(out.result.severity);
    expect(typeof out.result.confidence).toBe("number");
    expect(typeof out.result.flagged_urgent).toBe("boolean");

    // Usage telemetry should reflect both LLM calls (subflow + outer).
    // The inner LLM's node name is qualified by its enclosing FlowNode so
    // that two FlowNodes embedding the same concept with the same internal
    // node name produce distinguishable entries.
    expect(out.usage.perNode.length).toBe(2);
    const names = out.usage.perNode.map((n) => n.nodeName);
    expect(names).toContain("inner_extract.rate");
    expect(names).toContain("flag");
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Example 14: includeUsage:false strips the wrapper and returns bare output.
// ─────────────────────────────────────────────────────────────────────────

aiTest({
  name: "ai.evaluate — includeUsage:false returns bare topology output",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const topology = buildSeverityTopology();
    const bare = await ai.evaluate({
      topology,
      input: { note: "Patient reports moderate joint pain." },
      includeUsage: false,
    });
    // No wrapper — direct access.
    expect(["mild", "moderate", "severe"]).toContain(bare.severity);
    expect(typeof bare.confidence).toBe("number");
  },
});
