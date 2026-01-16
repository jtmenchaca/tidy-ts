import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";
import type { RowAfterMutation } from "./mutate/mutate.types.ts";
import type { RowAfterDrop } from "../selection/drop.types.ts";

/**
 * Keys that are actually provided (exclude optionals that are undefined)
 */
type ProvidedKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

/**
 * Extract new key values from rename map as a union
 * This preserves literal types better than mapping
 * Excludes identity renames (where old key equals new key)
 */
type NewKeyValues<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = {
  [K in ProvidedKeys<RenameMap>]: K extends PropertyKey
    ? RenameMap[K] extends PropertyKey
      ? K extends RenameMap[K] ? never : RenameMap[K]
    : never
    : never;
}[ProvidedKeys<RenameMap>];

/**
 * Find the old key that maps to a given new key
 * Excludes identity renames (where old key equals new key)
 */
type OldKeyForNewKey<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
  NewKey extends PropertyKey,
> = {
  [OldKey in ProvidedKeys<RenameMap>]: OldKey extends PropertyKey
    ? RenameMap[OldKey] extends PropertyKey
      ? OldKey extends RenameMap[OldKey] ? never
      : RenameMap[OldKey] extends NewKey ? OldKey extends keyof Row ? OldKey
        : never
      : never
    : never
    : never;
}[ProvidedKeys<RenameMap>];

/**
 * Build mutate assignments from rename map: { newKey: (r) => r.oldKey }
 * Iterate over new keys first to preserve literal types (like mutate does)
 * Excludes identity renames (where old key equals new key)
 */
type MutateAssignmentsFromRename<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = {
  [NewKey in NewKeyValues<Row, RenameMap>]: (
    row: Row,
  ) => OldKeyForNewKey<Row, RenameMap, NewKey> extends keyof Row
    ? Row[OldKeyForNewKey<Row, RenameMap, NewKey>]
    : never;
};

/**
 * Get the keys that should be dropped (old keys that are actually being renamed)
 * Excludes identity renames (where old key equals new key)
 */
type KeysToDrop<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = {
  [K in ProvidedKeys<RenameMap>]: K extends PropertyKey
    ? RenameMap[K] extends PropertyKey ? K extends RenameMap[K] ? never : K
    : never
    : never;
}[ProvidedKeys<RenameMap>];

/** Strongly-typed rename result using mutate + drop composition. */
export type RowAfterRename<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = Row extends unknown ? Prettify<
    RowAfterDrop<
      RowAfterMutation<Row, MutateAssignmentsFromRename<Row, RenameMap>>,
      & KeysToDrop<Row, RenameMap>
      & keyof RowAfterMutation<
        Row,
        MutateAssignmentsFromRename<Row, RenameMap>
      >
    >
  >
  : never;

export type RenameMethod<Row extends object> = {
  /**
   * Rename columns in the DataFrame.
   *
   * Provide a mapping object where keys are old names and values are new column names.
   * All other columns remain unchanged. Type-safe with full autocomplete support.
   *
   * @example
   * // Rename a single column
   * df.rename({ name: "firstName" })
   *
   * @example
   * // Rename multiple columns
   * df.rename({
   *   name: "fullName",
   *   age: "yearsOld",
   *   email: "emailAddr"
   * })
   *
   * @example
   * // Works with grouped DataFrames
   * df.groupBy("category").rename({ value: "val" })
   */
  <
    GroupName extends keyof Row,
    const RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    mapping: RenameMap,
  ): PreserveGrouping<Row, GroupName, RowAfterRename<Row, RenameMap>>;

  /**
   * Rename columns in the DataFrame.
   *
   * Provide a mapping object where keys are old names and values are new column names.
   * All other columns remain unchanged. Type-safe with full autocomplete support.
   *
   * @example
   * // Rename a single column
   * df.rename({ name: "firstName" })
   *
   * @example
   * // Rename multiple columns
   * df.rename({
   *   name: "fullName",
   *   age: "yearsOld",
   *   email: "emailAddr"
   * })
   *
   * @example
   * // Works with grouped DataFrames
   * df.groupBy("category").rename({ value: "val" })
   */
  <const RenameMap extends Partial<Record<keyof Row, PropertyKey>>>(
    mapping: RenameMap,
  ): DataFrame<RowAfterRename<Row, RenameMap>>;
};
