// deno-lint-ignore-file no-explicit-any
// deno-lint-ignore-file no-explicit-any
import {
  createUpdatedDataFrame,
  processGroupedMutations,
  processUngroupedMutations,
} from "./mutate-helpers-sync.ts";
import { tracer } from "../../../telemetry/tracer.ts";

/**
 * Synchronous mutate implementation using copy-on-write columns
 *
 * NOTE: This is an internal implementation file called via `(verb as any)(...a)(df)`
 * from resolve-verb.ts. Generics here only waste tsc time — the typed API lives
 * in mutate.types.ts.
 */
export function mutateSyncImpl(
  df: any,
  spec: any,
): any {
  const span = tracer.startSpan(df, "mutate", spec);

  try {
    const profile = (globalThis as any).__TIDY_PROFILE;
    const t0 = profile ? performance.now() : 0;
    const n = (df as any).nrows();

    // updates are lazily allocated — napi path provides its own arrays
    const updates: Record<string, unknown[]> = {};
    let t1 = profile ? performance.now() : 0;
    if (profile) console.log(`  [mutate] prepare-columns(${n}): ${(performance.now() - t1).toFixed(4)}ms`);

    // 2) determine if we're dealing with grouped data
    t1 = profile ? performance.now() : 0;
    if ((df as any).__groups) {
      tracer.withSpan(df, "process-grouped-mutations", () => {
        processGroupedMutations(df, spec, updates);
      }, { groupCount: (df as any).__groups.size });
      if (profile) console.log(`  [mutate] process-grouped(${n}): ${(performance.now() - t1).toFixed(4)}ms`);
    } else {
      tracer.withSpan(df, "process-ungrouped-mutations", () => {
        processUngroupedMutations(df, spec, updates);
      });
      if (profile) console.log(`  [mutate] process-ungrouped(${n}): ${(performance.now() - t1).toFixed(4)}ms`);
    }

    // 3) handle column drops (null values)
    const drops = new Set<string>();
    tracer.withSpan(df, "handle-drops", () => {
      for (const [col, expr] of Object.entries(spec)) {
        if (expr === null) drops.add(col);
      }
    }, { dropCount: drops.size });

    // 4) build copy-on-write store and return new DataFrame
    t1 = profile ? performance.now() : 0;
    const result = tracer.withSpan(df, "create-updated-dataframe", () => {
      return createUpdatedDataFrame(df, updates, drops);
    });
    if (profile) console.log(`  [mutate] createUpdatedDataFrame: ${(performance.now() - t1).toFixed(4)}ms`);
    if (profile) console.log(`  [mutate] TOTAL: ${(performance.now() - t0).toFixed(4)}ms`);

    // Copy trace context to new DataFrame
    tracer.copyContext(df, result);

    return result;
  } finally {
    tracer.endSpan(df, span);
  }
}
