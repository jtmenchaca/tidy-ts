// Universal WASM loader using Node.js APIs (supported by Deno)
// deno-lint-ignore-file no-explicit-any

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as wasmInternal from "../lib/tidy_ts_dataframe.internal.js";

let wasmModule: any = null;
let wasmBytesCache: ArrayBuffer | null = null;

// NEW: allow initializing from bytes (worker path)
export function initWasmFromBytes(bytes: ArrayBuffer): any {
  if (wasmModule) return wasmModule;

  // Build imports from internal glue (functions only)
  const wasmImports: Record<string, any> = {};
  for (const [k, v] of Object.entries(wasmInternal)) {
    if (typeof v === "function") wasmImports[k] = v;
  }

  const mod = new WebAssembly.Module(new Uint8Array(bytes));
  const instance = new WebAssembly.Instance(mod, {
    "./tidy_ts_dataframe.internal.js": wasmImports,
  });

  wasmInternal.__wbg_set_wasm(instance.exports);
  wasmModule = instance.exports;
  return wasmModule;
}

// NEW: expose bytes so the main thread can send them to workers
export function getWasmBytes(): ArrayBuffer {
  if (wasmBytesCache) return wasmBytesCache;

  // Lazy load: only read the file when this function is actually called
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(currentDir, "../lib/tidy_ts_dataframe.wasm");
  const buf = fs.readFileSync(wasmPath); // Node Buffer
  // Make a standalone ArrayBuffer view (structured-clone friendly)
  wasmBytesCache = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  );
  return wasmBytesCache;
}

function initWasm(): any {
  if (wasmModule) return wasmModule;

  // Get path to WASM file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(currentDir, "../lib/tidy_ts_dataframe.wasm");

  // Read WASM file as buffer
  const wasmBuffer = fs.readFileSync(wasmPath);

  // Instantiate WebAssembly module with imports
  const wasmModuleInstance = new WebAssembly.Module(wasmBuffer);

  // Filter out non-function exports for WebAssembly imports
  const wasmImports: Record<string, any> = {};
  for (const [key, value] of Object.entries(wasmInternal)) {
    if (typeof value === "function") {
      wasmImports[key] = value;
    }
  }

  const wasmInstance = new WebAssembly.Instance(wasmModuleInstance, {
    "./tidy_ts_dataframe.internal.js": wasmImports,
  });

  // Set the WASM instance in the internal module
  wasmInternal.__wbg_set_wasm(wasmInstance.exports);

  wasmModule = wasmInstance.exports;
  return wasmModule;
}

// Export WASM types
export type {
  Grouping,
  PivotDenseF64,
  PivotLongerResult,
  PivotLongerStringResult,
} from "../lib/tidy_ts_dataframe.d.ts";

// Export WASM join functions (streamlined typed array approach)
export function inner_join_typed_multi_u32(
  leftColumns: Uint32Array[],
  rightColumns: Uint32Array[],
) {
  initWasm();
  return wasmInternal.inner_join_typed_multi_u32(leftColumns, rightColumns);
}

export function left_join_typed_multi_u32(
  leftColumns: Uint32Array[],
  rightColumns: Uint32Array[],
) {
  initWasm();
  return wasmInternal.left_join_typed_multi_u32(leftColumns, rightColumns);
}
export function right_join_typed_multi_u32(
  leftColumns: Uint32Array[],
  rightColumns: Uint32Array[],
) {
  initWasm();
  return wasmInternal.right_join_typed_multi_u32(leftColumns, rightColumns);
}

export function outer_join_typed_multi_u32(
  leftColumns: Uint32Array[],
  rightColumns: Uint32Array[],
) {
  initWasm();
  return wasmInternal.outer_join_typed_multi_u32(leftColumns, rightColumns);
}

export function cross_join_u32(leftLen: number, rightLen: number) {
  initWasm(); // Ensure WASM is loaded
  return wasmInternal.cross_join_u32(leftLen, rightLen);
}

// Sorting functions
export function arrange_multi_f64_wasm(
  values: any,
  nRows: any,
  nCols: any,
  dirs: any,
  outIdx: any,
) {
  initWasm();
  return wasmInternal.arrange_multi_f64_wasm(
    values,
    nRows,
    nCols,
    dirs,
    outIdx,
  );
}

export function stable_sort_indices_f64_wasm(
  values: any,
  indices: any,
  ascending: any,
) {
  initWasm();
  return wasmInternal.stable_sort_indices_f64_wasm(values, indices, ascending);
}

export function stable_sort_indices_u32_wasm(
  values: any,
  indices: any,
  ascending: any,
  na_code: any,
) {
  initWasm();
  return wasmInternal.stable_sort_indices_u32_wasm(
    values,
    indices,
    ascending,
    na_code,
  );
}

export function batch_filter_numbers(
  values: any,
  threshold: any,
  operation: any,
  output: any,
) {
  initWasm();
  return wasmInternal.batch_filter_numbers(
    values,
    threshold,
    operation,
    output,
  );
}

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
