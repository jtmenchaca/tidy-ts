// src/dataframe/ts/transformation/group-by.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import {
  createColumnarDataFrameFromStore,
  materializeIndex,
} from "../../dataframe/index.ts";

export function groupBy<
  T extends Record<string, unknown>,
  K extends keyof T,
>(columnOrColumns?: K | K[], ...additionalColumns: K[]) {
  return (df: DataFrame<T>): GroupedDataFrame<T, K> => {
    // Normalize inputs - handle both array and rest parameter syntax
    const columns = columnOrColumns === undefined
      ? []
      : Array.isArray(columnOrColumns)
      ? columnOrColumns
      : [columnOrColumns, ...additionalColumns];
    // deno-lint-ignore no-explicit-any
    const api = df as any;
    if (!columns.length) {
      const out = createColumnarDataFrameFromStore(api.__store, api.__options);
      // deno-lint-ignore no-explicit-any
      (out as any).__view = api.__view;
      // deno-lint-ignore no-explicit-any
      (out as any).__groups = undefined;
      return out as unknown as GroupedDataFrame<T, K>;
    }

    const store = api.__store;
    const viewObj = api.__view;

    // Optimize: avoid materializing identity index for unfiltered DataFrames
    let view: Uint32Array | null = null;
    let n: number;
    let getVal: (i: number, col: string) => unknown;

    if (!viewObj || (!viewObj.index && !viewObj.mask)) {
      // Fast path: no view transformations, work directly with raw indices
      n = store.length;
      getVal = (i: number, col: string) => {
        const column = store.columns[col];
        if (!column) {
          throw new Error(
            `Column '${col}' not found in DataFrame. Available columns: [${
              Object.keys(store.columns).join(", ")
            }]`,
          );
        }
        return column[i];
      };
    } else {
      // Slow path: materialize index for filtered/transformed DataFrames
      view = materializeIndex(store.length, viewObj);
      n = view.length;
      getVal = (i: number, col: string) => {
        const column = store.columns[col];
        if (!column) {
          throw new Error(
            `Column '${col}' not found in DataFrame. Available columns: [${
              Object.keys(store.columns).join(", ")
            }]`,
          );
        }
        return column[view![i]];
      };
    }

    // Adjacency representation
    const next = new Int32Array(n);
    next.fill(-1);
    const head: number[] = []; // head row (view index) per group
    const count: number[] = []; // count per group
    const keyRow: number[] = []; // representative row (view index) per group

    // Key → gid
    let gid = 0;

    if (columns.length === 1) {
      const col = String(columns[0]);
      const m = new Map<unknown, number>();

      for (let i = 0; i < n; i++) {
        const k = getVal(i, col);
        let g = m.get(k);
        if (g === undefined) {
          g = gid++;
          m.set(k, g);
          head[g] = -1;
          count[g] = 0;
          keyRow[g] = i;
        }
        next[i] = head[g];
        head[g] = i;
        count[g] = (count[g] + 1) | 0;
      }
    } else {
      // Nested-Map composite key: faster than string concat for many columns
      // deno-lint-ignore no-explicit-any
      type Node = Map<unknown, any>;
      const root: Node = new Map();

      const getOrCreateGid = (i: number): number => {
        let node: Node = root;
        for (let c = 0; c < columns.length - 1; c++) {
          const v = getVal(i, String(columns[c]));
          let nxt = node.get(v);
          if (!nxt) {
            nxt = new Map();
            node.set(v, nxt);
          }
          node = nxt;
        }
        const last = getVal(i, String(columns[columns.length - 1]));
        let g = node.get(last);
        if (g === undefined) {
          g = gid++;
          node.set(last, g);
          head[g] = -1;
          count[g] = 0;
          keyRow[g] = i;
        }
        return g;
      };

      for (let i = 0; i < n; i++) {
        const g = getOrCreateGid(i);
        next[i] = head[g];
        head[g] = i;
        count[g] = (count[g] + 1) | 0;
      }
    }

    // Pack to typed arrays
    const G = gid;
    const headArr = new Int32Array(G);
    const cntArr = new Uint32Array(G);
    const keyRowArr = new Uint32Array(G);
    for (let g = 0; g < G; g++) {
      headArr[g] = head[g] ?? -1;
      cntArr[g] = count[g] ?? 0;
      keyRowArr[g] = keyRow[g] ?? 0;
    }

    // Output grouped DF reusing the same store/view
    const out = createColumnarDataFrameFromStore(store, api.__options);
    // deno-lint-ignore no-explicit-any
    (out as any).__view = api.__view;
    // deno-lint-ignore no-explicit-any
    (out as any).__groups = undefined;

    // Kind tag for robust GroupedDataFrame detection
    // deno-lint-ignore no-explicit-any
    (out as any).__kind = "GroupedDataFrame";

    // Store only adjacency list representation - no legacy arrays
    // deno-lint-ignore no-explicit-any
    (out as any).__groups = {
      groupingColumns: columns,
      head: headArr, // Int32Array[G] - adjacency list heads
      next, // Int32Array[n] - adjacency list next pointers
      count: cntArr, // Uint32Array[G] - group sizes
      keyRow: keyRowArr, // Uint32Array[G] - representative row per group
      size: G, // number of groups
      // Store whether we're using raw indices or materialized view
      usesRawIndices: view === null,
    };

    return out as unknown as GroupedDataFrame<T, K>;
  };
}
