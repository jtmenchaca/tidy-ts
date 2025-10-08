// Import Node.js process module for runtime detection
import process from "node:process";

/**
 * Enum of supported Runtimes.
 * Defines all possible JavaScript runtime environments that this test shim can detect and work with.
 * @enum {string}
 */
export enum Runtime {
  Deno = "deno", // Deno runtime
  Bun = "bun", // Bun runtime
  Node = "node", // Node.js runtime
  Browser = "browser", // Web browser environment
  Tauri = "tauri", // Tauri desktop app framework
  Workerd = "workerd", // Cloudflare Workers runtime
  Netlify = "netlify", // Netlify Edge Functions
  EdgeLight = "edgelight", // Edge runtime (Vercel, etc.)
  Fastly = "fastly", // Fastly Compute@Edge
  Unsupported = "unsupported", // Fallback for unknown environments
}

/**
 * Verifies if a property exists in the global namespace and optionally checks its type.
 * This is a utility function used for runtime detection by checking for runtime-specific globals.
 *
 * @param {string} name - The name of the property to verify (e.g., "Deno", "Bun", "process").
 * @param {string} [typeString] - The expected type of the property (optional).
 * @returns {boolean} True if the property exists and matches the type (if provided), False otherwise.
 */
function verifyGlobal(name: string, typeString?: string): boolean {
  // Check if the property exists in the global scope
  return name in globalThis &&
    // If no type is specified, just check existence
    // If type is specified, verify the property has the expected type
    (!typeString ||
      typeof (globalThis as Record<string, unknown>)[name] === typeString);
}

/**
 * Dynamically determines the current runtime environment.
 * This function uses a series of checks to identify which JavaScript runtime is currently executing.
 * The order of checks is important - more specific runtimes are checked first.
 *
 * @returns {Runtime} The current runtime environment.
 */
export function getCurrentRuntime(): Runtime {
  // Check for Deno runtime - Deno exposes a global "Deno" object
  if (verifyGlobal("Deno", "object")) return Runtime.Deno;

  // Check for Bun runtime - Bun exposes a global "Bun" object
  if (verifyGlobal("Bun", "object")) return Runtime.Bun;

  // Check for Netlify Edge Functions - has a global "Netlify" object
  if (verifyGlobal("Netlify", "object")) return Runtime.Netlify;

  // Check for Edge Runtime (Vercel, etc.) - has "EdgeRuntime" as a string
  if (verifyGlobal("EdgeRuntime", "string")) return Runtime.EdgeLight;

  // Check for Cloudflare Workers - identified by specific user agent
  if (globalThis.navigator?.userAgent === "Cloudflare-Workers") {
    return Runtime.Workerd;
  }

  // Check for Fastly Compute@Edge - has a global "fastly" object
  if (verifyGlobal("fastly", "object")) return Runtime.Fastly;

  // Check for Node.js - has "process" object with "versions.node" property
  if (
    verifyGlobal("process", "object") &&
    //@ts-ignore Runtime detection - process may not be typed in all environments
    typeof process.versions !== "undefined" &&
    //@ts-ignore Runtime detection - process.versions.node may not be typed
    typeof process.versions.node !== "undefined"
  ) {
    return Runtime.Node;
  }

  // Check for Browser or Tauri - both have a "window" object
  if (verifyGlobal("window", "object")) {
    // Check for Tauri first (Tauri runs in a webview, so it has window)
    // Tauri exposes a global "__TAURI__" object
    if (verifyGlobal("__TAURI__", "object")) return Runtime.Tauri;
    // If we have window but no Tauri, it's a regular browser
    return Runtime.Browser;
  }

  // If none of the above conditions match, return unsupported
  return Runtime.Unsupported;
}

/**
 * Static variable containing the current runtime.
 * This is determined once when the module loads and used throughout the session.
 */
const CurrentRuntime = getCurrentRuntime();

/**
 * Test subject function type.
 * This defines the signature that all test functions must follow.
 * The function receives a context object and a done callback for async tests.
 */
export type TestSubject = (
  context: unknown | undefined, // Runtime-specific test context (varies by runtime)
  done: (value?: unknown) => void, // Callback to signal test completion (for async tests)
) => void | Promise<void>; // Can be sync or async

/**
 * Runtime independent test function interface.
 * This is the common interface that all runtime-specific test implementations must follow.
 */
export interface WrappedTest {
  (
    name: string, // Test name/description
    testFn: TestSubject, // The actual test function
    options?: WrappedTestOptions, // Optional test configuration
  ): Promise<void>; // Returns a promise that resolves when test completes
}

/**
 * Runtime independent test options.
 * These options work across all supported runtimes.
 */
export interface WrappedTestOptions {
  timeout?: number; // Timeout duration in milliseconds (optional)
  skip?: boolean; // Whether to skip the test (optional)
  waitForCallback?: boolean; // Whether to wait for the done-callback to be called (for async tests)
}

// Variable to hold the runtime-specific test implementation
let wrappedTestToUse: WrappedTest;

// Dynamically import the appropriate test implementation based on detected runtime
if (CurrentRuntime == Runtime.Deno) {
  // Import Deno-specific test implementation
  const { wrappedTest } = await import("./deno.ts");
  // @ts-ignore js - TypeScript may not recognize the dynamic import
  wrappedTestToUse = wrappedTest;
} else if (CurrentRuntime == Runtime.Node) {
  // Import Node.js-specific test implementation
  const { wrappedTest } = await import("./node.ts");
  // @ts-ignore js - TypeScript may not recognize the dynamic import
  wrappedTestToUse = wrappedTest;
} else if (CurrentRuntime == Runtime.Bun) {
  // Import Bun-specific test implementation
  const { wrappedTest } = await import("./bun.ts");
  // @ts-ignore js - TypeScript may not recognize the dynamic import
  wrappedTestToUse = wrappedTest;
} else {
  // Throw error if runtime is not supported
  throw new Error("Unsupported runtime");
}

/**
 * Defines and executes a single test.
 * This is the main test function that users call - it delegates to the runtime-specific implementation.
 *
 * @param name - The name/description of the test
 * @param testFn - The function containing the test logic
 * @param options - Optional test configuration (timeout, skip, etc.)
 */
export async function test(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions = {},
) {
  // Delegate to the runtime-specific test implementation
  await wrappedTestToUse(name, testFn, options);
}
