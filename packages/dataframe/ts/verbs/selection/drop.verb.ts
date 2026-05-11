// deno-lint-ignore-file no-explicit-any
import {
  type ColumnarStore,
  createDataFrame,
  materializeIndex,
  withGroups,
} from "../../dataframe/index.ts";
import { validateColumnsExist } from "../../utilities/errors.ts";
import { RowView, wrapRowView } from "../verb-helpers.ts";

/**
 * Remove columns by name from a dataframe.
 *
 * Returns a new dataframe with the specified columns removed.
 * Throws a ReferenceError if any specified column does not exist.
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
 * // Remove multiple columns
 * df.drop("mass", "homeworld")
 *
 * // Remove all columns (results in empty objects)
 * df.drop("id", "name", "mass", "species", "homeworld")
 * ```
 *
 * @remarks
 * - Throws ReferenceError for non-existent column names
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

    // Validate all requested columns exist
    if (cols.length > 0 && store && store.length > 0) {
      validateColumnsExist(cols, store.columnNames);
    }

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
        (out as any).__rowView = wrapRowView(new RowView({}, []), []);

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

      (out as any).__rowView = wrapRowView(new RowView(newColumns, keepColumns), keepColumns);

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
