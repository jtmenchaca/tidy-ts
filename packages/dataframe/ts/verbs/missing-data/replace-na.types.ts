import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Helper type to replace null/undefined types with the replacement value type.
 * Used by `replaceNA` to widen the replaced field's type after substitution.
 */
type ReplaceNullType<T, R> = T extends null | undefined ? R
  : T extends null | undefined | infer U ? R | U
  : T;

/**
 * replaceNA method type for DataFrames
 * @deprecated Use replaceNull and replaceUndefined instead.
 */
export type ReplaceNaMethod<Row extends object> = <
  R extends object,
  M extends Partial<{ [K in keyof R]: unknown }>,
>(
  this: DataFrame<R>,
  mapping: M,
) => DataFrame<
  {
    [K in keyof R]: K extends keyof M
      ? ReplaceNullType<R[K], NonNullable<M[K]>>
      : R[K];
  }
>;

/** replaceNull method type for DataFrames */
export type ReplaceNullMethod<Row extends object> = <
  R extends object,
  M extends Partial<{ [K in keyof R]: unknown }>,
>(
  this: DataFrame<R>,
  mapping: M,
) => DataFrame<
  {
    [K in keyof R]: K extends keyof M
      ? Exclude<R[K], null> | NonNullable<M[K]>
      : R[K];
  }
>;

/** replaceUndefined method type for DataFrames */
export type ReplaceUndefinedMethod<Row extends object> = <
  R extends object,
  M extends Partial<{ [K in keyof R]: unknown }>,
>(
  this: DataFrame<R>,
  mapping: M,
) => DataFrame<
  {
    [K in keyof R]: K extends keyof M
      ? Exclude<R[K], undefined> | NonNullable<M[K]>
      : R[K];
  }
>;

