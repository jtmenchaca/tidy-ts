/**
 * Re-export the shared comparator runners. The canonical home is
 * `../runners.ts`; both `RPython/` and `local/` scenarios import from there.
 *
 * Preserved for backward compatibility with the original RPython reproductions
 * that imported `runForeign` and `printForeignResult` from this path. New
 * reproductions should import from `../runners.ts` directly.
 *
 * Note: `printForeignResult`'s signature changed in `runners.ts`. The first
 * argument is now a `ComparatorLabel` (`"pandas" | "tidyverse" | "Polars"`
 * etc.), not the runtime (`"python" | "r"`). To keep existing call sites
 * working unchanged, this module wraps the new helper with a small adapter
 * that maps `"python"` → `"pandas"` and `"r"` → `"tidyverse"`.
 */
import {
  type ComparatorLabel,
  type ForeignRunResult,
  type ForeignRuntime,
  printForeignResult as printForeignResultByLabel,
  runForeign as runForeignRaw,
} from "../runners.ts";

export type { ForeignRunResult };

export function runForeign(runtime: ForeignRuntime, script: string): ForeignRunResult {
  return runForeignRaw(runtime, script);
}

export function printForeignResult(runtime: ForeignRuntime, result: ForeignRunResult): void {
  // Existing RPython files call `printForeignResult("python", ...)` for
  // pandas and `printForeignResult("r", ...)` for tidyverse. Map to the
  // canonical labels used in the new runners module.
  const label: ComparatorLabel = runtime === "python" ? "pandas" : "tidyverse";
  printForeignResultByLabel(label, result);
}
