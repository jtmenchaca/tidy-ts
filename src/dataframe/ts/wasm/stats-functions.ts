// Stats functions module
// deno-lint-ignore-file no-explicit-any

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

// Stats functions
export function unique_f64(values: any) {
  initWasm();
  return wasmInternal.unique_f64(values);
}

export function unique_i32(values: any) {
  initWasm();
  return wasmInternal.unique_i32(values);
}

export function unique_str(values: any) {
  initWasm();
  return wasmInternal.unique_str(values);
}

export function count_f64(values: any, target: any) {
  initWasm();
  return wasmInternal.count_f64(values, target);
}

export function count_i32(values: any, target: any) {
  initWasm();
  return wasmInternal.count_i32(values, target);
}

export function count_str(values: any, target: any) {
  initWasm();
  return wasmInternal.count_str(values, target);
}

export function sum_wasm(values: any) {
  initWasm();
  return wasmInternal.sum_wasm(values);
}

export function quantile_wasm(values: any, probs: any) {
  initWasm();
  return wasmInternal.quantile_wasm(values, probs);
}

export function median_wasm(values: any) {
  initWasm();
  return wasmInternal.median_wasm(values);
}

export function iqr_wasm(values: any) {
  initWasm();
  return wasmInternal.iqr_wasm(values);
}

// Distinct functions
export function distinct_rows_generic_typed(
  column_data: Uint32Array[],
  view_index: Uint32Array,
) {
  initWasm();
  return wasmInternal.distinct_rows_generic_typed(column_data, view_index);
}
