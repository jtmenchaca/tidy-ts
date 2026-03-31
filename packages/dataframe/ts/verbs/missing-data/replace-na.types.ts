import type { DataFrame, Prettify } from "../../dataframe/index.ts";
/**
 * Helper type to replace null types with the replacement value type
 */
type ReplaceNullType<T, R> = T extends null | undefined ? R
  : T extends null | undefined | infer U ? R | U
  : T;

/**
 * Transform Row type after replaceNA operation (replaces both null and undefined).
 */
type ReplaceNaResult<
  Row extends object,
  Mapping extends Partial<{ [K in keyof Row]: unknown }>,
> = {
  [K in keyof Row]: K extends keyof Mapping
    ? ReplaceNullType<Row[K], NonNullable<Mapping[K]>>
    : Row[K];
};

/**
 * Transform Row type after replaceNull: only null is replaced; undefined remains.
 */
type ReplaceNullResult<
  Row extends object,
  Mapping extends Partial<{ [K in keyof Row]: unknown }>,
> = {
  [K in keyof Row]: K extends keyof Mapping
    ? Exclude<Row[K], null> | NonNullable<Mapping[K]>
    : Row[K];
};

/**
 * Transform Row type after replaceUndefined: only undefined is replaced; null remains.
 */
type ReplaceUndefinedResult<
  Row extends object,
  Mapping extends Partial<{ [K in keyof Row]: unknown }>,
> = {
  [K in keyof Row]: K extends keyof Mapping
    ? Exclude<Row[K], undefined> | NonNullable<Mapping[K]>
    : Row[K];
};

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
) => DataFrame<Prettify<ReplaceNaResult<R, M>>>;

/** replaceNull method type for DataFrames */
export type ReplaceNullMethod<Row extends object> = <
  R extends object,
  M extends Partial<{ [K in keyof R]: unknown }>,
>(
  this: DataFrame<R>,
  mapping: M,
) => DataFrame<Prettify<ReplaceNullResult<R, M>>>;

/** replaceUndefined method type for DataFrames */
export type ReplaceUndefinedMethod<Row extends object> = <
  R extends object,
  M extends Partial<{ [K in keyof R]: unknown }>,
>(
  this: DataFrame<R>,
  mapping: M,
) => DataFrame<Prettify<ReplaceUndefinedResult<R, M>>>;
