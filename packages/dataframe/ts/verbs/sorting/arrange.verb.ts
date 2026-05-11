// deno-lint-ignore-file no-explicit-any
// packages/dataframe/ts/transformation/arrange.ts
import { withIndex } from "../../dataframe/index.ts";
import { withGroupsRebuilt } from "../../dataframe/index.ts";
import { isComparable } from "../../stats/helpers.ts";
import { validateColumnsExist } from "../../utilities/errors.ts";
import {
  // fast path: multi-column numeric/date sorter (column-major f64)
  arrange_multi_f64_wasm,
  // stable single-key sorters used per pass (last→first) for mixed/string/grouped
  stable_sort_indices_f64_wasm,
  stable_sort_indices_u32_wasm,
} from "../../wasm/wasm-loader.ts";
type SortDirection = "asc" | "desc";

// Rank assigned to string "NA" (null/undefined) values; ensures they sort last.
const NA_STR_CODE = 0xffffffff;

// ---------- Helpers ----------

/** A column is numeric-ish if every non-null value is number or Date. */
function isNumericishCol(col: unknown[] | Float64Array): boolean {
  if (!col) return true; // Empty/undefined columns are considered numeric-ish
  if (col instanceof Float64Array) return true; // Already typed numeric
  for (let i = 0; i < col.length; i++) {
    const v = col[i];
    if (v == null) continue;
    if (typeof v === "number") continue;
    if (v instanceof Date) continue;
    return false;
  }
  return true;
}

/** Coerce any value to f64 (numbers & Date supported; null/undefined/other -> NaN). */
function coerceToF64(col: unknown[] | Float64Array, nRows: number): Float64Array {
  // Short-circuit: already Float64Array with correct length
  if (col instanceof Float64Array && col.length === nRows) return col;
  const out = new Float64Array(nRows);
  for (let i = 0; i < nRows; i++) {
    const v = col[i];
    out[i] = v == null
      ? Number.NaN
      : v instanceof Date
      ? +v
      : typeof v === "number"
      ? v
      : Number.NaN;
  }
  return out;
}

/**
 * Encode (possibly heterogeneous) string column to rank codes:
 *  - string: its lexicographic rank
 *  - number/Date/bool: stringified then ranked (deterministic)
 *  - object/array: JSON-stringified then ranked (deterministic)
 *  - null/undefined: NA_STR_CODE (sorts last)
 *
 * This lets WASM sort by integers stably.
 */
function encodeStringCol(col: unknown[], nRows: number): Uint32Array {
  const uniqSet = new Set<string>();
  for (let i = 0; i < nRows; i++) {
    const v = col[i];
    if (v == null) continue;
    switch (typeof v) {
      case "string":
        uniqSet.add(v);
        break;
      case "number":
        uniqSet.add(String(v));
        break;
      case "boolean":
        uniqSet.add(v ? "true" : "false");
        break;
      case "object":
        if (v instanceof Date) uniqSet.add(String(+v));
        else if (isComparable(v)) uniqSet.add(String(v));
        else uniqSet.add(JSON.stringify(v));
        break;
      default:
        uniqSet.add(String(v));
    }
  }
  const uniq = Array.from(uniqSet);
  // NOTE: swap to Intl.Collator for locale-aware order if desired.
  uniq.sort();

  const rank = new Map<string, number>();
  for (let i = 0; i < uniq.length; i++) rank.set(uniq[i], i);

  const out = new Uint32Array(nRows);
  for (let i = 0; i < nRows; i++) {
    const v = col[i];
    if (v == null) {
      out[i] = NA_STR_CODE;
    } else if (typeof v === "string") {
      out[i] = rank.get(v)!;
    } else if (typeof v === "number") {
      out[i] = rank.get(String(v)) ?? NA_STR_CODE;
    } else if (typeof v === "boolean") {
      out[i] = rank.get(v ? "true" : "false") ?? NA_STR_CODE;
    } else if (v instanceof Date) {
      out[i] = rank.get(String(+v)) ?? NA_STR_CODE;
    } else if (isComparable(v)) {
      out[i] = rank.get(String(v)) ?? NA_STR_CODE;
    } else {
      out[i] = rank.get(JSON.stringify(v)) ?? NA_STR_CODE;
    }
  }
  return out;
}

/**
 * Stable multi-pass arrange that supports:
 *  - strings & mixed types (via rank encoding)
 *  - grouped data (sort each group independently)
 * Strategy:
 *   - Prepare per-column typed buffers once (Float64Array or Uint32Array ranks)
 *   - Build an index buffer
 *   - For each key from last→first, perform a **stable** in-place sort of indices
 */
function arrangeWasmStable(
  df: any,
  columns: any[],
  directions: SortDirection[],
): any {
  const g = df;
  const api = df;
  const store = api.__store;
  const nRows: number = store.length;

  const colNames = columns.map(String);
  const specs = colNames.map((name, i) => ({
    name,
    dir: (directions[i] ?? "asc") as SortDirection,
  }));

  const prepared = colNames.map((name) => {
    const col = store.columns[name];
    if (isNumericishCol(col)) {
      return { kind: "f64" as const, values: coerceToF64(col, nRows) };
    } else {
      return { kind: "u32" as const, values: encodeStringCol(col, nRows) };
    }
  });

  const stableSortByKey = (idx: Uint32Array, k: number) => {
    const { kind, values } = prepared[k];
    const asc = specs[k].dir === "asc";
    if (kind === "f64") {
      stable_sort_indices_f64_wasm(values as Float64Array, idx, asc);
    } else {
      stable_sort_indices_u32_wasm(
        values as Uint32Array,
        idx,
        asc,
        NA_STR_CODE,
      );
    }
  };

  if (!g.__groups) {
    const idx = new Uint32Array(nRows);
    for (let i = 0; i < nRows; i++) idx[i] = i;
    for (let k = specs.length - 1; k >= 0; k--) {
      stableSortByKey(idx, k);
    }
    return withIndex(df, idx);
  }

  // Grouped: sort each group index slice independently; preserve group block order
  const blocks: number[] = [];
  const { head, next, size } = g.__groups;

  for (let g = 0; g < size; g++) {
    // Collect rows for this group
    const groupRows: number[] = [];
    let rowIdx = head[g];
    while (rowIdx !== -1) {
      groupRows.push(rowIdx);
      rowIdx = next[rowIdx];
    }

    const idx = new Uint32Array(groupRows.length);
    for (let i = 0; i < groupRows.length; i++) idx[i] = groupRows[i];
    for (let k = specs.length - 1; k >= 0; k--) {
      stableSortByKey(idx, k);
    }
    for (let i = 0; i < idx.length; i++) blocks.push(idx[i]);
  }
  const result = withIndex(
    df,
    new Uint32Array(blocks),
  );
  // Rebuild groups over reordered rows to keep adjacency correct
  const outRows = result.toArray();
  return withGroupsRebuilt(
    g,
    outRows,
    result,
  );
}

// ---------- Implementation ----------

export function arrange(
  columnOrColumns: any,
  directionOrColumnsOrDirections?: any,
  ...additionalColumns: any[]
): any {
  return (df: any) => {
    const g = df;
    const api = df;
    const store = api.__store;

    // Normalize inputs - handle array, single column, and variadic syntax
    let columns: any[];
    let directions: SortDirection[] = [];

    if (Array.isArray(columnOrColumns)) {
      // Array syntax: arrange(["col1", "col2"], ["asc", "desc"])
      columns = columnOrColumns;

      if (directionOrColumnsOrDirections === undefined) {
        directions = columns.map(() => "asc");
      } else if (Array.isArray(directionOrColumnsOrDirections)) {
        directions = directionOrColumnsOrDirections as SortDirection[];
      } else if (typeof directionOrColumnsOrDirections === "string") {
        // Single direction applied to all columns
        directions = columns.map(() =>
          directionOrColumnsOrDirections as SortDirection
        );
      }
    } else {
      // Single column or variadic syntax
      if (
        directionOrColumnsOrDirections === "asc" ||
        directionOrColumnsOrDirections === "desc"
      ) {
        // Single column with direction: arrange("col1", "desc")
        columns = [columnOrColumns];
        directions = [directionOrColumnsOrDirections];
      } else if (
        directionOrColumnsOrDirections === undefined &&
        additionalColumns.length === 0
      ) {
        // Single column, no direction: arrange("col1")
        columns = [columnOrColumns];
        directions = ["asc"];
      } else {
        // Variadic: arrange("col1", "col2", "col3")
        // Accept a property key as the second parameter; reject array forms here
        const maybeSecond = directionOrColumnsOrDirections;
        const moreCols: any[] = [];
        const t = typeof maybeSecond;
        if (t === "string" || t === "number" || t === "symbol") {
          moreCols.push(maybeSecond);
        } else if (Array.isArray(maybeSecond)) {
          throw new Error(
            "Invalid arrange arguments: use arrange([cols], directions?) for array syntax.",
          );
        }
        columns = [columnOrColumns, ...moreCols, ...additionalColumns];
        directions = columns.map(() => "asc");
      }
    }

    if (directions.length > 0 && directions.length !== columns.length) {
      throw new Error(
        `Direction array length (${directions.length}) must match column array length (${columns.length})`,
      );
    }

    const nRows = store.length;
    const colNames = columns.map(String);
    if (nRows > 0) {
      validateColumnsExist(colNames, store.columnNames);
    }
    const cols: unknown[][] = colNames.map((n) => store.columns[n]);
    const allNumeric = cols.every(isNumericishCol);

    // ---------- Fast path: all numeric/date (ungrouped or grouped) ----------
    if (allNumeric) {
      // For grouped data, prepend group ID as the primary sort key (asc)
      // so groups stay together. Then sort columns follow.
      const groups = g.__groups;
      const totalCols = groups ? cols.length + 1 : cols.length;
      const flat = new Float64Array(totalCols * nRows);

      let colOffset = 0;
      if (groups) {
        // Column 0: group ID per row (ensures groups stay contiguous)
        // Build gid_per_row from adjacency list
        const { head, next, size } = groups;
        for (let gid = 0; gid < size; gid++) {
          let rowIdx = head[gid];
          while (rowIdx !== -1) {
            flat[rowIdx] = gid; // column 0 at offset 0
            rowIdx = next[rowIdx];
          }
        }
        colOffset = 1;
      }

      // Fill sort columns
      for (let k = 0; k < cols.length; k++) {
        const base = (k + colOffset) * nRows;
        const col = cols[k];
        for (let r = 0; r < nRows; r++) {
          const v = col[r];
          flat[base + r] = v == null
            ? Number.NaN
            : v instanceof Date
            ? +v
            : typeof v === "number"
            ? v
            : Number.NaN;
        }
      }

      // Directions: group ID is always asc (+1), then user-specified directions
      const userDirs = directions.length
        ? directions.map((d) => (d === "desc" ? -1 : +1))
        : columns.map(() => +1);
      const dirs = new Int8Array(
        groups ? [+1, ...userDirs] : userDirs,
      );

      const outIdx = new Uint32Array(nRows);
      try {
        arrange_multi_f64_wasm(flat, nRows, totalCols, dirs, outIdx);

        if (!groups) {
          return withIndex(df, outIdx);
        }

        // Grouped: rebuild adjacency list from sorted order
        // Rows are now contiguous per group in outIdx
        const result = withIndex(df, outIdx);
        const { size, groupingColumns, count } = groups;
        const newHead = new Int32Array(size);
        const newNext = new Int32Array(nRows);
        const newCount = new Uint32Array(count);
        const newKeyRow = new Uint32Array(size);
        newNext.fill(-1);

        // Walk sorted indices; group ID is flat[outIdx[i]] (column 0)
        let currentGid = -1;
        let prevRow = -1;
        for (let i = 0; i < nRows; i++) {
          const row = outIdx[i];
          const gid = flat[row]; // column 0 = group ID
          if (gid !== currentGid) {
            currentGid = gid;
            newHead[gid] = i;
            newKeyRow[gid] = row;
            prevRow = i;
          } else {
            newNext[prevRow] = i;
            prevRow = i;
          }
        }

        (result as any).__groups = {
          groupingColumns: [...groupingColumns],
          head: newHead,
          next: newNext,
          count: newCount,
          keyRow: newKeyRow,
          size,
          usesRawIndices: false,
        };
        (result as any).__kind = "GroupedDataFrame";
        return result;
      } catch (_e) {
        // fall through to general stable path
      }
    }

    // ---------- General stable path: strings + mixed + grouped ----------
    return arrangeWasmStable(df, columns, directions);
  };
}
