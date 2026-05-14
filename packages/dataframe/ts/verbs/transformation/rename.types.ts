import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
} from "../../dataframe/index.ts";

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
    R extends object,
    GroupName extends keyof R,
    const RenameMap extends Partial<Record<keyof R, PropertyKey>>,
  >(
    this: GroupedDataFrame<R, GroupName>,
    mapping: RenameMap,
  ): PreserveGrouping<
    R,
    GroupName,
    R extends unknown ? {
        [
          K in
            | Exclude<keyof R, KeysToDrop<R, RenameMap>>
            | NewKeyValues<R, RenameMap>
        ]: K extends NewKeyValues<R, RenameMap>
          ? OldKeyForNewKey<R, RenameMap, K> extends keyof R
            ? R[OldKeyForNewKey<R, RenameMap, K>]
            : never
          : K extends keyof R ? R[K]
          : never;
      }
      : never
  >;

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
  <R extends object, const RenameMap extends Partial<Record<keyof R, PropertyKey>>>(
    this: DataFrame<R>,
    mapping: RenameMap,
  ): DataFrame<
    R extends unknown ? {
        [
          K in
            | Exclude<keyof R, KeysToDrop<R, RenameMap>>
            | NewKeyValues<R, RenameMap>
        ]: K extends NewKeyValues<R, RenameMap>
          ? OldKeyForNewKey<R, RenameMap, K> extends keyof R
            ? R[OldKeyForNewKey<R, RenameMap, K>]
            : never
          : K extends keyof R ? R[K]
          : never;
      }
      : never
  >;
};
