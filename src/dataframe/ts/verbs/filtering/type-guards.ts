/**
 * Type guard helpers for filter operations.
 *
 * These functions return type predicates that enable automatic type narrowing
 * when used with the filter verb.
 *
 * @example
 * ```typescript
 * import { isNotNull } from "@tidy-ts/dataframe";
 *
 * const filtered = df.filter(isNotNull("from_user_id"));
 * // filtered has type DataFrame<{from_user_id: string}> (null removed)
 * ```
 */

/**
 * Create a type guard that checks if a field is not null.
 *
 * @param field - The field name to check
 * @returns A type predicate function that narrows the field type by excluding null
 */
export function isNotNull<Row extends object, Field extends keyof Row>(
  field: Field,
): (row: Row) => row is Row & { [K in Field]: Exclude<Row[Field], null> } {
  return (
    row: Row,
  ): row is Row & { [K in Field]: Exclude<Row[Field], null> } => {
    return row[field] !== null;
  };
}

/**
 * Create a type guard that checks if a field is not undefined.
 *
 * @param field - The field name to check
 * @returns A type predicate function that narrows the field type by excluding undefined
 */
export function isNotUndefined<Row extends object, Field extends keyof Row>(
  field: Field,
): (row: Row) => row is Row & { [K in Field]: Exclude<Row[Field], undefined> } {
  return (
    row: Row,
  ): row is Row & { [K in Field]: Exclude<Row[Field], undefined> } => {
    return row[field] !== undefined;
  };
}

/**
 * Create a type guard that checks if a field is not null or undefined (using != null).
 *
 * @param field - The field name to check
 * @returns A type predicate function that narrows the field type by excluding null and undefined
 */
export function isNotNullish<Row extends object, Field extends keyof Row>(
  field: Field,
): (
  row: Row,
) => row is Row & { [K in Field]: Exclude<Row[Field], null | undefined> } {
  return (
    row: Row,
  ): row is Row & { [K in Field]: Exclude<Row[Field], null | undefined> } => {
    return row[field] != null;
  };
}

/**
 * Create a type guard that checks if a field is defined (not null or undefined).
 * Alias for isNotNullish.
 *
 * @param field - The field name to check
 * @returns A type predicate function that narrows the field type by excluding null and undefined
 */
export const isDefined = isNotNullish;

/**
 * Create a type guard that checks if a field is truthy.
 * Note: This is less precise for type narrowing as TypeScript cannot narrow
 * based on truthiness alone.
 *
 * @param field - The field name to check
 * @returns A type predicate function that checks truthiness
 */
export function isTruthy<Row extends object, Field extends keyof Row>(
  field: Field,
): (
  row: Row,
) => row is
  & Row
  & { [K in Field]: Exclude<Row[Field], null | undefined | false | 0 | ""> } {
  return (
    row: Row,
  ): row is
    & Row
    & {
      [K in Field]: Exclude<Row[Field], null | undefined | false | 0 | "">;
    } => {
    return !!row[field];
  };
}
