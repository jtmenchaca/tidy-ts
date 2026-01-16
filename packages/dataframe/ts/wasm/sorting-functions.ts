// Sorting functions module
// deno-lint-ignore-file no-explicit-any

import { initWasm, wasmInternal } from "./wasm-init.ts";

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
