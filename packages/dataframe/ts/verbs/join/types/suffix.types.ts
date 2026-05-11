// Suffix-aware join types
import type { MakeUndefined } from "../../../dataframe/index.ts";

// -----------------------------------------------------------------------------
// Suffix-aware helpers
// -----------------------------------------------------------------------------

// Keys we care about are strings for template-literal renaming
type StrKey = string;

// Columns that conflict between L and R, excluding join keys
type ConflictingColumns<
  L extends object,
  R extends object,
  K extends StrKey,
> = Exclude<Extract<keyof L, StrKey> & Extract<keyof R, StrKey>, K>;

// Apply a suffix to all prop names in T
// Non-distributive suffix application to prevent union explosion
type ApplySuffix<T extends object, S> = [S] extends [string]
  ? { [K in Extract<keyof T, StrKey> as `${K}${S}`]: T[K] }
  : T;

// Pull the join keys out of Options, preserving literals
type ExtractJoinKeys<Options> = Options extends { keys: infer Keys }
  ? Keys extends readonly (infer K)[] ? Extract<K, StrKey>
  : Keys extends { left: infer L; right: infer _R }
    ? L extends readonly (infer LK)[] ? Extract<LK, StrKey>
    : Extract<L, StrKey>
  : never
  : never;

// Preserve literal suffix strings
// Extract suffixes from options - prevent union explosion by avoiding string | undefined
type ExtractSuffixes<Options> = Options extends { suffixes: infer S } ? (
    // both present as literals
    S extends { left: infer SL; right: infer SR }
      ? { left: Extract<SL, string>; right: Extract<SR, string> }
      // only left present
      : S extends { left: infer SL }
        ? { left: Extract<SL, string>; right: undefined }
      // only right present
      : S extends { right: infer SR }
        ? { left: undefined; right: Extract<SR, string> }
      // present but empty object
      : { left: undefined; right: undefined }
  )
  : { left: undefined; right: undefined };

// -----------------------------------------------------------------------------
// Asof Join Suffix Types
// -----------------------------------------------------------------------------

// Build the asof-join result that renames conflicts on both sides
type AsofJoinWithSuffixes<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
> =
  // 1) join keys (from left preferentially, required)
  & Pick<L, Extract<keyof L, K>>
  // 2) left non-conflicting cols (as-is, required)
  & Omit<L, Exclude<Extract<keyof L, string> & Extract<keyof R, string>, K>>
  // 3) left conflicting cols (renamed with left suffix, required)
  & (S["left"] extends string ? {
      [
        C in Exclude<
          Extract<keyof L, string> & Extract<keyof R, string>,
          K
        > as `${C}${S["left"]}`
      ]: L[C];
    }
    : Pick<L, Exclude<Extract<keyof L, string> & Extract<keyof R, string>, K>>)
  // 4) right non-conflicting cols (optional - asof join)
  & MakeUndefined<Omit<R, Extract<keyof L, string> | K>>
  // 5) right conflicting cols (renamed, optional - asof join)
  & MakeUndefined<
    S["right"] extends string ? {
        [
          C in Exclude<
            Extract<keyof L, string> & Extract<keyof R, string>,
            K
          > as `${C}${S["right"]}`
        ]: R[C];
      }
      : {
        [
          C in Exclude<
            Extract<keyof L, string> & Extract<keyof R, string>,
            K
          > as `${C}_y`
        ]: R[C];
      }
  >;

// Fallback for when no suffixes provided — asof join has left-join semantics
// with _x/_y suffixes for conflicting non-key columns.
type SimpleAsofJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  // Join keys from L
  & Pick<L, K>
  // L non-conflicting non-key columns (as-is)
  & Omit<L, ConflictingColumns<L, R, Extract<K, StrKey>>>
  // L conflicting non-key columns get _x suffix
  & {
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? `${Extract<P, string>}_x`
        : never]: L[P];
  }
  // R non-conflicting non-key columns (optional)
  & MakeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? never
        : P]: R[P];
  }>
  // R conflicting non-key columns get _y suffix (optional)
  & MakeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? `${Extract<P, string>}_y`
        : never]: R[P];
  }>;

// Final dispatcher for asof join
export type SuffixAwareAsofJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = HasDefinedSuffixes<Options> extends true
  ? AsofJoinWithSuffixes<
      L,
      R,
      K,
      ExtractSuffixes<Options>
    >
  : SimpleAsofJoinResult<L, R, K>;

// -----------------------------------------------------------------------------
// Left Join Suffix Types
// -----------------------------------------------------------------------------

// Build the left-join result that renames conflicts on both sides
type LeftJoinWithSuffixes<
  L extends object,
  R extends object,
  K extends StrKey,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
> =
  // 1) join keys (from left, required)
  & Pick<L, Extract<keyof L, K>>
  // 2) left non-conflicting cols (as-is, required)
  & Omit<L, ConflictingColumns<L, R, K>>
  // 3) left conflicting cols (renamed with left suffix)
  & ApplySuffix<Pick<L, ConflictingColumns<L, R, K>>, S["left"]>
  // 4) right non-conflicting cols (optional due to left join)
  & MakeUndefined<Omit<R, Extract<keyof L, StrKey> | K>>
  // 5) right conflicting cols (renamed, optional)
  & MakeUndefined<
    ApplySuffix<Pick<R, ConflictingColumns<L, R, K>>, S["right"]>
  >;

// Fallback: L non-conflicting as-is, L conflicting get _x suffix,
// R non-conflicting with | undefined, R conflicting get _y suffix with | undefined.
type SimpleLeftJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  // Join keys from L
  & Pick<L, K>
  // L non-conflicting non-key columns (as-is)
  & Omit<L, ConflictingColumns<L, R, Extract<K, StrKey>>>
  // L conflicting non-key columns get _x suffix
  & {
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? `${Extract<P, string>}_x`
        : never]: L[P];
  }
  // R non-conflicting non-key columns (optional)
  & MakeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? never
        : P]: R[P];
  }>
  // R conflicting non-key columns get _y suffix (optional)
  & MakeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? `${Extract<P, string>}_y`
        : never]: R[P];
  }>;

// Final dispatcher
export type SuffixAwareLeftJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = HasDefinedSuffixes<Options> extends true
  ? LeftJoinWithSuffixes<
      L,
      R,
      ExtractJoinKeys<Options>,
      ExtractSuffixes<Options>
    >
  : SimpleLeftJoinResult<
      L,
      R,
      Options extends { keys: infer _K } ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : K
    >;

// -----------------------------------------------------------------------------
// Right Join Suffix Types
// -----------------------------------------------------------------------------

// Build the right-join result that renames conflicts on both sides
type RightJoinWithSuffixes<
  L extends object,
  R extends object,
  K extends StrKey,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
> =
  // 1) join keys (from right, required)
  & Pick<R, Extract<keyof R, K>>
  // 2) right non-conflicting cols (as-is, required)
  & Omit<R, ConflictingColumns<L, R, K>>
  // 3) right conflicting cols (renamed with right suffix)
  & ApplySuffix<Pick<R, ConflictingColumns<L, R, K>>, S["right"]>
  // 4) left non-conflicting cols (optional due to right join)
  & MakeUndefined<Omit<L, ConflictingColumns<L, R, K>>>
  // 5) left conflicting cols (renamed, optional)
  & MakeUndefined<ApplySuffix<Pick<L, ConflictingColumns<L, R, K>>, S["left"]>>;

// Fallback: R non-conflicting as-is, R conflicting get _y suffix,
// L non-conflicting with | undefined, L conflicting get _x suffix with | undefined.
type SimpleRightJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  // Join keys from R
  & Pick<R, K>
  // R non-conflicting non-key columns (as-is)
  & Omit<R, ConflictingColumns<L, R, Extract<K, StrKey>>>
  // R conflicting non-key columns get _y suffix
  & {
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? `${Extract<P, string>}_y`
        : never]: R[P];
  }
  // L non-conflicting non-key columns (optional)
  & MakeUndefined<{
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? never
        : P]: L[P];
  }>
  // L conflicting non-key columns get _x suffix (optional)
  & MakeUndefined<{
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? `${Extract<P, string>}_x`
        : never]: L[P];
  }>;

// Final dispatcher for right join
export type SuffixAwareRightJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = HasDefinedSuffixes<Options> extends true
  ? RightJoinWithSuffixes<
      L,
      R,
      ExtractJoinKeys<Options>,
      ExtractSuffixes<Options>
    >
  : SimpleRightJoinResult<
      L,
      R,
      Options extends { keys: infer _K } ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : K
    >;

// -----------------------------------------------------------------------------
// Outer Join Suffix Types
// -----------------------------------------------------------------------------

// Build the outer-join result that renames conflicts on both sides
type OuterJoinWithSuffixes<
  L extends object,
  R extends object,
  K extends StrKey,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
> =
  // For same-column-name joins: join keys are required (unified column exists in all rows)
  // For different-column-name joins: each join key column is optional
  & (
    Extract<keyof L, K> extends Extract<keyof R, K>
      ? Pick<L, Extract<keyof L, K>> // Same names: required join keys
      : MakeUndefined<Pick<L, Extract<keyof L, K>>> // Different names: optional left keys
  )
  // 1) left non-conflicting cols (optional due to outer join)
  & MakeUndefined<Omit<L, ConflictingColumns<L, R, K> | Extract<keyof L, K>>>
  // 2) left conflicting cols (renamed with left suffix, optional)
  & MakeUndefined<ApplySuffix<Pick<L, ConflictingColumns<L, R, K>>, S["left"]>>
  // 3) right non-conflicting cols (optional due to outer join)
  & MakeUndefined<Omit<R, ConflictingColumns<L, R, K>>>
  // 4) right conflicting cols (renamed, optional)
  & MakeUndefined<
    ApplySuffix<Pick<R, ConflictingColumns<L, R, K>>, S["right"]>
  >;

// Fallback: keys required, non-conflicting columns | undefined,
// L conflicting get _x suffix | undefined, R conflicting get _y suffix | undefined.
type SimpleOuterJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  // Keys are required (from L)
  & Pick<L, K>
  // L non-conflicting non-key columns (optional — outer join)
  & MakeUndefined<{
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? never
        : P]: L[P];
  }>
  // L conflicting non-key columns get _x suffix (optional)
  & MakeUndefined<{
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? `${Extract<P, string>}_x`
        : never]: L[P];
  }>
  // R non-conflicting non-key columns (optional — outer join)
  & MakeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? never
        : P]: R[P];
  }>
  // R conflicting non-key columns get _y suffix (optional)
  & MakeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? `${Extract<P, string>}_y`
        : never]: R[P];
  }>;

// Final dispatcher for outer join
export type SuffixAwareOuterJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = HasDefinedSuffixes<Options> extends true
  ? OuterJoinWithSuffixes<
      L,
      R,
      ExtractJoinKeys<Options>,
      ExtractSuffixes<Options>
    >
  : SimpleOuterJoinResult<
      L,
      R,
      Options extends { keys: infer _K } ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : K
    >;

// -----------------------------------------------------------------------------
// Inner Join Suffix Types
// -----------------------------------------------------------------------------

// Build the inner-join result that renames conflicts on both sides
type InnerJoinWithSuffixes<
  L extends object,
  R extends object,
  K extends StrKey,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
> =
  // 1) join keys (from left preferentially, required)
  & Pick<L, Extract<keyof L, K>>
  // 2) left non-conflicting cols (as-is, required)
  & Omit<L, ConflictingColumns<L, R, K>>
  // 3) left conflicting cols (renamed with left suffix, required)
  & ApplySuffix<Pick<L, ConflictingColumns<L, R, K>>, S["left"]>
  // 4) right non-conflicting cols (required - inner join guarantees match)
  & Omit<R, Extract<keyof L, StrKey> | K>
  // 5) right conflicting cols (renamed, required)
  & ApplySuffix<Pick<R, ConflictingColumns<L, R, K>>, S["right"]>;

// Fallback: L non-conflicting columns as-is, L conflicting columns get _x suffix,
// all non-key R columns (non-conflicting as-is), conflicting get _y suffix.
// Uses `P extends K ? never : P` (not `P extends keyof L ? never : P`) so that
// non-key R columns remain accessible even when L is generic.
type SimpleInnerJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  // Join keys from L
  & Pick<L, K>
  // L non-conflicting non-key columns (as-is)
  & Omit<L, ConflictingColumns<L, R, Extract<K, StrKey>>>
  // L conflicting non-key columns get _x suffix
  & {
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? `${Extract<P, string>}_x`
        : never]: L[P];
  }
  // R non-conflicting non-key columns
  & {
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? never
        : P]: R[P];
  }
  // R conflicting non-key columns get _y suffix
  & {
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? `${Extract<P, string>}_y`
        : never]: R[P];
  };

// Check whether Options has suffixes that are actually defined (not undefined)
type HasDefinedSuffixes<Options> = Options extends
  { suffixes: infer S }
  ? S extends { left: string } | { right: string } ? true : false
  : false;

// Final dispatcher for inner join
export type SuffixAwareInnerJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = HasDefinedSuffixes<Options> extends true
  ? InnerJoinWithSuffixes<
      L,
      R,
      ExtractJoinKeys<Options>,
      ExtractSuffixes<Options>
    >
  : SimpleInnerJoinResult<
      L,
      R,
      Options extends { keys: infer _K } ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : K
    >;
