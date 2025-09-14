// deno-lint-ignore-file no-explicit-any
import type { DataFrame, Prettify } from "../../dataframe/index.ts";
import type { ColumnarStore } from "../../dataframe/implementation/columnar-store.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/implementation/create-dataframe.ts";
import { tracer } from "../../telemetry/tracer.ts";

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
export function bind_rows<
  Row extends Record<string, unknown>,
  OtherRow extends Record<string, unknown>,
>(
  ...dataFrames: DataFrame<OtherRow>[]
): (df: DataFrame<Row>) => DataFrame<Prettify<Row & Partial<OtherRow>>> {
  return (df: DataFrame<Row>) => {
    const span = tracer.startSpan(df, "bind_rows", {
      dataFrameCount: dataFrames.length + 1,
      inputRowCount: df.nrows(),
    });

    try {
      // Require at least one DataFrame
      if (dataFrames.length === 0) {
        throw new Error("bind_rows requires at least one DataFrame argument");
      }

      // COLUMNAR OPTIMIZATION: Work directly with columnar storage
      const originalApi = df as any;
      const originalStore = originalApi.__store as ColumnarStore;

      // Get all DataFrames stores for efficient columnar operations
      const allStores = tracer.withSpan(df, "collect-stores", () => {
        const stores: ColumnarStore[] = [originalStore];
        dataFrames.forEach((dframe) => {
          const api = dframe as any;
          stores.push(api.__store as ColumnarStore);
        });
        return stores;
      });

      // Calculate total length and get all unique column names
      const columnAnalysis = tracer.withSpan(df, "analyze-columns", () => {
        let totalLength = originalStore.length;
        const allColumns = new Set<string>();
        const columnInsertionOrder: string[] = [];

        // Add columns from original DataFrame (preserve insertion order)
        originalStore.columnNames.forEach((col) => {
          if (!allColumns.has(col)) {
            allColumns.add(col);
            columnInsertionOrder.push(col);
          }
        });

        // Add columns from other DataFrames and calculate total length
        dataFrames.forEach((dframe) => {
          const api = dframe as any;
          const store = api.__store as ColumnarStore;
          totalLength += store.length;

          store.columnNames.forEach((col) => {
            if (!allColumns.has(col)) {
              allColumns.add(col);
              columnInsertionOrder.push(col);
            }
          });
        });

        return { totalLength, finalColumns: columnInsertionOrder };
      });

      // Create new columnar store with combined data
      const newColumns = tracer.withSpan(df, "copy-data", () => {
        const columns: Record<string, unknown[]> = {};

        // Use array concatenation approach - often faster than manual copying
        for (const colName of columnAnalysis.finalColumns) {
          const columnSegments: unknown[][] = [];

          // Collect all segments for this column
          for (const store of allStores) {
            if (store.columns[colName]) {
              // Column exists - use the existing array directly
              columnSegments.push(store.columns[colName]);
            } else {
              // Column doesn't exist - create undefined array
              columnSegments.push(new Array(store.length).fill(undefined));
            }
          }

          // Use concat to join all segments (V8 optimized)
          columns[colName] = ([] as unknown[]).concat(...columnSegments);
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
        return createColumnarDataFrameFromStore<
          Prettify<Row & Partial<OtherRow>>
        >(
          newStore,
        ) as unknown as DataFrame<Prettify<Row & Partial<OtherRow>>>;
      });

      // Copy trace context to new DataFrame
      tracer.copyContext(df, result);

      return result;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
