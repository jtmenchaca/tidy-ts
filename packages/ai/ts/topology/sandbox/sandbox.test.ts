// Structural tests for the sandbox layer. Per ADR-0004 we use the SDK's
// Capability / Manifest / Skill primitives directly — no parallel
// discriminated union. These tests assert that our `build.sandboxAgent`
// carries SDK-shaped values verbatim onto the OAS-side component.


import { ai, build, sandbox } from "../../../mod.ts";
import { aiTest } from "../../runtime/testing.ts";
import { expect } from "@std/expect";
import { z } from "zod";


import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const llm = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ── Manifest entries (SDK shape — discriminator is `type`) ─────────────

Deno.test("manifest entries use SDK shapes verbatim", () => {
  const a = sandbox.localDir({ src: "/tmp/data" });
  expect(a.type).toBe("local_dir");
  expect(a.src).toBe("/tmp/data");

  const b = sandbox.localFile({ src: "/tmp/x" });
  expect(b.type).toBe("local_file");

  const c = sandbox.gitRepo({ repo: "openai/openai-agents-js", ref: "main" });
  expect(c.type).toBe("git_repo");
  expect(c.repo).toBe("openai/openai-agents-js");
  expect(c.ref).toBe("main");

  const d = sandbox.file({ content: "hello" });
  expect(d.type).toBe("file");
  expect(d.content).toBe("hello");
});

// ── Capabilities (SDK class instances via capability.*) ────────────────

Deno.test("capability factories return SDK Capability instances", () => {
  const cFs = sandbox.capability.filesystem();
  expect(cFs.type).toBe("filesystem");

  const sh = sandbox.capability.shell();
  expect(sh.type).toBe("shell");

  const cmp = sandbox.capability.compaction();
  expect(cmp.type).toBe("compaction");

  const mem = sandbox.capability.memory();
  expect(mem.type).toBe("memory");

  const sk = sandbox.capability.skills({
    skills: [{ name: "csv", description: "csv work", content: "# CSV" }],
  });
  expect(sk.type).toBe("skills");
  expect(sk.skills.length).toBe(1);
  expect(sk.skills[0].name).toBe("csv");
});

// ── SandboxAgent (our wrapper that carries SDK values verbatim) ────────

Deno.test("build.sandboxAgent — minimal config", () => {
  const agent = build.sandboxAgent({
    name: "minimal",
    llmConfig: llm,
    systemPromptTemplate: "Do work.",
  });
  expect(agent.componentType).toBe("SandboxAgent");
  expect(agent.name).toBe("minimal");
  expect(agent.tools).toEqual([]);
  expect(agent.toolboxes).toEqual([]);
  expect(agent.maxToolTurns).toBe(8);
  expect(agent.defaultManifest).toBeUndefined();
  expect(agent.capabilities).toBeUndefined();
});

Deno.test("build.sandboxAgent — defaultManifest + capabilities + runAs flow through verbatim", () => {
  const manifest = {
    entries: {
      data: sandbox.localDir({ src: "/tmp/data" }),
      repo: sandbox.gitRepo({ repo: "openai/openai-agents-js" }),
    },
  };
  const agent = build.sandboxAgent({
    name: "workspace",
    llmConfig: llm,
    systemPromptTemplate: "Use the workspace.",
    defaultManifest: manifest,
    capabilities: [
      sandbox.capability.filesystem(),
      sandbox.capability.shell(),
      sandbox.capability.skills({
        skills: [{
          name: "credit-note-fixer",
          description: "Fix credit-note bugs",
          content: "# How to fix credit notes...",
        }],
      }),
    ],
    runAs: "agent",
  });
  // The exact same JS reference goes in and comes out — no lowering.
  expect(agent.defaultManifest).toBe(manifest);
  expect(agent.capabilities?.length).toBe(3);
  expect(agent.capabilities?.[0].type).toBe("filesystem");
  expect(agent.capabilities?.[2].type).toBe("skills");
  expect(agent.runAs).toBe("agent");
});

Deno.test("build.sandboxAgent — outputSchema (Zod) is attached as overlay", () => {
  const OutSchema = z.object({ done: z.boolean() });
  const agent = build.sandboxAgent({
    name: "structured",
    llmConfig: llm,
    systemPromptTemplate: "Finish the task.",
    outputSchema: OutSchema,
  });
  // outputSchema is a non-schema overlay carried on the runtime value.
  // deno-lint-ignore no-explicit-any
  expect((agent as any).outputSchema).toBe(OutSchema);
});

// ── Lazy skills via LocalDirLazySkillSource ────────────────────────────

Deno.test("capability.skills with LocalDirLazySkillSource — lazy from a host directory", () => {
  // The SDK lazy source points at a host dir that contains one
  // subdirectory per skill, each with its own SKILL.md. The factory
  // accepts a bare string OR `{ src, baseDir? }`.
  const sourceBare = sandbox.lazySkillSource("./host-skills");
  expect(sourceBare.source).toBeDefined();

  const sourceObj = sandbox.lazySkillSource({
    src: "./host-skills",
    baseDir: "/Users/example/project",
  });
  expect(sourceObj.source).toBeDefined();

  const skillsCap = sandbox.capability.skills({ lazyFrom: sourceBare });
  expect(skillsCap.type).toBe("skills");
  expect(skillsCap.lazyFrom).toBe(sourceBare);
});

Deno.test("build.sandboxAgent — capability.skills with lazyFrom flows through to capabilities[]", () => {
  const lazy = sandbox.lazySkillSource({ src: "./host-skills" });
  const agent = build.sandboxAgent({
    name: "lazy-skill-agent",
    llmConfig: llm,
    systemPromptTemplate: "Use a skill when relevant.",
    defaultManifest: {
      entries: { repo: sandbox.localDir({ src: "./repo" }) },
    },
    capabilities: [
      sandbox.capability.filesystem(),
      sandbox.capability.shell(),
      sandbox.capability.skills({ lazyFrom: lazy }),
    ],
  });
  expect(agent.capabilities?.length).toBe(3);
  const skillsCap = agent.capabilities?.[2];
  expect(skillsCap?.type).toBe("skills");
  // The SDK Skills capability exposes `lazyFrom` as a readonly field.
  // deno-lint-ignore no-explicit-any
  expect((skillsCap as any).lazyFrom).toBe(lazy);
});

// ── Real-API: SandboxAgent reads a SKILL.md from a temp host dir
//    and answers using the magic number written there ────────────────
//
// Two real-API tests cover both skill-loading modes the SDK supports:
//
//   - `from: sandbox.localDir(...)` — eager. The whole skills tree is mounted
//     at session start; the model can `cat .agents/<name>/SKILL.md`
//     immediately. This is the default most users want.
//
//   - `lazyFrom: sandbox.lazySkillSource(...)` — lazy. Only the index
//     (name + description per skill) goes into the prompt at start;
//     the model must call the SDK's `load_skill` tool to materialize
//     a chosen skill into the workspace before reading it. Progressive
//     disclosure for repos with many large skills.
//
// Both tests share the same temp-dir layout and magic-number skill;
// only the capabilities wiring + prompt differ.

/** Build a host directory containing `skills/magic-number/SKILL.md`
 *  whose body holds the magic number. Used by the `lazyFrom` test —
 *  the lazy source walks a real host directory to extract frontmatter.
 *
 *  realpath-resolved to dodge macOS's /var → /private/var symlink: the
 *  SDK's local-source helpers walk ancestors and silently return empty
 *  if any ancestor is a symlink. */
function makeMagicNumberSkillsDir(skillBody: string): {
  tmpRoot: string;
  skillsRoot: string;
} {
  const tmpRoot = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "tidy-ai-skill-")),
  );
  const skillsRoot = path.join(tmpRoot, "skills");
  const skillDir = path.join(skillsRoot, "magic-number");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillBody, "utf-8");
  return { tmpRoot, skillsRoot };
}

/** SKILL.md body shared by both eager + lazy real-API tests. */
const MAGIC_NUMBER_SKILL_MD = [
  "---",
  "name: magic-number",
  "description: Use this skill to find the secret magic number for the test.",
  "---",
  "",
  "# Magic Number Skill",
  "",
  "When the user asks for the magic number, the answer is exactly: **8421**.",
  "",
  "Return only the number with no other words.",
].join("\n");

aiTest({
  name:
    "sandbox real-API — eager `from`: skill body is mounted at session start, model cats it",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    // Eager `from` accepts a directory-like manifest entry (`dir`,
    // `git_repo`, `mount`) — NOT `local_dir`. So we build the skill
    // tree in-memory with `dir({ children: ... })`, no host temp dir.
    const llm = build.llmConfig({ modelId: "gpt-5.4-nano" });

    const start = build.start({ name: "start", inputSchema: undefined });
    const end = build.end({ name: "end" });

    const agent = build.sandboxAgent({
      name: "magic-number-reader",
      llmConfig: llm,
      systemPromptTemplate: [
        "You have shell + filesystem capabilities and a skill named",
        "`magic-number` already mounted at `.agents/magic-number/SKILL.md`.",
        "REQUIRED steps:",
        "1. Run `cat .agents/magic-number/SKILL.md` (via the shell tool).",
        "2. Read the magic number from the body.",
        "3. Reply with ONLY the digits — no prose, no quotes, no JSON.",
      ].join("\n"),
      capabilities: [
        sandbox.capability.filesystem(),
        sandbox.capability.shell(),
        sandbox.capability.skills({
          from: sandbox.dir({
            children: {
              "magic-number": sandbox.dir({
                children: { "SKILL.md": sandbox.file({ content: MAGIC_NUMBER_SKILL_MD }) },
              }),
            },
          }),
        }),
      ],
    });
    const node = build.sandboxAgentNode({
      name: "magic-number-reader",
      agent,
    });
    const topology = build.create({
      id: "SANDBOX_MAGIC_NUMBER_EAGER",
      name: "SANDBOX_MAGIC_NUMBER_EAGER",
      startNode: start,
      endNode: end,
      nodes: [start, node, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: node }),
        build.controlFlowEdge({ name: "a->e", fromNode: node, toNode: end }),
      ],
    });

    const out = await ai.evaluate({
      topology,
      input: {},
      sandboxClient: new sandbox.UnixLocalClient(),
      includeUsage: false,
    });
    const text = typeof out === "string" ? out : JSON.stringify(out);
    expect(text).toContain("8421");
  },
});

aiTest({
  name:
    "sandbox real-API — lazy `lazyFrom`: model must call `load_skill` before reading",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const { tmpRoot, skillsRoot } = makeMagicNumberSkillsDir(
      MAGIC_NUMBER_SKILL_MD,
    );
    const llm = build.llmConfig({ modelId: "gpt-5.4-nano" });

    const start = build.start({ name: "start", inputSchema: undefined });
    const end = build.end({ name: "end" });

    const agent = build.sandboxAgent({
      name: "magic-number-reader",
      llmConfig: llm,
      systemPromptTemplate: [
        "You have shell + filesystem capabilities and a *lazy* skill named",
        "`magic-number`. The body is NOT in the workspace yet — only the",
        "index entry is. REQUIRED steps:",
        "1. Call the `load_skill` tool with `skill_name: 'magic-number'`",
        "   to materialize it under `.agents/magic-number/`.",
        "2. Run `cat .agents/magic-number/SKILL.md` (via the shell tool).",
        "3. Read the magic number from the body.",
        "4. Reply with ONLY the digits — no prose, no quotes, no JSON.",
      ].join("\n"),
      defaultManifest: {
        entries: {},
        // lazyFrom resolves outside cwd; the SDK needs read access to
        // both index-time (host walk for frontmatter) and materialize-time.
        extraPathGrants: [{ path: tmpRoot }],
      },
      capabilities: [
        sandbox.capability.filesystem(),
        sandbox.capability.shell(),
        sandbox.capability.skills({
          lazyFrom: sandbox.lazySkillSource({
            src: skillsRoot,
            baseDir: tmpRoot,
          }),
        }),
      ],
    });
    const node = build.sandboxAgentNode({
      name: "magic-number-reader",
      agent,
    });
    const topology = build.create({
      id: "SANDBOX_MAGIC_NUMBER_LAZY",
      name: "SANDBOX_MAGIC_NUMBER_LAZY",
      startNode: start,
      endNode: end,
      nodes: [start, node, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: node }),
        build.controlFlowEdge({ name: "a->e", fromNode: node, toNode: end }),
      ],
    });

    try {
      const out = await ai.evaluate({
        topology,
        input: {},
        sandboxClient: new sandbox.UnixLocalClient(),
        includeUsage: false,
      });
      const text = typeof out === "string" ? out : JSON.stringify(out);
      expect(text).toContain("8421");
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  },
});
