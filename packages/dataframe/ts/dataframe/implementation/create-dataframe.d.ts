import type { DataFrame } from "../types/dataframe.type.ts";
import { type ColumnarStore } from "./columnar-store.ts";
export type PrintOptions = {
    maxRows?: number;
    maxColWidth?: number;
    includeRowIndex?: boolean;
};
/**
 * Create a new DataFrame with columnar storage for high performance.
 * Same API as createDataFrame but with internal columnar optimization.
 */
export declare function createColumnarDataFrame<R extends readonly object[]>(rows: R, options?: DataFrameOptions): DataFrame<R[number]>;
/**
 * Create a DataFrame directly from a ColumnarStore (optimized path)
 */
export declare function createColumnarDataFrameFromStore<Row extends object>(store: ColumnarStore, options?: DataFrameOptions): DataFrame<Row>;
import { z } from "zod";
import type { ConcurrencyOptions } from "../../promised-dataframe/concurrency-utils.ts";
/**
 * Options for DataFrame creation, including concurrency settings and schema validation.
 *
 * @example
 * ```typescript
 * import { createDataFrame } from "@tidy-ts/dataframe";
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string()
 * });
 *
 * const df = createDataFrame(data, {
 *   schema,
 *   concurrency: 4,
 *   retry: { maxRetries: 3 }
 * });
 * ```
 */
export interface DataFrameOptions extends ConcurrencyOptions {
    /** Schema for row validation */
    schema?: z.ZodObject<any> | null;
    /** Enable operation tracing for performance profiling */
    trace?: boolean;
    /** When true, returns DataFrame<any> instead of typed DataFrame */
    no_types?: boolean;
}
/**
 * Options for creating a DataFrame from columns.
 */
export interface ColumnBasedDataFrameOptions {
    /** Column data as record of column names to arrays */
    columns: Record<string, readonly unknown[]>;
}
/**
 * Create a new DataFrame from an array of objects or columnar data.
 *
 * DataFrames provide a fluent, type-safe API for data manipulation including filtering,
 * grouping, aggregation, joins, pivoting, and statistical operations. Supports schema
 * validation with Zod and flexible configuration options.
 *
 * @param rows - Array of objects (row-based) or `{ columns: {...} }` (column-based)
 * @param schemaOrOptions - Optional Zod schema for validation or DataFrame options
 *   - Zod schema: Validates and types each row
 *   - DataFrameOptions: Configure concurrency, retry behavior, and validation
 *
 * @returns A type-safe DataFrame with chainable operations
 *
 * @example
 * // Basic row-based creation
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, city: "NYC" },
 *   { name: "Bob", age: 30, city: "LA" }
 * ]);
 *
 * @example
 * // Column-based creation
 * const df = createDataFrame({
 *   columns: {
 *     name: ["Alice", "Bob"],
 *     age: [25, 30],
 *     city: ["NYC", "LA"]
 *   }
 * });
 *
 * @example
 * // With Zod schema validation
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 * const df = createDataFrame(data, schema);
 *
 * @example
 * // With configuration options
 * const df = createDataFrame(data, {
 *   concurrency: 4,
 *   schema: userSchema
 * });
 *
 * @example
 * // Chaining operations
 * df.filter(row => row.age >= 18)
 *   .groupBy("city")
 *   .summarise({ avgAge: g => s.mean(g.age) })
 *   .arrange("avgAge", "desc");
 */
export declare function createDataFrame<T extends Record<string, readonly unknown[]>>(options: {
    columns: T;
}, schemaOrOptions: DataFrameOptions & {
    no_types: true;
}): DataFrame<any>;
export declare function createDataFrame<T extends Record<string, readonly unknown[]>>(options: {
    columns: T;
}, schemaOrOptions?: null | DataFrameOptions): DataFrame<{
    [K in keyof T]: T[K][number];
}>;
export declare function createDataFrame<R extends readonly object[]>(rows: R, options: DataFrameOptions & {
    no_types: true;
}): DataFrame<any>;
export declare function createDataFrame<R extends readonly object[]>(rows: R, options: DataFrameOptions): DataFrame<R[number]>;
export declare function createDataFrame<R extends readonly object[]>(rows: R, schema: null): DataFrame<R[number]>;
export declare function createDataFrame<S extends z.ZodObject<any>>(rows: readonly object[], schema: S): DataFrame<z.infer<S>>;
export declare function createDataFrame<R extends readonly object[]>(rows: R): DataFrame<R[number]>;
