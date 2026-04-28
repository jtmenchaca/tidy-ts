// Sorting functions module

import { initWasm, wasmInternal } from "./wasm-init.ts";

// Sorting functions
export function arrange_multi_f64_wasm(
  values: Float64Array,
  nRows: number,
  nCols: number,
  dirs: Int8Array,
  outIdx: Uint32Array,
): void {
  initWasm();
  const result = wasmInternal.arrange_multi_f64_wasm(
    values,
    nRows,
    nCols,
    dirs,
    outIdx,
  );
  // napi returns a new sorted array; copy back into the original buffer
  if (result) outIdx.set(result);
}

export function stable_sort_indices_f64_wasm(
  values: Float64Array,
  indices: Uint32Array,
  ascending: boolean,
): void {
  initWasm();
  const result = wasmInternal.stable_sort_indices_f64_wasm(values, indices, ascending);
  // napi returns a new sorted array; copy back into the original buffer
  if (result) indices.set(result);
}

export function stable_sort_indices_u32_wasm(
  values: Uint32Array,
  indices: Uint32Array,
  ascending: boolean,
  na_code: number,
): void {
  initWasm();
  const result = wasmInternal.stable_sort_indices_u32_wasm(
    values,
    indices,
    ascending,
    na_code,
  );
  // napi returns a new sorted array; copy back into the original buffer
  if (result) indices.set(result);
}

export function batch_filter_numbers(
  values: Float64Array,
  threshold: number,
  operation: number,
  output: Uint8Array,
): void {
  initWasm();
  const result = wasmInternal.batch_filter_numbers(
    values,
    threshold,
    operation,
    output,
  );
  // napi returns a new mask array; copy back into the original buffer
  if (result) output.set(result);
}

/**
 * Batch filter that returns a packed Uint32Array bitset directly.
 * Eliminates the Uint8Array → BitSet conversion on the JS side.
 * Falls back to batch_filter_numbers + bitsetFromMask if napi bitset
 * export is not available.
 */
export function batch_filter_bitset(
  values: Float64Array,
  threshold: number,
  operation: number,
): Uint32Array | null {
  initWasm();
  // Try the bitset-returning napi export first
  const fn_ = wasmInternal.batch_filter_bitset;
  if (fn_) {
    return fn_(values, threshold, operation);
  }
  return null;
}

/**
 * Vectorized binary operation between two f64 columns.
 * Operations: 0=add, 1=sub, 2=mul, 3=div
 * Returns Float64Array result or null if napi not available.
 */
export function mutate_binary_cols(
  a: Float64Array,
  b: Float64Array,
  operation: number,
): Float64Array | null {
  initWasm();
  const fn_ = wasmInternal.mutate_binary_cols;
  if (fn_) {
    return fn_(a, b, operation);
  }
  return null;
}

/**
 * Vectorized operation: column op scalar.
 * Operations: 0=add, 1=sub, 2=mul, 3=div
 * Returns Float64Array result or null if napi not available.
 */
export function mutate_col_scalar(
  col: Float64Array,
  scalar: number,
  operation: number,
): Float64Array | null {
  initWasm();
  const fn_ = wasmInternal.mutate_col_scalar;
  if (fn_) {
    return fn_(col, scalar, operation);
  }
  return null;
}

/**
 * Compare column against scalar, returning array of 0/1 booleans.
 * Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
 */
export function mutate_compare_scalar(
  col: Float64Array,
  scalar: number,
  operation: number,
): unknown[] | null {
  initWasm();
  const fn_ = wasmInternal.mutate_compare_scalar;
  if (fn_) {
    // napi returns Buffer (Uint8Array) of 0/1; convert to boolean[]
    const raw: Uint8Array = fn_(col, scalar, operation);
    const n = raw.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = raw[i] !== 0;
    return out;
  }
  return null;
}

/**
 * Compare column against scalar, returning raw Uint8Array mask (0/1).
 * Avoids the boolean[] conversion overhead for ternary operations.
 */
export function mutate_compare_scalar_raw(
  col: Float64Array,
  scalar: number,
  operation: number,
): Uint8Array | null {
  initWasm();
  const fn_ = wasmInternal.mutate_compare_scalar;
  if (fn_) {
    return fn_(col, scalar, operation) as Uint8Array;
  }
  return null;
}

/**
 * Compare column against scalar, returning boolean[] via napi Vec<bool>.
 * napi-rs handles the Rust Vec<bool> → JS Array<boolean> conversion natively.
 * Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
 */
export function mutate_compare_scalar_bool(
  col: Float64Array,
  scalar: number,
  operation: number,
): unknown[] | null {
  initWasm();
  const fn_ = wasmInternal.mutate_compare_scalar_bool;
  if (fn_) {
    return fn_(col, scalar, operation);
  }
  return null;
}

/**
 * Compare two f64 columns, returning array of booleans.
 * Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
 */
export function mutate_compare_cols(
  a: Float64Array,
  b: Float64Array,
  operation: number,
): unknown[] | null {
  initWasm();
  const fn_ = wasmInternal.mutate_compare_cols;
  if (fn_) {
    const raw: Uint8Array = fn_(a, b, operation);
    const n = raw.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = raw[i] !== 0;
    return out;
  }
  return null;
}

/**
 * Compare two f64 columns, returning raw Uint8Array mask (0/1).
 */
export function mutate_compare_cols_raw(
  a: Float64Array,
  b: Float64Array,
  operation: number,
): Uint8Array | null {
  initWasm();
  const fn_ = wasmInternal.mutate_compare_cols;
  if (fn_) {
    return fn_(a, b, operation) as Uint8Array;
  }
  return null;
}

/**
 * Fill a Float64Array with a scalar value.
 */
export function mutate_fill_scalar(
  length: number,
  scalar: number,
): Float64Array | null {
  initWasm();
  const fn_ = wasmInternal.mutate_fill_scalar;
  if (fn_) {
    return fn_(length, scalar);
  }
  return null;
}
