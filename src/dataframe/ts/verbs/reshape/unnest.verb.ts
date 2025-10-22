// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../dataframe/index.ts";
import type { ColumnarStore } from "../../dataframe/implementation/columnar-store.ts";
import { createDataFrame } from "../../dataframe/index.ts";

/**
 * Unnest an array column, creating one row per array element.
 *
 * Takes an array column and creates multiple rows, one for each element in the array.
 * Other columns are duplicated for each array element. Empty arrays result in no rows
 * for that original row.
 *
 * @param column - The array column to unnest
 * @returns A function that takes a DataFrame and returns it with the array column unnested
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", tags: ["admin", "user"] },
 *   { id: 2, name: "Bob", tags: ["user"] },
 *   { id: 3, name: "Charlie", tags: [] }
 * ]);
 *
 * // Unnest the tags column
 * const unnested = pipe(df, unnest("tags"));
 * // Result: [
 * //   { id: 1, name: "Alice", tags: "admin" },
 * //   { id: 1, name: "Alice", tags: "user" },
 * //   { id: 2, name: "Bob", tags: "user" }
 * // ]
 * ```
 */
export function unnest<Row extends Record<string, unknown>>(
  column: keyof Row,
) {
  return (df: DataFrame<Row>): DataFrame<any> => {
    const api = df as any;
    const store = api.__store as ColumnarStore;

    // Get the array column
    const arrayColumn = store.columns[column as string];
    if (!arrayColumn) {
      throw new Error(`Column '${String(column)}' not found in DataFrame`);
    }

    // Check if the column contains arrays
    if (store.length > 0 && !Array.isArray(arrayColumn[0])) {
      throw new Error(`Column '${String(column)}' is not an array column`);
    }

    // Get original column order
    const columnOrder = store.columnNames;

    // Build columnar result to preserve column order
    const resultColumns: Record<string, any[]> = {};
    for (const colName of columnOrder) {
      resultColumns[colName] = [];
    }

    // Process each row
    for (let i = 0; i < store.length; i++) {
      const arrayValue = arrayColumn[i];

      if (Array.isArray(arrayValue) && arrayValue.length > 0) {
        // Create a row for each array element
        for (const element of arrayValue) {
          // Copy all columns in original order
          for (const colName of columnOrder) {
            if (colName === column) {
              resultColumns[colName].push(element); // Use the array element
            } else {
              resultColumns[colName].push(store.columns[colName][i]); // Copy original value
            }
          }
        }
      } else {
        // For empty arrays, keep the row with null for the unnested column
        for (const colName of columnOrder) {
          if (colName === column) {
            resultColumns[colName].push(null); // Use null for empty array
          } else {
            resultColumns[colName].push(store.columns[colName][i]); // Copy original value
          }
        }
      }
    }

    // Create new DataFrame from columns to preserve order
    return createDataFrame({ columns: resultColumns }) as unknown as DataFrame<
      any
    >;
  };
}
