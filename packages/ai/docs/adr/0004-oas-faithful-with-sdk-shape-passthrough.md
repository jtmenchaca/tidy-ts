---
status: accepted
---

# OAS-faithful authoring, with SDK-shape passthrough where OAS hasn't standardized

`@tidy-ts/ai`'s authoring layer follows Oracle's Open Agent Specification (OAS)
wherever OAS standardizes a concept (Topology, Node, Edge, Property, LlmConfig,
ServerTool / ClientTool / RemoteTool / BuiltinTool, McpTool, MCPToolBox,
ClientTransport). Where OAS has not standardized a concept the OpenAI Agents
SDK has formalized (SandboxAgent, Capability, Manifest, Skill), we re-export
the SDK's primitives directly and use the SDK's shape verbatim — field names,
discriminators, factory signatures unchanged. The SDK bridge lifts both
families into SDK runtime values at execution time.

We made this choice after inventing a parallel discriminated union for
Capability / Manifest / Skill and discovering it didn't match the SDK at run
time: my `{ componentType: "FilesystemCapability" }` literal couldn't be used
where the SDK expected a `FilesystemCapability` class instance with
`tools()` / `bind()` / `processManifest()` methods; my `InlineSkill` /
`LocalSkill` / `SkillReference` types were Responses-API wire shapes
conflated with the Agents SDK's `SkillDescriptor`; my `InlineFile` entry
named the SDK's `File({ content })` shape as `{ type: "inline_file", contents }`.

## Considered options

- **Wrap everything in OAS grammar.** What we tried first. Every drift bug
  above came from inventing fields the SDK doesn't recognize and then trying
  to translate them at the bridge. Rejected: pure boilerplate cost with
  negative semantic value.
- **Wrap nothing — author imports from `@openai/agents` directly.** Rejected:
  authors then need to track which import path each thing lives under
  (`@openai/agents`, `@openai/agents/sandbox`, `@openai/agents-openai`); our
  package becomes a thin re-runner; OAS round-trip for SandboxAgent breaks
  because SDK class instances are not JSON-serializable.

## Consequences

- Authors import from `@tidy-ts/ai` only — we re-export the SDK's
  `capability` namespace, `localDir` / `gitRepo` / `file` / mount factories,
  and the `SkillDescriptor` type. They never touch `@openai/agents` directly.
- OAS round-trip for sandbox-bearing topologies has the same loss profile as
  for `ServerTool.execute`: serializable fields survive (`SkillDescriptor`,
  manifest entries with `src` / `repo` strings); class instances do not
  (`Capability` is a class with methods, so `defaultManifest` and
  `capabilities` are excluded from `toOAS` output the same way `execute` is).
  Authors who need full round-trip wire skills + capabilities + manifest
  in re-attachable code, not in the OAS JSON.
- When OAS upstream standardizes Skill / Capability / Manifest / SandboxAgent,
  we re-align silently — replace the SDK re-exports with OAS-faithful
  wrappers. The author surface stays the same; only the implementation
  underneath shifts.
- The SDK bridge becomes thinner: no `capabilityToSdk` / `skillToSdk` / `manifestEntryToSdk`
  translation. The bridge constructs `new SandboxAgent({ defaultManifest, capabilities, runAs })`
  with the values the author wrote.
- One vocabulary in docs, errors, and CONTEXT.md. An author seeing an SDK
  error referencing `type: "filesystem"` doesn't have to translate from
  tidy-ts's `componentType: "FilesystemCapability"` — those don't exist
  here.
