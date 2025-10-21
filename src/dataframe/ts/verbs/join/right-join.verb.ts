// deno-lint-ignore-file no-explicit-any
import { right_join_typed_multi_u32 } from "../../wasm/wasm-loader.ts";
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
  JoinKey,
  ObjectJoinOptions,
  RightJoinResult,
  StoreAndIndex,
  SuffixAwareRightJoinResult,
} from "./types/index.ts";
import {
  computeColumnConflicts,
  computeSameNamedKeys,
  createEmptyJoinResult,
  getStoreAndIndex,
  processJoinColumns,
  setupJoinOperation,
} from "./join-helpers.ts";
import { withGroupsRebuilt } from "../../dataframe/index.ts";

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
// Overloaded function signatures
export function right_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  right: DataFrame<RightRow>,
  by: JoinKeyName | JoinKeyName[],
  options?: { suffixes?: { left?: string; right?: string } },
): (
  left: DataFrame<LeftRow>,
) => DataFrame<Prettify<RightJoinResult<LeftRow, RightRow, JoinKeyName>>>;

export function right_join<
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
    SuffixAwareRightJoinResult<
      LeftRow,
      RightRow,
      { keys: Keys; suffixes: Suffixes }
    >
  >
>;

export function right_join<
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
      }) as unknown as any;
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
      }) as unknown as any;
    }

    // Setup join operation
    const setup = setupJoinOperation(left, right, byOrOptions, options);

    // If setup is null, we have an empty DataFrame situation
    if (!setup) {
      // This shouldn't happen for right join since we handle empty cases above
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
        const wasmResult = right_join_typed_multi_u32(
          leftColumnData,
          rightColumnData,
        );
        const leftIndicesRaw = (wasmResult as any).takeLeft() as Uint32Array;
        const rightIndicesRaw = (wasmResult as any).takeRight() as Uint32Array;

        // Convert sentinel values (0xFFFFFFFF) to null for left indices
        const leftIndices = Array.from(
          leftIndicesRaw,
          (idx: number) => idx === 0xFFFFFFFF ? null : idx,
        );
        const rightIndices = Array.from(rightIndicesRaw);

        return { leftIndices, rightIndices };
      } catch {
        // JavaScript fallback - build right map and probe with left
        const rightMap = new Map<string, number[]>();

        // Build right index (always include all right rows)
        for (let i = 0; i < R.index.length; i++) {
          const keyParts: string[] = [];
          for (const name of rightKeys) {
            keyParts.push(String(rightTypedArrays[name][i]));
          }
          const key = keyParts.join("|");
          if (!rightMap.has(key)) rightMap.set(key, []);
          rightMap.get(key)!.push(i);
        }

        // For right join, include ALL right rows
        const leftIndices: (number | null)[] = [];
        const rightIndices: number[] = [];

        for (let i = 0; i < R.index.length; i++) {
          const keyParts: string[] = [];
          for (const name of rightKeys) {
            keyParts.push(String(rightTypedArrays[name][i]));
          }
          const key = keyParts.join("|");

          // Find matching left rows
          let found = false;
          if (L.index.length > 0) {
            for (let j = 0; j < L.index.length; j++) {
              const leftKeyParts: string[] = [];
              for (const name of leftKeys) {
                leftKeyParts.push(String(leftTypedArrays[name][j]));
              }
              const leftKey = leftKeyParts.join("|");
              if (leftKey === key) {
                leftIndices.push(j);
                rightIndices.push(i);
                found = true;
              }
            }
          }

          if (!found) {
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
      return createEmptyJoinResult() as unknown as any;
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

    const outDf = createColumnarDataFrameFromStore(
      outStore,
    ) as unknown as any;

    if ((left as any).__groups) {
      const src = left as unknown as GroupedDataFrame<LeftRow, keyof LeftRow>;
      const outRows = (outDf as DataFrame<LeftRow>)
        .toArray() as readonly LeftRow[];
      return withGroupsRebuilt(src, outRows, outDf) as unknown as any;
    }

    return outDf;
  };
}
