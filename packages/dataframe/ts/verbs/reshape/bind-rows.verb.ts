// deno-lint-ignore-file no-explicit-any
import type { ColumnarStore } from "../../dataframe/implementation/columnar-store.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/implementation/create-dataframe.ts";
import { materializeIndex } from "../../dataframe/implementation/columnar-view.ts";
import { tracer } from "../../telemetry/tracer.ts";
import type { ConcatDataFramesFunction } from "./bind-rows.types.ts";


/**
 * Standalone function to concatenate an array of DataFrames by rows (vertical binding).
 *
 * This function combines DataFrames by stacking their rows on top of each other,
 * similar to pandas concat or tidyverse's bind_rows. It handles different column sets
 * by filling missing columns with undefined.
 *
 * @param dataFrames - Array of DataFrames to combine
 * @returns Combined DataFrame with all rows
 *
 * @example
 * ```ts
 * // Combine array of DataFrames
 * const dataFrames = [df1, df2, df3];
 * const combined = concatDataFrames(dataFrames);
 *
 * // Direct usage
 * const combined = concatDataFrames([df1, df2, df3]);
 * ```
 *
 * @remarks
 * - Combines DataFrames vertically (row-wise)
 * - Handles different column sets by filling missing columns with undefined
 * - Preserves column order (insertion order for intuitive behavior)
 * - Maintains type safety with optional properties
 * - Requires at least one DataFrame in the array
 */
export const concatDataFrames: ConcatDataFramesFunction = function concatDataFrames(
  dataFrames: any[],
): any {
  if (!Array.isArray(dataFrames) || dataFrames.length === 0) {
    throw new Error(
      "concatDataFrames requires a non-empty array of DataFrames",
    );
  }

  if (dataFrames.length === 1) {
    return dataFrames[0];
  }

  // Use the first DataFrame and bind all others to it
  const [first, ...rest] = dataFrames;
  return first.bindRows(...rest);
};

/**
 * Bind multiple DataFrames together by rows (vertical binding).
 *
 * This function combines DataFrames by stacking their rows on top of each other,
 * similar to tidyverse's bind_rows function. It handles different column sets
 * by filling missing columns with undefined.
 *
 * @param dataFrames - One or more DataFrames to combine
 * @returns A function that takes a DataFrame and returns the combined DataFrame
 *
 * @example
 * ```ts
 * // Basic row binding
 * const combined = df1.bindRows(df2);
 *
 * // Multiple DataFrames
 * const combined = df1.bindRows(df2, df3);
 *
 * // Chaining with other operations
 * const result = df1
 *   .bindRows(df2)
 *   .filter(row => row.active)
 *   .select("name", "active");
 * ```
 *
 * @remarks
 * - Combines DataFrames vertically (row-wise)
 * - Handles different column sets by filling missing columns with undefined
 * - Preserves column order (insertion order for intuitive behavior)
 * - Maintains type safety with optional properties
 * - Returns empty DataFrame if all inputs are empty
 * - Requires at least one DataFrame argument
 */
export function bind_rows(
  ...dataFrames: any[]
) {
  return (df: any): any => {
    const span = tracer.startSpan(df, "bind_rows", {
      dataFrameCount: dataFrames.length + 1,
      inputRowCount: df.nrows(),
    });

    try {
      // Require at least one DataFrame
      if (dataFrames.length === 0) {
        throw new Error("bind_rows requires at least one DataFrame argument");
      }

      // Materialize store through view index (respects filter/sort views)
      function materializeStore(dframe: any): ColumnarStore {
        const store = dframe.__store as ColumnarStore;
        const view = dframe.__view;
        const index = materializeIndex(store.length, view);

        // If index is identity (no view), return store as-is
        if (index.length === store.length) {
          let isIdentity = true;
          for (let i = 0; i < index.length; i++) {
            if (index[i] !== i) {
              isIdentity = false;
              break;
            }
          }
          if (isIdentity) return store;
        }

        // Gather only visible rows
        const columns: Record<string, unknown[]> = {};
        for (const name of store.columnNames) {
          const src = store.columns[name];
          const out = new Array(index.length);
          for (let i = 0; i < index.length; i++) out[i] = src[index[i]];
          columns[name] = out;
        }
        return {
          columns,
          length: index.length,
          columnNames: [...store.columnNames],
        };
      }

      // COLUMNAR OPTIMIZATION: Work directly with columnar storage
      const allStores = tracer.withSpan(df, "collect-stores", () => {
        const stores: ColumnarStore[] = [materializeStore(df)];
        dataFrames.forEach((dframe) => {
          stores.push(materializeStore(dframe));
        });
        return stores;
      });

      // Calculate total length and get all unique column names
      const columnAnalysis = tracer.withSpan(df, "analyze-columns", () => {
        let totalLength = 0;
        const allColumns = new Set<string>();
        const columnInsertionOrder: string[] = [];

        for (const store of allStores) {
          totalLength += store.length;
          store.columnNames.forEach((col) => {
            if (!allColumns.has(col)) {
              allColumns.add(col);
              columnInsertionOrder.push(col);
            }
          });
        }

        return { totalLength, finalColumns: columnInsertionOrder };
      });

      // Create new columnar store with combined data
      const newColumns = tracer.withSpan(df, "copy-data", () => {
        const columns: Record<string, unknown[] | Float64Array> = {};

        // Use array concatenation approach - often faster than manual copying
        for (const colName of columnAnalysis.finalColumns) {
          // Check if all existing segments are Float64Array (and no missing segments)
          let allTyped = true;
          let totalLen = 0;
          for (const store of allStores) {
            const seg = store.columns[colName];
            if (!seg) { allTyped = false; break; }
            if (!(seg instanceof Float64Array)) { allTyped = false; break; }
            totalLen += seg.length;
          }

          if (allTyped && totalLen > 0) {
            // Fast path: concat Float64Arrays
            const out = new Float64Array(totalLen);
            let offset = 0;
            for (const store of allStores) {
              const seg = store.columns[colName] as Float64Array;
              out.set(seg, offset);
              offset += seg.length;
            }
            columns[colName] = out;
          } else {
            // Fallback: plain array concat
            const columnSegments: unknown[][] = [];
            for (const store of allStores) {
              if (store.columns[colName]) {
                const seg = store.columns[colName];
                // Convert Float64Array to plain array for concat
                columnSegments.push(
                  seg instanceof Float64Array ? Array.from(seg) : seg as unknown[],
                );
              } else {
                columnSegments.push(new Array(store.length).fill(undefined));
              }
            }
            columns[colName] = ([] as unknown[]).concat(...columnSegments);
          }
        }

        return columns;
      });

      // Create new columnar store
      const newStore = tracer.withSpan(df, "create-store", () => {
        return {
          columns: newColumns,
          length: columnAnalysis.totalLength,
          columnNames: columnAnalysis.finalColumns,
          // Note: Row labels from original store are not preserved in bind_rows
        } as ColumnarStore;
      });

      // Create DataFrame from the new store (most efficient path)
      const result = tracer.withSpan(df, "create-dataframe", () => {
        return createColumnarDataFrameFromStore(newStore);
      });

      // Copy trace context to new DataFrame
      tracer.copyContext(df, result);

      return result;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
