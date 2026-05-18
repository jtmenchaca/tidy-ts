import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
/**
 * Remove rows where field(s) are null.
 * Automatically narrows the type to exclude null.
 *
 * Supports nested fields via tuple path: `removeNull(["parent", "child"])`
 */
export declare function removeNull<Row extends object, K1 extends keyof Row, K2 extends keyof Row[K1]>(df: DataFrame<Row> | GroupedDataFrame<Row>, path: readonly [K1, K2]): any;
export declare function removeNull<Row extends object, Field extends keyof Row>(df: DataFrame<Row> | GroupedDataFrame<Row>, field: Field): any;
export declare function removeNull<Row extends object, Field extends keyof Row>(df: DataFrame<Row> | GroupedDataFrame<Row>, field: Field, ...fields: Field[]): any;
/**
 * Remove rows where field(s) are undefined.
 * Automatically narrows the type to exclude undefined.
 *
 * Supports nested fields via tuple path: `removeUndefined(["parent", "child"])`
 */
export declare function removeUndefined<Row extends object, K1 extends keyof Row, K2 extends keyof Row[K1]>(df: DataFrame<Row> | GroupedDataFrame<Row>, path: readonly [K1, K2]): any;
export declare function removeUndefined<Row extends object, Field extends keyof Row>(df: DataFrame<Row> | GroupedDataFrame<Row>, field: Field): any;
export declare function removeUndefined<Row extends object, Field extends keyof Row>(df: DataFrame<Row> | GroupedDataFrame<Row>, field: Field, ...fields: Field[]): any;
/**
 * Remove rows where field(s) are null or undefined.
 * Automatically narrows the type to exclude both null and undefined.
 *
 * @deprecated Use {@link removeNull} and {@link removeUndefined}, or {@link filter}, instead.
 */
export declare function removeNA<Row extends object, Field extends keyof Row>(df: DataFrame<Row> | GroupedDataFrame<Row>, field: Field): any;
export declare function removeNA<Row extends object, Field extends keyof Row>(df: DataFrame<Row> | GroupedDataFrame<Row>, field: Field, ...fields: Field[]): any;
