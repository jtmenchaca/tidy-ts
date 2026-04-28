/**
 * Shared helper utilities used across multiple verb implementations.
 */

import {
  type BitSet,
  bitsetGet,
} from "../dataframe/implementation/columnar-view.ts";
import {
  type ColumnData,
  type ColumnarStore,
  gatherColumn,
} from "../dataframe/implementation/columnar-store.ts";
import { createColumnarDataFrameFromStore } from "../dataframe/index.ts";
import { isComparable } from "../stats/helpers.ts";

/**
 * Lightweight row cursor that provides property-getter access to columnar data.
 * Used internally by verbs that rebuild stores and need to attach a new __rowView.
 *
 * For mutate operations that add columns dynamically, pass `configurable: true`
 * so that property definitions can be overwritten when new columns are added.
 */
export class RowView {
  private _i = 0;
  constructor(
    private cols: Record<string, ColumnData>,
    names: string[],
    configurable = false,
  ) {
    for (const name of names) {
      Object.defineProperty(this, name, {
        get: () => this.cols[name][this._i],
        enumerable: true,
        configurable,
      });
    }
  }
  setCursor(i: number) {
    this._i = i;
  }
}

/**
 * Build a new DataFrame from a columnar store by selecting rows at the given
 * physical indices. Returns the DataFrame with __view reset and __rowView attached.
 */
// deno-lint-ignore no-explicit-any
export function buildDataFrameFromIndices(
  store: ColumnarStore,
  indices: number[],
): any {
  const newColumns: Record<string, ColumnData> = {};
  const len = indices.length;
  for (const colName of store.columnNames) {
    newColumns[colName] = gatherColumn(store.columns[colName], indices);
  }
  const newStore: ColumnarStore = {
    columns: newColumns,
    columnNames: [...store.columnNames],
    length: len,
  };
  const out = createColumnarDataFrameFromStore(newStore);
  // deno-lint-ignore no-explicit-any
  (out as any).__view = {};
  // deno-lint-ignore no-explicit-any
  (out as any).__rowView = new RowView(newColumns, newStore.columnNames);
  return out;
}

/**
 * Compare two values with null-safe, type-aware logic.
 * Nulls always sort to the end regardless of direction.
 *
 * Type cascade: null → number → Date → Comparable → string (localeCompare).
 */
export function compareValues(
  a: unknown,
  b: unknown,
  direction: "asc" | "desc" = "asc",
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const desc = direction === "desc";
  if (typeof a === "number" && typeof b === "number") {
    return desc ? b - a : a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return desc ? b.getTime() - a.getTime() : a.getTime() - b.getTime();
  }
  if (isComparable(a) && isComparable(b)) {
    return desc
      ? a.constructor.compare(b, a)
      : a.constructor.compare(a, b);
  }
  return desc
    ? String(b).localeCompare(String(a))
    : String(a).localeCompare(String(b));
}

/**
 * Collect row indices for a single group from the adjacency list,
 * filtering by mask if present.
 *
 * Returns view-level indices (not physical store indices). If you need
 * physical indices, remap through `baseIndex` afterward.
 */
export function collectGroupIndices({
  head,
  next,
  groupIndex,
  mask,
}: {
  head: Int32Array;
  next: Int32Array;
  groupIndex: number;
  mask?: BitSet | null;
}): number[] {
  const indices: number[] = [];
  let rowIdx = head[groupIndex];
  while (rowIdx !== -1) {
    if (!mask || bitsetGet(mask, rowIdx)) {
      indices.push(rowIdx);
    }
    rowIdx = next[rowIdx];
  }
  return indices;
}
