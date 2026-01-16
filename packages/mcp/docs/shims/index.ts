import type { DocEntry } from "../mcp-types.ts";
import { asyncDocs } from "./async.ts";
import { encryptionDocs } from "./encryption.ts";
import { envDocs } from "./env.ts";
import { fetchDocs } from "./fetch.ts";
import { filesystemDocs } from "./filesystem.ts";
import { pathDocs } from "./path.ts";
import { resultDocs } from "./result.ts";
import { runtimeDocs } from "./runtime.ts";

// Re-exports all shims docs aggregated from topic files
export const shimsDocs: Record<string, DocEntry> = {
  ...runtimeDocs,
  ...filesystemDocs,
  ...pathDocs,
  ...envDocs,
  ...resultDocs,
  ...asyncDocs,
  ...fetchDocs,
  ...encryptionDocs,
};
