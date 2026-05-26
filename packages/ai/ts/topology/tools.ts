// Re-export shim for the old single-file `tools.ts` import path. The
// canonical home is `./tools/`; this file keeps existing in-package
// imports (e.g., from runtime executors and OAS round-trip) working
// without a sweeping rename.

export * from "./tools/index.ts";
