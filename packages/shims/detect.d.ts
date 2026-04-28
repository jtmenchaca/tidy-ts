/**
 * Runtime detection utilities
 * Detects the current JavaScript runtime environment
 */
/**
 * Enum of supported JavaScript runtimes
 */
export declare enum Runtime {
    Deno = "deno",
    Bun = "bun",
    Node = "node",
    Browser = "browser",
    Tauri = "tauri",
    Workerd = "workerd",
    Netlify = "netlify",
    EdgeLight = "edgelight",
    Fastly = "fastly",
    Unsupported = "unsupported"
}
/**
 * Detects the current JavaScript runtime environment
 * Checks for runtime-specific globals in order of specificity
 */
export declare function getCurrentRuntime(): Runtime;
/**
 * Cached runtime detection result
 * Determined once when module loads
 */
export declare const currentRuntime: Runtime;
