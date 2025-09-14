import type { DataFrame, Prettify } from "../../dataframe/index.ts";
/**
 * Helper type to replace null types with the replacement value type
 */
type ReplaceNullType<T, R> = T extends null | undefined ? R
  : T extends null | undefined | infer U ? R | U
  : T;

/**
 * Transform Row type after replace_na operation
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
 * replace_na method type for DataFrames
 */
export type ReplaceNaMethod<Row extends object> = <
  M extends Partial<{ [K in keyof Row]: unknown }>,
>(
  mapping: M,
) => DataFrame<Prettify<ReplaceNaResult<Row, M>>>;
