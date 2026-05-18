/**
 * Execute a side effect for each row in the DataFrame.
 * Returns the same DataFrame for chaining.
 */
export declare function for_each_row(fn: any): (df: any) => any;
export declare function for_each_row_async(fn: any): (df: any) => any;
/**
 * Execute a side effect for each column in the DataFrame.
 * Returns the same DataFrame for chaining.
 */
export declare function for_each_col(fn: any): (df: any) => any;
export declare function for_each_col_async(fn: any): (df: any) => any;
