// Sandbox subdirectory.
//
// Per ADR-0004: OAS does not standardize SandboxAgent / Capability /
// Manifest / Skill, so we re-export the SDK's primitives directly
// rather than inventing parallel discriminated unions. Authors import
// these from `@tidy-ts/ai` (via mod.ts → topology/index.ts) — they
// never need to touch `@openai/agents` directly.

// Our SandboxAgent value (the OAS-side component that carries SDK
// values verbatim) + its factory + node accessor.
export {
  createSandboxAgent,
  type SandboxAgent,
  SandboxAgentSchema,
} from "./sandbox-agent.ts";

// SDK Capability factories + types — used to build the
// `capabilities` field on a SandboxAgent. Names match the SDK exactly.
import {
  compaction as _compaction,
  filesystem as _filesystem,
  memory as _memory,
  shell as _shell,
  skills as _skills,
} from "@openai/agents/sandbox";

/** Convenience namespace bundling the SDK's capability factories.
 *  `capability.filesystem()`, `capability.shell()`, `capability.skills({...})`,
 *  `capability.memory({...})`, `capability.compaction({...})`. Functionally
 *  identical to importing the bare factories from `@openai/agents` — this
 *  exists so call sites read `capability.filesystem()` rather than juggling
 *  five top-level imports. */
export const capability = Object.freeze({
  filesystem: _filesystem,
  shell: _shell,
  skills: _skills,
  memory: _memory,
  compaction: _compaction,
});

export {
  type Capability,
  type Compaction,
  type CompactionModelInfo,
  CompactionPolicy,
  DynamicCompactionPolicy,
  StaticCompactionPolicy,
  type Filesystem,
  type FilesystemArgs,
  type LocalDirLazySkillSource,
  type Memory,
  type MemoryArgs,
  type MemoryGenerateConfig,
  type MemoryLayoutConfig,
  type MemoryReadConfig,
  type Shell,
  type ShellArgs,
  type SkillDescriptor,
  type SkillIndexEntry,
  type Skills,
  type SkillsArgs,
} from "@openai/agents/sandbox";

// SDK Manifest types + entry factories. `file({ content })`,
// `dir({ children })`, `localFile({ src })`, `localDir({ src })`,
// `gitRepo({ repo, ref?, subpath? })`, plus mount factories for S3 /
// GCS / Azure Blob / R2 / Box and mount-strategy helpers.
export {
  azureBlobMount,
  boxMount,
  dir,
  dockerVolumeMountStrategy,
  type Entry,
  file,
  gcsMount,
  gitRepo,
  inContainerMountStrategy,
  localBindMountStrategy,
  localDir,
  localFile,
  type Manifest,
  type ManifestInput,
  mount,
  mountPattern,
  r2Mount,
  s3FilesMount,
  s3Mount,
} from "@openai/agents/sandbox";

// SDK sandbox-client primitives + lazy-skill factory. Re-exported from
// `@openai/agents/sandbox/local` so authors don't reach across module
// boundaries.
export {
  localDirLazySkillSource,
  type LocalDirLazySkillSourceOptions,
  UnixLocalSandboxClient,
} from "@openai/agents/sandbox/local";
