// src/dataframe/ts/utility/create-dataframe/columns.ts

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
  columns: Record<string, unknown[]>,
  columnNames: string[],
): Record<string, string> {
  const types: Record<string, string> = {};

  for (const colName of columnNames) {
    const column = columns[colName];
    if (!column || column.length === 0) {
      types[colName] = "unknown";
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
 * - Numbers are scaled by 1000 and rounded (NaN maps to 0xFFFFFFFF)
 * - Strings/objects use fast 31-bit polynomial hash
 *
 * @param columns - Column data indexed by column name
 * @param keyCols - Column names to convert
 * @returns Record of column names to their Uint32Array representations
 */
export function convertToTypedArrays(
  columns: Record<string, unknown[]>,
  keyCols: string[],
): Record<string, Uint32Array> {
  const typedArrays: Record<string, Uint32Array> = {};

  for (const colName of keyCols) {
    const colData = columns[colName];
    if (!colData) continue;

    const len = colData.length;
    const out = new Uint32Array(len);

    for (let i = 0; i < len; i++) {
      const v = colData[i];

      // Fast null check
      if (v == null) {
        out[i] = 0;
        continue;
      }

      const t = typeof v;
      if (t === "boolean") {
        out[i] = v ? 1 : 0;
      } else if (t === "number") {
        const num = v as number;
        out[i] = Number.isNaN(num)
          ? 0xFFFFFFFF
          : (Math.round(num * 1000) >>> 0);
      } else {
        // Optimized fast string hash
        const str = "" + v;
        let hash = 0;
        for (let j = 0, c = 0; j < str.length; j++) {
          c = str.charCodeAt(j);
          hash = (hash * 31 + c) >>> 0;
        }
        out[i] = hash;
      }
    }

    typedArrays[colName] = out;
  }

  return typedArrays;
}
