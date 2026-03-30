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
  return wasmInternal.arrange_multi_f64_wasm(
    values,
    nRows,
    nCols,
    dirs,
    outIdx,
  );
}

export function stable_sort_indices_f64_wasm(
  values: Float64Array,
  indices: Uint32Array,
  ascending: boolean,
): void {
  initWasm();
  return wasmInternal.stable_sort_indices_f64_wasm(values, indices, ascending);
}

export function stable_sort_indices_u32_wasm(
  values: Uint32Array,
  indices: Uint32Array,
  ascending: boolean,
  na_code: number,
): void {
  initWasm();
  return wasmInternal.stable_sort_indices_u32_wasm(
    values,
    indices,
    ascending,
    na_code,
  );
}

export function batch_filter_numbers(
  values: Float64Array,
  threshold: number,
  operation: number,
  output: Uint8Array,
): void {
  initWasm();
  return wasmInternal.batch_filter_numbers(
    values,
    threshold,
    operation,
    output,
  );
}
