// Resvg WASM initialization module
// Following the pattern from @src/dataframe/ts/wasm/wasm-init.ts
// deno-lint-ignore-file no-explicit-any

import { dirname, fileURLToPath, readFileSync, resolve } from "@tidy-ts/shims";

// Lazy import the local resvg JS glue code (v2.6.3-alpha.0) to avoid top-level await
let resvgGlue: any = null;

let resvgWasmModule: any = null;
let resvgWasmBytesCache: ArrayBuffer | null = null;
let resvgInstance: any = null;
let initialized = false;

// Initialize Resvg WASM from bytes (for workers)
export async function initResvgWasmFromBytes(bytes: ArrayBuffer): Promise<any> {
  if (initialized) return { module: resvgWasmModule, Resvg: resvgInstance };

  // Lazy load the resvg glue code when actually needed
  if (!resvgGlue) {
    resvgGlue = await import("./resvg-wasm-2.6.3-alpha.0.js");
  }

  // Initialize the WASM module using the local implementation
  const mod = new WebAssembly.Module(new Uint8Array(bytes));

  // Use the initWasm function from the glue code
  const initFunc = resvgGlue.initWasm;
  if (initFunc) {
    await initFunc(mod);
  } else {
    throw new Error("Could not find resvg WASM initialization function");
  }

  resvgWasmModule = mod;
  resvgInstance = resvgGlue.Resvg;
  initialized = true;

  return { module: resvgWasmModule, Resvg: resvgInstance };
}

// Get Resvg WASM bytes for transfer to workers
export function getResvgWasmBytes(): ArrayBuffer {
  if (resvgWasmBytesCache) return resvgWasmBytesCache;

  // Lazy load: only read the file when this function is actually called
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = resolve(
    currentDir,
    "./resvg-wasm-2.6.3-alpha.0_bg.wasm",
  );
  const buf = readFileSync(wasmPath);

  // Make a standalone ArrayBuffer view (structured-clone friendly)
  resvgWasmBytesCache = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;

  return resvgWasmBytesCache;
}

// Initialize Resvg WASM module
export async function initResvgWasm(): Promise<any> {
  if (initialized) {
    return { module: resvgWasmModule, Resvg: resvgInstance };
  }

  // Lazy load the resvg glue code when actually needed
  if (!resvgGlue) {
    resvgGlue = await import("./resvg-wasm-2.6.3-alpha.0.js");
  }

  // Get path to WASM file
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = resolve(
    currentDir,
    "./resvg-wasm-2.6.3-alpha.0_bg.wasm",
  );

  // Use the initWasm function with the file path
  const wasmUrl = new URL(wasmPath, `file://${wasmPath}`);

  const initFunc = resvgGlue.initWasm;
  if (initFunc) {
    await initFunc(wasmUrl);
  } else {
    throw new Error("Could not find resvg WASM initialization function");
  }

  resvgWasmModule = true; // Mark as initialized
  resvgInstance = resvgGlue.Resvg;
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
