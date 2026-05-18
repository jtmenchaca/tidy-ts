/**
 * Columnar storage implementation for high-performance DataFrames
 *
 * Stores data in column-major format for better cache locality and
 * vectorized operations while maintaining the same DataFrame API.
 */
import type { RowLabelStore } from "../types/row-labels.ts";
/** A column can be a plain JS array, Float64Array for numeric data, or Uint8Array for boolean masks. */
export type ColumnData = unknown[] | Float64Array | Uint8Array;
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
export declare function isTypedColumn(col: ColumnData): col is Float64Array;
/** True if column is a Uint8Array boolean mask (0/1 values). */
export declare function isBooleanColumn(col: ColumnData): col is Uint8Array;
/**
 * Gather elements from a source column by index, preserving typed array format.
 * If src is Float64Array, returns Float64Array; otherwise returns unknown[].
 */
export declare function gatherColumn(src: ColumnData, indices: Uint32Array | number[]): ColumnData;
/**
 * Try to promote a plain array column to Float64Array.
 * Returns Float64Array only if ALL values are numbers (no null/undefined).
 * Columns with any nullish values stay as unknown[] to preserve semantics.
 */
export declare function tryPromoteToTyped(col: unknown[]): ColumnData;
/**
 * Convert row-oriented data to columnar storage (optimized for performance)
 */
export declare function toColumnarStorage<T extends object>(rows: readonly T[], explicitColumnNames?: string[]): ColumnarStore;
