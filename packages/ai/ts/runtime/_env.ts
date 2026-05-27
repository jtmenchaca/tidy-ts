// Side-effect-only module: load `.env` once per process so `OPENAI_API_KEY`
// is available to the OpenAI client without callers having to shell-export it.
//
// Imported for its side effect by every runtime entry point that hits the
// API (evaluate, embed). Loading from the same file twice is a no-op,
// and import-deduping means it actually only runs once per process.

import { env } from "@tidy-ts/shims";

env.loadFromFileSync(".env");

// We do NOT set `OPENAI_AGENTS_DISABLE_TRACING=1` here, even though
// our package's OTel pipeline is the source of truth for telemetry.
// `OPENAI_AGENTS_DISABLE_TRACING=1` would cut off `addTraceProcessor`
// callbacks entirely, which we rely on to receive the SDK's per-turn
// generation / function / handoff spans for translation into OTel.
//
// To suppress the SDK's default exporter (which posts to OpenAI's
// Traces backend), `runtime/tracing.ts` calls `setTraceProcessors([...])`
// with our bridge processor only — replacing the default OpenAI
// exporter rather than disabling tracing entirely.
