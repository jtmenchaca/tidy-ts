/**
 * Runtime detection utilities
 * Detects the current JavaScript runtime environment
 */

/**
 * Enum of supported JavaScript runtimes
 */
export enum Runtime {
  Deno = "deno",
  Bun = "bun",
  Node = "node",
  Browser = "browser",
  Tauri = "tauri",
  Workerd = "workerd",
  Netlify = "netlify",
  EdgeLight = "edgelight",
  Fastly = "fastly",
  Unsupported = "unsupported",
}

/**
 * Type guard to check if a property exists in globalThis
 */
function hasGlobalProperty(
  name: string,
  typeString?: "string" | "object" | "function" | "number" | "boolean",
): boolean {
  const value = (globalThis as Record<string, unknown>)[name];
  if (value === undefined) return false;
  if (typeString) {
    const actualType = typeof value;
    return actualType === typeString;
  }
  return true;
}

/**
 * Detects the current JavaScript runtime environment
 * Checks for runtime-specific globals in order of specificity
 */
export function getCurrentRuntime(): Runtime {
  // Check for Deno runtime
  if (hasGlobalProperty("Deno", "object")) {
    return Runtime.Deno;
  }

  // Check for Bun runtime
  if (hasGlobalProperty("Bun", "object")) {
    return Runtime.Bun;
  }

  // Check for Netlify Edge Functions
  if (hasGlobalProperty("Netlify", "object")) {
    return Runtime.Netlify;
  }

  // Check for Edge Runtime (Vercel, etc.)
  if (hasGlobalProperty("EdgeRuntime", "string")) {
    return Runtime.EdgeLight;
  }

  // Check for Cloudflare Workers
  if (globalThis.navigator?.userAgent === "Cloudflare-Workers") {
    return Runtime.Workerd;
  }

  // Check for Fastly Compute@Edge
  if (hasGlobalProperty("fastly", "object")) {
    return Runtime.Fastly;
  }

  // Check for Node.js
  if (
    hasGlobalProperty("process", "object") &&
    typeof (globalThis as { process?: { versions?: { node?: unknown } } })
        .process?.versions?.node !== "undefined"
  ) {
    return Runtime.Node;
  }

  // Check for Browser or Tauri
  if (hasGlobalProperty("window", "object")) {
    if (hasGlobalProperty("__TAURI__", "object")) {
      return Runtime.Tauri;
    }
    return Runtime.Browser;
  }

  return Runtime.Unsupported;
}

/**
 * Cached runtime detection result
 * Determined once when module loads
 */
export const currentRuntime: Runtime = getCurrentRuntime();
