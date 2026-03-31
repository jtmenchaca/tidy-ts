// Join result types
//
// These use Partial<T> + RequiredUndefined instead of Omit-based
// ExcludeKeysAndMakeUndefined<T, K> to preserve generic indexability.
// When L or R is a generic type parameter, Omit<T, K> defers and creates
// mapped types that can't be indexed with generic keys like K & keyof T.
// Partial<T> preserves T's indexability because TS knows keyof Partial<T> = keyof T.
//
// RequiredUndefined strips the `?` optionality from Partial while keeping
// `| undefined` in value types, so the result has `field: T | undefined`
// (not `field?: T | undefined`). This preserves assignability to concrete
// type annotations in test code.

/**
 * Maps optional properties to required-but-undefined.
 * Converts `{ a?: string | undefined }` to `{ a: string | undefined }`.
 */
type RequiredUndefined<T> = { [K in keyof T]-?: T[K] };

// -----------------------------------------------------------------------------
// Join Result Types
// -----------------------------------------------------------------------------

/**
 * Inner join result type: L ∪ R\K
 * All fields are required (no undefined values)
 */
export type InnerJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = L & Omit<R, K>;

/**
 * Left join result type: L ∪ (R\K)?
 * All fields from L are required, non-key fields from R become T | undefined
 */
export type LeftJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = RequiredUndefined<L & Partial<R>>;

/**
 * Right join result type: (L\K)? ∪ R
 * All fields from R are required, non-key fields from L become T | undefined
 */
export type RightJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = RequiredUndefined<Partial<L> & R>;

/**
 * Full outer join result type: (L\K)? ∪ (R\K)?
 * Key fields are required, all non-key fields become T | undefined
 */
export type FullJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = RequiredUndefined<Pick<L, K> & Partial<L> & Partial<R>>;
