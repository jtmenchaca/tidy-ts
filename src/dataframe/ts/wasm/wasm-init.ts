// WASM initialization module
// deno-lint-ignore-file no-explicit-any

import * as wasmInternal from "../../lib/tidy_ts_dataframe.js";

let wasmModule: any = null;

// Initialize WASM module - relies on the generated JS file to handle WASM loading
export function initWasm(): any {
  if (wasmModule) return wasmModule;

  // The WASM should already be initialized by the generated JS file
  // Just return the exports from the internal module
  wasmModule = wasmInternal;
  return wasmModule;
}
