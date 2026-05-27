import { ai, build } from "../../mod.ts";
import { expect } from "@std/expect";
import { z } from "zod";


const openai = build.llmConfig({ modelId: "gpt-5.4-nano" });

// Sentinel LlmConfig used by tests that build topologies for structural
// validation only — these tests never call `ai.evaluate`. The model id
// and apiKey are deliberately obvious-junk so that if a test ever drifts
// and accidentally fires an LLM request, it fails with an auth/model
// error pointing at this sentinel rather than emitting a real (but
// nonsensical) request to OpenAI.
const noApiCallExpected = build.llmConfig({
  modelId: "__no_api_call_expected__",
  apiKey: "__no_api_call_expected__",
});

const InSchema = z.object({ note: z.string() });
const OutSchema = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
});

function buildHealthyTopology() {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "llm",
    agent: build.agent({
      name: "llm",
      llmConfig: openai,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  return {
    topology: build.create({
      id: "HEALTHY",
      name: "HEALTHY",
      startNode: start,
      endNode: end,
      nodes: [start, llm, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
        build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
      ],
      dataFlowConnections: [
        build.dataFlowEdge({
          name: "s.note->l.note",
          sourceNode: start, sourceOutput: "note",
          destinationNode: llm, destinationInput: "note",
        }),
        build.dataFlowEdge({
          name: "l.severity->e.severity",
          sourceNode: llm, sourceOutput: "severity",
          destinationNode: end, destinationInput: "severity",
        }),
      ],
    }),
    start,
    llm,
    end,
  };
}

Deno.test("build.validate — healthy topology has zero issues", () => {
  const { topology } = buildHealthyTopology();
  const issues = build.validate(topology);
  expect(issues).toEqual([]);
});

Deno.test("build.validate — flags unreachable node", () => {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "reachable",
    agent: build.agent({
      name: "reachable",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  // Orphan node — not in any control-flow path.
  const orphan = build.agentNode({
    name: "orphan",
    agent: build.agent({
      name: "orphan",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  const topology = build.create({
    id: "ORPHAN",
    name: "ORPHAN",
    startNode: start,
    endNode: end,
    nodes: [start, llm, orphan, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
    validate: false, // test deliberately constructs a broken topology
  });

  const issues = build.validate(topology);
  const codes = issues.map((i) => i.code);
  expect(codes).toContain("unreachable-node");
  const issue = issues.find((i) => i.code === "unreachable-node");
  expect(issue?.nodeName).toBe("orphan");
});

Deno.test("build.validate — flags missing prompt placeholder", () => {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "bad_template",
    agent: build.agent({
      name: "bad_template",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "Note: {{note}}, name: {{name}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  const topology = build.create({
    id: "BAD_TEMPLATE",
    name: "BAD_TEMPLATE",
    startNode: start,
    endNode: end,
    nodes: [start, llm, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
    validate: false, // test deliberately uses a placeholder that isn't in the schema
  });

  const issues = build.validate(topology);
  const placeholderIssue = issues.find((i) => i.code === "missing-prompt-placeholder");
  expect(placeholderIssue).toBeDefined();
  expect(placeholderIssue?.message).toContain("{{name}}");
});

Deno.test("build.validate — flags type mismatch across data-flow edge", () => {
  // sourceOutput is a number; destinationInput expects a string.
  const NumberSchema = z.object({ value: z.number() });
  const StringSchema = z.object({ value: z.string() });

  const start = build.start({ name: "start", inputSchema: NumberSchema });
  const llm = build.agentNode({
    name: "consumer",
    agent: build.agent({
      name: "consumer",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{value}}",
      inputSchema: StringSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  const topology = build.create({
    id: "TYPE_MISMATCH",
    name: "TYPE_MISMATCH",
    startNode: start,
    endNode: end,
    nodes: [start, llm, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
    dataFlowConnections: [
      build.dataFlowEdge({
        name: "n->s",
        sourceNode: start,
        sourceOutput: "value",
        destinationNode: llm,
        destinationInput: "value",
      }),
    ],
    validate: false, // test deliberately mismatches a single edge's types
  });

  const issues = build.validate(topology);
  const mismatch = issues.find((i) => i.code === "type-mismatch");
  expect(mismatch).toBeDefined();
});

Deno.test("build.validate — flags CatchExceptionNode missing required branches", () => {
  // Build a subflow.
  const subStart = build.start({ name: "ss", inputSchema: InSchema });
  const subLlm = build.agentNode({
    name: "sl",
    agent: build.agent({
      name: "sl",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const subEnd = build.end({ name: "se", outputSchema: OutSchema });
  const subflow = build.create({
    id: "SUB",
    name: "SUB",
    startNode: subStart,
    endNode: subEnd,
    nodes: [subStart, subLlm, subEnd],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "a", fromNode: subStart, toNode: subLlm }),
      build.controlFlowEdge({ name: "b", fromNode: subLlm, toNode: subEnd }),
    ],
    dataFlowConnections: [
      build.dataFlowEdge({
        name: "ss.note->sl.note",
        sourceNode: subStart, sourceOutput: "note",
        destinationNode: subLlm, destinationInput: "note",
      }),
      build.dataFlowEdge({
        name: "sl.severity->se.severity",
        sourceNode: subLlm, sourceOutput: "severity",
        destinationNode: subEnd, destinationInput: "severity",
      }),
    ],
  });

  const start = build.start({ name: "start", inputSchema: InSchema });
  const catchNode = build.catchException({ name: "catch", subflow });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  // Only wire the success ("next") branch — missing caught_exception_branch.
  const topology = build.create({
    id: "INCOMPLETE_CATCH",
    name: "INCOMPLETE_CATCH",
    startNode: start,
    endNode: end,
    nodes: [start, catchNode, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->c", fromNode: start, toNode: catchNode }),
      build.controlFlowEdge({ name: "c->e:next", fromNode: catchNode, toNode: end, fromBranch: "next" }),
      // Note: no edge with fromBranch=build.CAUGHT_EXCEPTION_BRANCH
    ],
    validate: false, // test deliberately omits the required exception branch
  });

  const issues = build.validate(topology);
  const issue = issues.find((i) =>
    i.code === "catch-missing-branch" && i.message.includes(build.CAUGHT_EXCEPTION_BRANCH)
  );
  expect(issue).toBeDefined();
});

Deno.test("build.validate — flags BranchingNode mapping value without matching edge", () => {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "classify",
    agent: build.agent({
      name: "classify",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: z.object({ kind: z.enum(["a", "b"]) }),
    }),
  });
  const branch = build.branching({
    name: "branch",
    mapping: { a: "branch_a", b: "branch_b" },
    inputs: [{
      jsonSchema: { title: "kind", type: "string" },
      title: "kind",
      type: "string",
    }],
  });
  const endA = build.end({ name: "end_a", outputSchema: OutSchema });
  // Wire only "branch_a" — missing "branch_b".
  const topology = build.create({
    id: "INCOMPLETE_BRANCH",
    name: "INCOMPLETE_BRANCH",
    startNode: start,
    endNode: endA,
    nodes: [start, llm, branch, endA],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->b", fromNode: llm, toNode: branch }),
      build.controlFlowEdge({ name: "b->a", fromNode: branch, toNode: endA, fromBranch: "branch_a" }),
    ],
    dataFlowConnections: [
      build.dataFlowEdge({
        name: "k",
        sourceNode: llm,
        sourceOutput: "kind",
        destinationNode: branch,
        destinationInput: "kind",
      }),
    ],
    validate: false, // test deliberately omits the second branch mapping
  });

  const issues = build.validate(topology);
  const issue = issues.find((i) => i.code === "branching-missing-edge");
  expect(issue).toBeDefined();
  expect(issue?.message).toContain("branch_b");
});

Deno.test("build.validate — flags duplicate node names", () => {
  const start = build.start({ name: "start", inputSchema: InSchema });
  // Two LlmNodes share the name "extract".
  const a = build.agentNode({
    name: "extract",
    agent: build.agent({
      name: "extract",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const b = build.agentNode({
    name: "extract",
    agent: build.agent({
      name: "extract",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  const topology = build.create({
    id: "DUPLICATE_NAMES",
    name: "DUPLICATE_NAMES",
    startNode: start,
    endNode: end,
    nodes: [start, a, b, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: a }),
      build.controlFlowEdge({ name: "a->b", fromNode: a, toNode: b }),
      build.controlFlowEdge({ name: "b->e", fromNode: b, toNode: end }),
    ],
    validate: false, // test deliberately constructs a duplicate-name topology
  });

  const issues = build.validate(topology);
  const dup = issues.find((i) => i.code === "duplicate-node-name");
  expect(dup).toBeDefined();
  expect(dup?.nodeName).toBe("extract");
  expect(dup?.severity).toBe("error");
});

Deno.test("build.validate — flags required input with no incoming data edge", () => {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "llm",
    agent: build.agent({
      name: "llm",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  const topology = build.create({
    id: "UNWIRED",
    name: "UNWIRED",
    startNode: start,
    endNode: end,
    nodes: [start, llm, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
    // No dataFlowConnections — llm.note and end.severity should both flag.
    validate: false,
  });

  const issues = build.validate(topology);
  const unwiredNames = issues
    .filter((i) => i.code === "unwired-input")
    .map((i) => `${i.nodeName}`);
  expect(unwiredNames).toContain("llm");
  expect(unwiredNames).toContain("end");
});

Deno.test("build.create — throws by default when validation surfaces an error issue", () => {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const a = build.agentNode({
    name: "dup",
    agent: build.agent({
      name: "dup",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const b = build.agentNode({
    name: "dup",
    agent: build.agent({
      name: "dup",
      llmConfig: noApiCallExpected,
      systemPromptTemplate: "{{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });

  expect(() =>
    build.create({
      id: "AUTO_VALIDATE_THROWS",
      name: "AUTO_VALIDATE_THROWS",
      startNode: start,
      endNode: end,
      nodes: [start, a, b, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: a }),
        build.controlFlowEdge({ name: "a->b", fromNode: a, toNode: b }),
        build.controlFlowEdge({ name: "b->e", fromNode: b, toNode: end }),
      ],
    })
  ).toThrow(/duplicate-node-name/);
});
