import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";
/**
 * Asynchronous mutate implementation that handles Promise resolution with concurrency control
 *
 * @param df - The DataFrame to mutate
 * @param spec - Mutation specification (functions/values)
 * @param options - Concurrency control options
 */
export declare function mutateAsyncImpl(df: any, spec: any, options?: ConcurrencyOptions): Promise<any>;
