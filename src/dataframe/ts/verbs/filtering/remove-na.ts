// deno-lint-ignore-file no-explicit-any
// Convenience methods for removing null/undefined values with automatic type narrowing
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import { filter } from "./filter.verb.ts";

// Helper type to narrow multiple fields
type NarrowFields<Row, Fields extends keyof Row, Remove> = Prettify<
  & Omit<Row, Fields>
  & { [K in Fields]: Exclude<Row[K], Remove> }
>;

/**
 * Remove rows where field(s) are null.
 * Automatically narrows the type to exclude null.
 */
// Single field overload
export function removeNull<Row extends object, Field extends keyof Row>(
  field: Field,
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<
  Prettify<Omit<Row, Field> & { [K in Field]: Exclude<Row[Field], null> }>
>;

// Multiple fields overload (rest parameters)
export function removeNull<Row extends object, Field extends keyof Row>(
  field: Field,
  ...fields: Field[]
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<NarrowFields<Row, Field, null>>;

// Array overload
export function removeNull<Row extends object, Field extends keyof Row>(
  fields: Field[],
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<NarrowFields<Row, Field, null>>;

// Implementation
export function removeNull<Row extends object, Field extends keyof Row>(
  fieldOrFields: Field | Field[],
  ...fields: Field[]
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    // Normalize inputs - handle both array and rest parameter syntax
    const allFields = Array.isArray(fieldOrFields)
      ? fieldOrFields
      : [fieldOrFields, ...fields];

    // Chain filters for each field
    let result: any = df;
    for (const field of allFields) {
      const predicate = (row: Row): row is any => {
        return row[field] !== null;
      };
      result = filter(predicate)(result);
    }
    return result;
  };
}

/**
 * Remove rows where field(s) are undefined.
 * Automatically narrows the type to exclude undefined.
 */
// Single field overload
export function removeUndefined<Row extends object, Field extends keyof Row>(
  field: Field,
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<
  Prettify<Omit<Row, Field> & { [K in Field]: Exclude<Row[Field], undefined> }>
>;

// Multiple fields overload (rest parameters)
export function removeUndefined<Row extends object, Field extends keyof Row>(
  field: Field,
  ...fields: Field[]
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<NarrowFields<Row, Field, undefined>>;

// Array overload
export function removeUndefined<Row extends object, Field extends keyof Row>(
  fields: Field[],
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<NarrowFields<Row, Field, undefined>>;

// Implementation
export function removeUndefined<Row extends object, Field extends keyof Row>(
  fieldOrFields: Field | Field[],
  ...fields: Field[]
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    // Normalize inputs - handle both array and rest parameter syntax
    const allFields = Array.isArray(fieldOrFields)
      ? fieldOrFields
      : [fieldOrFields, ...fields];

    // Chain filters for each field
    let result: any = df;
    for (const field of allFields) {
      const predicate = (row: Row): row is any => {
        return row[field] !== undefined;
      };
      result = filter(predicate)(result);
    }
    return result;
  };
}

/**
 * Remove rows where field(s) are null or undefined.
 * Automatically narrows the type to exclude both null and undefined.
 */
// Single field overload
export function removeNA<Row extends object, Field extends keyof Row>(
  field: Field,
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<
  Prettify<
    Omit<Row, Field> & { [K in Field]: Exclude<Row[Field], null | undefined> }
  >
>;

// Multiple fields overload (rest parameters)
export function removeNA<Row extends object, Field extends keyof Row>(
  field: Field,
  ...fields: Field[]
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<NarrowFields<Row, Field, null | undefined>>;

// Array overload
export function removeNA<Row extends object, Field extends keyof Row>(
  fields: Field[],
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<NarrowFields<Row, Field, null | undefined>>;

// Implementation
export function removeNA<Row extends object, Field extends keyof Row>(
  fieldOrFields: Field | Field[],
  ...fields: Field[]
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    // Normalize inputs - handle both array and rest parameter syntax
    const allFields = Array.isArray(fieldOrFields)
      ? fieldOrFields
      : [fieldOrFields, ...fields];

    // Chain filters for each field
    let result: any = df;
    for (const field of allFields) {
      const predicate = (row: Row): row is any => {
        return row[field] != null;
      };
      result = filter(predicate)(result);
    }
    return result;
  };
}
