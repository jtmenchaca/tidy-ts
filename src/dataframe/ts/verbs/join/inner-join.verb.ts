// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import { tracer } from "../../telemetry/tracer.ts";
import { inner_join_typed_multi_u32 } from "../../wasm/wasm-loader.ts";
import type { Prettify, UnifyUnion } from "../../dataframe/index.ts";
import type {
  JoinKey,
  ObjectJoinOptions,
  SuffixAwareInnerJoinResult,
} from "./types/index.ts";

// Simple helper to get store and index from DataFrame
function getStoreAndIndex<Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
) {
  const anyDf = df as any;
  const store = anyDf.__store;
  const view = anyDf.__view;
  const index = materializeIndex(store.length, view);
  return { store, index };
}

// Simple helper to parse join arguments
function parseJoinKeys(
  byOrOptions: any,
  options?: any,
): {
  leftKeys: string[];
  rightKeys: string[];
  suffixes: { left?: string; right?: string };
} {
  // Handle object API: { keys: ["id"], suffixes: {...} }
  if (
    byOrOptions && typeof byOrOptions === "object" &&
    !Array.isArray(byOrOptions) && "keys" in byOrOptions
  ) {
    const opts = byOrOptions;
    if (Array.isArray(opts.keys)) {
      const keys = opts.keys.map(String);
      return { leftKeys: keys, rightKeys: keys, suffixes: opts.suffixes || {} };
    } else {
      const mapping = opts.keys;
      return {
        leftKeys: Array.isArray(mapping.left)
          ? mapping.left.map(String)
          : [String(mapping.left)],
        rightKeys: Array.isArray(mapping.right)
          ? mapping.right.map(String)
          : [String(mapping.right)],
        suffixes: opts.suffixes || {},
      };
    }
  }

  // Handle simple API: by keys, options
  const keys = Array.isArray(byOrOptions)
    ? byOrOptions.map(String)
    : [String(byOrOptions)];
  return { leftKeys: keys, rightKeys: keys, suffixes: options?.suffixes || {} };
}

// Simple helper to build result columns
function buildJoinResult(
  leftStore: any,
  rightStore: any,
  leftIndices: number[],
  rightIndices: number[],
  leftKeys: string[],
  suffixes: { left?: string; right?: string },
) {
  const n = leftIndices.length;
  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];

  const leftSuffix = suffixes.left ?? "";
  const rightSuffix = suffixes.right ?? "_y";
  const leftKeySet = new Set(leftKeys);
  const leftNameSet = new Set(leftStore.columnNames);

  // Add left columns
  for (const name of leftStore.columnNames) {
    const hasConflict = !leftKeySet.has(name) &&
      rightStore.columnNames.includes(name);
    const outName = hasConflict && leftSuffix ? `${name}${leftSuffix}` : name;
    outNames.push(outName);

    const src = leftStore.columns[name];
    const dst = new Array(n);
    for (let i = 0; i < n; i++) {
      dst[i] = src[leftIndices[i]];
    }
    outCols[outName] = dst;
  }

  // Add right columns (skip keys that match left keys)
  for (const name of rightStore.columnNames) {
    if (leftKeySet.has(name) && leftKeys.includes(name)) continue; // Skip duplicate keys

    const hasConflict = leftNameSet.has(name);
    const outName = hasConflict && rightSuffix ? `${name}${rightSuffix}` : name;
    outNames.push(outName);

    const src = rightStore.columns[name];
    const dst = new Array(n);
    for (let i = 0; i < n; i++) {
      dst[i] = src[rightIndices[i]];
    }
    outCols[outName] = dst;
  }

  return { columns: outCols, columnNames: outNames, length: n };
}

// API
export function inner_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  const Keys extends ObjectJoinOptions<LeftRow, RightRow>["keys"],
  const Suffixes extends ObjectJoinOptions<LeftRow, RightRow>["suffixes"],
>(
  right: DataFrame<RightRow>,
  options: { keys: Keys; suffixes?: Suffixes },
): (left: DataFrame<LeftRow>) => DataFrame<
  UnifyUnion<
    SuffixAwareInnerJoinResult<
      LeftRow,
      RightRow,
      { keys: Keys; suffixes: Suffixes }
    >
  >
>;

export function inner_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  right: DataFrame<RightRow>,
  by: JoinKeyName | JoinKeyName[],
  options?: { suffixes?: { left?: string; right?: string } },
): (left: DataFrame<LeftRow>) => DataFrame<Prettify<LeftRow & RightRow>>;

export function inner_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  right: DataFrame<RightRow>,
  byOrOptions:
    | JoinKeyName
    | JoinKeyName[]
    | ObjectJoinOptions<LeftRow, RightRow>,
  options?: { suffixes?: { left?: string; right?: string } },
): (left: DataFrame<LeftRow>) => any {
  return (left: DataFrame<LeftRow>): any => {
    const span = tracer.startSpan(left, "inner_join");

    try {
      // Handle empty DataFrames
      if (left.nrows() === 0 || right.nrows() === 0) {
        return createColumnarDataFrameFromStore({
          columns: {},
          length: 0,
          columnNames: [],
        }) as unknown as any;
      }

      // Parse arguments
      const { leftKeys, rightKeys, suffixes } = parseJoinKeys(
        byOrOptions,
        options,
      );

      // Get stores and indices
      const L = getStoreAndIndex(left);
      const R = getStoreAndIndex(right);

      // Ultra-optimized typed array join
      const { leftIndices, rightIndices } = tracer.withSpan(
        left,
        "join-operation",
        () => {
          // Convert to typed arrays
          const leftTypedArrays = convertToTypedArrays(
            L.store.columns,
            leftKeys,
          );
          const rightTypedArrays = convertToTypedArrays(
            R.store.columns,
            rightKeys,
          );

          // Map to column order
          const leftColumnData = leftKeys.map((name) => leftTypedArrays[name]);
          const rightColumnData = rightKeys.map((name) =>
            rightTypedArrays[name]
          );

          // Call WASM
          try {
            console.log("trying WASM");
            const wasmResult = inner_join_typed_multi_u32(
              leftColumnData,
              rightColumnData,
            );
            const leftIndices = Array.from((wasmResult as any).takeLeft());
            const rightIndices = Array.from((wasmResult as any).takeRight());
            return { leftIndices, rightIndices };
          } catch {
            console.log("falling back to JavaScript");
            // JavaScript fallback
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

            // Probe with left
            const leftIndices: number[] = [];
            const rightIndices: number[] = [];

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
                }
              }
            }

            return { leftIndices, rightIndices };
          }
        },
      );

      if (leftIndices.length === 0) {
        return createColumnarDataFrameFromStore({
          columns: {},
          length: 0,
          columnNames: [],
        }) as unknown as any;
      }

      // Build result
      const outStore = buildJoinResult(
        L.store,
        R.store,
        leftIndices as number[],
        rightIndices as number[],
        leftKeys,
        suffixes,
      );
      const outDf = createColumnarDataFrameFromStore(
        outStore,
      ) as unknown as any;

      // Handle groups
      if ((left as any).__groups) {
        const src = left as unknown as GroupedDataFrame<LeftRow, keyof LeftRow>;
        const outRows = (outDf as DataFrame<LeftRow>)
          .toArray() as readonly LeftRow[];
        return withGroupsRebuilt(src, outRows, outDf) as unknown as any;
      }

      return outDf;
    } finally {
      tracer.endSpan(left, span);
    }
  };
}
