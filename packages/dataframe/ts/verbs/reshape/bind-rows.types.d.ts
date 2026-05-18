import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Merge two row types for bindRows as a single mapped type.
 *
 * Rule:
 *   - Key in both: value is `Row1[K] | Row2[K]`
 *   - Key only in Row1: `Row1[K] | undefined`
 *   - Key only in Row2: `Row2[K] | undefined`
 *
 * Used only as a building block for MergeRows3/MergeRows4. The 2-arg
 * overloads inline the mapped type directly at the call site so TS
 * displays the expanded shape on hover without needing `& {}`.
 */
type MergeRows<Row1, Row2> = {
    [K in keyof Row1 | keyof Row2]: K extends keyof Row1 ? K extends keyof Row2 ? Row1[K] | Row2[K] : Row1[K] | undefined : K extends keyof Row2 ? Row2[K] | undefined : never;
};
/**
 * 3-way merge: inline single mapped type, no recursion needed.
 * Each key is present in some subset of {R1, R2, R3}; missing sides
 * contribute `undefined`.
 */
type MergeRows3<R1, R2, R3> = {
    [K in keyof R1 | keyof R2 | keyof R3]: K extends keyof R1 ? K extends keyof R2 ? K extends keyof R3 ? R1[K] | R2[K] | R3[K] : R1[K] | R2[K] | undefined : K extends keyof R3 ? R1[K] | undefined | R3[K] : R1[K] | undefined : K extends keyof R2 ? K extends keyof R3 ? R2[K] | R3[K] | undefined : R2[K] | undefined : K extends keyof R3 ? R3[K] | undefined : never;
};
/**
 * 4-way merge: inline single mapped type.
 * Uses MergeRows internally for the first pair, then expands the
 * remaining two rows in a single mapped type — keeps hover flat.
 */
type MergeRows4<R1, R2, R3, R4> = {
    [K in keyof R1 | keyof R2 | keyof R3 | keyof R4]: K extends keyof R1 ? K extends keyof R2 ? K extends keyof R3 ? K extends keyof R4 ? R1[K] | R2[K] | R3[K] | R4[K] : R1[K] | R2[K] | R3[K] | undefined : K extends keyof R4 ? R1[K] | R2[K] | undefined | R4[K] : R1[K] | R2[K] | undefined : K extends keyof R3 ? K extends keyof R4 ? R1[K] | undefined | R3[K] | R4[K] : R1[K] | undefined | R3[K] | undefined : K extends keyof R4 ? R1[K] | undefined | undefined | R4[K] : R1[K] | undefined : K extends keyof R2 ? K extends keyof R3 ? K extends keyof R4 ? R2[K] | R3[K] | R4[K] | undefined : R2[K] | R3[K] | undefined : K extends keyof R4 ? R2[K] | undefined | R4[K] | undefined : R2[K] | undefined : K extends keyof R3 ? K extends keyof R4 ? R3[K] | R4[K] | undefined : R3[K] | undefined : K extends keyof R4 ? R4[K] | undefined : never;
};
/**
 * Type for the bind_rows method that combines DataFrames vertically.
 *
 * @template Row - The row type of the DataFrame
 */
export type BindRowsMethod<Row extends object> = {
    /**
     * Combine DataFrames vertically (stack rows).
     *
     * Stacks rows from multiple DataFrames, creating a union of columns. Missing columns
     * in any DataFrame become optional and filled with undefined. Columns present in multiple
     * DataFrames have their types unioned.
     *
     * @example
     * // Combine two DataFrames with same columns
     * df1.bindRows(df2)
     *
     * @example
     * // Combine DataFrames with different columns
     * users.bindRows(admins)
     * // Result has all columns from both, missing values are undefined
     *
     * @example
     * // Combine multiple DataFrames
     * df1.bindRows(df2, df3, df4)
     */
    <R extends object, OtherRow extends object>(this: DataFrame<R>, other: DataFrame<OtherRow>): DataFrame<{
        [K in keyof R | keyof OtherRow]: K extends keyof R ? K extends keyof OtherRow ? R[K] | OtherRow[K] : R[K] | undefined : K extends keyof OtherRow ? OtherRow[K] | undefined : never;
    }>;
    /**
     * Combine DataFrames vertically (stack rows).
     *
     * @example
     * df1.bindRows(df2, df3)
     */
    <R extends object, OtherRow1 extends object, OtherRow2 extends object>(this: DataFrame<R>, other1: DataFrame<OtherRow1>, other2: DataFrame<OtherRow2>): DataFrame<MergeRows3<R, OtherRow1, OtherRow2>>;
    /**
     * Combine DataFrames vertically (stack rows).
     *
     * @example
     * df1.bindRows(df2, df3, df4)
     */
    <R extends object, OtherRow1 extends object, OtherRow2 extends object, OtherRow3 extends object>(this: DataFrame<R>, other1: DataFrame<OtherRow1>, other2: DataFrame<OtherRow2>, other3: DataFrame<OtherRow3>): DataFrame<MergeRows4<R, OtherRow1, OtherRow2, OtherRow3>>;
    /**
     * Combine DataFrames vertically (stack rows) — variadic fallback.
     *
     * @example
     * df1.bindRows(...others)
     */
    <R extends object, OtherRow extends object>(this: DataFrame<R>, ...others: DataFrame<OtherRow>[]): DataFrame<MergeRows<R, OtherRow>>;
};
/**
 * Type for the standalone concatDataFrames function.
 * Mirrors BindRowsMethod overloads but takes an array/tuple instead of variadic args.
 */
export type ConcatDataFramesFunction = {
    <R1 extends object, R2 extends object>(dataFrames: [DataFrame<R1>, DataFrame<R2>]): DataFrame<{
        [K in keyof R1 | keyof R2]: K extends keyof R1 ? K extends keyof R2 ? R1[K] | R2[K] : R1[K] | undefined : K extends keyof R2 ? R2[K] | undefined : never;
    }>;
    <R1 extends object, R2 extends object, R3 extends object>(dataFrames: [DataFrame<R1>, DataFrame<R2>, DataFrame<R3>]): DataFrame<MergeRows3<R1, R2, R3>>;
    <R1 extends object, R2 extends object, R3 extends object, R4 extends object>(dataFrames: [DataFrame<R1>, DataFrame<R2>, DataFrame<R3>, DataFrame<R4>]): DataFrame<MergeRows4<R1, R2, R3, R4>>;
    <R extends object>(dataFrames: DataFrame<R>[]): DataFrame<R>;
};
export {};
