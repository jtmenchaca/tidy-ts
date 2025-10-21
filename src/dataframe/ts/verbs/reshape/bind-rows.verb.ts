// deno-lint-ignore-file no-explicit-any
import type { DataFrame, Prettify } from "../../dataframe/index.ts";
import type { ColumnarStore } from "../../dataframe/implementation/columnar-store.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/implementation/create-dataframe.ts";
import { tracer } from "../../telemetry/tracer.ts";

/**
 * Helper to detect if a property is optional in a type
 */
type IsOptional<T, K extends keyof T> = undefined extends T[K] ? true : false;

/**
 * Helper type that properly merges two objects by creating unions for shared keys
 * and maintaining optional status for keys that don't exist in both types.
 *
 * This handles the complex case where fields might be optional in one type but required in another.
 */
type MergeRows<Row1, Row2> =
  & {
    // For keys that exist in both:
    // - If optional in either type, make the result optional
    // - Create union of the value types
    [
      K in keyof Row1 & keyof Row2 as IsOptional<Row1, K> extends true ? K
        : IsOptional<Row2, K> extends true ? K
        : never
    ]?: Row1[K] | Row2[K];
  }
  & {
    // For keys that exist in both and are required in both
    [
      K in keyof Row1 & keyof Row2 as IsOptional<Row1, K> extends false
        ? IsOptional<Row2, K> extends false ? K : never
        : never
    ]: Row1[K] | Row2[K];
  }
  & {
    // For keys only in Row1, keep them as-is
    [K in Exclude<keyof Row1, keyof Row2>]: Row1[K];
  }
  & {
    // For keys only in Row2, make them optional
    [K in Exclude<keyof Row2, keyof Row1>]?: Row2[K];
  };

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
export function concatDataFrames<Row extends Record<string, unknown>>(
  dataFrames: DataFrame<Row>[],
): DataFrame<Row> {
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
  return first.bindRows(...rest) as unknown as DataFrame<Row>;
}

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
): (df: DataFrame<Row>) => DataFrame<Prettify<MergeRows<Row, OtherRow>>> {
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
          Prettify<MergeRows<Row, OtherRow>>
        >(
          newStore,
        ) as unknown as DataFrame<Prettify<MergeRows<Row, OtherRow>>>;
      });

      // Copy trace context to new DataFrame
      tracer.copyContext(df, result);

      return result;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
