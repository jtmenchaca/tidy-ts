// deno-lint-ignore-file no-explicit-any
// Convenience methods for removing null/undefined values with automatic type narrowing
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import { filter } from "./filter.verb.ts";

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
  // Normalize inputs - handle both array and rest parameter syntax
  const allFields = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...fields];

  // Chain filters for each field
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
  // Normalize inputs - handle both array and rest parameter syntax
  const allFields = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...fields];

  // Chain filters for each field
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
  // Normalize inputs - handle both array and rest parameter syntax
  const allFields = Array.isArray(fieldOrFields)
    ? fieldOrFields
    : [fieldOrFields, ...fields];

  // Chain filters for each field
  let result: any = df;
  for (const field of allFields) {
    const predicate = (row: Row) => {
      return row[field] != null;
    };
    result = filter(predicate)(result);
  }
  return result;
}
