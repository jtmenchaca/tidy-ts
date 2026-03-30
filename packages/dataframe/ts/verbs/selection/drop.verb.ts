// deno-lint-ignore-file no-explicit-any
import {
  type ColumnarStore,
  createDataFrame,
  materializeIndex,
  withGroups,
} from "../../dataframe/index.ts";
import { RowView } from "../verb-helpers.ts";

/**
 * Remove columns by name from a dataframe.
 *
 * Returns a new dataframe with the specified columns removed. Non-existent columns
 * are silently ignored, making this function safe to use even when column names
 * might not exist in the data.
 *
 * @param columnOrColumns - Column name, array of column names, or undefined
 * @param additionalColumns - Additional column names (when using sequential arguments)
 * @returns A function that takes a DataFrame and returns the DataFrame with columns removed
 *
 * @example
 * ```ts
 * // Remove a single column
 * df.drop("mass")
 *
 * // Remove multiple columns (sequential arguments)
 * df.drop("mass", "homeworld")
 *
 * // Remove multiple columns (array syntax)
 * df.drop(["mass", "homeworld"])
 *
 * // Non-existent columns are ignored
 * df.drop("nonexistent", "mass") // Only removes "mass"
 * df.drop(["nonexistent", "mass"]) // Only removes "mass"
 *
 * // Remove all columns (results in empty objects)
 * df.drop("id", "name", "mass", "species", "homeworld")
 * df.drop(["id", "name", "mass", "species", "homeworld"])
 * ```
 *
 * @remarks
 * - Silently ignores missing column names (no error thrown)
 * - Returns a new dataframe (does not mutate the original)
 * - Preserves all rows and remaining columns
 * - Works with empty dataframes
 * - Returns empty objects if all columns are dropped
 */

export function drop(
  columnOrColumns?: string | string[],
  ...additionalColumns: string[]
) {
  // Normalize inputs - handle both array and rest parameter syntax
  const cols = columnOrColumns === undefined
    ? []
    : Array.isArray(columnOrColumns)
    ? columnOrColumns
    : [columnOrColumns, ...additionalColumns];

  const set = new Set(cols);
  return (df: any): any => {
    const api: any = df as any;
    const store = api.__store as ColumnarStore | undefined;

    if (store) {
      // View-aware columnar implementation
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      // Filter columns to keep (not in drop set)
      const keepColumns = store.columnNames.filter((colName) =>
        !set.has(colName)
      );

      if (keepColumns.length === 0) {
        // All columns dropped - return empty dataframe
        const emptyStore: ColumnarStore = {
          columns: {},
          columnNames: [],
          length: viewLength,
        };

        const out = createDataFrame([]);
        (out as any).__store = emptyStore;
        (out as any).__view = {}; // reset view
        (out as any).__rowView = new (class RowView {
          private _i = 0;
          constructor() {}
          setCursor(i: number) {
            this._i = i;
          }
        })();

        return out;
      }

      // Create new store with only kept columns
      const newColumns: Record<string, unknown[]> = {};

      for (const colName of keepColumns) {
        const sourceCol = store.columns[colName];
        const newCol = new Array(viewLength);
        for (let i = 0; i < viewLength; i++) {
          newCol[i] = sourceCol[idx[i]];
        }
        newColumns[colName] = newCol;
      }

      const newStore: ColumnarStore = {
        columns: newColumns,
        columnNames: keepColumns,
        length: viewLength,
      };

      const out = createDataFrame([]);
      (out as any).__store = newStore;
      (out as any).__view = {}; // reset view

      (out as any).__rowView = new RowView(newColumns, keepColumns);

      // Preserve groups if they exist (column-only operation)
      return api.__groups ? withGroups(df, out) : out;
    } else {
      // Fallback for non-columnar DataFrames
      const result: Record<string, unknown>[] = [];
      for (const row of df) {
        const out: Record<string, unknown> = { ...row };
        for (const c of set) delete (out as Record<string, unknown>)[c];
        result.push(out);
      }

      const out = createDataFrame(result);

      // Preserve groups if they exist (column-only operation)
      return api.__groups ? withGroups(df, out) : out;
    }
  };
}
