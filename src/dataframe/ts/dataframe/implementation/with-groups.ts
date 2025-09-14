/**
 * Utility functions for managing grouped DataFrames and DataFrame metadata
 *
 * FUNCTION USAGE CATEGORIZATION:
 *
 * 1. preserveDataFrameMetadata() - VALUE-CHANGING operations
 *    - Operations that change cell values but keep same columns/grouping
 *    - Used by: mutate, select (when keeping same structure)
 *    - Copies __kind, __groups, __rowLabels exactly as-is
 *
 * 2. withGroups() - COLUMN-CHANGING operations
 *    - Operations that modify column names/structure
 *    - Used by: pivot, rename, mutate-columns, dummy-col, drop
 *    - Filters groupingColumns to only those that still exist after column changes
 *
 * 3. withGroupsRebuilt() - ROW-CHANGING operations
 *    - Operations that modify which rows exist or their order/indices
 *    - Used by: distinct, filter, slice, joins, arrange
 *    - Completely rebuilds the adjacency list group structure from scratch
 *
 * 4. rebuildGroups() - Internal helper
 *    - Creates adjacency list structure (head, next, count, keyRow, size)
 *    - Called internally by withGroupsRebuilt, not used directly by verbs
 */

import type { DataFrame, GroupedDataFrame } from "../index.ts";

/**
 * Helper function to preserve DataFrame metadata (__kind, __groups, __rowLabels)
 * from source to target DataFrame
 *
 * Used by: VALUE-CHANGING operations that keep same columns and same grouping
 * - mutate (mutate-sync.ts, mutate-group.ts): Changes cell values, keeps grouping structure
 * - select (select.verb.ts): Selects columns but keeps grouping structure intact
 *
 * @example
 * // Used by: mutate - changes values but keeps same grouping
 * const result = mutate({ newCol: (row) => row.value * 2 })(groupedDF);
 * // mutate calls: preserveDataFrameMetadata(result, groupedDF)
 * // Copies __kind="GroupedDataFrame" and __groups exactly as-is
 */
// deno-lint-ignore no-explicit-any
export function preserveDataFrameMetadata(target: any, source: any): void {
  // Preserve original metadata for proper chain proxy behavior
  if (source.__kind !== undefined) {
    target.__kind = source.__kind;
  }
  if (source.__groups !== undefined) {
    target.__groups = source.__groups;
  }
  if (source.__rowLabels !== undefined) {
    target.__rowLabels = source.__rowLabels;
  }
  if (source.__options !== undefined) {
    target.__options = source.__options;
  }
}

/**
 * Preserve groups from source dataframe to output dataframe.
 * For COLUMN-CHANGING operations that modify column names/structure.
 *
 * WHY THIS IS NEEDED:
 * When operations change columns, some grouping columns may become invalid:
 * 1. rename() - changes column names, so "habitat" → "location"
 * 2. drop() - removes columns, so grouping by ["species", "habitat"] becomes ["species"]
 * 3. pivot() - reshapes data, measurement column disappears, becomes new column names
 * 4. mutate-columns() - can add/remove columns, invalidating some grouping columns
 *
 * This function filters the groupingColumns array to only include columns that
 * still exist in the output DataFrame, preserving valid groups while discarding
 * references to non-existent columns.
 *
 * Used by: Operations that change column names or add/remove columns
 * - pivot (pivot.verb.ts): Reshapes columns, grouping columns may disappear
 * - rename (rename.verb.ts): Renames columns, grouping column names may change
 * - mutate-columns (mutate-columns.verb.ts): Adds/removes columns
 * - dummy-col (dummy-col.verb.ts): Adds dummy columns
 * - drop (drop.verb.ts): Removes columns, grouping columns may be dropped
 *
 * @example
 * // Example 1: rename() - column names change
 * const grouped = df.groupBy("species", "habitat");
 * const renamed = grouped.rename({ habitat: "location" });
 * // Before: groupingColumns = ["species", "habitat"]
 * // After rename: "habitat" column is now called "location"
 * // withGroups filters to: ["species"] (only existing columns)
 * // Note: "location" is not included because original grouping was by "habitat"
 *
 * // Example 2: drop() - columns are removed
 * const grouped2 = df.groupBy("species", "habitat", "weight");
 * const dropped = grouped2.drop("habitat");
 * // Before: groupingColumns = ["species", "habitat", "weight"]
 * // After drop: "habitat" column no longer exists
 * // withGroups filters to: ["species", "weight"] (existing columns only)
 *
 * // Example 3: pivot() - column structure changes completely
 * const grouped3 = df.groupBy("species", "year", "measurement");
 * const pivoted = grouped3.pivot("measurement", "value");
 * // Before: columns = [species, year, measurement, value]
 * // After pivot: columns = [species, year, height, weight] (measurement → new cols)
 * // withGroups filters to: ["species", "year"] ("measurement" no longer exists)
 */
export function withGroups<
  T extends object,
  G extends keyof T,
  U extends object,
>(
  src: GroupedDataFrame<T, G>,
  out: DataFrame<U>,
): GroupedDataFrame<U, Extract<G, keyof U>> {
  if (!src.__groups) {
    return out as unknown as GroupedDataFrame<U, Extract<G, keyof U>>;
  }

  // Filter grouping columns to only those that still exist
  const remainingGroupCols = src.__groups.groupingColumns.filter(
    (col) => out.nrows() > 0 && String(col) in out[0],
  );

  if (remainingGroupCols.length > 0) {
    // deno-lint-ignore no-explicit-any
    (out as any).__groups = {
      ...src.__groups,
      groupingColumns: remainingGroupCols,
    };
  }

  return out as unknown as GroupedDataFrame<U, Extract<G, keyof U>>;
}

/**
 * Rebuild groups from groupingColumns over new rows (when indices change).
 * Internal helper that creates the adjacency list structure from scratch.
 * Used internally by withGroupsRebuilt - not called directly by verbs.
 *
 * @example
 * // Used internally by withGroupsRebuilt for ROW-CHANGING operations
 * const newRows = [
 *   { category: "A", value: 10 },
 *   { category: "B", value: 20 },
 *   { category: "A", value: 30 }
 * ];
 * const adjacencyList = rebuildGroups(newRows, ["category"]);
 * // Returns: { head: [2, 1], next: [2, -1, 0], count: [2, 1], size: 2, ... }
 */
function rebuildGroups<
  T extends object,
  G extends keyof T,
>(
  rows: readonly T[],
  groupingColumns: readonly G[],
): {
  groupingColumns: G[];
  head: Int32Array;
  next: Int32Array;
  count: Uint32Array;
  keyRow: Uint32Array;
  size: number;
  usesRawIndices: boolean;
} {
  const n = rows.length;
  const next = new Int32Array(n);
  const head: number[] = [];
  const count: number[] = [];
  const keyRow: number[] = [];

  const map = new Map<string, number>();
  let gid = 0;

  // Build adjacency list structure like groupBy does
  for (let i = 0; i < n; i++) {
    const kobj: object = {};
    groupingColumns.forEach((g) => {
      // deno-lint-ignore no-explicit-any
      (kobj as any)[String(g)] = rows[i][g];
    });
    const key = JSON.stringify(kobj);

    let g = map.get(key);
    if (g === undefined) {
      g = gid++;
      map.set(key, g);
      head[g] = -1;
      count[g] = 0;
      keyRow[g] = i;
    }

    next[i] = head[g];
    head[g] = i;
    count[g] = (count[g] + 1) | 0;
  }

  // Pack to typed arrays
  const G = gid;
  const headArr = new Int32Array(G);
  const cntArr = new Uint32Array(G);
  const keyRowArr = new Uint32Array(G);

  for (let g = 0; g < G; g++) {
    headArr[g] = head[g] ?? -1;
    cntArr[g] = count[g] ?? 0;
    keyRowArr[g] = keyRow[g] ?? 0;
  }

  return {
    groupingColumns: groupingColumns.slice() as G[],
    head: headArr,
    next,
    count: cntArr,
    keyRow: keyRowArr,
    size: G,
    usesRawIndices: true, // We're rebuilding with direct indices
  };
}

/**
 * Preserve groups with rebuilding for row-changing operations.
 * Combines withGroups and rebuildGroups for operations that change rows.
 *
 * Used by: ROW-CHANGING operations that modify which rows exist or their order/indices
 * - distinct (distinct.verb.ts): Removes duplicate rows, indices change
 * - filter (filter.verb.ts): Removes rows that don't match predicate
 * - slice operations (slice.verb.ts): head, tail, sample - changes which rows exist
 * - joins (left-join, inner-join, etc.): Combine tables, completely new row indices
 * - arrange (arrange.verb.ts): Reorders rows, all indices change
 *
 * @example
 * // Example 1: slice operation - changes which rows exist
 * const groupedData = df.groupBy("team");
 * const sliced = groupedData.head(2); // Takes first 2 rows from each group
 * // slice calls: withGroupsRebuilt(groupedData, slicedRows, slicedDF)
 * // Rebuilds groups because row indices changed
 *
 * // Example 2: filter operation - removes rows
 * const filtered = groupedData.filter(row => row.score > 80);
 * // filter calls: withGroupsRebuilt(groupedData, filteredRows, filteredDF)
 * // Rebuilds groups because some rows were removed
 *
 * // Example 3: arrange operation - reorders rows
 * const sorted = groupedData.arrange("name");
 * // arrange calls: withGroupsRebuilt(groupedData, sortedRows, sortedDF)
 * // Rebuilds groups because row order changed
 */
export function withGroupsRebuilt<
  T extends object,
  G extends keyof T,
  U extends object,
>(
  src: GroupedDataFrame<T, G>,
  outRows: readonly U[],
  out: DataFrame<U>,
): GroupedDataFrame<U, Extract<G, keyof U>> {
  if (!src.__groups) {
    return out as unknown as GroupedDataFrame<U, Extract<G, keyof U>>;
  }

  // Filter grouping columns to only those that still exist
  const remainingGroupCols = src.__groups.groupingColumns.filter(
    (col) => outRows.length > 0 && String(col) in outRows[0],
  ) as Extract<G, keyof U>[];

  if (remainingGroupCols.length > 0) {
    // deno-lint-ignore no-explicit-any
    (out as any).__groups = rebuildGroups(outRows, remainingGroupCols);
    // deno-lint-ignore no-explicit-any
    (out as any).__kind = "GroupedDataFrame";
  }

  return out as unknown as GroupedDataFrame<U, Extract<G, keyof U>>;
}
