// Join result types
import type { ExcludeKeysAndMakeUndefined } from "../../../dataframe/index.ts";

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
> = L & ExcludeKeysAndMakeUndefined<R, K>;

/**
 * Right join result type: (L\K)? ∪ R
 * All fields from R are required, non-key fields from L become T | undefined
 */
export type RightJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = ExcludeKeysAndMakeUndefined<L, K> & R;

/**
 * Full outer join result type: (L\K)? ∪ (R\K)?
 * Key fields are required, all non-key fields become T | undefined
 */
export type FullJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> =
  & Pick<L, K>
  & ExcludeKeysAndMakeUndefined<L, K>
  & ExcludeKeysAndMakeUndefined<R, K>;
