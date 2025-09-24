// Grouping functions module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.js";
import { initWasm } from "./wasm-init.ts";

// High-performance grouping functions
export function group_ids_codes(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
) {
  initWasm();
  return wasmInternal.group_ids_codes(keys_codes, n_rows, n_key_cols);
}

export function get_unique_group_keys(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
) {
  initWasm();
  return wasmInternal.get_unique_group_keys(keys_codes, n_rows, n_key_cols);
}

export function get_group_count(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
) {
  initWasm();
  return wasmInternal.get_group_count(keys_codes, n_rows, n_key_cols);
}

export function get_group_info(
  unique_keys: Uint32Array,
  n_key_cols: number,
  group_id: number,
) {
  initWasm();
  return wasmInternal.get_group_info(unique_keys, n_key_cols, group_id);
}

// New combined grouping function that returns all data in one pass
export function group_ids_codes_all(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
) {
  initWasm();
  return wasmInternal.group_ids_codes_all(keys_codes, n_rows, n_key_cols);
}

// High-performance aggregation functions
export function reduce_sum_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  n_groups: number,
) {
  initWasm();
  return wasmInternal.reduce_sum_f64(gid_per_row, vals, n_groups);
}

export function reduce_count_u32(
  gid_per_row: Uint32Array,
  valid: Uint8Array,
  n_groups: number,
) {
  initWasm();
  return wasmInternal.reduce_count_u32(gid_per_row, valid, n_groups);
}

export function reduce_mean_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  valid: Uint8Array,
  n_groups: number,
) {
  initWasm();
  return wasmInternal.reduce_mean_f64(gid_per_row, vals, valid, n_groups);
}
