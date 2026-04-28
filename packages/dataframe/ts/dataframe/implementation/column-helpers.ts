// packages/dataframe/ts/utility/create-dataframe/columns.ts

import type { ColumnData, ColumnarStore } from "./columnar-store.ts";
import { isTypedColumn } from "./columnar-store.ts";
import type { View } from "./columnar-view.ts";
import { materializeIndex } from "./columnar-view.ts";

// ---------------------------------------------------------------------------
// Standardized helpers for verbs interacting with WASM/napi
// ---------------------------------------------------------------------------

/**
 * Get a column as Float64Array, gathering through the view if needed.
 * Returns null if the column contains non-numeric data.
 *
 * Use this when you need to pass a column to a Rust WASM/napi function
 * that expects Float64Array input.
 */
function getColumnAsFloat64(
  store: ColumnarStore,
  colName: string,
  view?: View | null,
): Float64Array | null {
  const col = store.columns[colName];
  if (!col) return null;

  const hasView = view && (view.index || view.mask);

  if (isTypedColumn(col)) {
    if (!hasView) return col;
    // Gather through view
    const idx = materializeIndex(store.length, view);
    const out = new Float64Array(idx.length);
    for (let i = 0; i < idx.length; i++) out[i] = col[idx[i]];
    return out;
  }

  // Plain array — check if all numeric, convert
  const idx = hasView ? materializeIndex(store.length, view) : null;
  const n = idx ? idx.length : col.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const val = idx ? col[idx[i]] : col[i];
    if (typeof val !== "number") return null;
    out[i] = val as number;
  }
  return out;
}

/**
 * Gather a single column through an index array.
 * Handles both Float64Array and plain array columns.
 */
function gatherColumn(
  col: ColumnData,
  indices: Uint32Array,
): ColumnData {
  if (isTypedColumn(col)) {
    const out = new Float64Array(indices.length);
    for (let i = 0; i < indices.length; i++) out[i] = col[indices[i]];
    return out;
  }
  const out = new Array(indices.length);
  for (let i = 0; i < indices.length; i++) out[i] = col[indices[i]];
  return out;
}

/**
 * Build a new ColumnarStore by gathering rows at the given physical indices
 * from a source store. Preserves Float64Array type for numeric columns.
 *
 * Use this instead of inline scatter-gather loops in verbs.
 */
function buildStoreFromIndices(
  source: ColumnarStore,
  indices: Uint32Array,
  columnNames?: string[],
): ColumnarStore {
  const names = columnNames ?? source.columnNames;
  const columns: Record<string, ColumnData> = {};
  for (const name of names) {
    const col = source.columns[name];
    if (!col) continue;
    columns[name] = gatherColumn(col, indices);
  }
  return {
    columns,
    length: indices.length,
    columnNames: names.filter((n) => n in columns),
  };
}

/** Gather union-of-keys across all rows, first-seen order */
export function computeColumns(
  store: readonly object[],
): string[] {
  const cols: string[] = [];
  const seen = new Set<string>();
  for (const r of store) {
    for (const k of Object.keys(r ?? {})) {
      const key = String(k);
      if (!seen.has(key)) {
        seen.add(key);
        cols.push(key);
      }
    }
  }
  return cols;
}

/** True if column has at least one non-null value and all such values are numbers */
export function isNumericColumn(
  store: readonly object[],
  col: string,
): boolean {
  let sawValue = false;
  for (const r of store) {
    // deno-lint-ignore no-explicit-any
    const v = (r as any)[col];
    if (v == null) continue;
    sawValue = true;
    if (typeof v !== "number") return false;
  }
  return sawValue;
}

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
export function detectColumnTypes(
  columns: Record<string, unknown[] | Float64Array>,
  columnNames: string[],
): Record<string, string> {
  const types: Record<string, string> = {};

  for (const colName of columnNames) {
    const column = columns[colName];
    if (!column || column.length === 0) {
      types[colName] = "unknown";
      continue;
    }

    // Float64Array columns are always numeric
    if (column instanceof Float64Array) {
      types[colName] = "number";
      continue;
    }

    // Sample more values to detect mixed types accurately
    const typesSeen = new Set<string>();
    const sampleSize = Math.min(50, column.length); // Sample up to 50 values

    for (let i = 0; i < sampleSize; i++) {
      const value = column[i];
      if (value != null) {
        if (typeof value === "number") {
          typesSeen.add("number");
        } else if (typeof value === "string") {
          typesSeen.add("string");
        } else if (typeof value === "boolean") {
          typesSeen.add("boolean");
        } else if (value instanceof Date) {
          typesSeen.add("date");
        } else {
          typesSeen.add("object");
        }
      }

      // Early exit if we detect mixed types (optimization)
      if (typesSeen.size > 1) {
        types[colName] = "mixed";
        break;
      }
    }

    // If we haven't determined it's mixed, use the single type found
    if (types[colName] !== "mixed") {
      if (typesSeen.size === 0) {
        types[colName] = "null"; // All null/undefined values
      } else if (typesSeen.size === 1) {
        types[colName] = Array.from(typesSeen)[0]; // Single type + nulls (homogeneous)
      }
    }
  }

  return types;
}

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
export function convertToTypedArrays(
  columns: Record<string, ColumnData>,
  keyCols: string[],
): Record<string, Uint32Array> {
  const typedArrays: Record<string, Uint32Array> = {};

  for (const colName of keyCols) {
    const colData = columns[colName];
    if (!colData) continue;

    const len = colData.length;
    const out = new Uint32Array(len);

    // Lossless f64 → u32 hash: use the f64 bit pattern (via DataView) to
    // produce a collision-resistant 32-bit hash. Two f64 values are equal
    // iff their bit patterns match (except ±0 which we canonicalize, and
    // NaN). We XOR the high and low 32-bit halves after mixing.
    // Reserved values: 0=null, 1=undefined, 2=true, 3=false, 0xFFFFFFFF=NaN
    const hashBuf = new ArrayBuffer(8);
    const hashF64 = new Float64Array(hashBuf);
    const hashU32 = new Uint32Array(hashBuf);

    // Fast path: Float64Array columns are all-numeric (NaN = missing)
    if (colData instanceof Float64Array) {
      for (let i = 0; i < len; i++) {
        const num = colData[i];
        if (Number.isNaN(num)) {
          out[i] = 0xFFFFFFFF;
          continue;
        }
        // Canonicalize -0 to +0
        hashF64[0] = num === 0 ? 0 : num;
        // Mix high 32 bits and XOR with low 32 bits
        let h = hashU32[1];
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
        h = (h ^ (h >>> 13)) >>> 0;
        h = (h ^ hashU32[0]) >>> 0;
        // Avoid reserved values (0-3 and 0xFFFFFFFF)
        out[i] = h < 4 ? (h + 4) : h === 0xFFFFFFFF ? 0xFFFFFFFE : h;
      }
      typedArrays[colName] = out;
      continue;
    }

    for (let i = 0; i < len; i++) {
      const v = colData[i];

      // Distinguish null from undefined
      if (v === null) {
        out[i] = 0;
        continue;
      }
      if (v === undefined) {
        out[i] = 1;
        continue;
      }

      const t = typeof v;
      if (t === "boolean") {
        out[i] = v ? 2 : 3;
      } else if (t === "number") {
        const num = v as number;
        if (Number.isNaN(num)) {
          out[i] = 0xFFFFFFFF;
          continue;
        }
        hashF64[0] = num === 0 ? 0 : num;
        let h = hashU32[1];
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
        h = (h ^ (h >>> 13)) >>> 0;
        h = (h ^ hashU32[0]) >>> 0;
        out[i] = h < 4 ? (h + 4) : h === 0xFFFFFFFF ? 0xFFFFFFFE : h;
      } else {
        // Optimized fast string hash - polynomial hash
        const str = "" + v;
        let hash = 0;
        for (let j = 0; j < str.length; j++) {
          hash = (Math.imul(hash, 31) + str.charCodeAt(j)) >>> 0;
        }
        // Avoid reserved values
        hash = hash < 4 ? (hash + 4) : hash === 0xFFFFFFFF ? 0xFFFFFFFE : hash;
        out[i] = hash;
      }
    }

    typedArrays[colName] = out;
  }

  return typedArrays;
}
