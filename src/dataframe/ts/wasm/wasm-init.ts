// deno-lint-ignore-file no-explicit-any

import {
  currentRuntime,
  dirname,
  fileURLToPath,
  readFileSync,
  resolve,
  Runtime,
} from "@tidy-ts/shims";
import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";

// Export wasmInternal for use by other modules
export { wasmInternal };

let wasmModule: any = null;
let wasmBytesCache: ArrayBuffer | null = null;

// NEW: Browser preloading support
let compiledModule: WebAssembly.Module | null = null;
let preloadPromise: Promise<void> | null = null;

// Runtime detection helpers
const isBrowser = currentRuntime === Runtime.Browser;
const isDeno = currentRuntime === Runtime.Deno;

// For Deno: pre-load WASM at module initialization using top-level await
// Note: Dynamic import with expression is intentional for Deno WASM loading.
// Webpack will warn about this, but it's harmless as this code only runs in Deno.
if (isDeno && !isBrowser) {
  const wasmUrl = new URL("../../lib/tidy_ts_dataframe.wasm", import.meta.url);
  // webpackIgnore: true - This dynamic import is Deno-specific and won't execute in browser bundles
  // @ts-ignore - Dynamic import with expression is intentional
  const wasmExports = await import(wasmUrl.href);

  // Deno 2.1+ returns the instantiated WASM exports directly
  wasmInternal.__wbg_set_wasm(wasmExports);
  wasmModule = wasmExports;
}

// Build imports from internal glue (functions only)
function buildImports() {
  const imports: Record<string, any> = {};
  for (const [k, v] of Object.entries(wasmInternal)) {
    if (typeof v === "function") imports[k] = v;
  }
  return { "./tidy_ts_dataframe.internal.js": imports };
}

/**
 * Setup function for browsers - preload and compile the WASM module.
 *
 * Call this once before using any tidy-ts statistical or GLM functions in browsers.
 * The function fetches and compiles the WebAssembly module that powers statistical
 * computations. In Node.js/Deno environments, this is a no-op as they load WASM
 * synchronously on demand.
 *
 * @param url - Optional URL or path to the tidy_ts_dataframe.wasm file.
 *   If omitted, automatically resolves the URL relative to the package location.
 *   Useful for custom CDN paths or local hosting scenarios.
 *
 * @returns A Promise that resolves when the WASM module is compiled and ready
 *
 * @example
 * // Basic setup (auto-detects WASM location)
 * import { setupTidyTS } from "@tidy-ts/dataframe";
 * await setupTidyTS();
 *
 * @example
 * // Custom WASM URL
 * await setupTidyTS("https://cdn.example.com/tidy_ts_dataframe.wasm");
 *
 * @example
 * // Setup before using stats functions
 * await setupTidyTS();
 * const df = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);
 * const meanValue = s.mean(df.x);
 */
export async function setupTidyTS(url?: string | URL): Promise<void> {
  if (!isBrowser) return; // No-op outside browsers
  if (compiledModule) return; // Already compiled
  if (preloadPromise) return preloadPromise;

  // Resolve default WASM URL next to the lib output
  // For ESM.sh, we need to construct the correct URL
  const baseUrl = import.meta.url.replace(/\/es2022\/.*$/, "");
  const defaultUrl = new URL(
    "lib/tidy_ts_dataframe.wasm",
    baseUrl + "/",
  );
  const wasmUrl = url ?? defaultUrl;

  const imports = buildImports();

  preloadPromise = (async () => {
    // Fast path: instantiateStreaming (requires application/wasm)
    if ("instantiateStreaming" in WebAssembly) {
      try {
        const { module, instance } = await WebAssembly.instantiateStreaming(
          fetch(wasmUrl as any),
          imports,
        );
        compiledModule = module; // cache compiled module
        wasmInternal.__wbg_set_wasm(instance.exports);
        wasmModule = instance.exports;
        return;
      } catch (_e) {
        // Fall through to arrayBuffer path (wrong MIME or non-support)
      }
    }

    // Fallback: fetch bytes → compile (async) → cache module
    const res = await fetch(wasmUrl as any);
    const bytes = await res.arrayBuffer();
    compiledModule = await WebAssembly.compile(bytes);
    // Don't instantiate yet; let initWasm() do a synchronous Instance() later.
  })();

  await preloadPromise;
}

// NEW: allow initializing from bytes (worker path)
export function initWasmFromBytes(bytes: ArrayBuffer): any {
  if (wasmModule) return wasmModule;

  const imports = buildImports();
  const mod = new WebAssembly.Module(new Uint8Array(bytes));
  const instance = new WebAssembly.Instance(mod, imports);

  wasmInternal.__wbg_set_wasm(instance.exports);
  wasmModule = instance.exports;
  return wasmModule;
}

// NEW: expose bytes so the main thread can send them to workers
export function getWasmBytes(): ArrayBuffer {
  if (wasmBytesCache) return wasmBytesCache;

  // Lazy load: only read the file when this function is actually called
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = resolve(currentDir, "../../lib/tidy_ts_dataframe.wasm");
  const buf = readFileSync(wasmPath);
  // Make a standalone ArrayBuffer view (structured-clone friendly)
  wasmBytesCache = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
  return wasmBytesCache;
}

export function initWasm(): any {
  if (wasmModule) return wasmModule;

  // Browser: require prior async preload
  if (isBrowser) {
    if (!compiledModule) {
      throw new Error(
        "WASM not loaded yet. In the browser, call `await setupTidyTS()` once before using the API.",
      );
    }
    const imports = buildImports();
    const instance = new WebAssembly.Instance(compiledModule, imports);
    wasmInternal.__wbg_set_wasm(instance.exports);
    wasmModule = instance.exports;
    return wasmModule;
  }

  // Deno: already loaded at module initialization via top-level await
  if (isDeno) {
    return wasmModule;
  }

  // Node/Bun: original sync path using file system
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = resolve(currentDir, "../../lib/tidy_ts_dataframe.wasm");

  // Read WASM file as buffer
  const wasmBuffer = readFileSync(wasmPath);

  // Instantiate WebAssembly module with imports
  // Ensure we have an ArrayBuffer (not SharedArrayBuffer)
  const wasmArrayBuffer = wasmBuffer.buffer instanceof ArrayBuffer
    ? wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset,
      wasmBuffer.byteOffset + wasmBuffer.byteLength,
    )
    : new Uint8Array(wasmBuffer).buffer;
  const wasmModuleInstance = new WebAssembly.Module(wasmArrayBuffer);

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
