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
 * Convert row-oriented data to columnar storage (optimized for performance)
 */
export function toColumnarStorage<T extends object>(
  rows: readonly T[],
  explicitColumnNames?: string[],
): ColumnarStore {
  if (rows.length === 0) {
    // If explicit column names provided, preserve them even for empty DataFrame
    if (explicitColumnNames && explicitColumnNames.length > 0) {
      const columns: Record<string, unknown[]> = {};
      for (const colName of explicitColumnNames) {
        columns[colName] = [];
      }
      return {
        columns,
        length: 0,
        columnNames: explicitColumnNames,
      };
    }

    return {
      columns: {},
      length: 0,
      columnNames: [],
    };
  }

  // Find all unique column names across all rows
  let columnNames: string[];

  if (rows.length > 0) {
    const allColumns = new Set<string>();
    for (const row of rows) {
      Object.keys(row).forEach((key) => allColumns.add(key));
    }
    columnNames = Array.from(allColumns);
  } else {
    columnNames = [];
  }

  const columns: Record<string, unknown[]> = {};
  const len = rows.length;

  // Pre-allocate arrays and cache references for performance
  const add = (name: string) => {
    const arr = Array(len); // Pre-allocate array
    columns[name] = arr;
    return arr;
  };

  const cols = columnNames.map(add); // Cache column references

  // Simple nested loops with cached references for performance
  const numCols = columnNames.length;
  const names = columnNames; // Direct reference to column names

  if (len > 0) {
    // Fill columns, handling missing values with undefined
    for (let idx = 0; idx < len; ++idx) {
      const row = rows[idx] as any;
      for (let i = 0; i < numCols; ++i) {
        const colName = names[i];
        cols[i][idx] = colName in row ? row[colName] : undefined;
      }
    }
  }

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
