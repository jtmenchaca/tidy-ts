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
