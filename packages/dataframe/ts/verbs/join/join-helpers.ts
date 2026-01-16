// deno-lint-ignore-file no-explicit-any
/**
 * Shared helper functions for join operations
 */

import {
  type ColumnarStore,
  createColumnarDataFrameFromStore,
  type DataFrame,
  materializeIndex,
  toColumnarStorage,
} from "../../dataframe/index.ts";
import type {
  ColumnMapping,
  JoinArgs,
  JoinKey,
  ObjectJoinOptions,
  StoreAndIndex,
} from "./types/index.ts";

// -----------------------------------------------------------------------------
// Core Helper Functions
// -----------------------------------------------------------------------------

export function getStoreAndIndex<Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
): StoreAndIndex {
  const anyDf = df as any;
  const store: ColumnarStore | undefined = anyDf.__store;
  const view = anyDf.__view;
  if (store) {
    const index = materializeIndex(store.length, view);
    return { store, index };
  }
  const rows = Array.from(df);
  const tmp = toColumnarStorage(rows);
  const idx = new Uint32Array(tmp.length);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  return { store: tmp, index: idx };
}

export function firstNonNullish(xs: readonly unknown[]): unknown {
  for (let i = 0; i < xs.length; i++) {
    const v = xs[i];
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}

export function asI64(keys: readonly unknown[]): BigInt64Array {
  const out = new BigInt64Array(keys.length);
  for (let i = 0; i < keys.length; i++) {
    const v = keys[i];
    out[i] = typeof v === "bigint" ? v as bigint : BigInt((v as number) ?? 0);
  }
  return out;
}

export function projectCompositeKeyColumn(
  store: ColumnarStore,
  index: Uint32Array,
  keys: string[],
): string[] {
  const out = new Array(index.length);
  for (let i = 0; i < index.length; i++) {
    const rowIdx = index[i];
    const keyValues = keys.map((k) => {
      const src = store.columns[k];
      if (!src) throw new Error(`Join key '${k}' not found`);
      return String(src[rowIdx]);
    });
    out[i] = keyValues.join("\0");
  }
  return out;
}

// -----------------------------------------------------------------------------
// Multi-key Join API Helpers
// -----------------------------------------------------------------------------

export function normalizeJoinKeys<Row extends Record<string, unknown>>(
  by: JoinKey<Row> | JoinKey<Row>[],
): JoinKey<Row>[] {
  return Array.isArray(by) ? by : [by];
}

// Type guards to distinguish API styles
export function isObjectJoinOptions<
  L extends Record<string, unknown>,
  R extends Record<string, unknown>,
>(
  options: any,
): options is ObjectJoinOptions<
  L,
  R
> {
  return options && typeof options === "object" && !Array.isArray(options) &&
    "keys" in options;
}

export function parseJoinArgs<
  L extends Record<string, unknown>,
  R extends Record<string, unknown>,
>(
  arg2: any, // Can be keys or options
  arg3?: any, // Can be options or undefined
): JoinArgs<L, R> {
  // Advanced API: single argument with options object
  if (isObjectJoinOptions<L, R>(arg2)) {
    const opts = arg2;
    if (Array.isArray(opts.keys)) {
      // Same column names: { keys: ["id", "year"] }
      const keys = opts.keys.map((k) => String(k));
      return {
        leftKeys: keys,
        rightKeys: keys,
        suffixes: opts.suffixes || {},
      };
    } else {
      // Different column names: { keys: { left: ["emp_id"], right: ["id"] } }
      const mapping = opts.keys as ColumnMapping<L, R>;
      return {
        leftKeys: Array.isArray(mapping.left)
          ? (mapping.left as string[]).map(String)
          : [String(mapping.left)],
        rightKeys: Array.isArray(mapping.right)
          ? (mapping.right as string[]).map(String)
          : [String(mapping.right)],
        suffixes: opts.suffixes || {},
      };
    }
  }

  // Simple API: separate key and options arguments
  const keys = normalizeJoinKeys(arg2).map((k) => String(k));
  return {
    leftKeys: keys,
    rightKeys: keys,
    suffixes: arg3?.suffixes || {},
  };
}

// -----------------------------------------------------------------------------
// Pairwise Key Logic
// -----------------------------------------------------------------------------

export function computeSameNamedKeys(
  leftJoinKeys: string[],
  rightJoinKeys: string[],
): { sameNamedLeftKeys: Set<string>; sameNamedRightKeys: Set<string> } {
  const sameNamedLeftKeys = new Set<string>();
  const sameNamedRightKeys = new Set<string>();

  for (
    let i = 0;
    i < Math.min(leftJoinKeys.length, rightJoinKeys.length);
    i++
  ) {
    if (leftJoinKeys[i] === rightJoinKeys[i]) {
      sameNamedLeftKeys.add(leftJoinKeys[i]);
      sameNamedRightKeys.add(rightJoinKeys[i]);
    }
  }

  return { sameNamedLeftKeys, sameNamedRightKeys };
}

// -----------------------------------------------------------------------------
// Common Build Output Store Utilities
// -----------------------------------------------------------------------------

export const NA_U32 = 0xFFFFFFFF;

export function computeColumnConflicts(
  leftColumnNames: string[],
  rightColumnNames: string[],
  leftJoinKeys: string[],
): {
  leftNameSet: Set<string>;
  rightNameSet: Set<string>;
  leftKeySet: Set<string>;
} {
  const leftNameSet = new Set(leftColumnNames);
  const rightNameSet = new Set(rightColumnNames);
  const leftKeySet = new Set(leftJoinKeys);

  return { leftNameSet, rightNameSet, leftKeySet };
}

export function applySuffixToColumnName(
  name: string,
  hasConflict: boolean,
  suffix: string,
): string {
  return hasConflict && suffix ? `${name}${suffix}` : name;
}

export function precomputeBaseIndices(
  left: StoreAndIndex,
  right: StoreAndIndex,
  leftIdxView: readonly number[],
  rightIdxView: readonly (number | null)[],
): {
  leftBase: Uint32Array;
  rightBase: Uint32Array;
  n: number;
} {
  const n = leftIdxView.length;
  const leftBase = new Uint32Array(n);
  const rightBase = new Uint32Array(n);

  for (let i = 0; i < n; i++) {
    leftBase[i] = left.index[leftIdxView[i]];
    const rv = rightIdxView[i];
    rightBase[i] = rv == null ? NA_U32 : right.index[rv];
  }

  return { leftBase, rightBase, n };
}

// -----------------------------------------------------------------------------
// Column Building Helpers
// -----------------------------------------------------------------------------

export function copyColumnWithIndex(
  source: unknown[],
  indices: Uint32Array,
  length: number,
): unknown[] {
  const out = new Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = source[indices[i]];
  }
  return out;
}

export function copyColumnWithNullableIndex(
  source: unknown[],
  baseIndices: Uint32Array,
  length: number,
): unknown[] {
  const out = new Array(length);
  for (let i = 0; i < length; i++) {
    const idx = baseIndices[i];
    out[i] = idx === NA_U32 ? undefined : source[idx];
  }
  return out;
}

// -----------------------------------------------------------------------------
// Join Algorithm Helpers
// -----------------------------------------------------------------------------

export interface JoinIndices {
  leftIdxView: number[];
  rightIdxView: (number | null)[];
}

export interface InnerJoinIndices {
  leftIdxView: number[];
  rightIdxView: number[];
}

export function buildHashMapForJoin(
  keys: readonly unknown[],
): Map<unknown, number[]> {
  const map = new Map<unknown, number[]>();
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const arr = map.get(k);
    if (arr) {
      arr.push(i);
    } else {
      map.set(k, [i]);
    }
  }
  return map;
}

export function toNullableIndex(value: number): number | null {
  return value === NA_U32 ? null : value;
}

// -----------------------------------------------------------------------------
// Join Algorithm Strategy Selection
// -----------------------------------------------------------------------------

export type JoinType = "inner" | "left" | "right" | "outer";

export interface JoinAlgorithmParams {
  leftKeys: readonly unknown[];
  rightKeys: readonly unknown[];
  joinType: JoinType;
  wasmFunctions: {
    i64: (left: BigInt64Array, right: BigInt64Array) => any;
    str: (left: string[], right: string[]) => any;
  };
  threshold?: number;
}

export function executeJoinWithAdaptiveStrategy(
  params: JoinAlgorithmParams,
): JoinIndices {
  const { leftKeys, rightKeys, joinType, wasmFunctions, threshold = 1000 } =
    params;

  let leftIdxView: number[] = [];
  let rightIdxView: (number | null)[] = [];

  const totalSize = leftKeys.length + rightKeys.length;

  // Use pure JS for larger datasets to avoid WASM marshaling overhead
  if (totalSize > threshold) {
    if (joinType === "inner") {
      const rMap = buildHashMapForJoin(rightKeys);
      for (let i = 0; i < leftKeys.length; i++) {
        const matches = rMap.get(leftKeys[i]);
        if (matches) {
          for (const j of matches) {
            leftIdxView.push(i);
            rightIdxView.push(j);
          }
        }
      }
    } else if (joinType === "left") {
      const rMap = buildHashMapForJoin(rightKeys);
      for (let i = 0; i < leftKeys.length; i++) {
        const matches = rMap.get(leftKeys[i]);
        if (matches) {
          for (const j of matches) {
            leftIdxView.push(i);
            rightIdxView.push(j);
          }
        } else {
          leftIdxView.push(i);
          rightIdxView.push(null);
        }
      }
    } else if (joinType === "outer") {
      const rMap = buildHashMapForJoin(rightKeys);
      const rSeen = new Uint8Array(rightKeys.length);

      for (let i = 0; i < leftKeys.length; i++) {
        const arr = rMap.get(leftKeys[i]);
        if (arr) {
          for (const j of arr) {
            leftIdxView.push(i);
            rightIdxView.push(j);
            rSeen[j] = 1;
          }
        } else {
          leftIdxView.push(i);
          rightIdxView.push(null);
        }
      }
      // unmatched rights
      for (let j = 0; j < rightKeys.length; j++) {
        if (!rSeen[j]) {
          leftIdxView.push(null as any);
          rightIdxView.push(j);
        }
      }
    }
  } else {
    // Use WASM for smaller datasets
    const probe = firstNonNullish(leftKeys) ?? firstNonNullish(rightKeys);
    const useI64 = typeof probe === "number" || typeof probe === "bigint";

    if (useI64) {
      const l64 = asI64(leftKeys);
      const r64 = asI64(rightKeys);
      const res = wasmFunctions.i64(l64, r64);
      leftIdxView = Array.from(res.takeLeft());
      const rightRaw = Array.from(res.takeRight());

      // Convert nullable indices for left/outer joins
      if (joinType === "left" || joinType === "outer") {
        rightIdxView = rightRaw.map((v) => toNullableIndex(v as number));
      } else {
        rightIdxView = rightRaw as number[];
      }

      // For outer join and right join, left side can also be null
      if (joinType === "outer" || joinType === "right") {
        leftIdxView = leftIdxView.map((v) =>
          toNullableIndex(v as number)
        ) as number[];
      }
    } else {
      const ls = leftKeys.map(String);
      const rs = rightKeys.map(String);
      const res = wasmFunctions.str(ls, rs);
      leftIdxView = Array.from(res.takeLeft());
      const rightRaw = Array.from(res.takeRight());

      // Convert nullable indices for left/outer joins
      if (joinType === "left" || joinType === "outer") {
        rightIdxView = rightRaw.map((v) => toNullableIndex(v as number));
      } else {
        rightIdxView = rightRaw as number[];
      }

      // For outer join and right join, left side can also be null
      if (joinType === "outer" || joinType === "right") {
        leftIdxView = leftIdxView.map((v) =>
          toNullableIndex(v as number)
        ) as number[];
      }
    }
  }

  return { leftIdxView, rightIdxView };
}

// -----------------------------------------------------------------------------
// Column Processing
// -----------------------------------------------------------------------------

export interface ColumnProcessingParams {
  store: StoreAndIndex;
  baseIndices: Uint32Array;
  columnNames: string[];
  nameSet: Set<string>;
  conflictSet: Set<string>;
  keySet: Set<string>;
  dropKeys: Set<string>;
  suffix: string;
  useNullable?: boolean;
}

export function processJoinColumns(params: ColumnProcessingParams): {
  columns: Record<string, unknown[]>;
  names: string[];
} {
  const {
    store,
    baseIndices,
    columnNames,
    conflictSet,
    dropKeys,
    suffix,
    useNullable = false,
  } = params;

  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];
  const n = baseIndices.length;

  for (const name of columnNames) {
    // Skip columns that should be dropped
    if (dropKeys.has(name)) continue;

    // Apply suffix if there's a naming conflict
    const hasConflict = conflictSet.has(name);
    const outName = applySuffixToColumnName(name, hasConflict, suffix);
    outNames.push(outName);

    // Copy column data using base indices
    const src = store.store.columns[name];
    const out = new Array(n);

    if (useNullable) {
      // For nullable indices (left/right joins with unmatched rows)
      for (let i = 0; i < n; i++) {
        const idx = baseIndices[i];
        out[i] = idx === NA_U32 ? undefined : src[idx];
      }
    } else {
      // For non-nullable indices (inner join, matched rows)
      for (let i = 0; i < n; i++) {
        out[i] = src[baseIndices[i]];
      }
    }

    outCols[outName] = out;
  }

  return { columns: outCols, names: outNames };
}

// -----------------------------------------------------------------------------
// Common Join Setup and Validation
// -----------------------------------------------------------------------------

export interface JoinSetupResult {
  leftStore: StoreAndIndex;
  rightStore: StoreAndIndex;
  leftKeys: string[];
  rightKeys: string[];
  suffixes: { left?: string; right?: string };
}

export function setupJoinOperation<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
  JoinKeyName extends JoinKey<LeftRow> & JoinKey<RightRow>,
>(
  left: DataFrame<LeftRow>,
  right: DataFrame<RightRow>,
  byOrOptions:
    | JoinKeyName
    | JoinKeyName[]
    | ObjectJoinOptions<LeftRow, RightRow>,
  options?: { suffixes?: { left?: string; right?: string } },
): JoinSetupResult | null {
  // Parse arguments - works for both API styles
  const joinArgs = parseJoinArgs<LeftRow, RightRow>(byOrOptions, options);
  const { leftKeys, rightKeys, suffixes } = joinArgs;

  // Check for empty DataFrames (caller handles specific logic)
  if (left.nrows() === 0 || right.nrows() === 0) {
    return null;
  }

  // Get store and index for both DataFrames
  const leftStore = getStoreAndIndex(left);
  const rightStore = getStoreAndIndex(right);

  return {
    leftStore,
    rightStore,
    leftKeys,
    rightKeys,
    suffixes,
  };
}

// -----------------------------------------------------------------------------
// Empty DataFrame Handling
// -----------------------------------------------------------------------------

export function createEmptyJoinResult() {
  return createColumnarDataFrameFromStore({
    columns: {},
    length: 0,
    columnNames: [],
  });
}

export function copyDataFrameColumns(
  storeAndIndex: StoreAndIndex,
): ColumnarStore {
  const { store, index } = storeAndIndex;
  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];

  for (const name of store.columnNames) {
    outNames.push(name);
    const out = new Array(index.length);
    const src = store.columns[name];
    for (let i = 0; i < index.length; i++) {
      out[i] = src[index[i]];
    }
    outCols[name] = out;
  }

  return {
    columns: outCols,
    length: index.length,
    columnNames: outNames,
  };
}
