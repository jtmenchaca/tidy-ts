export declare const wasmInternal: any;
/** Returns true if the native .node addon is being used instead of WASM */
export declare function usingNativeBackend(): boolean;
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
export declare function setupTidyTS(url?: string | URL): Promise<void>;
export declare function initWasmFromBytes(bytes: ArrayBuffer): any;
export declare function getWasmBytes(): ArrayBuffer;
export declare function initWasm(): any;
