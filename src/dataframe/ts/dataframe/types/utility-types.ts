// src/dataframe/ts/core/types/utilities.ts
// Consolidated type utilities for tidy-ts
// deno-lint-ignore-file no-explicit-any

// ============================================================================
// Shape and Object Manipulation
// ============================================================================

// deno-lint-ignore ban-types
export type Prettify<Type> = { [Key in keyof Type]: Type[Key] } & {};

// Force *nested* properties to expand too
export type PrettifyDeep<T> = T extends object
  // deno-lint-ignore ban-types
  ? { [K in keyof T]: PrettifyDeep<T[K]> } & {}
  : T;

// Keys from Row excluding internal metadata
export type DataKeys<Row> = Exclude<
  Extract<keyof Row, string>,
  "__tidy_row_label__" | "__tidy_row_types__"
>;

// Exact data-only view (same as Omit<Row, "__tidy_row_label__" | "__tidy_row_types__"> but pretty)
export type DataOnly<Row> = { [K in DataKeys<Row>]: Row[K] };

// Turn a string union into columns, but allow pretty-expansion at the site of use
export type ColumnsFromUnion<Labels extends string, T> = { [K in Labels]: T };

export type Subset<Type, Key extends keyof Type> = Prettify<Pick<Type, Key>>;

export type UnionToIntersection<Union> =
  (Union extends unknown ? (k: Union) => void : never) extends (
    k: infer Intersection,
  ) => void ? Intersection
    : never;

export type KeyUnion<Type> = Type extends Type ? keyof Type : never;

// ============================================================================
// Union Type Utilities
// ============================================================================

/** Extract value type from a union of objects at a specific key */
export type ValueUnion<Type, Key extends PropertyKey> = Type extends unknown
  ? Type extends Record<Key, unknown> ? Type[Key]
  : never
  : never;

/** Merge all keys from a union of object types */
export type MergeUnionAllKeys<Type> = {
  [Key in keyof Type]: ValueUnion<Type, Key>;
};

// ============================================================================
// Mutability and Widening
// ============================================================================

// Deeply remove readonly from objects and arrays
// deno-lint-ignore ban-types
export type DeepMutable<T> = T extends Function ? T
  : T extends ReadonlyArray<infer U> ? DeepMutable<U>[]
  : T extends object ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
  : T;

/** Widen primitive types to their most general form */
export type WidenPrimitive<Type> = Type extends string ? string
  : Type extends number ? number
  : Type extends boolean ? boolean
  : Type extends bigint ? bigint
  : Type extends symbol ? symbol
  : Type;

/** Widen all properties of an object type */
export type WidenProps<Type> = {
  [Key in keyof Type]: WidenPrimitive<Type[Key]>;
};

// ============================================================================
// Deep Merge Utilities
// ============================================================================

/** Keys of any member of a union */
type KeyUnionInternal<Type> = Type extends Type ? keyof Type : never;

/** Value union where missing keys produce undefined */
type ValueUnionOrU<Type, Key extends PropertyKey> = Type extends
  Record<Key, infer Value> ? Value
  : undefined;

type DropUndefined<Type> = Exclude<Type, undefined>;

/** Keys that EVERY member has (as key) */
type KeysAll<Type> = {
  [Key in KeyUnionInternal<Type>]: [Type] extends
    [{ [Property in Key]-?: unknown }] ? Key
    : never;
}[KeyUnionInternal<Type>];

/** Required keys among those present in every member */
type RequiredKeysFromUnion<Type> = {
  [Key in KeysAll<Type>]: undefined extends ValueUnionOrU<Type, Key> ? never
    : Key;
}[KeysAll<Type>];

/** Optional keys = everything else that's not required */
type OptionalKeysFromUnion<Type> = Exclude<
  KeyUnionInternal<Type>,
  RequiredKeysFromUnion<Type>
>;

/** Depth arithmetic (cap recursion) */
type Prev = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
type Dec<Depth extends number> = Prev[Depth] extends number ? Prev[Depth] : 0;

/** Depth-limited deep merge */
export type DeepMergeNestedProps<T, D extends number = 2> = [D] extends [0] ? T
  : [T] extends [Date] ? T
  : [T] extends [(...args: any) => any] ? T
  : [T] extends [ReadonlyArray<infer U>] ? DeepMergeNestedProps<U, Dec<D>>[]
  : [T] extends [object] ? (
      // only required keys
      [OptionalKeysFromUnion<T>] extends [never] ? {
          [K in RequiredKeysFromUnion<T>]: DeepMergeNestedProps<
            DropUndefined<ValueUnionOrU<T, K>>,
            Dec<D>
          >;
        }
        // only optional keys
        : [RequiredKeysFromUnion<T>] extends [never] ? {
            [K in OptionalKeysFromUnion<T>]?: DeepMergeNestedProps<
              DropUndefined<ValueUnionOrU<T, K>>,
              Dec<D>
            >;
          }
        // both present
        : (
          & {
            [K in RequiredKeysFromUnion<T>]: DeepMergeNestedProps<
              DropUndefined<ValueUnionOrU<T, K>>,
              Dec<D>
            >;
          }
          & {
            [K in OptionalKeysFromUnion<T>]?: DeepMergeNestedProps<
              DropUndefined<ValueUnionOrU<T, K>>,
              Dec<D>
            >;
          }
        )
    )
  : T;

export type UnifyUnion<T> = Prettify<
  {
    [K in keyof MergeUnionAllKeys<T>]: MergeUnionAllKeys<T>[K];
  }
>;

// ============================================================================
// Join Type Utilities
// ============================================================================

/**
 * Convert all properties in a type to be required but allow undefined values.
 * This is different from Partial<T> which makes properties optional (?:)
 *
 * @example
 * type Before = { name: string; age: number }
 * type WithPartial = Partial<Before>        // { name?: string; age?: number }
 * type WithUndefined = MakeUndefined<Before> // { name: string | undefined; age: number | undefined }
 */
export type MakeUndefined<T> = {
  [K in keyof T]: T[K] | undefined;
};

/**
 * Remove specified keys from a type and make remaining properties undefined-able.
 * Used for join operations where certain keys are excluded from the optional side.
 *
 * @example
 * type Row = { id: number; name: string; value: number }
 * type Result = ExcludeKeysAndMakeUndefined<Row, "id">
 * // Result: { name: string | undefined; value: number | undefined }
 */
export type ExcludeKeysAndMakeUndefined<T, K extends keyof T> = MakeUndefined<
  Omit<T, K>
>;
