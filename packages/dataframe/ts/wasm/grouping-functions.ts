// Grouping functions module

import { initWasm, wasmInternal } from "./wasm-init.ts";

// Combined grouping function that returns all data in one pass
function group_ids_codes_all(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
) {
  initWasm();
  return wasmInternal.group_ids_codes_all(keys_codes, n_rows, n_key_cols);
}

// High-performance aggregation functions
function reduce_sum_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  n_groups: number,
) {
  initWasm();
  return wasmInternal.reduce_sum_f64(gid_per_row, vals, n_groups);
}

function reduce_count_u32(
  gid_per_row: Uint32Array,
  valid: Uint8Array,
  n_groups: number,
) {
  initWasm();
  return wasmInternal.reduce_count_u32(gid_per_row, valid, n_groups);
}

function reduce_mean_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  valid: Uint8Array,
  n_groups: number,
) {
  initWasm();
  return wasmInternal.reduce_mean_f64(gid_per_row, vals, valid, n_groups);
}
