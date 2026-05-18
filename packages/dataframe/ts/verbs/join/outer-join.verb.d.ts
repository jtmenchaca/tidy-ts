/**
 * Outer join: keep all rows from both dataframes; fill missing columns with undefined.
 * Adaptive (WASM for small; JS hash + bitset for large). Columnar-first.
 */
export declare function outer_join(right: any, byOrOptions: any, options?: any): (left: any) => any;
