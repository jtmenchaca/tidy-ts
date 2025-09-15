// Join functions module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

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
