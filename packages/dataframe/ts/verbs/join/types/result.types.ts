// Join result types
//
// Uses conditional mapped types to add `| undefined` to non-key fields
// without Omit (which defers on generics) or Partial + -? (which strips
// the implicit | undefined that Partial adds).
//
// Pattern: `L & { [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined }`
// - Preserves generic indexability (no Omit deferral)
// - Correctly produces `T | undefined` for non-key fields
// - Shared keys come from L via intersection priority

// -----------------------------------------------------------------------------
// Join Result Types
// -----------------------------------------------------------------------------

/**
 * Inner join result type: L ∪ R\K
 * All fields are required (no undefined values).
 * Avoids Omit (which defers on generics) — uses key remapping instead.
 */
export type InnerJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = L & {
  [P in keyof R as P extends K ? never : P]: R[P];
};

/**
 * Left join result type: L ∪ (R\K)?
 * All fields from L are required, non-key fields from R become T | undefined
 */
export type LeftJoinResult<
  L extends object,
  R extends object,
  _K extends keyof L & keyof R,
> = L & {
  [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined;
};

/**
 * Right join result type: (L\K)? ∪ R
 * All fields from R are required, non-key fields from L become T | undefined
 */
export type RightJoinResult<
  L extends object,
  R extends object,
  _K extends keyof L & keyof R,
> = {
  [P in keyof L]: P extends keyof R ? L[P] : L[P] | undefined;
} & R;

/**
 * Asof join result type: L ∪ (R\L)?
 * All fields from L are required, non-key R fields become T | undefined.
 * Matches LeftJoinResult pattern — conflicting non-key columns get `_y` suffix
 * at runtime, but modeling that in the base type breaks generic structural checks.
 * Use SuffixAwareAsofJoinResult (in suffix.types.ts) for concrete `_y` tracking.
 */
export type AsofJoinResult<
  L extends object,
  R extends object,
  _K extends keyof L & keyof R,
> = L & {
  [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined;
};

/**
 * Full outer join result type: (L\K)? ∪ (R\K)?
 * Key fields are required, all non-key fields become T | undefined
 */
export type FullJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = Pick<L, K> & {
  [P in keyof L]: P extends K ? L[P] : L[P] | undefined;
} & {
  [P in keyof R]: P extends K ? R[P] : R[P] | undefined;
};
