// Unified suffix-aware join types
// Consolidates inner/left/right/outer/asof into a single generic JoinResult.
import type { MakeUndefined } from "../../../dataframe/index.ts";

// -----------------------------------------------------------------------------
// Helpers (unchanged)
// -----------------------------------------------------------------------------

type StrKey = string;

type ConflictingColumns<
  L extends object,
  R extends object,
  K extends StrKey,
> = Exclude<Extract<keyof L, StrKey> & Extract<keyof R, StrKey>, K>;

type ApplySuffix<T extends object, S> = [S] extends [string]
  ? { [K in Extract<keyof T, StrKey> as `${K}${S}`]: T[K] }
  : T;

type ExtractJoinKeys<Options> = Options extends { keys: infer Keys }
  ? Keys extends readonly (infer K)[] ? Extract<K, StrKey>
  : Keys extends { left: infer L; right: infer _R }
    ? L extends readonly (infer LK)[] ? Extract<LK, StrKey>
    : Extract<L, StrKey>
  : never
  : never;

type ExtractSuffixes<Options> = Options extends { suffixes: infer S } ? (
    S extends { left: infer SL; right: infer SR }
      ? { left: Extract<SL, string>; right: Extract<SR, string> }
      : S extends { left: infer SL }
        ? { left: Extract<SL, string>; right: undefined }
      : S extends { right: infer SR }
        ? { left: undefined; right: Extract<SR, string> }
      : { left: undefined; right: undefined }
  )
  : { left: undefined; right: undefined };

type HasDefinedSuffixes<Options> = Options extends
  { suffixes: infer S }
  ? S extends { left: string } | { right: string } ? true : false
  : false;

// -----------------------------------------------------------------------------
// Optionality helper: wrap T in MakeUndefined when Required is false
// -----------------------------------------------------------------------------

type MaybeUndefined<T, Required extends boolean> =
  Required extends true ? T : MakeUndefined<T>;

// -----------------------------------------------------------------------------
// Unified: custom suffixes path
// -----------------------------------------------------------------------------

/**
 * Generic join result with custom suffixes — written as a single mapped type
 * so the result displays flat in hover without needing `Prettify<...>`.
 *
 * Output keys = (join keys) ∪ (L non-conflicting) ∪ (`${conflict}${S.left}`)
 *             ∪ (R non-conflicting, not in L) ∪ (`${conflict}${S.right}`).
 *
 * @param L - Left row type
 * @param R - Right row type
 * @param K - Join key names (subset of keyof L & keyof R)
 * @param S - Suffix config { left?: string; right?: string }
 * @param LReq - Are left non-key columns required?
 * @param RReq - Are right non-key columns required?
 */
type JoinWithSuffixes<
  L extends object,
  R extends object,
  K extends StrKey,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
  LReq extends boolean = true,
  RReq extends boolean = true,
> = {
  [
    Out in
      | Extract<keyof L, K>
      | Exclude<keyof L, ConflictingColumns<L, R, K>>
      | `${Extract<ConflictingColumns<L, R, K>, StrKey>}${S["left"] extends string ? S["left"] : ""}`
      | Exclude<keyof R, Extract<keyof L, StrKey> | K>
      | `${Extract<ConflictingColumns<L, R, K>, StrKey>}${S["right"] extends string ? S["right"] : ""}`
  ]: Out extends K ? L[Extract<Out, keyof L>]
    // Check for L-suffixed conflicting columns first
    : S["left"] extends string
      ? Out extends `${infer Base}${S["left"]}`
        ? Base extends ConflictingColumns<L, R, K>
          ? Base extends keyof L
            ? LReq extends true ? L[Base] : L[Base] | undefined
          : never
        : SecondaryLookup<L, R, K, S, LReq, RReq, Out>
      : SecondaryLookup<L, R, K, S, LReq, RReq, Out>
    : SecondaryLookup<L, R, K, S, LReq, RReq, Out>;
};

/**
 * Second-stage lookup used by JoinWithSuffixes after the L-suffix check fails.
 * Tries R-suffix match, then plain L/R non-conflicting columns.
 */
type SecondaryLookup<
  L extends object,
  R extends object,
  K extends StrKey,
  S extends { left?: string; right?: string },
  LReq extends boolean,
  RReq extends boolean,
  Out,
> = S["right"] extends string
  ? Out extends `${infer Base}${S["right"]}`
    ? Base extends ConflictingColumns<L, R, K>
      ? Base extends keyof R
        ? RReq extends true ? R[Base] : R[Base] | undefined
      : never
    : PlainLookup<L, R, LReq, RReq, Out>
  : PlainLookup<L, R, LReq, RReq, Out>
  : PlainLookup<L, R, LReq, RReq, Out>;

/** Plain L or R non-conflicting column lookup. */
type PlainLookup<
  L extends object,
  R extends object,
  LReq extends boolean,
  RReq extends boolean,
  Out,
> = Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
  : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
  : never;

// -----------------------------------------------------------------------------
// Unified: default _x/_y suffixes path
// -----------------------------------------------------------------------------

/**
 * Generic join result with default _x/_y suffixes.
 *
 * Written as a single mapped type so the result displays flat in hover
 * without needing an outer `Prettify<...>` wrap.
 *
 * Output keys = (join keys) ∪ (L non-conflicting non-key) ∪ (`${conflict}_x`)
 *             ∪ (R non-conflicting non-key) ∪ (`${conflict}_y`).
 *
 * Dispatch rule:
 *   - join key K           → L[K]  (always required)
 *   - L non-conflicting    → L[P], +undefined if !LReq
 *   - `${conflict}_x`      → L[conflict], +undefined if !LReq
 *   - R non-conflicting    → R[P], +undefined if !RReq
 *   - `${conflict}_y`      → R[conflict], +undefined if !RReq
 */
type SimpleJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
  LReq extends boolean = true,
  RReq extends boolean = true,
> = {
  [
    Out in
      | K
      | Exclude<
        keyof L,
        K | ConflictingColumns<L, R, Extract<K, StrKey>>
      >
      | `${Extract<ConflictingColumns<L, R, Extract<K, StrKey>>, string>}_x`
      | Exclude<
        keyof R,
        K | Extract<keyof L, StrKey>
      >
      | `${Extract<ConflictingColumns<L, R, Extract<K, StrKey>>, string>}_y`
  ]: Out extends K ? L[Extract<Out, keyof L>]
    : Out extends
      `${infer Base}_x` // L conflicting renamed
      ? Base extends keyof L
        ? LReq extends true ? L[Base] : L[Base] | undefined
      : never
    : Out extends
      `${infer Base}_y` // R conflicting renamed
      ? Base extends keyof R
        ? RReq extends true ? R[Base] : R[Base] | undefined
      : never
    : Out extends keyof L
      ? LReq extends true ? L[Out] : L[Out] | undefined
    : Out extends keyof R
      ? RReq extends true ? R[Out] : R[Out] | undefined
    : never;
};

// -----------------------------------------------------------------------------
// Unified dispatcher
// -----------------------------------------------------------------------------

// Resolve join keys: prefer Options.keys if present, fall back to K
type ResolveJoinKeys<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
  Options,
> = Options extends { keys: infer _K }
  ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R>
  : Extract<K, StrKey>;

type SuffixAwareJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
  LReq extends boolean = true,
  RReq extends boolean = true,
> = HasDefinedSuffixes<Options> extends true
  ? JoinWithSuffixes<
      L, R,
      ResolveJoinKeys<L, R, K, Options>,
      ExtractSuffixes<Options>,
      LReq, RReq
    >
  : SimpleJoinResult<
      L, R,
      Options extends { keys: infer _K } ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : K,
      LReq, RReq
    >;

// -----------------------------------------------------------------------------
// Per-join-type exports (thin wrappers)
// -----------------------------------------------------------------------------

/** Inner: both sides required */
export type SuffixAwareInnerJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = SuffixAwareJoinResult<L, R, K, Options, true, true>;

/** Left: left required, right optional */
export type SuffixAwareLeftJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = SuffixAwareJoinResult<L, R, K, Options, true, false>;

/** Right: left optional, right required */
export type SuffixAwareRightJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = SuffixAwareJoinResult<L, R, K, Options, false, true>;

/** Outer: both sides optional (keys still required) */
export type SuffixAwareOuterJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = SuffixAwareJoinResult<L, R, K, Options, false, false>;

/** Asof: same semantics as left join */
export type SuffixAwareAsofJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
> = SuffixAwareJoinResult<L, R, K, Options, true, false>;
