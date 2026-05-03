// deno-lint-ignore-file no-explicit-any
import {
  createDataFrame,
  materializeIndex,
  withGroupsRebuilt,
  withIndex,
} from "../../dataframe/index.ts";
import { createRandomInt, sampleArray } from "../utility/seedable-random.ts";
import { buildDataFrameFromIndices, collectGroupPhysicalIndices, compareValues } from "../verb-helpers.ts";

/**
 * Select rows by range (0-based indexing, like JavaScript's Array.slice).
 *
 * Returns rows from start index up to but not including end index.
 * For grouped data, applies the range within each group.
 *
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, exclusive). If omitted, slices to the end
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select rows 0-2 (indices 0, 1, 2)
 * pipe(df, slice(0, 3))
 *
 * // Select from index 2 to the end
 * pipe(df, slice(2))
 *
 * // Select last 3 rows using negative index
 * pipe(df, slice(-3))
 *
 * // Works with grouped data - slices within each group
 * pipe(df, group_by("cyl"), slice(0, 2))
 * ```
 *
 * @remarks
 * - Uses 0-based indexing (like JavaScript arrays)
 * - Negative indices count from the end
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array if range is invalid
 */
export function slice(
  start: number,
  end?: number,
) {
  return (df: any) => {
    const api: any = df as any;
    const store = api.__store;

    // If grouped, apply slice within each group
    const groupedDf = df;
    if (groupedDf.__groups) {
      const rebuilt: any[] = [];
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        const n = groupIndices.length;
        const s = Math.max(0, start < 0 ? n + start : start);
        const e0 = end == null ? n : (end < 0 ? n + end : end);
        const e = Math.min(n, e0);
        for (let i = s; i < e; i++) {
          const actualRowIdx = groupIndices[i];
          const row: any = {};
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][actualRowIdx];
          }
          rebuilt.push(row);
        }
      }

      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    }

    // Ungrouped: slice over current view
    const idx = materializeIndex(store.length, api.__view);
    const n = idx.length;
    const s = Math.max(0, start < 0 ? n + start : start);
    const e0 = end == null ? n : (end < 0 ? n + end : end);
    const e = Math.min(n, e0);
    const sub = idx.subarray(s, e);
    return withIndex(df as any, new Uint32Array(sub));
  };
}

/**
 * Select rows by specific indices (0-based indexing).
 *
 * Returns rows at the specified 0-based indices. For grouped data, applies
 * the selection within each group while preserving group order.
 *
 * @param indices - One or more 0-based row indices to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select specific rows by index
 * pipe(df, slice_indices(0, 2, 5))
 *
 * // Works with grouped data
 * pipe(df, group_by("cyl"), slice_indices(0, 1))
 * ```
 *
 * @remarks
 * - Uses 0-based indexing (like JavaScript arrays)
 * - Invalid indices (including negative values) are silently ignored
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array if no valid indices
 */
function slice_indices(
  ...indices: number[]
) {
  return (df: any) => {
    const groupedDf = df;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const rebuilt: any[] = [];

      if (!groupedDf.__groups) return df;
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        // Apply slice indices to this group
        for (const idx of indices) {
          if (idx >= 0 && idx < groupIndices.length) {
            const actualRowIdx = groupIndices[idx];
            const row: any = {};
            for (const colName of store.columnNames) {
              (row as any)[colName] = store.columns[colName][actualRowIdx];
            }
            rebuilt.push(row);
          }
        }
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      // View-aware ungrouped data path
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);
      const n = idx.length;

      // Filter indices to be within view bounds and map to physical indices
      const validPhysicalIndices: number[] = [];
      for (const logicalIdx of indices) {
        if (logicalIdx >= 0 && logicalIdx < n) {
          validPhysicalIndices.push(idx[logicalIdx]);
        }
      }

      if (validPhysicalIndices.length === 0) {
        return createDataFrame([]);
      }

      return buildDataFrameFromIndices(store, validPhysicalIndices);
    }
  };
}

/**
 * Select the first n rows.
 *
 * Returns the first n rows from the dataframe. For grouped data, returns
 * the first n rows from each group.
 *
 * @param n - Number of rows to select from the beginning
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select first 3 rows
 * pipe(df, slice_head(3))
 *
 * // Select first 2 rows from each group
 * pipe(df, group_by("cyl"), slice_head(2))
 * ```
 *
 * @remarks
 * - Returns all rows if n is greater than dataframe length
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array for empty dataframes
 */
export function slice_head(
  n: number,
) {
  return (df: any) => {
    const groupedDf = df;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const rebuilt: any[] = [];

      if (!groupedDf.__groups) return df;
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        // Take first n rows from this group
        const takeCount = Math.min(n, groupIndices.length);
        for (let i = 0; i < takeCount; i++) {
          const actualRowIdx = groupIndices[i];
          const row: any = {};
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][actualRowIdx];
          }
          rebuilt.push(row);
        }
      }

      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      // View-aware ungrouped data path - equivalent to slice(0, n)
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      const sliceLength = Math.min(n, viewLength);
      if (sliceLength === 0) {
        return createDataFrame([]);
      }

      // Take first n physical indices from the view
      const sub = idx.subarray(0, sliceLength);
      const out = withIndex(df as any, new Uint32Array(sub));
      return out;
    }
  };
}

/**
 * Select the last n rows.
 *
 * Returns the last n rows from the dataframe. For grouped data, returns
 * the last n rows from each group.
 *
 * @param n - Number of rows to select from the end
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select last 2 rows
 * pipe(df, slice_tail(2))
 *
 * // Select last row from each group
 * pipe(df, group_by("cyl"), slice_tail(1))
 * ```
 *
 * @remarks
 * - Returns all rows if n is greater than dataframe length
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array for empty dataframes
 */
export function slice_tail(
  n: number,
) {
  return (df: any) => {
    const groupedDf = df;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const rebuilt: any[] = [];

      if (!groupedDf.__groups) return df;
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        // Take last n rows from this group
        for (
          let i = Math.max(0, groupIndices.length - n);
          i < groupIndices.length;
          ++i
        ) {
          const actualRowIdx = groupIndices[i];
          const row: any = {};
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][actualRowIdx];
          }
          rebuilt.push(row);
        }
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      // View-aware ungrouped data path - equivalent to slice(-n)
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      const startIndex = Math.max(0, viewLength - n);
      if (startIndex >= viewLength) {
        return createDataFrame([]);
      }

      // Take last n physical indices from the view
      const sub = idx.subarray(startIndex);
      const out = withIndex(df as any, new Uint32Array(sub));
      return out;
    }
  };
}

/**
 * Select n rows with lowest values of a column.
 *
 * Returns n rows with the lowest values in the specified column. For grouped data,
 * returns n rows with lowest values within each group.
 *
 * @param column - Column name to sort by for minimum selection
 * @param n - Number of rows to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select 2 rows with lowest mpg
 * pipe(df, slice_min("mpg", 2))
 *
 * // Select row with lowest mpg from each group
 * pipe(df, group_by("cyl"), slice_min("mpg", 1))
 * ```
 *
 * @remarks
 * - Sorts by the specified column in ascending order
 * - Null/undefined values are sorted to the end
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns fewer rows if dataframe is smaller than n
 */
export function slice_min(
  column: any,
  n: number,
) {
  return (df: any) => {
    const groupedDf = df;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const rebuilt: any[] = [];

      if (!groupedDf.__groups) return df;
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        // Build rows from physical indices and sort
        const groupData = groupIndices.map((i: number) => {
          const row: any = {};
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][i];
          }
          return row;
        });

        const sorted = [...groupData].sort((a, b) =>
          compareValues(a[column], b[column])
        );
        for (let i = 0; i < Math.min(n, sorted.length); ++i) {
          rebuilt.push(sorted[i]);
        }
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      // View-aware ungrouped data path
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);

      const sortColumn = store.columns[column as string];
      if (!sortColumn) {
        // Column doesn't exist, return empty
        return createDataFrame([]);
      }

      // Sort physical indices by their column values
      const sortableIndices = Array.from(idx);
      sortableIndices.sort((a, b) => compareValues(sortColumn[a], sortColumn[b]));

      // Take first n sorted physical indices
      const selectedIndices = sortableIndices.slice(0, n);

      if (selectedIndices.length === 0) {
        return createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      }

      return buildDataFrameFromIndices(store, selectedIndices);
    }
  };
}

/**
 * Select n rows with highest values of a column.
 *
 * Returns n rows with the highest values in the specified column. For grouped data,
 * returns n rows with highest values within each group.
 *
 * @param column - Column name to sort by for maximum selection
 * @param n - Number of rows to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select 3 rows with highest hp
 * pipe(df, slice_max("hp", 3))
 *
 * // Select row with highest hp from each group
 * pipe(df, group_by("cyl"), slice_max("hp", 1))
 * ```
 *
 * @remarks
 * - Sorts by the specified column in descending order
 * - Null/undefined values are sorted to the end
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns fewer rows if dataframe is smaller than n
 */
export function slice_max(
  column: any,
  n: number,
) {
  return (df: any) => {
    const groupedDf = df;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const rebuilt: any[] = [];

      if (!groupedDf.__groups) return df;
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        // Build rows from physical indices
        const groupData = groupIndices.map((i: number) => {
          const row: any = {};
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][i];
          }
          return row;
        });

        // Sort descending (nulls go to end via compareValues)
        const sorted = [...groupData].sort((a, b) =>
          compareValues(a[column], b[column], "desc")
        );
        for (let i = 0; i < Math.min(n, sorted.length); ++i) {
          rebuilt.push(sorted[i]);
        }
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      // View-aware ungrouped data path
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);

      const sortColumn = store.columns[column as string];
      if (!sortColumn) {
        // Column doesn't exist, return empty
        return createDataFrame([]);
      }

      // Sort physical indices by their column values (descending for max)
      const sortableIndices = Array.from(idx);
      sortableIndices.sort((a, b) =>
        compareValues(sortColumn[a], sortColumn[b], "desc")
      );

      // Take first n sorted physical indices
      const selectedIndices = sortableIndices.slice(0, n);

      if (selectedIndices.length === 0) {
        return createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      }

      return buildDataFrameFromIndices(store, selectedIndices);
    }
  };
}

/**
 * Select n random rows.
 *
 * Returns n randomly selected rows from the dataframe. For grouped data,
 * returns n random rows from each group.
 *
 * @param n - Number of random rows to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select 3 random rows
 * df.sample(3))
 *
 * // Select 2 random rows from each group
 * df.groupBy("cyl").sample(2)
 * ```
 *
 * @remarks
 * - Uses Fisher-Yates shuffle algorithm for random selection
 * - Returns all rows if n is greater than dataframe length
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array for empty dataframes
 * - Each call produces different results (random)
 */
export function slice_sample(
  n: number,
  seed?: number,
) {
  return (df: any) => {
    const groupedDf = df;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const rebuilt: any[] = [];

      if (!groupedDf.__groups) return df;
      const { head, next, size, usesRawIndices } = groupedDf.__groups;
      const baseIndex = usesRawIndices ? null : materializeIndex(store.length, api.__view);

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });

        // Build rows from physical indices
        const groupData = groupIndices.map((i: number) => {
          const row: any = {};
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][i];
          }
          return row;
        });

        const sampled = sampleArray(
          groupData,
          Math.min(n, groupData.length),
          seed,
        );
        rebuilt.push(...sampled);
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      // View-aware ungrouped data path
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      // Create shuffled array of physical indices from current view
      const shuffleableIndices = Array.from(idx);

      // Fisher-Yates shuffle with optional seeding
      const randomInt = createRandomInt(seed);
      for (let i = shuffleableIndices.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [shuffleableIndices[i], shuffleableIndices[j]] = [
          shuffleableIndices[j],
          shuffleableIndices[i],
        ];
      }

      // Take first n physical indices
      const selectedIndices = shuffleableIndices.slice(
        0,
        Math.min(n, viewLength),
      );

      if (selectedIndices.length === 0) {
        return createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      }

      return buildDataFrameFromIndices(store, selectedIndices);
    }
  };
}
