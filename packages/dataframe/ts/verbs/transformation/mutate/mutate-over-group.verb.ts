// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../../dataframe/index.ts";
import {
  cowStore,
  createDataFrame,
  preserveDataFrameMetadata,
} from "../../../dataframe/index.ts";
import { materializeIndex } from "../../../dataframe/implementation/columnar-view.ts";
import { RowView } from "../../verb-helpers.ts";

/**
 * Group-level mutate: each expression receives the group DataFrame and returns an array.
 * Called once per group (O(N) not O(N²)).
 *
 * On ungrouped DataFrames, the whole df is treated as one group.
 *
 * Expressions are evaluated sequentially — later expressions can reference
 * columns created by earlier expressions in the same call.
 *
 * @example
 * ```ts
 * df.groupBy("id")
 *   .mutateOverGroup({
 *     maxEndSoFar: (gdf) => s.cummax(gdf.extract("end")),
 *   })
 *   .mutateOverGroup({
 *     prevMaxEnd: (gdf) => s.lag(gdf.extract("maxEndSoFar"), 1),
 *   })
 * ```
 */
export function mutateOverGroup(
  spec: Record<string, (df: any) => unknown[]>,
) {
  return (df: any): any => {
    const store = df.__store;
    const n = (df as DataFrame<any>).nrows();
    const view = df.__view;
    const storeLength = store.length;
    const materialized = materializeIndex(storeLength, view);
    const updates: Record<string, unknown[]> = {};

    for (const col of Object.keys(spec)) {
      updates[col] = new Array(n);
    }

    if (df.__groups) {
      const g = df.__groups;
      const { head, next, size } = g;
      const usesRaw = !!g.usesRawIndices;

      for (const [col, expr] of Object.entries(spec)) {
        for (let groupIdx = 0; groupIdx < size; groupIdx++) {
          // Collect physical indices and row data for this group
          const physicalIndices: number[] = [];
          const groupRows: Record<string, unknown>[] = [];

          let tempRowIdx = head[groupIdx];
          while (tempRowIdx !== -1) {
            const physicalIndex = usesRaw
              ? tempRowIdx
              : materialized[tempRowIdx];
            physicalIndices.push(physicalIndex);

            const row = {} as Record<string, unknown>;
            for (const colName of store.columnNames) {
              row[colName] = store.columns[colName][physicalIndex];
            }
            // Include previously computed columns from this spec
            for (const prevCol of Object.keys(updates)) {
              if (prevCol === col) break;
              if (updates[prevCol][physicalIndex] !== undefined) {
                row[prevCol] = updates[prevCol][physicalIndex];
              }
            }
            groupRows.push(row);
            tempRowIdx = next[tempRowIdx];
          }

          const groupDF = createDataFrame(
            groupRows as readonly Record<string, unknown>[],
          );
          const result = expr(groupDF as unknown as DataFrame<any>);

          if (result.length !== physicalIndices.length) {
            throw new Error(
              `mutateOverGroup: column "${col}" returned ${result.length} values but group has ${physicalIndices.length} rows.`,
            );
          }
          for (let i = 0; i < physicalIndices.length; i++) {
            updates[col][physicalIndices[i]] = result[i];
          }
        }
      }
    } else {
      // Ungrouped — whole df is one group
      for (const [col, expr] of Object.entries(spec)) {
        const result = expr(df as DataFrame<any>);

        if (result.length !== n) {
          throw new Error(
            `mutateOverGroup: column "${col}" returned ${result.length} values but DataFrame has ${n} rows.`,
          );
        }
        for (let i = 0; i < n; i++) {
          updates[col][i] = result[i];
        }
      }
    }

    const nextStore = cowStore(store, updates);
    const out = createDataFrame([] as readonly Record<string, unknown>[]);
    (out as any).__store = nextStore;
    (out as any).__view = df.__view;
    (out as any).__rowView = new RowView(
      nextStore.columns,
      nextStore.columnNames,
      true,
    );
    preserveDataFrameMetadata(out, df);
    return out;
  };
}
