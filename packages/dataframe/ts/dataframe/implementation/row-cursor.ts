import type { DataFrame } from "../types/dataframe.type.ts";
import { type ColumnData, type ColumnarStore, gatherColumn } from "./columnar-store.ts";
import { materializeIndex, type View } from "./columnar-view.ts";
import { createColumnarDataFrame } from "./create-dataframe.ts";

export function withIndex<Row extends object>(
  df: DataFrame<Row>,
  index: Uint32Array,
): DataFrame<Row> {
  // deno-lint-ignore no-explicit-any
  const api = df as any;
  const view: View = { ...(api.__view || {}), index, _materializedIndex: null };
  const out = createColumnarDataFrame([] as readonly object[]);
  // deno-lint-ignore no-explicit-any
  (out as any).__store = api.__store;
  // deno-lint-ignore no-explicit-any
  (out as any).__view = view;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowView = api.__rowView; // share
  // Preserve original __kind, __groups, and __rowLabels for proper chain proxy behavior
  // deno-lint-ignore no-explicit-any
  (out as any).__kind = api.__kind;
  // deno-lint-ignore no-explicit-any
  (out as any).__groups = api.__groups;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowLabels = api.__rowLabels;
  return out as unknown as DataFrame<Row>;
}

export function withMask<Row extends object>(
  df: DataFrame<Row>,
  mask: import("./columnar-view.ts").BitSet,
): DataFrame<Row> {
  const _p = (globalThis as Record<string, unknown>).__TIDY_PROFILE;
  let _t0 = _p ? performance.now() : 0;
  // deno-lint-ignore no-explicit-any
  const api = df as any;
  const view: View = { ...(api.__view || {}), mask, _materializedIndex: null };
  if (_p) { console.log(`    [withMask] build view: ${(performance.now() - _t0).toFixed(4)}ms`); _t0 = performance.now(); }
  const out = createColumnarDataFrame([] as readonly object[]);
  if (_p) { console.log(`    [withMask] createColumnarDataFrame(empty): ${(performance.now() - _t0).toFixed(4)}ms`); _t0 = performance.now(); }
  // deno-lint-ignore no-explicit-any
  (out as any).__store = api.__store;
  // deno-lint-ignore no-explicit-any
  (out as any).__view = view;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowView = api.__rowView;
  // Preserve original __kind, __groups, and __rowLabels for proper chain proxy behavior
  // deno-lint-ignore no-explicit-any
  (out as any).__kind = api.__kind;
  // deno-lint-ignore no-explicit-any
  (out as any).__groups = api.__groups;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowLabels = api.__rowLabels;
  if (_p) console.log(`    [withMask] assign props: ${(performance.now() - _t0).toFixed(4)}ms`);
  return out as unknown as DataFrame<Row>;
}

export function withRawMask<Row extends object>(
  df: DataFrame<Row>,
  rawMask: Uint8Array,
): DataFrame<Row> {
  const _p = (globalThis as Record<string, unknown>).__TIDY_PROFILE;
  let _t0 = _p ? performance.now() : 0;
  // deno-lint-ignore no-explicit-any
  const api = df as any;
  const view: View = { ...(api.__view || {}), rawMask, mask: null, _materializedIndex: null };
  if (_p) { console.log(`    [withRawMask] build view: ${(performance.now() - _t0).toFixed(4)}ms`); _t0 = performance.now(); }
  const out = createColumnarDataFrame([] as readonly object[]);
  if (_p) { console.log(`    [withRawMask] createColumnarDataFrame(empty): ${(performance.now() - _t0).toFixed(4)}ms`); _t0 = performance.now(); }
  // deno-lint-ignore no-explicit-any
  (out as any).__store = api.__store;
  // deno-lint-ignore no-explicit-any
  (out as any).__view = view;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowView = api.__rowView;
  // deno-lint-ignore no-explicit-any
  (out as any).__kind = api.__kind;
  // deno-lint-ignore no-explicit-any
  (out as any).__groups = api.__groups;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowLabels = api.__rowLabels;
  if (_p) console.log(`    [withRawMask] assign props: ${(performance.now() - _t0).toFixed(4)}ms`);
  return out as unknown as DataFrame<Row>;
}

function withOrder<Row extends object>(
  df: DataFrame<Row>,
  order: (ai: number, bi: number, cols: Record<string, unknown[]>) => number,
): DataFrame<Row> {
  // deno-lint-ignore no-explicit-any
  const api = df as any;
  const view: View = {
    ...(api.__view || {}),
    _order: order,
    _materializedIndex: null,
  };
  const out = createColumnarDataFrame([] as readonly object[]);
  // deno-lint-ignore no-explicit-any
  (out as any).__store = api.__store;
  // deno-lint-ignore no-explicit-any
  (out as any).__view = view;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowView = api.__rowView;
  // Preserve original __kind, __groups, and __rowLabels for proper chain proxy behavior
  // deno-lint-ignore no-explicit-any
  (out as any).__kind = api.__kind;
  // deno-lint-ignore no-explicit-any
  (out as any).__groups = api.__groups;
  // deno-lint-ignore no-explicit-any
  (out as any).__rowLabels = api.__rowLabels;
  return out as unknown as DataFrame<Row>;
}

// Clone store with copy-on-write columns (unchanged arrays are shared)
export function cowStore(
  base: ColumnarStore,
  updates: Partial<Record<string, ColumnData>>,
  drops: Set<string> = new Set(),
  renames: Record<string, string> = {},
): ColumnarStore {
  const names: string[] = [];
  const cols: Record<string, ColumnData> = {};
  for (const name of base.columnNames) {
    if (drops.has(name)) continue;
    const newName = renames[name] ?? name;
    names.push(newName);
    cols[newName] = updates[name] ?? base.columns[name];
  }
  // add any brand new columns not in base
  for (const k of Object.keys(updates)) {
    if (!(k in cols)) {
      names.push(k);
      cols[k] = updates[k]!;
    }
  }
  return { columnNames: names, columns: cols, length: base.length };
}

// Materialize a DataFrame to new store using given index (subset/reorder)
function materializeView<Row extends object>(
  df: DataFrame<Row>,
): ColumnarStore {
  // deno-lint-ignore no-explicit-any
  const api = df as any;
  const { __store, __view } = api;
  const idx = materializeIndex(__store.length, __view);
  const cols: Record<string, ColumnData> = {};
  for (const name of __store.columnNames) {
    cols[name] = gatherColumn(__store.columns[name], idx);
  }
  return {
    columnNames: [...__store.columnNames],
    columns: cols,
    length: idx.length,
  };
}
