export declare function arrange_multi_f64_wasm(values: Float64Array, nRows: number, nCols: number, dirs: Int8Array, outIdx: Uint32Array): void;
export declare function stable_sort_indices_f64_wasm(values: Float64Array, indices: Uint32Array, ascending: boolean): void;
export declare function stable_sort_indices_u32_wasm(values: Uint32Array, indices: Uint32Array, ascending: boolean, na_code: number): void;
export declare function batch_filter_numbers(values: Float64Array, threshold: number, operation: number, output: Uint8Array): void;
/**
 * Batch filter that returns a packed Uint32Array bitset directly.
 * Eliminates the Uint8Array → BitSet conversion on the JS side.
 * Falls back to batch_filter_numbers + bitsetFromMask if napi bitset
 * export is not available.
 */
export declare function batch_filter_bitset(values: Float64Array, threshold: number, operation: number): Uint32Array | null;
/**
 * Vectorized binary operation between two f64 columns.
 * Operations: 0=add, 1=sub, 2=mul, 3=div
 * Returns Float64Array result or null if napi not available.
 */
export declare function mutate_binary_cols(a: Float64Array, b: Float64Array, operation: number): Float64Array | null;
/**
 * Vectorized operation: column op scalar.
 * Operations: 0=add, 1=sub, 2=mul, 3=div
 * Returns Float64Array result or null if napi not available.
 */
export declare function mutate_col_scalar(col: Float64Array, scalar: number, operation: number): Float64Array | null;
/**
 * Masked binary operation between two f64 columns.
 * Only processes rows where mask[i] != 0. Unmasked slots = 0.0.
 * Returns null if napi not available.
 */
export declare function mutate_binary_cols_masked(a: Float64Array, b: Float64Array, operation: number, mask: Uint8Array): Float64Array | null;
/**
 * Masked column op scalar.
 * Only processes rows where mask[i] != 0. Unmasked slots = 0.0.
 * Returns null if napi not available.
 */
export declare function mutate_col_scalar_masked(col: Float64Array, scalar: number, operation: number, mask: Uint8Array): Float64Array | null;
/**
 * Compare column against scalar, returning array of 0/1 booleans.
 * Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
 */
export declare function mutate_compare_scalar(col: Float64Array, scalar: number, operation: number): unknown[] | null;
/**
 * Compare column against scalar, returning raw Uint8Array mask (0/1).
 * Avoids the boolean[] conversion overhead for ternary operations.
 */
export declare function mutate_compare_scalar_raw(col: Float64Array, scalar: number, operation: number): Uint8Array | null;
/**
 * Compare column against scalar, returning boolean[] via napi Vec<bool>.
 * napi-rs handles the Rust Vec<bool> → JS Array<boolean> conversion natively.
 * Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
 */
export declare function mutate_compare_scalar_bool(col: Float64Array, scalar: number, operation: number): unknown[] | null;
/**
 * Compare two f64 columns, returning array of booleans.
 * Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
 */
export declare function mutate_compare_cols(a: Float64Array, b: Float64Array, operation: number): unknown[] | null;
/**
 * Compare two f64 columns, returning raw Uint8Array mask (0/1).
 */
export declare function mutate_compare_cols_raw(a: Float64Array, b: Float64Array, operation: number): Uint8Array | null;
/**
 * Convert a Uint8Array boolean mask (0/1) to a compact Uint32Array of set indices.
 * E.g. mask [0,1,0,1,1] → [1,3,4]
 * Returns null if napi not available.
 */
export declare function mask_to_index(mask: Uint8Array): Uint32Array | null;
/**
 * Fill a Float64Array with a scalar value.
 */
export declare function mutate_fill_scalar(length: number, scalar: number): Float64Array | null;
/**
 * Apply a string transformation to a string column.
 * Operations: 0=toUpperCase, 1=toLowerCase, 2=trim
 */
export declare function mutate_string_transform(values: string[], operation: number): string[] | null;
