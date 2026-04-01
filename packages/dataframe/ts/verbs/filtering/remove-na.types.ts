import type { DataFrame, Prettify } from "../../dataframe/index.ts";

/** @deprecated Use RemoveNullMethod and RemoveUndefinedMethod instead. */
export type RemoveNAMethod<Row extends object> = {
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], null | undefined> }>
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], null | undefined> }>
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    fields: Field[],
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], null | undefined> }>
  >;
};

export type RemoveNullMethod<Row extends object> = {
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], null> }>
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], null> }>
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    fields: Field[],
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], null> }>
  >;
};

export type RemoveUndefinedMethod<Row extends object> = {
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], undefined> }>
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], undefined> }>
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    fields: Field[],
  ): DataFrame<
    Prettify<R & { [K in Field]: Exclude<R[K], undefined> }>
  >;
};
