// deno-lint-ignore-file no-explicit-any
// Convenience methods for removing null/undefined values with automatic type narrowing
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import { filter } from "./filter.verb.ts";
import {
  type BitSet,
  bitsetClear,
  bitsetGet,
  createBitSet,
} from "../../dataframe/implementation/columnar-view.ts";
import { withMask } from "../../dataframe/implementation/row-cursor.ts";

/** Fill all valid bits in a bitset (up to n), leaving padding bits clear. */
function bitsetFillAll(bs: BitSet, n: number): void {
  const arr = bs.bits;
  const fullWords = n >>> 5;
  const tailBits = n & 31;
  for (let i = 0; i < fullWords; i++) arr[i] = 0xFFFFFFFF;
  if (tailBits > 0) {
    // Set only the top `tailBits` bits in the last word (MSB-first layout)
    arr[fullWords] = (0xFFFFFFFF << (32 - tailBits)) >>> 0;
  }
}

// Helper type to narrow multiple fields without Omit to reduce type depth
type NarrowFields<Row, Fields extends keyof Row, Remove> = Prettify<
  {
    [K in keyof Row]: K extends Fields
      ? Exclude<Row[K], Remove>
      : Row[K];
  }
>;

/**
 * Remove rows where field(s) are null.
 * Automatically narrows the type to exclude null.
 */
// Single field overload
export function removeNull<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
): DataFrame<NarrowFields<Row, Field, null>>;

// Multiple fields overload (rest parameters)
export function removeNull<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
  ...fields: Field[]
): DataFrame<NarrowFields<Row, Field, null>>;

// Array overload
export function removeNull<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fields: Field[],
): DataFrame<NarrowFields<Row, Field, null>>;

// Implementation
export function removeNull<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fieldOrFields: Field | Field[],
  ...fields: Field[]
): any {
  const allFields = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...fields];

  const api = df as any;
  const store = api.__store;

  // Fast columnar path: build mask directly on the store columns
  if (store) {
    const nStore = store.length;
    const existingMask = api.__view?.mask;

    // Start from existing mask or all-set
    const bs = createBitSet(nStore);
    if (existingMask) {
      const src = existingMask.bits;
      const dst = bs.bits;
      for (let i = 0; i < src.length && i < dst.length; i++) dst[i] = src[i];
    } else {
      bitsetFillAll(bs, nStore);
    }

    // Clear bits where any field is null
    for (const field of allFields) {
      const col = store.columns[field as string];
      if (!col) continue;
      for (let p = 0; p < nStore; p++) {
        if (bitsetGet(bs, p) && col[p] === null) {
          bitsetClear(bs, p);
        }
      }
    }

    const out = withMask(api, bs);
    if (api.__groups) (out as any).__groups = api.__groups;
    return out;
  }

  // Fallback for non-store DataFrames
  let result: any = df;
  for (const field of allFields) {
    const predicate = (row: Row) => {
      return row[field] !== null;
    };
    result = filter(predicate)(result);
  }
  return result;
}

/**
 * Remove rows where field(s) are undefined.
 * Automatically narrows the type to exclude undefined.
 */
// Single field overload
export function removeUndefined<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
): DataFrame<NarrowFields<Row, Field, undefined>>;

// Multiple fields overload (rest parameters)
export function removeUndefined<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
  ...fields: Field[]
): DataFrame<NarrowFields<Row, Field, undefined>>;

// Array overload
export function removeUndefined<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fields: Field[],
): DataFrame<NarrowFields<Row, Field, undefined>>;

// Implementation
export function removeUndefined<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fieldOrFields: Field | Field[],
  ...fields: Field[]
): any {
  const allFields = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...fields];

  const api = df as any;
  const store = api.__store;

  if (store) {
    const nStore = store.length;
    const existingMask = api.__view?.mask;

    const bs = createBitSet(nStore);
    if (existingMask) {
      const src = existingMask.bits;
      const dst = bs.bits;
      for (let i = 0; i < src.length && i < dst.length; i++) dst[i] = src[i];
    } else {
      bitsetFillAll(bs, nStore);
    }

    for (const field of allFields) {
      const col = store.columns[field as string];
      if (!col) continue;
      for (let p = 0; p < nStore; p++) {
        if (bitsetGet(bs, p) && col[p] === undefined) {
          bitsetClear(bs, p);
        }
      }
    }

    const out = withMask(api, bs);
    if (api.__groups) (out as any).__groups = api.__groups;
    return out;
  }

  let result: any = df;
  for (const field of allFields) {
    const predicate = (row: Row) => {
      return row[field] !== undefined;
    };
    result = filter(predicate)(result);
  }
  return result;
}

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
): DataFrame<NarrowFields<Row, Field, null | undefined>>;

// Multiple fields overload (rest parameters)
export function removeNA<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  field: Field,
  ...fields: Field[]
): DataFrame<NarrowFields<Row, Field, null | undefined>>;

// Array overload
export function removeNA<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fields: Field[],
): DataFrame<NarrowFields<Row, Field, null | undefined>>;

// Implementation
export function removeNA<Row extends object, Field extends keyof Row>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fieldOrFields: Field | Field[],
  ...fields: Field[]
): any {
  const allFields = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...fields];

  const api = df as any;
  const store = api.__store;

  if (store) {
    const nStore = store.length;
    const existingMask = api.__view?.mask;

    const bs = createBitSet(nStore);
    if (existingMask) {
      const src = existingMask.bits;
      const dst = bs.bits;
      for (let i = 0; i < src.length && i < dst.length; i++) dst[i] = src[i];
    } else {
      bitsetFillAll(bs, nStore);
    }

    for (const field of allFields) {
      const col = store.columns[field as string];
      if (!col) continue;
      for (let p = 0; p < nStore; p++) {
        if (bitsetGet(bs, p) && col[p] == null) {
          bitsetClear(bs, p);
        }
      }
    }

    const out = withMask(api, bs);
    if (api.__groups) (out as any).__groups = api.__groups;
    return out;
  }

  let result: any = df;
  for (const field of allFields) {
    const predicate = (row: Row) => {
      return row[field] != null;
    };
    result = filter(predicate)(result);
  }
  return result;
}
