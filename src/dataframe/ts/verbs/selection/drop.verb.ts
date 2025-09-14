// deno-lint-ignore-file no-explicit-any
import {
  type ColumnarStore,
  createDataFrame,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
  type Prettify,
  withGroups,
} from "../../dataframe/index.ts";

/**
 * Remove columns by name from a dataframe.
 *
 * Returns a new dataframe with the specified columns removed. Non-existent columns
 * are silently ignored, making this function safe to use even when column names
 * might not exist in the data.
 *
 * @param cols - One or more column names to remove from the dataframe
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
 * // Non-existent columns are ignored
 * df.drop("nonexistent", "mass") // Only removes "mass"
 *
 * // Remove all columns (results in empty objects)
 * df.drop("id", "name", "mass", "species", "homeworld")
 * ```
 *
 * @remarks
 * - Silently ignores missing column names (no error thrown)
 * - Returns a new dataframe (does not mutate the original)
 * - Preserves all rows and remaining columns
 * - Works with empty dataframes
 * - Returns empty objects if all columns are dropped
 */

// Typed overload for precise column removal
export function drop<
  Row extends Record<string, unknown>,
  const Cols extends readonly (keyof Row & string)[],
>(
  ...cols: Cols
): (df: DataFrame<Row>) => DataFrame<Prettify<Omit<Row, Cols[number]>>>;

// Implementation signature (wide for backward compatibility)
export function drop<Row extends Record<string, unknown>>(...cols: string[]) {
  const set = new Set(cols);
  // Note the `any` return so it satisfies both overloads
  return (df: DataFrame<Row>): any => {
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

      // reconstruct a rowView
      class RowView {
        private _i = 0;
        constructor(
          private cols: Record<string, unknown[]>,
          private names: (string | symbol)[],
        ) {
          for (const name of names) {
            Object.defineProperty(this, name, {
              get: () => this.cols[name as string][this._i],
              enumerable: true,
            });
          }
        }
        setCursor(i: number) {
          this._i = i;
        }
      }
      (out as any).__rowView = new RowView(newColumns, keepColumns);

      // Preserve groups if they exist (column-only operation)
      const groupedDf = df as GroupedDataFrame<Row, keyof Row>;
      return groupedDf.__groups ? withGroups(groupedDf, out) : out;
    } else {
      // Fallback for non-columnar DataFrames
      const result: Record<string, unknown>[] = [];
      for (const row of df) {
        const out: Record<string, unknown> = { ...row };
        for (const c of set) delete (out as Record<string, unknown>)[c];
        result.push(out as Prettify<Row>);
      }

      const out = createDataFrame(result) as unknown as DataFrame<
        Prettify<Row>
      >;

      // Preserve groups if they exist (column-only operation)
      const groupedDf = df as GroupedDataFrame<Row, keyof Row>;
      return groupedDf.__groups ? withGroups(groupedDf, out) : out;
    }
  };
}
