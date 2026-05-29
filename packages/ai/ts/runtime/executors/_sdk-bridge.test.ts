// Structural tests for the SDK bridge — proves an OAS-shaped
// SandboxAgent compiles into an SDK SandboxAgent that carries the
// author's manifest / capabilities / runAs verbatim. No LLM call;
// no sandbox client; no Runner.run.


import { build, sandbox } from "../../../mod.ts";
import { expect } from "@std/expect";
import { z } from "zod";


import { buildSdkSandboxAgent } from "./_sdk-bridge.ts";
import type { RunContext } from "../run-context.ts";
import { createTraceContext } from "../tracing.ts";

function blankCtx(): RunContext {
  return {
    retryConfig: undefined,
    usageSink: undefined,
    overrides: undefined,
    nodePathPrefix: "",
    cache: false,
    clientToolHandler: undefined,
    sandboxClient: undefined,
    // Real trace context — even structural tests need this since
    // `RunContext.trace` is required. The exporter just collects spans
    // in memory; the test never reads them.
    trace: createTraceContext(),
  };
}

Deno.test("buildSdkSandboxAgent — manifest + capabilities + runAs flow through to the SDK SandboxAgent", async () => {
  const llm = build.llmConfig({
    modelId: "gpt-5.4-nano",
    apiKey: "__no_real_call__",
  });
  const manifest = {
    entries: {
      data: sandbox.localDir({ src: "/tmp/data" }),
      repo: sandbox.gitRepo({ repo: "openai/openai-agents-js", ref: "main" }),
    },
  };
  const lazy = sandbox.lazySkillSource({ src: "./host-skills" });
  const caps = [
    sandbox.capability.filesystem(),
    sandbox.capability.shell(),
    sandbox.capability.skills({ lazyFrom: lazy }),
  ];
  const agent = build.sandboxAgent({
    name: "bridge-shape-check",
    llmConfig: llm,
    systemPromptTemplate: "Inspect repo/README.md",
    inputSchema: z.object({}),
    outputSchema: z.object({}),
    defaultManifest: manifest,
    capabilities: caps,
    runAs: "agent",
  });

  const { sdkAgent, cleanup } = await buildSdkSandboxAgent({
    agent,
    ctx: blankCtx(),
    effectiveSystemPrompt: "Inspect repo/README.md",
  });

  try {
    // deno-lint-ignore no-explicit-any
    const a = sdkAgent as any;
    expect(a.name).toBe("bridge-shape-check");
    // The SDK SandboxAgent exposes `defaultManifest` as a `Manifest`
    // instance (the constructor wraps a `ManifestInit` in a class).
    // Verify the underlying entries survived the wrap.
    expect(a.defaultManifest).toBeDefined();
    expect(a.defaultManifest.entries.data.type).toBe("local_dir");
    expect(a.defaultManifest.entries.data.src).toBe("/tmp/data");
    expect(a.defaultManifest.entries.repo.type).toBe("git_repo");
    // Capabilities are the same class instances we passed in (the SDK
    // doesn't clone them), so reference equality holds.
    expect(a.capabilities.length).toBe(3);
    expect(a.capabilities[0]).toBe(caps[0]);
    expect(a.capabilities[1]).toBe(caps[1]);
    expect(a.capabilities[2]).toBe(caps[2]);
    expect(a.runAs).toBe("agent");
  } finally {
    await cleanup();
  }
});

Deno.test("buildSdkSandboxAgent — minimal config (no manifest, no capabilities, no runAs)", async () => {
  const llm = build.llmConfig({
    modelId: "gpt-5.4-nano",
    apiKey: "__no_real_call__",
  });
  const agent = build.sandboxAgent({
    name: "minimal",
    llmConfig: llm,
    systemPromptTemplate: "Do work.",
    inputSchema: z.object({}),
    outputSchema: z.object({}),
  });
  const { sdkAgent, cleanup } = await buildSdkSandboxAgent({
    agent,
    ctx: blankCtx(),
    effectiveSystemPrompt: "Do work.",
  });
  try {
    // deno-lint-ignore no-explicit-any
    const a = sdkAgent as any;
    expect(a.name).toBe("minimal");
    // When no manifest is supplied we hand `undefined` to the SDK; the
    // SDK constructs a `runtimeManifest` lazily at run time, not on the
    // agent value itself.
    expect(a.defaultManifest).toBeUndefined();
    // The SDK's defaults apply when `capabilities` is undefined; the
    // class still has a `capabilities` array, just populated from the
    // SDK's `filesystem() + shell() + compaction()` defaults.
    expect(Array.isArray(a.capabilities)).toBe(true);
    expect(a.capabilities.length).toBeGreaterThan(0);
    expect(a.runAs).toBeUndefined();
  } finally {
    await cleanup();
  }
});
