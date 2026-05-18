import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Type guard to check if a value is a Promise
 */
export declare function returnsPromise(x: unknown): x is Promise<unknown>;
/**
 * Tests a single function to see if it's async.
 *
 * @param fn - The function to test
 * @param testArgs - Arguments to pass to the function for testing
 * @returns true if the function is async (declared async or returns a Promise)
 */
export declare function isAsyncFunction(fn: unknown, testArgs?: unknown[]): boolean;
/**
 * Tests if any function in a record/spec is async.
 * Used by mutate verb.
 *
 * @param df - The DataFrame to test against
 * @param spec - Record of column names to functions/values
 * @returns true if any function in the spec is async
 */
export declare function shouldUseAsyncForMutate<Row extends object>(df: DataFrame<Row>, spec: object): boolean;
/**
 * Tests if any predicate function is async.
 * Used by filter verb.
 *
 * @param df - The DataFrame to test against
 * @param predicates - Array of predicate functions or arrays
 * @returns true if any predicate function is async
 */
export declare function shouldUseAsyncForFilter<Row extends object>(df: DataFrame<Row>, predicates: unknown[]): boolean;
/**
 * Tests if any function in a summarise spec is async.
 * Used by summarise verb.
 *
 * @param df - The DataFrame to test against
 * @param spec - Summarise specification (function or record of functions)
 * @returns true if any function in the spec is async
 */
export declare function shouldUseAsyncForSummarise<Row extends object>(df: DataFrame<Row>, spec: Record<string, (df: DataFrame<Row>) => unknown> | ((df: DataFrame<Row>) => object)): boolean;
