// Stats functions module

import { initWasm, wasmInternal } from "./wasm-init.ts";

// Stats functions
export function unique_f64(values: Float64Array): Float64Array {
  initWasm();
  return wasmInternal.unique_f64(values);
}

export function unique_i32(values: Int32Array): Int32Array {
  initWasm();
  return wasmInternal.unique_i32(values);
}

export function unique_str(values: string[]): string[] {
  initWasm();
  return wasmInternal.unique_str(values);
}

export function count_f64(values: Float64Array, target: number): number {
  initWasm();
  return wasmInternal.count_f64(values, target);
}

export function count_i32(values: Int32Array, target: number): number {
  initWasm();
  return wasmInternal.count_i32(values, target);
}

export function count_str(values: string[], target: string): number {
  initWasm();
  return wasmInternal.count_str(values, target);
}

export function mean_wasm(values: Float64Array): number {
  initWasm();
  return wasmInternal.mean_wasm(values);
}

export function sum_wasm(values: Float64Array): number {
  initWasm();
  return wasmInternal.sum_wasm(values);
}

export function quantile_wasm(
  values: Float64Array,
  probs: Float64Array,
): Float64Array {
  initWasm();
  return wasmInternal.quantile_wasm(values, probs);
}

export function median_wasm(values: Float64Array): number {
  initWasm();
  return wasmInternal.median_wasm(values);
}

export function iqr_wasm(values: Float64Array): number {
  initWasm();
  return wasmInternal.iqr_wasm(values);
}

export function variance_wasm(values: Float64Array): number {
  initWasm();
  return wasmInternal.variance_wasm(values);
}

export function stdev_wasm(values: Float64Array): number {
  initWasm();
  return wasmInternal.stdev_wasm(values);
}

export function batch_stats_wasm(
  values: Float64Array,
  ops: string,
): Float64Array {
  initWasm();
  return wasmInternal.batch_stats_wasm(values, ops);
}

// Distinct functions
export function distinct_rows_generic_typed(
  column_data: Uint32Array[],
  view_index: Uint32Array,
): Uint32Array {
  if (view_index.length === 0) return new Uint32Array(0);
  initWasm();
  return wasmInternal.distinct_rows_generic_typed(column_data, view_index);
}
