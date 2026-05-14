import type { DataFrame } from "../../dataframe/index.ts";

/** @deprecated Use RemoveNullMethod and RemoveUndefinedMethod instead. */
export type RemoveNAMethod<Row extends object> = {
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    {
      [K in keyof R]: K extends Field ? Exclude<R[K], null | undefined>
        : R[K];
    }
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    {
      [K in keyof R]: K extends Field ? Exclude<R[K], null | undefined>
        : R[K];
    }
  >;
};

export type RemoveNullMethod<Row extends object> = {
  // Nested field: removeNull(["parent", "child"])
  <R extends object, K1 extends keyof R, K2 extends keyof R[K1]>(
    this: DataFrame<R>,
    path: readonly [K1, K2],
  ): DataFrame<
    {
      [K in keyof R]: K extends K1
        ? {
          [N in keyof R[K1]]: N extends K2 ? Exclude<R[K1][N], null>
            : R[K1][N];
        }
        : R[K];
    }
  >;

  // Top-level single field
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    { [K in keyof R]: K extends Field ? Exclude<R[K], null> : R[K] }
  >;
  // Top-level multiple fields (rest parameters)
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    { [K in keyof R]: K extends Field ? Exclude<R[K], null> : R[K] }
  >;
};

export type RemoveUndefinedMethod<Row extends object> = {
  // Nested field: removeUndefined(["parent", "child"])
  <R extends object, K1 extends keyof R, K2 extends keyof R[K1]>(
    this: DataFrame<R>,
    path: readonly [K1, K2],
  ): DataFrame<
    {
      [K in keyof R]: K extends K1
        ? {
          [N in keyof R[K1]]: N extends K2 ? Exclude<R[K1][N], undefined>
            : R[K1][N];
        }
        : R[K];
    }
  >;

  // Top-level single field
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    { [K in keyof R]: K extends Field ? Exclude<R[K], undefined> : R[K] }
  >;
  // Top-level multiple fields (rest parameters)
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    { [K in keyof R]: K extends Field ? Exclude<R[K], undefined> : R[K] }
  >;
};
