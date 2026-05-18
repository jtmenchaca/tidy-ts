import type { DataFrame } from "../../dataframe/index.ts";

/** @deprecated Use RemoveNullMethod and RemoveUndefinedMethod instead. */
export type RemoveNAMethod<Row extends object> = {
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    & Omit<R, Field>
    & { [K in Field]-?: Exclude<R[K], null | undefined> }
  >;
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    & Omit<R, Field>
    & { [K in Field]-?: Exclude<R[K], null | undefined> }
  >;
};

export type RemoveNullMethod<Row extends object> = {
  // Nested field: removeNull(["parent", "child"])
  <R extends object, K1 extends keyof R, K2 extends keyof R[K1]>(
    this: DataFrame<R>,
    path: readonly [K1, K2],
  ): DataFrame<
    & Omit<R, K1>
    & {
      [K in K1]-?: & Omit<R[K1], K2> & {
        [N in K2]-?: Exclude<R[K1][N & keyof R[K1]], null>;
      };
    }
  >;

  // Top-level single field
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    & Omit<R, Field>
    & { [K in Field]-?: Exclude<R[K], null> }
  >;
  // Top-level multiple fields (rest parameters)
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    & Omit<R, Field>
    & { [K in Field]-?: Exclude<R[K], null> }
  >;
};

export type RemoveUndefinedMethod<Row extends object> = {
  // Nested field: removeUndefined(["parent", "child"])
  <R extends object, K1 extends keyof R, K2 extends keyof R[K1]>(
    this: DataFrame<R>,
    path: readonly [K1, K2],
  ): DataFrame<
    & Omit<R, K1>
    & {
      [K in K1]-?: & Omit<R[K1], K2> & {
        [N in K2]-?: Exclude<R[K1][N & keyof R[K1]], undefined>;
      };
    }
  >;

  // Top-level single field
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
  ): DataFrame<
    & Omit<R, Field>
    & { [K in Field]-?: Exclude<R[K], undefined> }
  >;
  // Top-level multiple fields (rest parameters)
  <R extends object, Field extends keyof R>(
    this: DataFrame<R>,
    field: Field,
    ...fields: Field[]
  ): DataFrame<
    & Omit<R, Field>
    & { [K in Field]-?: Exclude<R[K], undefined> }
  >;
};
