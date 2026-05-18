import type { ColumnData } from "./columnar-store.ts";
/** Gather union-of-keys across all rows, first-seen order */
export declare function computeColumns(store: readonly object[]): string[];
/** True if column has at least one non-null value and all such values are numbers */
export declare function isNumericColumn(store: readonly object[], col: string): boolean;
/**
 * Detect column types with proper handling of union types.
 *
 * Returns:
 * - "number", "string", "boolean", "date", "object" for homogeneous columns (+ nulls)
 * - "mixed" for heterogeneous columns (e.g., number | string)
 * - "null" for columns with only null/undefined values
 * - "unknown" for empty columns
 *
 * This enables optimizations:
 * - Homogeneous columns can use fast type-specific conversions
 * - Mixed columns use flexible runtime type checking
 */
export declare function detectColumnTypes(columns: Record<string, unknown[] | Float64Array>, columnNames: string[]): Record<string, string>;
/**
 * Converts column data to typed arrays for high-performance operations.
 *
 * This function optimizes data for operations like joins and distinct by:
 * - Using Uint32Array for consistent memory layout and fast comparisons
 * - Converting all data types to 32-bit unsigned integers via hashing
 * - Null/undefined values map to 0
 * - Booleans map to 0/1
 * - Numbers use lossless f64 bit-pattern hash (NaN maps to 0xFFFFFFFF)
 * - Strings/objects use fast 31-bit polynomial hash
 *
 * @param columns - Column data indexed by column name
 * @param keyCols - Column names to convert
 * @returns Record of column names to their Uint32Array representations
 */
export declare function convertToTypedArrays(columns: Record<string, ColumnData>, keyCols: string[]): Record<string, Uint32Array>;
