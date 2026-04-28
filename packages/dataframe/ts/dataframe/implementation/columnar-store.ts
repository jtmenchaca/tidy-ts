// deno-lint-ignore-file no-explicit-any
/**
 * Columnar storage implementation for high-performance DataFrames
 *
 * Stores data in column-major format for better cache locality and
 * vectorized operations while maintaining the same DataFrame API.
 */

import type { RowLabelStore } from "../types/row-labels.ts";

/** A column can be a plain JS array or a typed Float64Array for numeric data. */
export type ColumnData = unknown[] | Float64Array;

export interface ColumnarStore {
  /** Column data stored as arrays (plain or typed) */
  columns: Record<string, ColumnData>;
  /** Number of rows */
  length: number;
  /** Column names in order */
  columnNames: string[];
  /** Optional row labels for reversible operations */
  rowLabels?: RowLabelStore;
}

/** True if column is a Float64Array (numeric typed storage). */
export function isTypedColumn(col: ColumnData): col is Float64Array {
  return col instanceof Float64Array;
}

/**
 * Gather elements from a source column by index, preserving typed array format.
 * If src is Float64Array, returns Float64Array; otherwise returns unknown[].
 */
export function gatherColumn(
  src: ColumnData,
  indices: Uint32Array | number[],
): ColumnData {
  const len = indices.length;
  if (src instanceof Float64Array) {
    const out = new Float64Array(len);
    for (let i = 0; i < len; i++) out[i] = src[indices[i]];
    return out;
  }
  const out = new Array(len);
  for (let i = 0; i < len; i++) out[i] = src[indices[i]];
  return out;
}

/**
 * Try to promote a plain array column to Float64Array.
 * Returns Float64Array only if ALL values are numbers (no null/undefined).
 * Columns with any nullish values stay as unknown[] to preserve semantics.
 */
export function tryPromoteToTyped(col: unknown[]): ColumnData {
  const len = col.length;
  if (len === 0) return col;
  // Strict scan: every value must be a number (no nullish)
  for (let i = 0; i < len; i++) {
    if (typeof col[i] !== "number") return col;
  }
  // All numbers — promote to Float64Array
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = col[i] as number;
  }
  return out;
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
      const columns: Record<string, ColumnData> = {};
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

  const tempColumns: Record<string, unknown[]> = {};
  const len = rows.length;

  // Pre-allocate arrays and cache references for performance
  const add = (name: string) => {
    const arr = Array(len); // Pre-allocate array
    tempColumns[name] = arr;
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

  // Promote numeric columns to Float64Array for zero-copy Rust interop
  const columns: Record<string, ColumnData> = {};
  for (let i = 0; i < numCols; i++) {
    columns[names[i]] = tryPromoteToTyped(tempColumns[names[i]]);
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
): ColumnData | undefined {
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
