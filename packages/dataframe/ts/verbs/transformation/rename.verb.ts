import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type { RowAfterRename } from "./rename.types.ts";

/**
 * Type helper to rename columns in a type.
 *
 * Creates a new type where specified columns are renamed according to the mapping.
 * Columns not in the mapping are preserved as-is.
 *
 * Reuses RowAfterRename from rename.types.ts to ensure method and standalone function
 * share the exact same type logic.
 *
 * @template Row - The original dataframe type
 * @template RenameMap - The mapping object: { oldName: newName, ... }
 */
type RenameColumns<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = RowAfterRename<Row, RenameMap>;

/**
 * Rename columns in a dataframe.
 *
 * Renames columns according to the provided mapping object. The mapping should
 * be in the format `{ oldName: newName, ... }`. This is a pure rename operation
 * - the old column is removed and replaced with the new column name.
 *
 * @param mapping - Object mapping old column names to new column names
 * @returns A function that takes a DataFrame and returns the renamed DataFrame
 *
 * @example
 * ```ts
 * // Rename a single column
 * pipe(df, rename({ mass: "weight" }))
 *
 * // Rename multiple columns
 * pipe(df, rename({
 *   name: "character_name",
 *   mass: "weight",
 *   species: "type"
 * }))
 *
 * // Rename with numeric keys
 * pipe(df, rename({ 1: "first", 2: "second" }))
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
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
>(mapping: RenameMap) {
  return (
    df: DataFrame<Row> | GroupedDataFrame<Row>,
  ):
    | DataFrame<RenameColumns<Row, RenameMap>>
    | GroupedDataFrame<RenameColumns<Row, RenameMap>> => {
    // Filter out identity renames (oldName === newName) and validate no collisions
    const filteredMapping: Record<string, string> = {};
    const newNames = new Set<string>();
    const oldKeys: string[] = [];
    const dfColumns = (df as DataFrame<Row>).columns();

    for (const [oldName, newName] of Object.entries(mapping)) {
      const oldNameStr = String(oldName);
      const newNameStr = String(newName);

      // Skip identity renames silently
      if (oldNameStr === newNameStr) continue;

      // Validate old column exists
      if (!dfColumns.includes(oldNameStr)) {
        throw new ReferenceError(
          `Column "${oldNameStr}" not found in DataFrame`,
        );
      }

      // Check for new name collisions
      if (newNames.has(newNameStr)) {
        throw new Error(`Duplicate new column name: "${newNameStr}"`);
      }

      newNames.add(newNameStr);
      filteredMapping[oldNameStr] = newNameStr;
      oldKeys.push(oldNameStr);
    }

    // If no actual renames, return original dataframe
    if (oldKeys.length === 0) {
      return df as unknown as
        | DataFrame<RenameColumns<Row, RenameMap>>
        | GroupedDataFrame<
          RenameColumns<Row, RenameMap>
        >;
    }

    // Build mutate spec: { newKey: (r) => r.oldKey, ... }
    const mutateSpec: Record<string, (r: Row) => unknown> = {};
    for (const [oldKey, newKey] of Object.entries(filteredMapping)) {
      mutateSpec[newKey] = (r: Row) => (r as Record<string, unknown>)[oldKey];
    }

    // Use mutate method then drop method - TypeScript will infer types from the method calls
    const mutated = df.mutate(mutateSpec);
    // Drop the old keys - they're guaranteed to be keys that exist in the mutated dataframe
    // Cast through unknown to avoid type mismatch between drop's overloads and our usage
    const dropFn = mutated.drop as unknown as (
      ...cols: string[]
    ) => typeof mutated;
    const result = dropFn(...oldKeys);
    return result as unknown as
      | DataFrame<RenameColumns<Row, RenameMap>>
      | GroupedDataFrame<
        RenameColumns<Row, RenameMap>
      >;
  };
}
