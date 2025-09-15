// Pivot functions module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

// High-performance pivot_wider functions
export function pivot_wider_dense_f64(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
) {
  initWasm();
  return wasmInternal.pivot_wider_dense_f64(
    gid_per_row,
    cat_codes,
    values,
    n_groups,
    n_cats,
    policy,
  );
}

export function pivot_wider_seen_flags(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
) {
  initWasm();
  return wasmInternal.pivot_wider_seen_flags(
    gid_per_row,
    cat_codes,
    values,
    n_groups,
    n_cats,
    policy,
  );
}

// New combined pivot function that returns values and seen flags in one pass
export function pivot_wider_dense_f64_all(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
) {
  initWasm();
  return wasmInternal.pivot_wider_dense_f64_all(
    gid_per_row,
    cat_codes,
    values,
    n_groups,
    n_cats,
    policy,
  );
}

// High-performance pivot_longer functions
export function pivot_longer_dense(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
) {
  initWasm();
  return wasmInternal.pivot_longer_dense(
    keep_cols_data,
    fold_cols_data,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
}

// Ultra-optimized pivot_longer with typed arrays
export function pivot_longer_typed_arrays(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
) {
  initWasm();
  return wasmInternal.pivot_longer_typed_arrays(
    keep_cols_data,
    fold_cols_data,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
}

export function pivot_longer_numeric(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_valid: Uint8Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
) {
  initWasm();
  return wasmInternal.pivot_longer_numeric(
    keep_cols_data,
    fold_cols_data,
    fold_cols_valid,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
}

// Ultra-optimized pivot_longer for numeric data
export function pivot_longer_typed_numeric(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_valid: Uint8Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
) {
  initWasm();
  return wasmInternal.pivot_longer_typed_numeric(
    keep_cols_data,
    fold_cols_data,
    fold_cols_valid,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
}

export function pivot_longer_strings(
  keep_cols_data: Uint32Array,
  fold_cols_data: Uint32Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
) {
  initWasm();
  return wasmInternal.pivot_longer_strings(
    keep_cols_data,
    fold_cols_data,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
}

// Ultra-optimized pivot_longer for string data
export function pivot_longer_typed_strings(
  keep_cols_data: Uint32Array,
  fold_cols_data: Uint32Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
) {
  initWasm();
  return wasmInternal.pivot_longer_typed_strings(
    keep_cols_data,
    fold_cols_data,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
}
