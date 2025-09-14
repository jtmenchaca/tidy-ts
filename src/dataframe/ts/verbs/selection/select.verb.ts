// deno-lint-ignore-file no-explicit-any
import type { DataFrame, Prettify } from "../../dataframe/index.ts";
import {
  createColumnarDataFrameFromStore,
  preserveDataFrameMetadata,
} from "../../dataframe/index.ts";
import { tracer } from "../../telemetry/tracer.ts";

/**
 * Keep columns by name in a dataframe.
 *
 * Selects and returns only the specified columns from the dataframe. The order
 * of columns in the result matches the order specified in the arguments.
 *
 * @param columnNames - One or more column names to keep. At least one column must be specified.
 * @returns A function that takes a DataFrame and returns the selected DataFrame
 *
 * @example
 * ```ts
 * // Select a single column
 * df.select("name")
 *
 * // Select multiple columns
 * df.select("name", "species", "mass")
 *
 * // Select all columns explicitly
 * df.select("id", "name", "mass", "species", "homeworld")
 *
 * // Column order is preserved
 * df.select("species", "name", "id")
 *
 * // Chain with other operations
 * df.select("name", "age", "score")
 *   .filter_rows(row => row.age >= 18)
 *   .arrange({ by: "score", desc: true })
 * ```
 * @remarks
 * - Column order in the result matches the order specified in arguments
 * - Duplicate column names are handled gracefully (only one copy kept)
 * - All data types are preserved (strings, numbers, booleans, arrays, objects, null, undefined)
 * - Works with empty dataframes
 * - Preserves the original dataframe (does not mutate)
 * - At least one column name must be specified
 *
 * @throws {ReferenceError} When a specified column name is not found in the dataframe
 */

// Sync overloads (current implementation)

// Single column overload
export function select<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  columnName: ColName,
): (df: DataFrame<Row>) => DataFrame<Prettify<Pick<Row, ColName>>>;

// Multiple columns overload (rest parameters)
export function select<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  columnName: ColName,
  ...columnNames: ColName[]
): (df: DataFrame<Row>) => DataFrame<Prettify<Pick<Row, ColName>>>;

// Array overload
export function select<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  columns: ColName[],
): (df: DataFrame<Row>) => DataFrame<Prettify<Pick<Row, ColName>>>;

// Implementation
export function select<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  columnNameOrColumns: ColName | ColName[],
  ...columnNames: ColName[]
): (df: DataFrame<Row>) => DataFrame<Prettify<Pick<Row, ColName>>> {
  return (df: DataFrame<Row>) => {
    // Normalize inputs - handle both array and rest parameter syntax
    const allColumns = Array.isArray(columnNameOrColumns)
      ? columnNameOrColumns
      : [columnNameOrColumns, ...columnNames];

    const span = tracer.startSpan(df, "select", {
      columns: allColumns,
    });

    try {
      const api = df as any;
      const store = api.__store;

      // Runtime check for empty arguments
      if (allColumns.length === 0) {
        throw new Error("select() requires at least one column name");
      }
      // Remove duplicates while preserving order
      const uniqueColumns = tracer.withSpan(df, "deduplicate-columns", () => {
        return [...new Set(allColumns.map(String))];
      });

      // Validate columns exist (except for empty DataFrames)
      tracer.withSpan(df, "validate-columns", () => {
        if (store.length > 0) {
          for (const col of uniqueColumns) {
            if (!(col in store.columns)) {
              throw new ReferenceError(
                `Column "${col}" not found. Available columns: [${
                  store.columnNames.join(", ")
                }]`,
              );
            }
          }
        }
      });

      // Build new store with selected columns (reordered), no row loop
      const nextStore = tracer.withSpan(df, "build-column-store", () => {
        const cols: Record<string, unknown[]> = {};
        for (const name of uniqueColumns) {
          // For empty DataFrames, create empty arrays for requested columns
          cols[name] = store.columns[name] || [];
        }
        return {
          columnNames: uniqueColumns,
          columns: cols,
          length: store.length,
        };
      });

      // Create new DataFrame directly from store (avoid toColumnarStorage)
      const out = tracer.withSpan(df, "create-dataframe", () => {
        const dataframe = createColumnarDataFrameFromStore(nextStore);
        (dataframe as any).__view = (df as any).__view;
        return dataframe;
      });

      // Preserve DataFrame metadata (__kind, __groups, __rowLabels)
      preserveDataFrameMetadata(out, df);

      // Copy trace context to new DataFrame
      tracer.copyContext(df, out);

      return out as unknown as DataFrame<Prettify<Pick<Row, ColName>>>;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
