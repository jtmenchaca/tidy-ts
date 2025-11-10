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
 */
type NewKeyValues<RenameMap> = {
  [K in keyof RenameMap]: RenameMap[K] extends PropertyKey ? RenameMap[K]
    : never;
}[keyof RenameMap];

/**
 * Find the old key that maps to a given new key
 */
type OldKeyForNewKey<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
  NewKey extends PropertyKey,
> = {
  [OldKey in ProvidedKeys<RenameMap>]: RenameMap[OldKey] extends NewKey
    ? OldKey extends keyof Row ? OldKey
    : never
    : never;
}[ProvidedKeys<RenameMap>];

/**
 * Build mutate assignments from rename map: { newKey: (r) => r.oldKey }
 * Iterate over new keys first to preserve literal types (like mutate does)
 */
type MutateAssignmentsFromRename<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = {
  [NewKey in NewKeyValues<Pick<RenameMap, ProvidedKeys<RenameMap>>>]: (
    row: Row,
  ) => OldKeyForNewKey<Row, RenameMap, NewKey> extends keyof Row
    ? Row[OldKeyForNewKey<Row, RenameMap, NewKey>]
    : never;
};

/** Strongly-typed rename result using mutate + drop composition. */
export type RowAfterRename<
  Row extends object,
  RenameMap extends Partial<Record<keyof Row, PropertyKey>>,
> = Row extends unknown ? Prettify<
    RowAfterDrop<
      RowAfterMutation<Row, MutateAssignmentsFromRename<Row, RenameMap>>,
      & ProvidedKeys<RenameMap>
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
