// deno-lint-ignore-file no-explicit-any
import type {
  ColumnarStore,
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";
import {
  createColumnarDataFrameFromStore,
  createDataFrame,
  materializeIndex,
  withGroupsRebuilt,
  withIndex,
} from "../../dataframe/index.ts";
import { bitsetGet } from "../../dataframe/implementation/columnar-view.ts";
import { createRandomInt, sampleArray } from "../utility/seedable-random.ts";

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
export function slice<Row extends object>(
  start: number,
  end?: number,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const api: any = df as any;
    const store = api.__store;

    // If grouped, apply slice within each group
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];
      const { head, next, size } = groupedDf.__groups;

      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        const n = groupIndices.length;
        const s = Math.max(0, start < 0 ? n + start : start);
        const e0 = end == null ? n : (end < 0 ? n + end : end);
        const e = Math.min(n, e0);
        for (let i = s; i < e; i++) {
          const actualRowIdx = groupIndices[i];
          const row = {} as Row;
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
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
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
export function slice_indices<Row extends object>(
  ...indices: number[]
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];

      if (!groupedDf.__groups) return df as DataFrame<Row>;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        // Apply slice indices to this group
        for (const idx of indices) {
          if (idx >= 0 && idx < groupIndices.length) {
            const actualRowIdx = groupIndices[idx];
            const row = {} as Row;
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
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
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
        return createDataFrame([] as readonly Row[]);
      }

      // Create new store from selected physical indices
      const newStore: ColumnarStore = {
        columns: {},
        length: validPhysicalIndices.length,
        columnNames: [...store.columnNames],
      };

      for (const colName of store.columnNames) {
        const sourceCol = store.columns[colName];
        const newCol = new Array(validPhysicalIndices.length);
        for (let i = 0; i < validPhysicalIndices.length; i++) {
          newCol[i] = sourceCol[validPhysicalIndices[i]];
        }
        newStore.columns[colName] = newCol;
      }

      const out = createColumnarDataFrameFromStore<Row>(newStore);
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
      (out as any).__rowView = new RowView(
        newStore.columns,
        newStore.columnNames,
      );

      return out;
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
export function slice_head<Row extends object>(
  n: number,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];

      if (!groupedDf.__groups) return df as DataFrame<Row>;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        // Take first n rows from this group
        const takeCount = Math.min(n, groupIndices.length);
        for (let i = 0; i < takeCount; i++) {
          const actualRowIdx = groupIndices[i];
          const row = {} as Row;
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
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
    } else {
      // View-aware ungrouped data path - equivalent to slice(0, n)
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      const sliceLength = Math.min(n, viewLength);
      if (sliceLength === 0) {
        return createDataFrame([] as readonly Row[]);
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
export function slice_tail<Row extends object>(
  n: number,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];

      if (!groupedDf.__groups) return df as DataFrame<Row>;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        // Take last n rows from this group
        for (
          let i = Math.max(0, groupIndices.length - n);
          i < groupIndices.length;
          ++i
        ) {
          const actualRowIdx = groupIndices[i];
          const row = {} as Row;
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
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
    } else {
      // View-aware ungrouped data path - equivalent to slice(-n)
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      const startIndex = Math.max(0, viewLength - n);
      if (startIndex >= viewLength) {
        return createDataFrame([] as readonly Row[]);
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
export function slice_min<Row extends object>(
  column: keyof Row,
  n: number,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];

      if (!groupedDf.__groups) return df as DataFrame<Row>;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        // Build rows from indices and sort
        const groupData = groupIndices.map((i: number) => {
          const row = {} as Row;
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][i];
          }
          return row;
        });

        const sorted = [...groupData].sort((a, b) => {
          const aVal = a[column];
          const bVal = b[column];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          if (typeof aVal === "number" && typeof bVal === "number") {
            return aVal - bVal;
          }
          if (aVal instanceof Date && bVal instanceof Date) {
            return aVal.getTime() - bVal.getTime(); // Ascending order for dates
          }
          return String(aVal).localeCompare(String(bVal));
        });
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
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
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
      sortableIndices.sort((a, b) => {
        const aVal = sortColumn[a];
        const bVal = sortColumn[b];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return aVal - bVal;
        }
        if (aVal instanceof Date && bVal instanceof Date) {
          return aVal.getTime() - bVal.getTime(); // Ascending order for dates
        }
        return String(aVal).localeCompare(String(bVal));
      });

      // Take first n sorted physical indices
      const selectedIndices = sortableIndices.slice(0, n);

      if (selectedIndices.length === 0) {
        return createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      }

      const newStore: ColumnarStore = {
        columns: {},
        length: selectedIndices.length,
        columnNames: [...store.columnNames],
      };

      for (const colName of store.columnNames) {
        const sourceCol = store.columns[colName];
        const newCol = new Array(selectedIndices.length);
        for (let i = 0; i < selectedIndices.length; i++) {
          newCol[i] = sourceCol[selectedIndices[i]];
        }
        newStore.columns[colName] = newCol;
      }

      const out = createColumnarDataFrameFromStore<Row>(newStore);
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
      (out as any).__rowView = new RowView(
        newStore.columns,
        newStore.columnNames,
      );

      return out;
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
export function slice_max<Row extends object>(
  column: keyof Row,
  n: number,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];

      if (!groupedDf.__groups) return df as DataFrame<Row>;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        // Build rows from indices
        const groupData = groupIndices.map((i: number) => {
          const row = {} as Row;
          for (const colName of store.columnNames) {
            (row as any)[colName] = store.columns[colName][i];
          }
          return row;
        });

        // Separate defined and undefined values
        const definedData = groupData.filter((row) => row[column] != null);
        const undefinedData = groupData.filter((row) => row[column] == null);

        // Sort defined values in descending order for sliceMax
        const sortedDefined = [...definedData].sort((a, b) => {
          const aVal = a[column];
          const bVal = b[column];
          if (typeof aVal === "number" && typeof bVal === "number") {
            return bVal - aVal;
          }
          if (aVal instanceof Date && bVal instanceof Date) {
            return bVal.getTime() - aVal.getTime(); // Descending order for dates
          }
          return String(bVal).localeCompare(String(aVal));
        });

        // Take first n from defined values, then undefined if needed
        const toTake = Math.min(n, groupData.length);
        let taken = 0;

        // First, take from sorted defined values
        for (let i = 0; i < Math.min(toTake, sortedDefined.length); i++) {
          rebuilt.push(sortedDefined[i]);
          taken++;
        }

        // If we need more and have undefined values, take those
        for (
          let i = 0;
          i < Math.min(toTake - taken, undefinedData.length);
          i++
        ) {
          rebuilt.push(undefinedData[i]);
        }
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
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
      sortableIndices.sort((a, b) => {
        const aVal = sortColumn[a];
        const bVal = sortColumn[b];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return bVal - aVal; // Descending order
        }
        if (aVal instanceof Date && bVal instanceof Date) {
          return bVal.getTime() - aVal.getTime(); // Descending order for dates
        }
        return String(bVal).localeCompare(String(aVal)); // Descending order
      });

      // Take first n sorted physical indices
      const selectedIndices = sortableIndices.slice(0, n);

      if (selectedIndices.length === 0) {
        return createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      }

      const newStore: ColumnarStore = {
        columns: {},
        length: selectedIndices.length,
        columnNames: [...store.columnNames],
      };

      for (const colName of store.columnNames) {
        const sourceCol = store.columns[colName];
        const newCol = new Array(selectedIndices.length);
        for (let i = 0; i < selectedIndices.length; i++) {
          newCol[i] = sourceCol[selectedIndices[i]];
        }
        newStore.columns[colName] = newCol;
      }

      const out = createColumnarDataFrameFromStore<Row>(newStore);
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
      (out as any).__rowView = new RowView(
        newStore.columns,
        newStore.columnNames,
      );

      return out;
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
export function slice_sample<Row extends object>(
  n: number,
  seed?: number,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const groupedDf = df as GroupedDataFrame<Row>;
    if (groupedDf.__groups) {
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: Row[] = [];

      if (!groupedDf.__groups) return df as DataFrame<Row>;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list now maintains original order (no reversal needed)

        // Build rows from indices
        const groupData = groupIndices.map((i: number) => {
          const row = {} as Row;
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
        rebuilt.push(...(sampled as Row[]));
      }
      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        }) as unknown as DataFrame<Row>;
      return withGroupsRebuilt(groupedDf, rebuilt, out);
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

      const newStore: ColumnarStore = {
        columns: {},
        length: selectedIndices.length,
        columnNames: [...store.columnNames],
      };

      for (const colName of store.columnNames) {
        const sourceCol = store.columns[colName];
        const newCol = new Array(selectedIndices.length);
        for (let i = 0; i < selectedIndices.length; i++) {
          newCol[i] = sourceCol[selectedIndices[i]];
        }
        newStore.columns[colName] = newCol;
      }

      const out = createColumnarDataFrameFromStore<Row>(newStore);
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
      (out as any).__rowView = new RowView(
        newStore.columns,
        newStore.columnNames,
      );

      return out;
    }
  };
}
