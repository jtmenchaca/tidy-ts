// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { MutateAssignments } from "./mutate.types.ts";
import {
  createUpdatedDataFrame,
  processGroupedMutations,
  processUngroupedMutations,
} from "./mutate-helpers-sync.ts";
import { tracer } from "../../../telemetry/tracer.ts";

/**
 * Synchronous mutate implementation using copy-on-write columns
 */
export function mutateSyncImpl<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
) {
  const span = tracer.startSpan(df, "mutate", spec);

  try {
    const n = (df as DataFrame<Row>).nrows();

    const updates: Record<string, unknown[]> = {};

    // 1) prepare arrays only for columns being added/replaced
    tracer.withSpan(df, "prepare-columns", () => {
      const columnCount = Object.keys(spec).length;
      const columnsToCreate = Object.keys(spec).filter((col) =>
        spec[col] !== null
      );

      tracer.withSpan(df, "count-columns", () => {
        // This is just counting, should be negligible
      }, {
        totalColumns: columnCount,
        columnsToCreate: columnsToCreate.length,
      });

      tracer.withSpan(df, "allocate-arrays", () => {
        for (const col of columnsToCreate) {
          updates[col] = new Array(n);
        }
      }, { arrayCount: columnsToCreate.length, arraySize: n });
    }, {
      columns: Object.keys(spec).filter((col) => spec[col] !== null),
      arraySize: n,
    });

    // 2) determine if we're dealing with grouped data
    if ((df as any).__groups) {
      tracer.withSpan(df, "process-grouped-mutations", () => {
        processGroupedMutations(df, spec, updates);
      }, { groupCount: (df as any).__groups.size });
    } else {
      tracer.withSpan(df, "process-ungrouped-mutations", () => {
        processUngroupedMutations(df, spec, updates);
      });
    }

    // 3) handle column drops (null values)
    const drops = new Set<string>();
    tracer.withSpan(df, "handle-drops", () => {
      for (const [col, expr] of Object.entries(spec)) {
        if (expr === null) drops.add(col);
      }
    }, { dropCount: drops.size });

    // 4) build copy-on-write store and return new DataFrame
    const result = tracer.withSpan(df, "create-updated-dataframe", () => {
      return createUpdatedDataFrame(df, updates, drops);
    });

    // Copy trace context to new DataFrame
    tracer.copyContext(df, result);

    return result;
  } finally {
    tracer.endSpan(df, span);
  }
}
