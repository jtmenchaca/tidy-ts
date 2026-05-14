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
 * Generic join result with custom suffixes.
 *
 * @param L - Left row type
 * @param R - Right row type
 * @param K - Join key names (subset of keyof L & keyof R)
 * @param S - Suffix config { left?: string; right?: string }
 * @param LReq - Are left non-key columns required? (true for inner/left, false for right/outer)
 * @param RReq - Are right non-key columns required? (true for inner/right, false for left/outer)
 */
type JoinWithSuffixes<
  L extends object,
  R extends object,
  K extends StrKey,
  // deno-lint-ignore ban-types
  S extends { left?: string; right?: string } = {},
  LReq extends boolean = true,
  RReq extends boolean = true,
> =
  // 1) join keys (from left)
  & Pick<L, Extract<keyof L, K>>
  // 2) left non-conflicting cols
  & MaybeUndefined<Omit<L, ConflictingColumns<L, R, K>>, LReq>
  // 3) left conflicting cols (renamed)
  & MaybeUndefined<ApplySuffix<Pick<L, ConflictingColumns<L, R, K>>, S["left"]>, LReq>
  // 4) right non-conflicting cols
  & MaybeUndefined<Omit<R, Extract<keyof L, StrKey> | K>, RReq>
  // 5) right conflicting cols (renamed)
  & MaybeUndefined<ApplySuffix<Pick<R, ConflictingColumns<L, R, K>>, S["right"]>, RReq>;

// -----------------------------------------------------------------------------
// Unified: default _x/_y suffixes path
// -----------------------------------------------------------------------------

/**
 * Generic join result with default _x/_y suffixes.
 *
 * Same params as above, minus S (always _x/_y).
 */
type SimpleJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
  LReq extends boolean = true,
  RReq extends boolean = true,
> =
  // Join keys from L
  & Pick<L, K>
  // L non-conflicting non-key columns
  & MaybeUndefined<Omit<L, ConflictingColumns<L, R, Extract<K, StrKey>>>, LReq>
  // L conflicting non-key columns get _x suffix
  & MaybeUndefined<{
    [P in keyof L as P extends K
      ? never
      : P extends keyof R
        ? `${Extract<P, string>}_x`
        : never]: L[P];
  }, LReq>
  // R non-conflicting non-key columns
  & MaybeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? never
        : P]: R[P];
  }, RReq>
  // R conflicting non-key columns get _y suffix
  & MaybeUndefined<{
    [P in keyof R as P extends K
      ? never
      : P extends keyof L
        ? `${Extract<P, string>}_y`
        : never]: R[P];
  }, RReq>;

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
