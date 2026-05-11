// deno-lint-ignore-file no-explicit-any
// Convenience methods for removing null/undefined values with automatic type narrowing
import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";
import { validateColumnsExist } from "../../utilities/errors.ts";
import { filter } from "./filter.verb.ts";
import {
  type BitSet,
  bitsetClear,
  bitsetGet,
  bitsetSet,
  createBitSet,
} from "../../dataframe/implementation/columnar-view.ts";
import { withMask } from "../../dataframe/implementation/row-cursor.ts";
import { materializeIndex, rebuildGroupsColumnar } from "../../dataframe/index.ts";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Fill all valid bits in a bitset (up to n), leaving padding bits clear. */
function bitsetFillAll(bs: BitSet, n: number): void {
  const arr = bs.bits;
  const fullWords = n >>> 5;
  const tailBits = n & 31;
  for (let i = 0; i < fullWords; i++) arr[i] = 0xFFFFFFFF;
  if (tailBits > 0) {
    arr[fullWords] = (0xFFFFFFFF << (32 - tailBits)) >>> 0;
  }
}

/** Initialize a bitset from the existing mask or all-set. */
function initBitSet(api: any, nStore: number): BitSet {
  const bs = createBitSet(nStore);
  const existingMask = api.__view?.mask;
  const existingRawMask = api.__view?.rawMask;
  if (existingMask) {
    const src = existingMask.bits;
    const dst = bs.bits;
    for (let i = 0; i < src.length && i < dst.length; i++) dst[i] = src[i];
  } else if (existingRawMask) {
    for (let i = 0; i < nStore; i++) {
      if (existingRawMask[i]) bitsetSet(bs, i);
    }
  } else {
    bitsetFillAll(bs, nStore);
  }
  return bs;
}

/** Apply a bitset mask to a DataFrame/GroupedDataFrame, rebuilding groups if needed. */
function applyMask(api: any, bs: BitSet, store: any): any {
  const out = withMask(api, bs);
  if (api.__groups) {
    const idx = materializeIndex(store.length, (out as any).__view);
    const groupCols = api.__groups.groupingColumns.map(String);
    if (idx.length > 0 && groupCols.length > 0) {
      (out as any).__groups = rebuildGroupsColumnar(store, groupCols, idx);
      (out as any).__kind = "GroupedDataFrame";
    }
  }
  return out;
}

/** Check if the argument is a nested path tuple [parentKey, nestedKey]. */
function isNestedPath(arg: any): arg is [string, string] {
  return Array.isArray(arg) && arg.length === 2 &&
    typeof arg[0] === "string" && typeof arg[1] === "string";
}

/**
 * Core removal logic shared by removeNull, removeUndefined, and removeNA.
 * @param check - returns true when a value should be REMOVED
 */
function removeBy(
  df: any,
  fieldOrFields: any,
  restFields: any[],
  check: (val: any) => boolean,
): any {
  const api = df;
  const store = api.__store;

  // Nested path: removeNull(["parent", "child"])
  if (isNestedPath(fieldOrFields) && restFields.length === 0) {
    const [parentKey, nestedKey] = fieldOrFields;

    if (store) {
      if (store.length > 0) {
        validateColumnsExist([parentKey], store.columnNames);
      }
      const parentCol = store.columns[parentKey];
      if (parentCol) {
        const nStore = store.length;
        const bs = initBitSet(api, nStore);
        for (let p = 0; p < nStore; p++) {
          if (bitsetGet(bs, p) && check(parentCol[p]?.[nestedKey])) {
            bitsetClear(bs, p);
          }
        }
        return applyMask(api, bs, store);
      }
    }

    // Fallback for non-store
    return filter((row: any) => !check(row[parentKey]?.[nestedKey]))(df);
  }

  // Top-level field(s)
  const allFields: string[] = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...restFields];

  if (store) {
    const nStore = store.length;
    if (nStore > 0) {
      validateColumnsExist(allFields, store.columnNames);
    }
    const bs = initBitSet(api, nStore);
    for (const field of allFields) {
      const col = store.columns[field];
      for (let p = 0; p < nStore; p++) {
        if (bitsetGet(bs, p) && check(col[p])) {
          bitsetClear(bs, p);
        }
      }
    }
    return applyMask(api, bs, store);
  }

  // Fallback for non-store DataFrames
  let result: any = df;
  for (const field of allFields) {
    result = filter((row: any) => !check(row[field]))(result);
  }
  return result;
}

// ---------------------------------------------------------------------------
// removeNull
// ---------------------------------------------------------------------------

/**
 * Remove rows where field(s) are null.
 * Automatically narrows the type to exclude null.
 *
 * Supports nested fields via tuple path: `removeNull(["parent", "child"])`
 */
// Nested path overload
export function removeNull<Row extends object, K1 extends keyof Row, K2 extends keyof Row[K1]>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  path: readonly [K1, K2],
): any;

// Single field overload
export function removeNull<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
): any;

// Multiple fields overload (rest parameters)
export function removeNull<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
  ...fields: Field[]
): any;

// Implementation
export function removeNull(df: any, fieldOrFields: any, ...fields: any[]): any {
  return removeBy(df, fieldOrFields, fields, (val) => val === null);
}

// ---------------------------------------------------------------------------
// removeUndefined
// ---------------------------------------------------------------------------

/**
 * Remove rows where field(s) are undefined.
 * Automatically narrows the type to exclude undefined.
 *
 * Supports nested fields via tuple path: `removeUndefined(["parent", "child"])`
 */
// Nested path overload
export function removeUndefined<Row extends object, K1 extends keyof Row, K2 extends keyof Row[K1]>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  path: readonly [K1, K2],
): any;

// Single field overload
export function removeUndefined<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
): any;

// Multiple fields overload (rest parameters)
export function removeUndefined<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
  ...fields: Field[]
): any;

// Implementation
export function removeUndefined(df: any, fieldOrFields: any, ...fields: any[]): any {
  return removeBy(df, fieldOrFields, fields, (val) => val === undefined);
}

// ---------------------------------------------------------------------------
// removeNA (deprecated)
// ---------------------------------------------------------------------------

/**
 * Remove rows where field(s) are null or undefined.
 * Automatically narrows the type to exclude both null and undefined.
 *
 * @deprecated Use {@link removeNull} and {@link removeUndefined}, or {@link filter}, instead.
 */
// Single field overload
export function removeNA<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
): any;

// Multiple fields overload (rest parameters)
export function removeNA<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
  ...fields: Field[]
): any;

// Implementation
export function removeNA(df: any, fieldOrFields: any, ...fields: any[]): any {
  return removeBy(df, fieldOrFields, fields, (val) => val == null);
}
