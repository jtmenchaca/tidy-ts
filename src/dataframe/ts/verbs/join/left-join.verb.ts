// deno-lint-ignore-file no-explicit-any

import {
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
  type Prettify,
  type UnifyUnion,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import { tracer } from "../../telemetry/tracer.ts";
import { left_join_typed_multi_u32 } from "../../wasm/wasm-loader.ts";
import type {
  JoinKey,
  ObjectJoinOptions,
  SuffixAwareLeftJoinResult,
} from "./types/index.ts";

const RIGHT_NULL: number = 0xFFFFFFFF; // must match the WASM/Rust sentinel (u32::MAX)

// Module-level cache for typed arrays
const TA_CACHE = new WeakMap<object, Map<string, Uint32Array>>();

function getTypedColsCached(
  store: any,
  keys: string[],
): Record<string, Uint32Array> {
  let m = TA_CACHE.get(store);
  if (!m) {
    m = new Map();
    TA_CACHE.set(store, m);
  }
  const out: Record<string, Uint32Array> = Object.create(null);
  for (const k of keys) {
    let arr = m.get(k);
    if (!arr) {
      const typed = convertToTypedArrays(store.columns, [k] as any)[k];
      // assume convertToTypedArrays returns Uint32Array for join keys
      arr = typed as Uint32Array;
      m.set(k, arr);
    }
    out[k] = arr;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Helpers (shared)                                                            */
/* -------------------------------------------------------------------------- */

function getStoreAndIndex<Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
) {
  const anyDf = df as any;
  const store = anyDf.__store;
  const view = anyDf.__view;
  const index = materializeIndex(store.length, view);
  return { store, index };
}

function parseJoinKeys(
  byOrOptions: any,
  options?: any,
): {
  leftKeys: string[];
  rightKeys: string[];
  suffixes: { left?: string; right?: string };
} {
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
      const leftKeys = Array.isArray(mapping.left)
        ? mapping.left.map(String)
        : [String(mapping.left)];
      const rightKeys = Array.isArray(mapping.right)
        ? mapping.right.map(String)
        : [String(mapping.right)];
      return { leftKeys, rightKeys, suffixes: opts.suffixes || {} };
    }
  }
  const keys = Array.isArray(byOrOptions)
    ? byOrOptions.map(String)
    : [String(byOrOptions)];
  return { leftKeys: keys, rightKeys: keys, suffixes: options?.suffixes || {} };
}

function allocLikeLeft(src: any, length: number): any {
  if (ArrayBuffer.isView(src) && !(src instanceof DataView)) {
    const Ctor = (src as any).constructor;
    try {
      return new Ctor(length);
    } catch {
      return new Array(length);
    }
  }
  return new Array(length);
}

function allocRightArray(length: number): unknown[] {
  return new Array(length);
}

function buildJoinResultOptimized(
  leftStore: any,
  rightStore: any,
  leftIndices: Uint32Array,
  rightIndices: Uint32Array,
  leftKeys: string[],
  suffixes: { left?: string; right?: string },
) {
  const n = leftIndices.length;

  const outCols: Record<string, any> = {};
  const outNames: string[] = [];

  const leftSuffix = suffixes.left ?? "";
  const rightSuffix = suffixes.right ?? "_y";

  const leftKeySet = new Set(leftKeys);
  const rightNameSet = new Set<string>(rightStore.columnNames as string[]);

  // ---------- Left columns ----------
  for (let c = 0; c < leftStore.columnNames.length; c++) {
    const name = leftStore.columnNames[c] as string;
    const isKey = leftKeySet.has(name);
    const hasConflict = !isKey && rightNameSet.has(name);
    const outName = hasConflict && leftSuffix ? `${name}${leftSuffix}` : name;

    outNames.push(outName);

    const src = leftStore.columns[name];
    const dst = allocLikeLeft(src, n);

    // Temporarily disable run-aware gathering to debug
    if (ArrayBuffer.isView(dst) && !(dst instanceof DataView)) {
      for (let i = 0; i < n; i++) (dst as any)[i] = src[leftIndices[i]];
    } else {
      for (let i = 0; i < n; i++) (dst as any[])[i] = src[leftIndices[i]];
    }
    outCols[outName] = dst;
  }

  // ---------- Right columns ----------
  const leftNameSet = new Set<string>(leftStore.columnNames as string[]);

  for (let c = 0; c < rightStore.columnNames.length; c++) {
    const name = rightStore.columnNames[c] as string;
    if (leftKeySet.has(name)) continue;

    const hasConflict = leftNameSet.has(name);
    const outName = hasConflict && rightSuffix ? `${name}${rightSuffix}` : name;

    outNames.push(outName);

    const src = rightStore.columns[name];
    const dst = allocRightArray(n);

    // Gather with NULL handling + runs of RIGHT_NULL or same r
    let i = 0;
    while (i < n) {
      const r = rightIndices[i]!;
      let j = i + 1;
      while (j < n && rightIndices[j] === r) j++;
      if (r === RIGHT_NULL) {
        for (let k = i; k < j; k++) (dst as any[])[k] = undefined;
      } else {
        const val = src[r];
        for (let k = i; k < j; k++) (dst as any[])[k] = val;
      }
      i = j;
    }

    outCols[outName] = dst;
  }

  return { columns: outCols, columnNames: outNames, length: n };
}

/* -------------------------------------------------------------------------- */
/* Single-threaded WASM + JS fallback (unchanged public API)                   */
/* -------------------------------------------------------------------------- */

export function left_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  const Keys extends ObjectJoinOptions<LeftRow, RightRow>["keys"],
  const Suffixes extends ObjectJoinOptions<LeftRow, RightRow>["suffixes"],
>(
  right: DataFrame<RightRow>,
  options: { keys: Keys; suffixes?: Suffixes },
): (left: DataFrame<LeftRow>) => DataFrame<
  UnifyUnion<
    SuffixAwareLeftJoinResult<
      LeftRow,
      RightRow,
      { keys: Keys; suffixes: Suffixes }
    >
  >
>;

export function left_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  right: DataFrame<RightRow>,
  by: JoinKeyName | JoinKeyName[],
  options?: { suffixes?: { left?: string; right?: string } },
): (
  left: DataFrame<LeftRow>,
) => DataFrame<Prettify<LeftRow & Partial<RightRow>>>;

export function left_join<
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
    const span = tracer.startSpan(left as any, "left_join");

    try {
      if (left.nrows() === 0) {
        tracer.addEvent(span, "early-return-empty-left");
        return createColumnarDataFrameFromStore({
          columns: {},
          length: 0,
          columnNames: [],
        }) as unknown as any;
      }

      const { leftKeys, rightKeys, suffixes } = tracer.withSpan(
        left as any,
        "parse-join-keys",
        () => parseJoinKeys(byOrOptions, options),
      );

      const L = tracer.withSpan(
        left as any,
        "get-left-store-index",
        () => getStoreAndIndex(left),
      );
      const R = tracer.withSpan(
        left as any,
        "get-right-store-index",
        () => getStoreAndIndex(right),
      );

      const { leftIdxTA, rightIdxTA } = tracer.withSpan(
        left as any,
        "join-operation",
        () => {
          const leftTyped = tracer.withSpan(
            left as any,
            "convert-left-to-typed",
            () => getTypedColsCached(L.store, leftKeys),
          );
          const rightTyped = tracer.withSpan(
            left as any,
            "convert-right-to-typed",
            () => getTypedColsCached(R.store, rightKeys),
          );

          const { leftColumnData, rightColumnData } = tracer.withSpan(
            left as any,
            "map-key-columns",
            () => {
              const leftColumnData = leftKeys.map((k) => leftTyped[k]);
              const rightColumnData = rightKeys.map((k) => rightTyped[k]);
              return { leftColumnData, rightColumnData };
            },
          );

          try {
            const validationResult = {
              isEmpty: leftColumnData.length === 0 ||
                rightColumnData.length === 0 ||
                !leftColumnData[0] || !rightColumnData[0] ||
                leftColumnData[0].length === 0 ||
                rightColumnData[0].length === 0,
              leftLength: leftColumnData[0]?.length || 0,
              rightLength: rightColumnData[0]?.length || 0,
            };

            if (validationResult.isEmpty) {
              tracer.addEvent(
                span,
                "validation-failed-empty-data",
                validationResult,
              );
              throw new Error("Empty data, using JS fallback");
            }

            const wasmResult = tracer.withSpan(left as any, "wasm-join", () => {
              return left_join_typed_multi_u32(leftColumnData, rightColumnData);
            });

            const leftIdxTA = (wasmResult as any).takeLeft() as Uint32Array;
            const rightIdxTA = (wasmResult as any).takeRight() as Uint32Array;

            tracer.addEvent(span, "wasm-join-successful", {
              resultRows: leftIdxTA.length,
            });

            return { leftIdxTA, rightIdxTA };
          } catch (error) {
            tracer.addEvent(span, "wasm-join-failed", {
              error: error instanceof Error ? error.message : String(error),
            });

            // JS fallback (typed arrays)
            const map = new Map<string, number[]>();
            const rcols = rightColumnData;
            for (let i = 0; i < R.index.length; i++) {
              const parts: string[] = new Array(rcols.length);
              for (let c = 0; c < rcols.length; c++) {
                parts[c] = String(rcols[c][i]);
              }
              const key = parts.join("|");
              let arr = map.get(key);
              if (!arr) {
                arr = [];
                map.set(key, arr);
              }
              arr.push(i);
            }

            const lcols = leftColumnData;
            const leftIdxArr: number[] = [];
            const rightIdxArr: number[] = [];

            for (let i = 0; i < L.index.length; i++) {
              const parts: string[] = new Array(lcols.length);
              for (let c = 0; c < lcols.length; c++) {
                parts[c] = String(lcols[c][i]);
              }
              const key = parts.join("|");
              const matches = map.get(key);
              if (matches && matches.length) {
                for (let j = 0; j < matches.length; j++) {
                  leftIdxArr.push(i);
                  rightIdxArr.push(matches[j]);
                }
              } else {
                leftIdxArr.push(i);
                rightIdxArr.push(RIGHT_NULL);
              }
            }

            return {
              leftIdxTA: new Uint32Array(leftIdxArr),
              rightIdxTA: new Uint32Array(rightIdxArr),
            };
          }
        },
      );

      const outStore = tracer.withSpan(
        left as any,
        "build-join-result",
        () => {
          return buildJoinResultOptimized(
            L.store,
            R.store,
            leftIdxTA,
            rightIdxTA,
            leftKeys,
            suffixes,
          );
        },
      );

      const outDf = tracer.withSpan(
        left as any,
        "create-dataframe-from-store",
        () => createColumnarDataFrameFromStore(outStore) as unknown as any,
      );

      if ((left as any).__groups) {
        const result = tracer.withSpan(left as any, "rebuild-groups", () => {
          const src = left as unknown as GroupedDataFrame<
            LeftRow,
            keyof LeftRow
          >;
          const outRows = (outDf as DataFrame<LeftRow>)
            .toArray() as readonly LeftRow[];
          // Casts to satisfy generic constraints of withGroupsRebuilt.
          return withGroupsRebuilt(
            src,
            outRows as any,
            outDf as any,
          ) as unknown as any;
        });

        tracer.copyContext(left as any, result as any);
        return result;
      }

      tracer.copyContext(left as any, outDf as any);
      return outDf;
    } finally {
      tracer.endSpan(left as any, span);
    }
  };
}
