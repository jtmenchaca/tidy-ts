// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { cross_join_u32 } from "../../wasm/wasm-loader.ts";

function getStoreAndIndex(df: any) {
  const store = df.__store;
  const view = df.__view;
  const index = materializeIndex(store.length, view);
  return { store, index };
}

function buildJoinResult(
  left: { store: any; index: Uint32Array },
  right: { store: any; index: Uint32Array },
  leftIndices: Uint32Array,
  rightIndices: Uint32Array,
  suffixes?: { left?: string; right?: string },
) {
  const n = leftIndices.length;
  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];

  const suffixLeft = suffixes?.left ?? "";
  const suffixRight = suffixes?.right ?? "";
  const leftNameSet = new Set(left.store.columnNames);
  const rightNameSet = new Set(right.store.columnNames);

  // Add left columns
  for (const name of left.store.columnNames) {
    const hasConflict = rightNameSet.has(name);
    const outName = hasConflict && suffixLeft ? `${name}${suffixLeft}` : name;

    // Only skip left column if there's a conflict and NO suffixes are provided
    if (hasConflict && !suffixLeft && !suffixRight) {
      continue;
    }

    outNames.push(outName);
    const leftCol = left.store.columns[name];
    const outCol = new Array(n);
    for (let i = 0; i < n; i++) {
      outCol[i] = leftCol[left.index[leftIndices[i]]];
    }
    outCols[outName] = outCol;
  }

  // Add right columns
  for (const name of right.store.columnNames) {
    const hasConflict = leftNameSet.has(name);
    const outName = hasConflict && suffixRight ? `${name}${suffixRight}` : name;

    outNames.push(outName);
    const rightCol = right.store.columns[name];
    const outCol = new Array(n);
    for (let i = 0; i < n; i++) {
      outCol[i] = rightCol[right.index[rightIndices[i]]];
    }
    outCols[outName] = outCol;
  }

  return { columns: outCols, columnNames: outNames, length: n };
}

/**
 * Cross join: create Cartesian product of all rows.
 */
export function cross_join(
  right: any,
  maxRows?: number,
  suffixes?: { left?: string; right?: string },
) {
  return (left: any): any => {
    if (left.nrows() === 0 || right.nrows() === 0) {
      return createColumnarDataFrameFromStore({
        columns: {},
        length: 0,
        columnNames: [],
      });
    }

    const expectedRows = left.nrows() * right.nrows();
    const actualRows = maxRows && maxRows < expectedRows
      ? maxRows
      : expectedRows;

    if (actualRows > 2147483647) {
      throw new Error(
        `Cross join would create ${actualRows} rows, exceeding JavaScript's maximum array length.`,
      );
    }

    const L = getStoreAndIndex(left);
    const R = getStoreAndIndex(right);

    const res = cross_join_u32(left.nrows(), right.nrows());
    let leftIdxView = res.takeLeft();
    let rightIdxView = res.takeRight();

    if (maxRows && maxRows < leftIdxView.length) {
      leftIdxView = leftIdxView.subarray(0, maxRows);
      rightIdxView = rightIdxView.subarray(0, maxRows);
    }

    const outStore = buildJoinResult(
      L,
      R,
      leftIdxView,
      rightIdxView,
      suffixes,
    );

    const outDf = createColumnarDataFrameFromStore(outStore) as any;

    if (left.__groups) {
      const outRows = outDf.toArray();
      return withGroupsRebuilt(left, outRows as any, outDf) as any;
    }

    return outDf;
  };
}
