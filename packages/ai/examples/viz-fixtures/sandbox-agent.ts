// Viz fixture: SandboxAgentNode — an agent that runs inside a sandbox
// with declared capabilities (filesystem, shell, skills, memory).
//
// Stresses: the SandboxAgent variant which is NOT a plain Agent. It
// has the same I/O + tools surface, but also carries `capabilities`
// (a sandbox-scoped permission list) and an optional `defaultManifest`.
// The viz should surface those distinctly from regular Agent tools.

import { build, sandbox, tool } from "../../mod.ts";
import { z } from "zod";

const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const grepRepo = tool.server({
  name: "grep_repo",
  description: "Run `git grep` inside the sandboxed repo checkout.",
  paramsSchema: z.object({ pattern: z.string() }),
  resultSchema: z.object({ matches: z.array(z.string()) }),
  execute: () => ({ matches: [] }),
});

const start = build.start({
  name: "start",
  inputSchema: z.object({ repo: z.string(), question: z.string() }),
});

const investigator = build.sandboxAgentNode({
  name: "investigate_repo",
  agent: build.sandboxAgent({
    name: "investigate_repo",
    llmConfig: nano,
    systemPromptTemplate:
      "You have shell + filesystem access inside the sandboxed repo. " +
      "Investigate the question and return a short summary plus the " +
      "files you consulted.",
    inputSchema: z.object({ repo: z.string(), question: z.string() }),
    outputSchema: z.object({
      summary: z.string(),
      files_consulted: z.array(z.string()),
    }),
    capabilities: [
      sandbox.capability.filesystem(),
      sandbox.capability.shell(),
    ],
    tools: [grepRepo],
    maxToolTurns: 20,
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({
    summary: z.string(),
    files_consulted: z.array(z.string()),
  }),
});

export default build.create({
  id: "REPO_INVESTIGATOR",
  name: "REPO_INVESTIGATOR",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, investigator, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->i", fromNode: start, toNode: investigator }),
    build.controlFlowEdge({ name: "i->e", fromNode: investigator, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.repo->i.repo",
      sourceNode: start, sourceOutput: "repo",
      destinationNode: investigator, destinationInput: "repo",
    }),
    build.dataFlowEdge({
      name: "start.question->i.question",
      sourceNode: start, sourceOutput: "question",
      destinationNode: investigator, destinationInput: "question",
    }),
    build.dataFlowEdge({
      name: "i.summary->end.summary",
      sourceNode: investigator, sourceOutput: "summary",
      destinationNode: end, destinationInput: "summary",
    }),
    build.dataFlowEdge({
      name: "i.files_consulted->end.files_consulted",
      sourceNode: investigator, sourceOutput: "files_consulted",
      destinationNode: end, destinationInput: "files_consulted",
    }),
  ],
});
