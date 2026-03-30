// deno-lint-ignore-file no-explicit-any
import { right_join_typed_multi_u32 } from "../../wasm/wasm-loader.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import {
  type ColumnarStore,
  createColumnarDataFrameFromStore,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import type { StoreAndIndex } from "./types/index.ts";
import {
  computeColumnConflicts,
  computeSameNamedKeys,
  createEmptyJoinResult,
  getStoreAndIndex,
  processJoinColumns,
  setupJoinOperation,
} from "./join-helpers.ts";

function buildOutputStoreRight(
  left: StoreAndIndex,
  right: StoreAndIndex,
  leftIdxView: readonly (number | null)[],
  rightIdxView: readonly number[],
  leftJoinKeys: string[],
  rightJoinKeys: string[],
  suffixes: { left?: string; right?: string },
  leftDataFrame: any,
  rightDataFrame: any,
): ColumnarStore {
  const n = rightIdxView.length;

  // Precompute base indices
  const rightBase = new Uint32Array(n);
  const leftBase = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    rightBase[i] = right.index[rightIdxView[i]];
    const lv = leftIdxView[i];
    leftBase[i] = lv == null ? 0xFFFFFFFF : left.index[lv];
  }

  // Identify conflicting column names (excluding join keys)
  // Use DataFrame.columns() to get schema even for empty DataFrames
  const leftColumnNames = leftDataFrame.columns() as string[];
  const rightColumnNames = rightDataFrame.columns() as string[];
  const { leftNameSet, rightNameSet, leftKeySet } = computeColumnConflicts(
    leftColumnNames,
    rightColumnNames,
    leftJoinKeys,
  );
  const suffixLeft = suffixes.left ?? "";
  const suffixRight = suffixes.right ?? "_y";

  // Compute same-named left keys to drop (only exact pairs)
  const { sameNamedLeftKeys } = computeSameNamedKeys(
    leftJoinKeys,
    rightJoinKeys,
  );

  // Process right columns (no nullable indices needed for right side)
  // For conflicts, don't apply suffix to join keys
  const rightKeySet = new Set(rightJoinKeys);
  const rightConflictSet = new Set<string>();
  for (const name of leftNameSet) {
    if (!rightKeySet.has(name)) {
      rightConflictSet.add(name);
    }
  }

  const rightResult = processJoinColumns({
    store: right,
    baseIndices: rightBase,
    columnNames: rightColumnNames,
    nameSet: rightNameSet,
    conflictSet: rightConflictSet,
    keySet: rightKeySet,
    dropKeys: new Set<string>(),
    suffix: suffixRight,
    useNullable: false,
  });

  // Process left columns with nullable handling
  const leftResult = processJoinColumns({
    store: left,
    baseIndices: leftBase,
    columnNames: leftColumnNames,
    nameSet: leftNameSet,
    conflictSet: rightNameSet,
    keySet: leftKeySet,
    dropKeys: sameNamedLeftKeys,
    suffix: suffixLeft,
    useNullable: true,
  });

  // Merge results
  const columns = { ...rightResult.columns, ...leftResult.columns };
  const columnNames = [...rightResult.names, ...leftResult.names];

  return { columns, length: n, columnNames };
}

/**
 * Right join: keep all rows from right; fill left columns with undefined if no matching key.
 * Columnar-first; respects DataFrame views/masks/orders.
 */
export function right_join(
  right: any,
  byOrOptions: any,
  options?: any,
): (left: any) => any {
  return (left: any): any => {
    // Early empty fast-path - right join with empty right = empty result
    // But preserve schema from both sides
    if (right.nrows() === 0) {
      const leftCols = left.columns() as string[];
      const rightCols = right.columns() as string[];
      const allCols = [...new Set([...rightCols, ...leftCols])];
      const columns: Record<string, unknown[]> = {};
      for (const col of allCols) {
        columns[col] = [];
      }
      return createColumnarDataFrameFromStore({
        columns,
        length: 0,
        columnNames: allCols,
      });
    }

    // If left dataframe is empty, return right dataframe with left columns added as undefined
    if (left.nrows() === 0) {
      const R = getStoreAndIndex(right);
      const outCols: Record<string, unknown[]> = {};
      const outNames: string[] = [];

      // Get column names from both DataFrames
      const leftCols = left.columns() as string[];
      const rightCols = right.columns() as string[];

      // Copy all right columns
      for (const name of rightCols) {
        outNames.push(name);
        const out = new Array(R.index.length);
        const src = R.store.columns[name];
        for (let i = 0; i < R.index.length; i++) out[i] = src[R.index[i]];
        outCols[name] = out;
      }

      // Add left columns as undefined
      for (const name of leftCols) {
        if (!rightCols.includes(name)) {
          outNames.push(name);
          outCols[name] = new Array(R.index.length).fill(undefined);
        }
      }

      return createColumnarDataFrameFromStore({
        columns: outCols,
        length: R.index.length,
        columnNames: outNames,
      });
    }

    // Setup join operation
    const setup = setupJoinOperation(left, right, byOrOptions, options);

    // If setup is null, we have an empty DataFrame situation
    if (!setup) {
      // This shouldn't happen for right join since we handle empty cases above
      return createEmptyJoinResult();
    }

    const { leftStore: L, rightStore: R, leftKeys, rightKeys, suffixes } =
      setup;

    // Ultra-optimized typed array join
    const { leftIndices, rightIndices } = (() => {
      // Convert to typed arrays and gather through view index
      const leftTypedRaw = convertToTypedArrays(L.store.columns, leftKeys);
      const rightTypedRaw = convertToTypedArrays(R.store.columns, rightKeys);

      const leftColumnData = leftKeys.map((name) => {
        const raw = leftTypedRaw[name];
        const out = new Uint32Array(L.index.length);
        for (let i = 0; i < L.index.length; i++) out[i] = raw[L.index[i]];
        return out;
      });
      const rightColumnData = rightKeys.map((name) => {
        const raw = rightTypedRaw[name];
        const out = new Uint32Array(R.index.length);
        for (let i = 0; i < R.index.length; i++) out[i] = raw[R.index[i]];
        return out;
      });

      // Call WASM
      try {
        const wasmResult = right_join_typed_multi_u32(
          leftColumnData,
          rightColumnData,
        );
        const leftIndicesRaw = (wasmResult as any).takeLeft() as Uint32Array;
        const rightIndicesRaw = (wasmResult as any).takeRight() as Uint32Array;

        const leftIndices = Array.from(
          leftIndicesRaw,
          (idx: number) => idx === 0xFFFFFFFF ? null : idx,
        );
        const rightIndices = Array.from(rightIndicesRaw);

        return { leftIndices, rightIndices };
      } catch {
        // JavaScript fallback — columnData already view-gathered
        const leftMap = new Map<string, number[]>();

        for (let j = 0; j < leftColumnData[0].length; j++) {
          const keyParts: string[] = new Array(leftColumnData.length);
          for (let c = 0; c < leftColumnData.length; c++) {
            keyParts[c] = String(leftColumnData[c][j]);
          }
          const key = keyParts.join("|");
          if (!leftMap.has(key)) leftMap.set(key, []);
          leftMap.get(key)!.push(j);
        }

        const leftIndices: (number | null)[] = [];
        const rightIndices: number[] = [];

        for (let i = 0; i < rightColumnData[0].length; i++) {
          const keyParts: string[] = new Array(rightColumnData.length);
          for (let c = 0; c < rightColumnData.length; c++) {
            keyParts[c] = String(rightColumnData[c][i]);
          }
          const key = keyParts.join("|");
          const matches = leftMap.get(key);

          if (matches) {
            for (const j of matches) {
              leftIndices.push(j);
              rightIndices.push(i);
            }
          } else {
            leftIndices.push(null);
            rightIndices.push(i);
          }
        }

        return { leftIndices, rightIndices };
      }
    })();

    const lIdxView = leftIndices as (number | null)[];
    const rIdxView = rightIndices;

    if (rIdxView.length === 0) {
      return createEmptyJoinResult();
    }

    const outStore = buildOutputStoreRight(
      L,
      R,
      lIdxView,
      rIdxView,
      leftKeys,
      rightKeys,
      suffixes,
      left,
      right,
    );

    const outDf = createColumnarDataFrameFromStore(outStore) as any;

    if (left.__groups) {
      const outRows = outDf.toArray();
      return withGroupsRebuilt(left, outRows as any, outDf) as any;
    }

    return outDf;
  };
}
