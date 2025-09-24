// WASM initialization module
// deno-lint-ignore-file no-explicit-any

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as wasmInternal from "../../lib/tidy_ts_dataframe.js";
import { __wbg_set_wasm } from "../../lib/tidy_ts_dataframe.internal.js";

let wasmModule: any = null;
let wasmBytesCache: ArrayBuffer | null = null;

// Initialize WASM from bytes (worker path)
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

  __wbg_set_wasm(instance.exports);
  wasmModule = instance.exports;
  return wasmModule;
}

// Get WASM bytes for transfer to workers
export function getWasmBytes(): ArrayBuffer {
  if (wasmBytesCache) return wasmBytesCache;

  // Lazy load: only read the file when this function is actually called
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(currentDir, "../../lib/tidy_ts_dataframe.wasm");
  const buf = fs.readFileSync(wasmPath); // Node Buffer
  // Make a standalone ArrayBuffer view (structured-clone friendly)
  wasmBytesCache = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  );
  return wasmBytesCache;
}

// Initialize WASM module
export function initWasm(): any {
  if (wasmModule) return wasmModule;

  // Get path to WASM file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(currentDir, "../../lib/tidy_ts_dataframe.wasm");

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
  __wbg_set_wasm(wasmInstance.exports);

  wasmModule = wasmInstance.exports;
  return wasmModule;
}
