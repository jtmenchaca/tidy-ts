// Side-effect-only module: load `.env` once per process so `OPENAI_API_KEY`
// is available to the OpenAI client without callers having to shell-export it.
//
// Imported for its side effect by every runtime entry point that hits the
// API (evaluate, embed). Loading from the same file twice is a no-op,
// and import-deduping means it actually only runs once per process.

import { env } from "@tidy-ts/shims";

env.loadFromFileSync(".env");

// Belt-and-suspenders to the `setTracingDisabled(true)` call in the
// SDK bridge: the Agents SDK reads `OPENAI_AGENTS_DISABLE_TRACING` at
// module init. Setting it here (before any code path that touches
// `@openai/agents`) guarantees the disable wins even if a future
// import order change makes the bridge load after a runner is
// constructed.
if (!Deno.env.get("OPENAI_AGENTS_DISABLE_TRACING")) {
  Deno.env.set("OPENAI_AGENTS_DISABLE_TRACING", "1");
}
