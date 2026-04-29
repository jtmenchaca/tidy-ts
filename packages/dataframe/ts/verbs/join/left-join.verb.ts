// deno-lint-ignore-file no-explicit-any

import {
  type ColumnData,
  type ColumnarStore,
  createColumnarDataFrameFromStore,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import {
  gather_f64_columns,
  left_join_typed_multi_u32,
} from "../../wasm/wasm-loader.ts";
import { parseJoinArgs } from "./join-helpers.ts";
import { materializeIndex } from "../../dataframe/implementation/columnar-view.ts";
import { toColumnarStorage } from "../../dataframe/implementation/columnar-store.ts";

const RIGHT_NULL: number = 0xFFFFFFFF;

function getStoreViewInfo(df: any): {
  store: ColumnarStore;
  hasView: boolean;
  index: Uint32Array;
} {
  const store: ColumnarStore | undefined = df.__store;
  const view = df.__view;
  if (store) {
    const hasView = !!(view && (view.index || view.mask || view.rawMask));
    const index = hasView
      ? materializeIndex(store.length, view)
      : undefined!; // unused when !hasView
    return { store, hasView, index };
  }
  const rows = Array.from(df) as object[];
  const tmp = toColumnarStorage(rows);
  const idx = new Uint32Array(tmp.length);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  return { store: tmp, hasView: false, index: idx };
}

export function left_join(
  right: any,
  byOrOptions: any,
  options?: any,
): (left: any) => any {
  return (left: any): any => {
    if (left.nrows() === 0) {
      const leftCols = left.columns() as string[];
      const rightCols = right.columns() as string[];
      const allCols = [...new Set([...leftCols, ...rightCols])];
      const columns: Record<string, unknown[]> = {};
      for (const col of allCols) columns[col] = [];
      return createColumnarDataFrameFromStore({
        columns,
        length: 0,
        columnNames: allCols,
      });
    }

    const { leftKeys, rightKeys, suffixes } = parseJoinArgs(
      byOrOptions,
      options,
    );

    const L = getStoreViewInfo(left);
    const R = getStoreViewInfo(right);

    // Left join with empty right = all left rows with undefined right columns
    if (right.nrows() === 0) {
      const leftColumnNames = left.columns() as string[];
      const rightColumnNames = right.columns() as string[];
      const leftKeySet = new Set(leftKeys);
      const leftSuffix = suffixes.left ?? "";
      const rightSuffix = suffixes.right ?? "_y";
      const leftNameSet = new Set(leftColumnNames);
      const rightNameSet = new Set<string>(rightColumnNames);

      const outCols: Record<string, any> = {};
      const outNames: string[] = [];
      const nLeft = left.nrows();

      for (const name of leftColumnNames) {
        const isKey = leftKeySet.has(name);
        const hasConflict = !isKey && rightNameSet.has(name);
        const outName = hasConflict && leftSuffix
          ? `${name}${leftSuffix}`
          : name;
        outNames.push(outName);
        outCols[outName] = L.store.columns[name].slice(0, nLeft);
      }

      for (const name of rightColumnNames) {
        if (leftKeySet.has(name)) continue;
        const hasConflict = leftNameSet.has(name);
        const outName = hasConflict && rightSuffix
          ? `${name}${rightSuffix}`
          : name;
        outNames.push(outName);
        outCols[outName] = new Array(nLeft).fill(undefined);
      }

      return createColumnarDataFrameFromStore({
        columns: outCols,
        columnNames: outNames,
        length: nLeft,
      });
    }

    const leftSuffix = suffixes.left ?? "";
    const rightSuffix = suffixes.right ?? "_y";
    const leftKeySet = new Set(leftKeys);
    const leftColumnNames = left.columns() as string[];
    const rightColumnNames = right.columns() as string[];
    const leftNameSet = new Set(leftColumnNames);
    const rightNameSet = new Set<string>(rightColumnNames);

    // Compute output column names
    const outNames: string[] = [];
    for (const name of leftColumnNames) {
      const isKey = leftKeySet.has(name);
      const hasConflict = !isKey && rightNameSet.has(name);
      outNames.push(
        hasConflict && leftSuffix ? `${name}${leftSuffix}` : name,
      );
    }
    const rightValueNames: string[] = [];
    const rightOutNames: string[] = [];
    for (const name of rightColumnNames) {
      if (leftKeySet.has(name)) continue;
      rightValueNames.push(name);
      const hasConflict = leftNameSet.has(name);
      const outName = hasConflict && rightSuffix
        ? `${name}${rightSuffix}`
        : name;
      rightOutNames.push(outName);
      outNames.push(outName);
    }

    // Convert key columns to typed u32 arrays for hash join
    const leftTypedRaw = convertToTypedArrays(L.store.columns, leftKeys);
    const rightTypedRaw = convertToTypedArrays(R.store.columns, rightKeys);

    let leftColumnData: Uint32Array[];
    let rightColumnData: Uint32Array[];

    if (!L.hasView) {
      leftColumnData = leftKeys.map((k) => leftTypedRaw[k]);
    } else {
      leftColumnData = leftKeys.map((k) => {
        const raw = leftTypedRaw[k];
        const out = new Uint32Array(L.index.length);
        for (let i = 0; i < L.index.length; i++) out[i] = raw[L.index[i]];
        return out;
      });
    }
    if (!R.hasView) {
      rightColumnData = rightKeys.map((k) => rightTypedRaw[k]);
    } else {
      rightColumnData = rightKeys.map((k) => {
        const raw = rightTypedRaw[k];
        const out = new Uint32Array(R.index.length);
        for (let i = 0; i < R.index.length; i++) out[i] = raw[R.index[i]];
        return out;
      });
    }

    let leftIdx: Uint32Array;
    let rightIdx: Uint32Array;

    try {
      if (
        leftColumnData.length === 0 || rightColumnData.length === 0 ||
        !leftColumnData[0] || !rightColumnData[0] ||
        leftColumnData[0].length === 0 || rightColumnData[0].length === 0
      ) {
        throw new Error("Empty data, using JS fallback");
      }

      const wasmResult = left_join_typed_multi_u32(
        leftColumnData,
        rightColumnData,
      );
      leftIdx = (wasmResult as any).takeLeft() as Uint32Array;
      rightIdx = (wasmResult as any).takeRight() as Uint32Array;
    } catch {
      const map = new Map<string, number[]>();
      const rcols = rightColumnData;
      for (let i = 0; i < rcols[0].length; i++) {
        const parts: string[] = new Array(rcols.length);
        for (let c = 0; c < rcols.length; c++) parts[c] = String(rcols[c][i]);
        const key = parts.join("|");
        let arr = map.get(key);
        if (!arr) { arr = []; map.set(key, arr); }
        arr.push(i);
      }

      const lcols = leftColumnData;
      const leftArr: number[] = [];
      const rightArr: number[] = [];
      for (let i = 0; i < lcols[0].length; i++) {
        const parts: string[] = new Array(lcols.length);
        for (let c = 0; c < lcols.length; c++) parts[c] = String(lcols[c][i]);
        const key = parts.join("|");
        const matches = map.get(key);
        if (matches && matches.length) {
          for (let j = 0; j < matches.length; j++) {
            leftArr.push(i);
            rightArr.push(matches[j]);
          }
        } else {
          leftArr.push(i);
          rightArr.push(RIGHT_NULL);
        }
      }

      leftIdx = new Uint32Array(leftArr);
      rightIdx = new Uint32Array(rightArr);
    }

    const n = leftIdx.length;

    const leftPhys = L.hasView ? gatherPhysical(leftIdx, L.index) : leftIdx;
    const rightPhys = R.hasView
      ? gatherPhysicalNullable(rightIdx, R.index)
      : rightIdx;

    // Separate Float64Array columns for Rust gather vs plain Array columns
    const leftF64Names: string[] = [];
    const leftF64Cols: Float64Array[] = [];
    const leftPlainIndices: number[] = [];
    for (let ci = 0; ci < leftColumnNames.length; ci++) {
      const src = L.store.columns[leftColumnNames[ci]];
      if (src instanceof Float64Array) {
        leftF64Names.push(outNames[ci]);
        leftF64Cols.push(L.hasView ? gatherF64View(src, L.index) : src);
      } else {
        leftPlainIndices.push(ci);
      }
    }

    const rightF64Names: string[] = [];
    const rightF64Cols: Float64Array[] = [];
    const rightPlainIndices: number[] = [];
    for (let ci = 0; ci < rightValueNames.length; ci++) {
      const src = R.store.columns[rightValueNames[ci]];
      if (src instanceof Float64Array) {
        rightF64Names.push(rightOutNames[ci]);
        rightF64Cols.push(R.hasView ? gatherF64View(src, R.index) : src);
      } else {
        rightPlainIndices.push(ci);
      }
    }

    const outCols: Record<string, ColumnData> = {};

    // Rust gather for left Float64Array columns (fast path — never nullable)
    try {
      if (leftF64Cols.length > 0) {
        const gathered = gather_f64_columns(leftF64Cols, leftPhys);
        for (let i = 0; i < leftF64Names.length; i++) {
          outCols[leftF64Names[i]] = gathered[i];
        }
      }
    } catch {
      for (let i = 0; i < leftF64Names.length; i++) {
        const src = leftF64Cols[i];
        const dst = new Float64Array(n);
        for (let j = 0; j < n; j++) dst[j] = src[leftPhys[j]];
        outCols[leftF64Names[i]] = dst;
      }
    }
    // Right Float64Array columns: use plain Array to preserve undefined for unmatched rows
    for (let i = 0; i < rightF64Names.length; i++) {
      const src = rightF64Cols[i];
      const dst = new Array(n);
      for (let j = 0; j < n; j++) {
        const p = rightPhys[j];
        dst[j] = p === RIGHT_NULL ? undefined : src[p];
      }
      outCols[rightF64Names[i]] = dst;
    }

    // JS gather for non-Float64Array columns (left side)
    for (const ci of leftPlainIndices) {
      const src = L.store.columns[leftColumnNames[ci]];
      const dst = new Array(n);
      for (let i = 0; i < n; i++) dst[i] = src[leftPhys[i]];
      outCols[outNames[ci]] = dst;
    }
    // JS gather for non-Float64Array columns (right side — nullable)
    for (const ci of rightPlainIndices) {
      const src = R.store.columns[rightValueNames[ci]];
      const dst = new Array(n);
      for (let i = 0; i < n; i++) {
        const p = rightPhys[i];
        dst[i] = p === RIGHT_NULL ? undefined : src[p];
      }
      outCols[rightOutNames[ci]] = dst;
    }

    const outStore = { columns: outCols, columnNames: outNames, length: n };
    const outDf = createColumnarDataFrameFromStore(outStore) as any;

    if (left.__groups) {
      const outRows = outDf.toArray();
      return withGroupsRebuilt(left, outRows as any, outDf as any) as any;
    }

    return outDf;
  };
}

function gatherPhysical(
  joinIdx: Uint32Array,
  viewIdx: Uint32Array,
): Uint32Array {
  const n = joinIdx.length;
  const out = new Uint32Array(n);
  for (let i = 0; i < n; i++) out[i] = viewIdx[joinIdx[i]];
  return out;
}

function gatherPhysicalNullable(
  joinIdx: Uint32Array,
  viewIdx: Uint32Array,
): Uint32Array {
  const n = joinIdx.length;
  const out = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    const v = joinIdx[i];
    out[i] = v === RIGHT_NULL ? RIGHT_NULL : viewIdx[v];
  }
  return out;
}

function gatherF64View(src: Float64Array, viewIdx: Uint32Array): Float64Array {
  const n = viewIdx.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = src[viewIdx[i]];
  return out;
}
