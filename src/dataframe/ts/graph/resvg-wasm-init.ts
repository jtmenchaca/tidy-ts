// Resvg WASM initialization module
// Following the pattern from @src/dataframe/ts/wasm/wasm-init.ts
// deno-lint-ignore-file no-explicit-any

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Import the local resvg JS glue code (v2.6.3-alpha.0)
const resvgGlue = await import("./resvg-wasm-2.6.3-alpha.0.cjs");

let resvgWasmModule: any = null;
let resvgWasmBytesCache: ArrayBuffer | null = null;
let resvgInstance: any = null;
let initialized = false;

// Initialize Resvg WASM from bytes (for workers)
export async function initResvgWasmFromBytes(bytes: ArrayBuffer): Promise<any> {
  if (initialized) return { module: resvgWasmModule, Resvg: resvgInstance };

  // Initialize the WASM module using the local implementation
  const mod = new WebAssembly.Module(new Uint8Array(bytes));

  // Use the initWasm function from the glue code
  const initFunc = resvgGlue.initWasm || resvgGlue.default?.initWasm;
  if (initFunc) {
    await initFunc(mod);
  } else {
    throw new Error("Could not find resvg WASM initialization function");
  }

  resvgWasmModule = mod;
  resvgInstance = resvgGlue.Resvg || resvgGlue.default?.Resvg;
  initialized = true;

  return { module: resvgWasmModule, Resvg: resvgInstance };
}

// Get Resvg WASM bytes for transfer to workers
export function getResvgWasmBytes(): ArrayBuffer {
  if (resvgWasmBytesCache) return resvgWasmBytesCache;

  // Lazy load: only read the file when this function is actually called
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(
    currentDir,
    "./resvg-wasm-2.6.3-alpha.0_bg.wasm",
  );
  const buf = fs.readFileSync(wasmPath); // Node Buffer

  // Make a standalone ArrayBuffer view (structured-clone friendly)
  resvgWasmBytesCache = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  );

  return resvgWasmBytesCache;
}

// Initialize Resvg WASM module
export async function initResvgWasm(): Promise<any> {
  if (initialized) {
    return { module: resvgWasmModule, Resvg: resvgInstance };
  }

  // Get path to WASM file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(
    currentDir,
    "./resvg-wasm-2.6.3-alpha.0_bg.wasm",
  );

  // Use the initWasm function with the file path
  const wasmUrl = new URL(wasmPath, `file://${wasmPath}`);

  const initFunc = resvgGlue.initWasm || resvgGlue.default?.initWasm;
  if (initFunc) {
    await initFunc(wasmUrl);
  } else {
    throw new Error("Could not find resvg WASM initialization function");
  }

  resvgWasmModule = true; // Mark as initialized
  resvgInstance = resvgGlue.Resvg || resvgGlue.default?.Resvg;
  initialized = true;

  return { module: resvgWasmModule, Resvg: resvgInstance };
}

// Export the Resvg class getter
export function getResvg(): any {
  if (!resvgInstance) {
    throw new Error("Resvg WASM not initialized. Call initResvgWasm() first.");
  }
  return resvgInstance;
}
