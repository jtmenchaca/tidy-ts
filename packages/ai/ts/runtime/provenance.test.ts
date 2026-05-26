import { ai, build } from "../../mod.ts";
import { expect } from "@std/expect";
import { z } from "zod";

import { agentNodeFingerprint, nodeCacheKey } from "./datastore.ts";
import { aiTest } from "./testing.ts";
import type { Result } from "@tidy-ts/shims";

function ok<T>(r: Result<T, unknown>): T {
  if (!r.ok) throw new Error(`unexpected Err: ${JSON.stringify(r.error)}`);
  return r.value;
}

const MODEL = "gpt-5.4-nano";
const openai = build.llmConfig({ modelId: MODEL });

const InSchema = z.object({ note: z.string() });
const OutSchema = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
  confidence: z.number().min(0).max(1),
});

function buildCitableTopology() {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "extract",
    agent: build.agent({
      name: "extract",
      llmConfig: openai,
      systemPromptTemplate: "Note: {{note}}",
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  return {
    topology: build.create({
      id: "EXTRACT_SEVERITY",
      name: "EXTRACT_SEVERITY",
      version: "2.0.0",
      citation: "Menchaca et al., 2026",
      startNode: start,
      endNode: end,
      nodes: [start, llm, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
        build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
      ],
    }),
    llm,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Pre-seeded datastore hit returns the topology's full provenance, with
//    the cached node's name in `cachedNodes` and an empty `models` list.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "provenance — datastore hit reports cachedNodes and citable identity",
  async fn(t) {
    const { topology, llm } = buildCitableTopology();
    const input = { note: "test" };

    // Pre-seed the per-node cache for the extract node so the LLM call is skipped.
    const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);
    await t.datastore.set(key, { severity: "mild" as const, confidence: 0.5 });

    const out = await ai.evaluate({ topology, input });

    expect(out.provenance.topology.id).toBe("EXTRACT_SEVERITY");
    expect(out.provenance.topology.name).toBe("EXTRACT_SEVERITY");
    expect(out.provenance.topology.version).toBe("2.0.0");
    expect(out.provenance.topology.citation).toBe("Menchaca et al., 2026");
    expect(out.provenance.cachedNodes).toEqual(["extract"]);
    // No models recorded — the cached node didn't invoke its model.
    expect(out.provenance.models).toEqual([]);
    expect(typeof out.provenance.runAt).toBe("string");
    expect(out.provenance.runAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Topology without optional fields surfaces just name; optionals undefined.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "provenance — id is required; version + citation are optional",
  async fn(t) {
    const start = build.start({ name: "start", inputSchema: InSchema });
    const llm = build.agentNode({
      name: "extract",
      agent: build.agent({
        name: "extract",
        llmConfig: openai,
        systemPromptTemplate: "{{note}}",
        inputSchema: InSchema,
        outputSchema: OutSchema,
      }),
    });
    const end = build.end({ name: "end", outputSchema: OutSchema });
    const topology = build.create({
      id: "MINIMAL",
      name: "MINIMAL",
      // No version, no citation.
      startNode: start,
      endNode: end,
      nodes: [start, llm, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
        build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
      ],
    });

    const input = { note: "x" };
    const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);
    await t.datastore.set(key, { severity: "mild" as const, confidence: 0.3 });

    const out = await ai.evaluate({ topology, input });
    expect(out.provenance.topology.id).toBe("MINIMAL");
    expect(out.provenance.topology.name).toBe("MINIMAL");
    expect(out.provenance.topology.version).toBeUndefined();
    expect(out.provenance.topology.citation).toBeUndefined();
  },
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Real-API: fresh run captures models in first-seen order; cachedNodes empty.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "provenance — fresh run captures invoked models and empty cachedNodes",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const { topology } = buildCitableTopology();
    const out = await ai.evaluate({
      topology,
      input: { note: "Patient reports mild headache." },
    });

    expect(out.provenance.cachedNodes).toEqual([]);
    expect(out.provenance.models).toEqual([MODEL]);
    expect(out.provenance.topology.id).toBe("EXTRACT_SEVERITY");
    expect(out.provenance.topology.version).toBe("2.0.0");
  },
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Real-API: second call with same input hits the per-node cache;
//    cachedNodes flips from [] → ["extract"], models flips from [model] → [].
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "provenance — second run with same input populates cachedNodes",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const { topology } = buildCitableTopology();
    const input = { note: "Patient mentions mild fatigue." };

    const first = await ai.evaluate({ topology, input });
    expect(first.provenance.cachedNodes).toEqual([]);
    expect(first.provenance.models.length).toBeGreaterThan(0);

    const second = await ai.evaluate({ topology, input });
    expect(second.provenance.cachedNodes).toEqual(["extract"]);
    expect(second.provenance.models).toEqual([]);
    // Same topology identity on both runs.
    expect(second.provenance.topology.id).toBe(first.provenance.topology.id);
    expect(second.provenance.topology.version).toBe(first.provenance.topology.version);
    // Different timestamps (each call gets its own runAt).
    expect(second.provenance.runAt).not.toBe(first.provenance.runAt);
  },
});
