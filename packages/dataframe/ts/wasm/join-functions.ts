// Join functions module

import { initWasm, wasmInternal } from "./wasm-init.ts";

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

// Full join+gather in Rust (napi fast path — bypasses all TS overhead)
export function inner_join_gather_f64(
  leftKeyCols: Float64Array[],
  rightKeyCols: Float64Array[],
  leftValueCols: Float64Array[],
  rightValueCols: Float64Array[],
): { leftCols: Float64Array[]; rightCols: Float64Array[]; nRows: number } {
  initWasm();
  return wasmInternal.inner_join_gather_f64(
    leftKeyCols,
    rightKeyCols,
    leftValueCols,
    rightValueCols,
  );
}

export function left_join_gather_f64(
  leftKeyCols: Float64Array[],
  rightKeyCols: Float64Array[],
  leftValueCols: Float64Array[],
  rightValueCols: Float64Array[],
): { leftCols: Float64Array[]; rightCols: Float64Array[]; nRows: number } {
  initWasm();
  return wasmInternal.left_join_gather_f64(
    leftKeyCols,
    rightKeyCols,
    leftValueCols,
    rightValueCols,
  );
}

// Gather-only functions (use after u32 hash join returns index pairs)
export function gather_f64_columns(
  columns: Float64Array[],
  indices: Uint32Array,
): Float64Array[] {
  initWasm();
  return wasmInternal.gather_f64_columns(columns, indices);
}

export function gather_f64_columns_nullable(
  columns: Float64Array[],
  indices: Uint32Array,
): Float64Array[] {
  initWasm();
  return wasmInternal.gather_f64_columns_nullable(columns, indices);
}

// String hashing in Rust (FNV-1a, ~5-10x faster than JS polynomial)
export function hash_strings(strings: string[]): Uint32Array {
  initWasm();
  return wasmInternal.hash_strings(strings);
}
