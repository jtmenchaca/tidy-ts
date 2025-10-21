// deno-lint-ignore-file no-explicit-any
// Columnar-first outer join: gather/merge by index, undefined for unmatched.
// Adaptive path (JS hash for big inputs; WASM for small), and precomputed bases.

import { outer_join_typed_multi_u32 } from "../../wasm/wasm-loader.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import {
  type ColumnarStore,
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  type Prettify,
  type UnifyUnion,
} from "../../dataframe/index.ts";
import type {
  FullJoinResult,
  JoinKey,
  ObjectJoinOptions,
  SuffixAwareOuterJoinResult,
} from "./types/index.ts";

import {
  applySuffixToColumnName,
  computeColumnConflicts,
  computeSameNamedKeys,
  createEmptyJoinResult,
  getStoreAndIndex,
  NA_U32,
  processJoinColumns,
  setupJoinOperation,
} from "./join-helpers.ts";
import { withGroupsRebuilt } from "../../dataframe/index.ts";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

import type { StoreAndIndex } from "./types/index.ts";

// Special outer join output store builder that handles join key merging
function buildOutputStoreOuter(
  left: StoreAndIndex,
  right: StoreAndIndex,
  leftIdxView: readonly (number | null)[],
  rightIdxView: readonly (number | null)[],
  leftJoinKeys: string[],
  rightJoinKeys: string[],
  suffixes: { left?: string; right?: string },
  leftDataFrame: any,
  rightDataFrame: any,
): ColumnarStore {
  const n = leftIdxView.length;

  // Precompute base indices with nullable handling
  const leftBase = new Uint32Array(n);
  const rightBase = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    const lv = leftIdxView[i];
    leftBase[i] = lv == null ? NA_U32 : left.index[lv];
    const rv = rightIdxView[i];
    rightBase[i] = rv == null ? NA_U32 : right.index[rv];
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

  // Compute same-named right keys to drop (only exact pairs)
  const { sameNamedRightKeys } = computeSameNamedKeys(
    leftJoinKeys,
    rightJoinKeys,
  );

  // For outer join, we need special handling for same-named join keys
  // They should merge values from both sides when one is null
  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];

  // Process left columns with special join key handling
  const leftConflictSet = new Set<string>();
  for (const name of rightNameSet) {
    if (!leftKeySet.has(name)) {
      leftConflictSet.add(name);
    }
  }

  for (const name of leftColumnNames) {
    const _isLeftJoinKey = leftKeySet.has(name);
    const hasConflict = leftConflictSet.has(name);
    const outName = applySuffixToColumnName(name, hasConflict, suffixLeft);
    outNames.push(outName);

    const out = new Array(n);
    const leftSrc = left.store.columns[name];

    // Check if this is a same-named join key for merging
    const keyIndex = leftJoinKeys.indexOf(name);
    const isSameNamedKey = keyIndex !== -1 && rightJoinKeys[keyIndex] === name;
    const rightSrc = isSameNamedKey
      ? right.store.columns[rightJoinKeys[keyIndex]]
      : null;

    for (let i = 0; i < n; i++) {
      const lIdx = leftBase[i];
      if (lIdx !== NA_U32) {
        out[i] = leftSrc[lIdx];
      } else if (rightSrc && isSameNamedKey) {
        // For same-named join keys, take from right when left is null
        const rIdx = rightBase[i];
        out[i] = (rIdx === NA_U32) ? undefined : rightSrc[rIdx];
      } else {
        out[i] = undefined;
      }
    }
    outCols[outName] = out;
  }

  // Process right columns (drop same-named keys, handle conflicts)
  const rightResult = processJoinColumns({
    store: right,
    baseIndices: rightBase,
    columnNames: rightColumnNames,
    nameSet: rightNameSet,
    conflictSet: leftNameSet,
    keySet: new Set(rightJoinKeys),
    dropKeys: sameNamedRightKeys,
    suffix: suffixRight,
    useNullable: true,
  });

  // Merge right columns
  for (const name of rightResult.names) {
    outNames.push(name);
    outCols[name] = rightResult.columns[name];
  }

  return { columns: outCols, length: n, columnNames: outNames };
}

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

/**
 * Outer join: keep all rows from both dataframes; fill missing columns with undefined.
 * Adaptive (WASM for small; JS hash + bitset for large). Columnar-first.
 */
// Overloaded function signatures
export function outer_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  right: DataFrame<RightRow>,
  by: JoinKeyName | JoinKeyName[],
  options?: { suffixes?: { left?: string; right?: string } },
): (
  left: DataFrame<LeftRow>,
) => DataFrame<Prettify<FullJoinResult<LeftRow, RightRow, JoinKeyName>>>;

export function outer_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  const Keys extends ObjectJoinOptions<
    LeftRow,
    RightRow
  >["keys"],
  const Suffixes extends ObjectJoinOptions<
    LeftRow,
    RightRow
  >["suffixes"],
>(
  right: DataFrame<RightRow>,
  options: { keys: Keys; suffixes?: Suffixes },
): (
  left: DataFrame<LeftRow>,
) => DataFrame<
  UnifyUnion<
    SuffixAwareOuterJoinResult<
      LeftRow,
      RightRow,
      { keys: Keys; suffixes: Suffixes }
    >
  >
>;

export function outer_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  right: DataFrame<RightRow>,
  byOrOptions:
    | JoinKeyName
    | JoinKeyName[]
    | ObjectJoinOptions<
      LeftRow,
      RightRow
    >,
  options?: { suffixes?: { left?: string; right?: string } },
): (left: DataFrame<LeftRow>) => any {
  return (left: DataFrame<LeftRow>): any => {
    // Early empty fast-paths - outer join preserves schema from both sides
    if (left.nrows() === 0 && right.nrows() === 0) {
      const leftCols = left.columns() as string[];
      const rightCols = right.columns() as string[];
      const allCols = [...new Set([...leftCols, ...rightCols])];
      const columns: Record<string, unknown[]> = {};
      for (const col of allCols) {
        columns[col] = [];
      }
      return createColumnarDataFrameFromStore({
        columns,
        length: 0,
        columnNames: allCols,
      }) as unknown as any;
    }
    if (left.nrows() === 0) {
      // Return right DataFrame with left columns added as undefined
      const R = getStoreAndIndex(right);
      const leftCols = left.columns() as string[];
      const rightCols = right.columns() as string[];
      const outCols: Record<string, unknown[]> = {};
      const outNames: string[] = [];

      // Copy right columns
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
      }) as unknown as any;
    }
    if (right.nrows() === 0) {
      // Return left DataFrame with right columns added as undefined
      const L = getStoreAndIndex(left);
      const leftCols = left.columns() as string[];
      const rightCols = right.columns() as string[];
      const outCols: Record<string, unknown[]> = {};
      const outNames: string[] = [];

      // Copy left columns
      for (const name of leftCols) {
        outNames.push(name);
        const out = new Array(L.index.length);
        const src = L.store.columns[name];
        for (let i = 0; i < L.index.length; i++) out[i] = src[L.index[i]];
        outCols[name] = out;
      }

      // Add right columns as undefined
      for (const name of rightCols) {
        if (!leftCols.includes(name)) {
          outNames.push(name);
          outCols[name] = new Array(L.index.length).fill(undefined);
        }
      }

      return createColumnarDataFrameFromStore({
        columns: outCols,
        length: L.index.length,
        columnNames: outNames,
      }) as unknown as any;
    }

    // Setup join operation
    const setup = setupJoinOperation(left, right, byOrOptions, options);

    // If setup is null, we have an unexpected empty DataFrame situation
    if (!setup) {
      return createEmptyJoinResult() as unknown as any;
    }

    const { leftStore: L, rightStore: R, leftKeys, rightKeys, suffixes } =
      setup;

    // Ultra-optimized typed array join
    const { leftIndices, rightIndices } = (() => {
      // Convert to typed arrays
      const leftTypedArrays = convertToTypedArrays(L.store.columns, leftKeys);
      const rightTypedArrays = convertToTypedArrays(R.store.columns, rightKeys);

      // Map to column order
      const leftColumnData = leftKeys.map((name) => leftTypedArrays[name]);
      const rightColumnData = rightKeys.map((name) => rightTypedArrays[name]);

      // Call WASM
      try {
        const wasmResult = outer_join_typed_multi_u32(
          leftColumnData,
          rightColumnData,
        );
        const leftIndicesRaw = (wasmResult as any).takeLeft() as Uint32Array;
        const rightIndicesRaw = (wasmResult as any).takeRight() as Uint32Array;

        // Convert sentinel values (0xFFFFFFFF) to null for both indices
        const leftIndices = Array.from(
          leftIndicesRaw,
          (idx: number) => idx === 0xFFFFFFFF ? null : idx,
        );
        const rightIndices = Array.from(
          rightIndicesRaw,
          (idx: number) => idx === 0xFFFFFFFF ? null : idx,
        );

        return { leftIndices, rightIndices };
      } catch {
        // JavaScript fallback - outer join (include all rows from both sides)
        const rightMap = new Map<string, number[]>();

        // Build right index
        for (let i = 0; i < R.index.length; i++) {
          const keyParts: string[] = [];
          for (const name of rightKeys) {
            keyParts.push(String(rightTypedArrays[name][i]));
          }
          const key = keyParts.join("|");
          if (!rightMap.has(key)) rightMap.set(key, []);
          rightMap.get(key)!.push(i);
        }

        const leftIndices: (number | null)[] = [];
        const rightIndices: (number | null)[] = [];
        const matchedRightIndices = new Set<number>();

        // First pass: left rows (matched and unmatched)
        for (let i = 0; i < L.index.length; i++) {
          const keyParts: string[] = [];
          for (const name of leftKeys) {
            keyParts.push(String(leftTypedArrays[name][i]));
          }
          const key = keyParts.join("|");
          const matches = rightMap.get(key);

          if (matches) {
            for (const match of matches) {
              leftIndices.push(i);
              rightIndices.push(match);
              matchedRightIndices.add(match);
            }
          } else {
            leftIndices.push(i);
            rightIndices.push(null);
          }
        }

        // Second pass: unmatched right rows
        for (let i = 0; i < R.index.length; i++) {
          if (!matchedRightIndices.has(i)) {
            leftIndices.push(null);
            rightIndices.push(i);
          }
        }

        return { leftIndices, rightIndices };
      }
    })();

    const lIdxView = leftIndices as (number | null)[];
    const rIdxView = rightIndices as (number | null)[];

    if (lIdxView.length === 0) {
      return createEmptyJoinResult() as unknown as any;
    }

    const outStore = buildOutputStoreOuter(
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

    const outDf = createColumnarDataFrameFromStore(outStore) as unknown as any;

    if ((left as any).__groups) {
      const src = left as unknown as GroupedDataFrame<LeftRow, keyof LeftRow>;
      const outRows = (outDf as DataFrame<LeftRow>)
        .toArray() as readonly LeftRow[];

      return withGroupsRebuilt(src, outRows, outDf) as unknown as any;
    }

    return outDf as unknown as any;
  };
}
