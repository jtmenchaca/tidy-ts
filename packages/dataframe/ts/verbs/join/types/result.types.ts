// Join result types
//
// Single mapped types over `keyof L | Exclude<keyof R, K>` (or equivalent),
// with `& {}` appended so TS drops the alias name in hover and displays the
// expanded shape. Avoids `Omit` (which defers on generic type params) and
// avoids the `Prettify<intersection>` pattern entirely.

// -----------------------------------------------------------------------------
// Join Result Types
// -----------------------------------------------------------------------------

/**
 * Inner join result type: L ∪ R\K
 * All fields are required (no undefined values).
 */
// deno-lint-ignore ban-types
export type InnerJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  & {
    [P in keyof L | Exclude<keyof R, K>]: P extends keyof L ? L[P]
      : P extends keyof R ? R[P]
      : never;
  }
  & {};

/**
 * Left join result type: L ∪ (R\K)?
 * All fields from L are required, non-key fields from R become T | undefined
 */
// deno-lint-ignore ban-types
export type LeftJoinResult<
  L extends object,
  R extends object,
  _K extends keyof L & keyof R,
> =
  & {
    [P in keyof L | keyof R]: P extends keyof L ? L[P]
      : P extends keyof R ? R[P] | undefined
      : never;
  }
  & {};

/**
 * Right join result type: (L\K)? ∪ R
 * All fields from R are required, non-key fields from L become T | undefined
 */
// deno-lint-ignore ban-types
export type RightJoinResult<
  L extends object,
  R extends object,
  _K extends keyof L & keyof R,
> =
  & {
    [P in keyof L | keyof R]: P extends keyof R ? R[P]
      : P extends keyof L ? L[P] | undefined
      : never;
  }
  & {};

/**
 * Asof join result type: L ∪ (R\L)?
 * All fields from L are required, non-key R fields become T | undefined.
 * Matches LeftJoinResult pattern — conflicting non-key columns get `_y` suffix
 * at runtime, but modeling that in the base type breaks generic structural checks.
 * Use SuffixAwareAsofJoinResult (in suffix.types.ts) for concrete `_y` tracking.
 */
// deno-lint-ignore ban-types
export type AsofJoinResult<
  L extends object,
  R extends object,
  _K extends keyof L & keyof R,
> =
  & {
    [P in keyof L | keyof R]: P extends keyof L ? L[P]
      : P extends keyof R ? R[P] | undefined
      : never;
  }
  & {};

/**
 * Full outer join result type: K ∪ (L\K)? ∪ (R\K)?
 * Key fields are required, all non-key fields become T | undefined
 */
// deno-lint-ignore ban-types
export type FullJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  & {
    [P in keyof L | keyof R]: P extends K ? L[Extract<P, keyof L>]
      : P extends keyof L ? L[P] | undefined
      : P extends keyof R ? R[P] | undefined
      : never;
  }
  & {};
