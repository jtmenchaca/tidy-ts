// deno-lint-ignore-file no-explicit-any
// All user-facing type safety comes from rename.types.ts (RenameMethod<Row>).
// This file is called via (rename as any)(...a)(df) from resolve-verb.ts.
import { throwColumnNotFound } from "../../utilities/errors.ts";

/**
 * Rename columns in a dataframe.
 */
export function rename(mapping: any): any {
  return (df: any): any => {
    // Filter out identity renames (oldName === newName) and validate no collisions
    const filteredMapping: Record<string, string> = {};
    const newNames = new Set<string>();
    const oldKeys: string[] = [];
    const dfColumns = df.columns();

    for (const [oldName, newName] of Object.entries(mapping)) {
      const oldNameStr = String(oldName);
      const newNameStr = String(newName);

      // Skip identity renames silently
      if (oldNameStr === newNameStr) continue;

      // Validate old column exists
      if (!dfColumns.includes(oldNameStr)) {
        throwColumnNotFound(oldNameStr, dfColumns);
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
      return df;
    }

    // Build mutate spec: { newKey: (r) => r.oldKey, ... }
    const mutateSpec: Record<string, (r: any) => unknown> = {};
    for (const [oldKey, newKey] of Object.entries(filteredMapping)) {
      mutateSpec[newKey] = (r: any) => r[oldKey];
    }

    // Use mutate method then drop method
    const mutated = df.mutate(mutateSpec);
    const dropFn = mutated.drop as (...cols: string[]) => any;
    const result = dropFn(...oldKeys);
    return result;
  };
}
