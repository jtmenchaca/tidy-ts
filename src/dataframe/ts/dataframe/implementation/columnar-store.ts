// deno-lint-ignore-file no-explicit-any
/**
 * Columnar storage implementation for high-performance DataFrames
 *
 * Stores data in column-major format for better cache locality and
 * vectorized operations while maintaining the same DataFrame API.
 */

import type { RowLabelStore } from "../types/row-labels.ts";

export interface ColumnarStore {
  /** Column data stored as arrays */
  columns: Record<string, unknown[]>;
  /** Number of rows */
  length: number;
  /** Column names in order */
  columnNames: string[];
  /** Optional row labels for reversible operations */
  rowLabels?: RowLabelStore;
}

/**
 * Convert row-oriented data to columnar storage (optimized like Arquero)
 */
export function toColumnarStorage<T extends object>(
  rows: readonly T[],
): ColumnarStore {
  // console.time("toColumnarStorage-total");

  if (rows.length === 0) {
    // console.timeEnd("toColumnarStorage-total");
    return {
      columns: {},
      length: 0,
      columnNames: [],
    };
  }

  // console.time("toColumnarStorage-extract-columns");
  let columnNames: string[];

  // OPTIMIZATION 1: Fast path for dense data (most common case)
  if (rows.length > 0) {
    const firstRowKeys = Object.keys(rows[0]);

    // Check if first 10 rows have same structure (dense data optimization)
    const sampleSize = Math.min(10, rows.length);
    let isDense = true;

    for (let i = 1; i < sampleSize; i++) {
      const currentKeys = Object.keys(rows[i]);
      if (currentKeys.length !== firstRowKeys.length) {
        isDense = false;
        break;
      }
      // Also check that keys are actually the same, not just same count
      for (let j = 0; j < firstRowKeys.length; j++) {
        if (currentKeys[j] !== firstRowKeys[j]) {
          isDense = false;
          break;
        }
      }
      if (!isDense) break;
    }

    if (isDense) {
      // Fast path: use first row keys directly, skip expensive Set operations
      columnNames = firstRowKeys;
    } else {
      // Fallback: use optimized Map-based extraction for sparse data
      const columnMap = new Map<string, number>();
      const columnInsertionOrder: string[] = [];

      for (const row of rows) {
        for (const key of Object.keys(row)) {
          if (!columnMap.has(key)) {
            columnMap.set(key, columnInsertionOrder.length);
            columnInsertionOrder.push(key);
          }
        }
      }
      columnNames = columnInsertionOrder;
    }
  } else {
    columnNames = [];
  }
  // console.timeEnd("toColumnarStorage-extract-columns");

  // console.time("toColumnarStorage-allocate-arrays");
  const columns: Record<string, unknown[]> = {};

  // Pre-allocate arrays and get references (Arquero approach)
  const columnArrays: unknown[][] = [];
  for (const colName of columnNames) {
    const arr = new Array(rows.length);
    columns[colName] = arr;
    columnArrays.push(arr);
  }
  // console.timeEnd("toColumnarStorage-allocate-arrays");

  // console.time("toColumnarStorage-fill-arrays");
  // OPTIMIZATION 2: Optimized array filling
  const numCols = columnNames.length;

  if (numCols <= 5) {
    // OPTIMIZATION 3: Unroll inner loop for small number of columns
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any; // Cache type cast
      if (numCols >= 1) {
        columnArrays[0][i] = row[columnNames[0]];
      }
      if (numCols >= 2) {
        columnArrays[1][i] = row[columnNames[1]];
      }
      if (numCols >= 3) {
        columnArrays[2][i] = row[columnNames[2]];
      }
      if (numCols >= 4) {
        columnArrays[3][i] = row[columnNames[3]];
      }
      if (numCols >= 5) {
        columnArrays[4][i] = row[columnNames[4]];
      }
    }
  } else {
    // OPTIMIZATION 4: Remove expensive 'in' operator, use direct property access
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any; // Cache type cast
      for (let j = 0; j < numCols; j++) {
        const colName = columnNames[j];
        columnArrays[j][i] = row[colName];
      }
    }
  }
  // console.timeEnd("toColumnarStorage-fill-arrays");

  // console.timeEnd("toColumnarStorage-total");
  return {
    columns,
    length: rows.length,
    columnNames,
  };
}

/**
 * Get a row by index from columnar storage (lazy reconstruction)
 */
export function getRowAt<T extends object>(
  store: ColumnarStore,
  index: number,
): T | undefined {
  if (index < 0 || index >= store.length) {
    return undefined;
  }

  const row = {} as T;
  for (const colName of store.columnNames) {
    (row as any)[colName] = store.columns[colName][index];
  }
  return row;
}

/**
 * Get column data directly
 */
export function getColumn(
  store: ColumnarStore,
  columnName: string,
): unknown[] | undefined {
  return store.columns[columnName];
}

/**
 * Create iterator for row-wise access (lazy reconstruction)
 */
export function* iterateRows<T extends object>(
  store: ColumnarStore,
): IterableIterator<T> {
  for (let i = 0; i < store.length; i++) {
    yield getRowAt<T>(store, i)!;
  }
}

/**
 * Convert columnar storage back to row array (for compatibility)
 */
export function toRowArray<T extends object>(
  store: ColumnarStore,
): T[] {
  const result: T[] = new Array(store.length);
  for (let i = 0; i < store.length; i++) {
    result[i] = getRowAt<T>(store, i)!;
  }
  return result;
}
