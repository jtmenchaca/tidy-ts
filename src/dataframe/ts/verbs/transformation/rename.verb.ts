// deno-lint-ignore-file no-explicit-any
import type {
  ColumnarStore,
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import {
  createDataFrame,
  materializeIndex,
  withGroups,
} from "../../dataframe/index.ts";

/**
 * Type helper to rename columns in a type.
 *
 * Creates a new type where specified columns are renamed according to the mapping.
 * Columns not in the mapping are preserved as-is.
 *
 * @template Row - The original dataframe type
 * @template RenameMap - The mapping object: { newName: oldName, ... }
 */
type RenameColumns<Row, RenameMap extends Record<string, keyof Row>> = Prettify<
  & {
    [ColName in Exclude<keyof Row, RenameMap[keyof RenameMap]>]: Row[ColName];
  }
  & { [ColName in keyof RenameMap]: Row[RenameMap[ColName]] }
>;

/**
 * Rename columns in a dataframe.
 *
 * Renames columns according to the provided mapping object. The mapping should
 * be in the format `{ newName: oldName, ... }`. This is a pure rename operation
 * - the old column is removed and replaced with the new column name.
 *
 * @param mapping - Object mapping new column names to old column names
 * @returns A function that takes a DataFrame and returns the renamed DataFrame
 *
 * @example
 * ```ts
 * // Rename a single column
 * pipe(df, rename({ weight: "mass" }))
 *
 * // Rename multiple columns
 * pipe(df, rename({
 *   character_name: "name",
 *   weight: "mass",
 *   type: "species"
 * }))
 *
 * // Rename with numeric keys
 * pipe(df, rename({ first: 1, second: 2 }))
 *
 * // Empty mapping (no change)
 * pipe(df, rename({}))
 * ```
 *
 * @remarks
 * - The old column is completely removed and replaced with the new name
 * - All data and types are preserved during the rename
 * - Works with any column names including numeric keys
 * - Empty mapping returns the dataframe unchanged
 * - Throws an error if any old column name doesn't exist
 * - Preserves the original dataframe (does not mutate)
 * - Identity renames (same name) are silently ignored
 * - Throws an error if new column names would collide
 * - Works with both grouped and ungrouped dataframes
 *
 * @throws {ReferenceError} When an old column name is not found in the dataframe
 */
export function rename<
  Row extends Record<string, unknown>,
  RenameMap extends Record<string, keyof Row>,
>(mapping: RenameMap) {
  return (
    df: DataFrame<Row> | GroupedDataFrame<Row>,
  ):
    | DataFrame<RenameColumns<Row, RenameMap>>
    | GroupedDataFrame<RenameColumns<Row, RenameMap>> => {
    // Filter out identity renames (oldName === newName) and validate no collisions
    const filteredMapping: Record<string, keyof Row> = {};
    const newNames = new Set<string>();

    for (const [newName, oldName] of Object.entries(mapping)) {
      const oldNameStr = String(oldName);
      const newNameStr = String(newName);

      // Skip identity renames silently
      if (oldNameStr === newNameStr) continue;

      // Check for new name collisions
      if (newNames.has(newNameStr)) {
        throw new Error(`Duplicate new column name: "${newNameStr}"`);
      }

      newNames.add(newNameStr);
      filteredMapping[newName] = oldName;
    }

    // If no actual renames, return original dataframe
    if (Object.keys(filteredMapping).length === 0) {
      return df as any;
    }

    // View-aware implementation using columnar storage
    const api: any = df as any;
    const store = api.__store as ColumnarStore | undefined;

    if (store) {
      // Columnar path: rename columns and preserve view
      const idx = materializeIndex(store.length, api.__view);

      // Validate all old column names exist
      for (const [, oldName] of Object.entries(filteredMapping)) {
        const oldNameStr = String(oldName);
        if (!store.columns[oldNameStr]) {
          throw new ReferenceError(`Column "${oldNameStr}" not found`);
        }
      }

      // Create new column mapping
      const newColumns: Record<string, unknown[]> = {};
      const newColumnNames: string[] = [];

      for (const colName of store.columnNames) {
        let newColName = colName;

        // Check if this column is being renamed
        for (const [newName, oldName] of Object.entries(filteredMapping)) {
          if (String(oldName) === colName) {
            newColName = newName;
            break;
          }
        }

        // Copy column data respecting current view
        const sourceCol = store.columns[colName];
        const newCol = new Array(idx.length);
        for (let i = 0; i < idx.length; i++) {
          newCol[i] = sourceCol[idx[i]];
        }
        newColumns[newColName] = newCol;
        newColumnNames.push(newColName);
      }

      const newStore: ColumnarStore = {
        columns: newColumns,
        columnNames: newColumnNames,
        length: idx.length,
      };

      const outDf = createDataFrame([]);
      (outDf as any).__store = newStore;
      (outDf as any).__view = {}; // reset view

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
      (outDf as any).__rowView = new RowView(newColumns, newColumnNames);

      return outDf as unknown as DataFrame<RenameColumns<Row, RenameMap>>;
    } else {
      // Fallback for non-columnar DataFrames
      const result: RenameColumns<Row, RenameMap>[] = [];
      for (const row of df) {
        const out: Record<string, unknown> = { ...row };
        for (const [newName, oldName] of Object.entries(filteredMapping)) {
          const oldNameStr = String(oldName);
          if (!(oldNameStr in out)) {
            throw new ReferenceError(`Column "${oldNameStr}" not found`);
          }
          out[newName] = out[oldNameStr];
          delete out[oldNameStr];
        }
        result.push(out as unknown as RenameColumns<Row, RenameMap>);
      }

      const outDf = createDataFrame(result) as DataFrame<
        RenameColumns<Row, RenameMap>
      >;

      const grouped = df as GroupedDataFrame<Row, keyof Row>;
      return grouped.__groups ? withGroups(grouped, outDf) : outDf;
    }
  };
}
