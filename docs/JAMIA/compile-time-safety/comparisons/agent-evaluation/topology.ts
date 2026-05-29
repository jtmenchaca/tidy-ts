// Per-(task, arm) sandbox topology factory. Uses `build.sandboxAgent`
// with the SDK's filesystem + shell capabilities (so the model gets
// real file editing + shell tools, not the four hand-authored
// ServerTools the first revision used). For the tidy-ts arm we mount
// the `tidy-ts-best-practices` skill so the model has progressive
// access to library guidance the way the plan describes.
//
// The action log is recovered post-run by walking
// `usage.perNode[0].turns` (the SDK's per-turn record that our ai
// package now surfaces on `NodeUsage`).

import { build, sandbox } from "@tidy-ts/ai";
import { z } from "zod";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ModelId = "gpt-5.4-nano";

export type LibraryArm = "tidy-ts" | "pandas" | "tidyverse";

const InputSchema = z.object({
  intent: z.string(),
  defaultFilename: z.string(),
});

const OutputSchema = z.object({
  finalSummary: z.string().describe(
    "One-paragraph self-report on what you produced, whether it ran, and whether you believe the output is correct.",
  ),
});

export type AgentInput = z.infer<typeof InputSchema>;
export type AgentOutput = z.infer<typeof OutputSchema>;

// The skills root contains one subdirectory per skill. The SDK's
// lazy source walks the parent and discovers skills by their SKILL.md.
const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(HERE, "..", "..", "..", "..");
const SKILLS_ROOT = join(REPO_ROOT, ".claude", "skills");

// The sandbox's default PATH (/opt/homebrew/bin:/usr/local/bin:...) is
// missing the user-local deno install. Prepend it on the tidy-ts arm.
const DENO_BIN_DIR = join(homedir(), ".deno", "bin");
const SANDBOX_BASE_PATH =
  "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin";

const SYSTEM_PROMPT_BY_ARM: Record<LibraryArm, string> = {
  "tidy-ts":
    "You are writing TypeScript (Deno) that uses the @tidy-ts/dataframe library.\n" +
    "Import with: `import { createDataFrame, readCSV } from \"npm:@tidy-ts/dataframe@1.5.9\";`\n" +
    "You have filesystem + shell access. Iterate: write the solution, type-check it with " +
    "`deno check <file>`, run it with `deno run -A <file>`.\n" +
    "When you are done, return your finalSummary.",
  pandas:
    "You are writing Python that uses pandas. You have filesystem + shell access.\n" +
    "Read CSVs with `pd.read_csv`. Iterate: write the solution, type-check it with " +
    "`pyright <file>`, run it with `python3 <file>`. When you are done, return your finalSummary.",
  tidyverse:
    "You are writing R that uses the tidyverse (dplyr, readr, tibble). You have filesystem + " +
    "shell access. Read CSVs with `readr::read_csv`. Iterate: write the solution and run it " +
    "with `Rscript <file>`. R has no compile-time checker in this evaluation. When you are " +
    "done, return your finalSummary.",
};

export function buildAgentTopology({
  arm,
  fixtures,
}: {
  arm: LibraryArm;
  fixtures: Record<string, string>;
}) {
  const start = build.start({ name: "start", inputSchema: InputSchema });

  // Stage fixtures (and grant the host path to the skill source on the
  // tidy-ts arm, since it lives outside the sandbox base dir).
  const entries: Record<string, ReturnType<typeof sandbox.file>> = {};
  for (const [path, contents] of Object.entries(fixtures)) {
    entries[path] = sandbox.file({ content: contents });
  }

  const capabilities = [
    sandbox.capability.filesystem(),
    sandbox.capability.shell(),
    ...(arm === "tidy-ts"
      ? [
        sandbox.capability.skills({
          lazyFrom: sandbox.lazySkillSource({ src: SKILLS_ROOT }),
        }),
      ]
      : []),
  ];

  const agent = build.sandboxAgent({
    name: "model_under_eval",
    llmConfig: build.llmConfig({ modelId: ModelId }),
    systemPromptTemplate: SYSTEM_PROMPT_BY_ARM[arm] +
      "\n\nTask intent: {{intent}}\n" +
      "Write your solution to `{{defaultFilename}}`. You have at most 25 tool calls.",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
    defaultManifest: {
      entries,
      // Tidy-ts arm needs (a) deno on PATH (lives in ~/.deno/bin,
      // outside the sandbox's default PATH) and (b) read access to the
      // lazy skill source directory.
      ...(arm === "tidy-ts"
        ? {
          environment: { PATH: `${DENO_BIN_DIR}:${SANDBOX_BASE_PATH}` },
          extraPathGrants: [{ path: SKILLS_ROOT }],
        }
        : {}),
    },
    capabilities,
    maxToolTurns: 25,
  });

  const agentNode = build.sandboxAgentNode({ name: "agent", agent });
  const end = build.end({ name: "end", outputSchema: OutputSchema });

  return build.create({
    id: `JAMIA_AGENT_EVAL_${arm.toUpperCase().replace(/-/g, "_")}`,
    name: `JAMIA_AGENT_EVAL_${arm}`,
    version: "0.2.0",
    citation: "Menchaca et al., 2026 (JAMIA Contribution C)",
    startNode: start,
    endNode: end,
    nodes: [start, agentNode, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: agentNode }),
      build.controlFlowEdge({ name: "a->e", fromNode: agentNode, toNode: end }),
    ],
  });
}
