/**
 * Build a self-contained browser bundle for @tidy-ts/dataframe with inlined WASM.
 *
 * This script:
 * 1. Reads the WASM file and encodes it as base64
 * 2. Creates a browser-specific entry point that decodes and instantiates the WASM
 * 3. Uses esbuild to bundle everything into a single ES module
 *
 * Usage: deno run -A packages/testing/runtimes/build-bundle.ts
 */

import * as esbuild from "npm:esbuild@0.24.0";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const DATAFRAME_ROOT = new URL("../../dataframe", import.meta.url).pathname;
const OUTPUT_DIR = new URL("./public", import.meta.url).pathname;

// Read and encode WASM as base64
const wasmPath = `${DATAFRAME_ROOT}/lib/tidy_ts_dataframe.wasm`;
const wasmBytes = await Deno.readFile(wasmPath);
const wasmBase64 = encodeBase64(wasmBytes);

console.log(
  `WASM file size: ${(wasmBytes.length / 1024 / 1024).toFixed(2)} MB`,
);
console.log(
  `Base64 encoded size: ${(wasmBase64.length / 1024 / 1024).toFixed(2)} MB`,
);

// Create browser-specific WASM initialization module
const wasmInitBrowser = `
// Browser-specific WASM initialization with inlined base64
import * as wasmInternal from "./tidy_ts_dataframe.internal.js";

const WASM_BASE64 = "${wasmBase64}";

let wasmModule = null;
let compiledModule = null;

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function buildImports() {
  const imports = {};
  for (const [k, v] of Object.entries(wasmInternal)) {
    if (typeof v === "function") imports[k] = v;
  }
  return { "./tidy_ts_dataframe.internal.js": imports };
}

export async function setupTidyTS() {
  if (wasmModule) return;
  if (compiledModule) return;

  const bytes = base64ToArrayBuffer(WASM_BASE64);
  const imports = buildImports();

  const { module, instance } = await WebAssembly.instantiate(bytes, imports);
  compiledModule = module;
  wasmInternal.__wbg_set_wasm(instance.exports);
  wasmModule = instance.exports;
}

export function initWasm() {
  if (wasmModule) return wasmModule;

  if (!compiledModule) {
    throw new Error(
      "WASM not loaded yet. Call \`await setupTidyTS()\` before using the API."
    );
  }

  const imports = buildImports();
  const instance = new WebAssembly.Instance(compiledModule, imports);
  wasmInternal.__wbg_set_wasm(instance.exports);
  wasmModule = instance.exports;
  return wasmModule;
}

export { wasmInternal };
`;

// Write temporary files for esbuild
const tempDir = await Deno.makeTempDir();
const wasmInitPath = `${tempDir}/wasm-init-browser.js`;
await Deno.writeTextFile(wasmInitPath, wasmInitBrowser);

// Copy internal.js to temp dir (esbuild will bundle it)
const internalJsPath = `${DATAFRAME_ROOT}/lib/tidy_ts_dataframe.internal.js`;
const internalJs = await Deno.readTextFile(internalJsPath);
await Deno.writeTextFile(
  `${tempDir}/tidy_ts_dataframe.internal.js`,
  internalJs,
);

// Create browser entry point that re-exports everything
const browserEntry = `
// Browser bundle entry point
export { s, stats } from "${DATAFRAME_ROOT}/ts/stats/stats.ts";
export { str } from "${DATAFRAME_ROOT}/ts/stats/strings/str.ts";
export {
  createDataFrame,
} from "${DATAFRAME_ROOT}/ts/dataframe/index.ts";
export { concatDataFrames } from "${DATAFRAME_ROOT}/ts/verbs/reshape/bind-rows.verb.ts";

// Use browser-specific WASM init
export { setupTidyTS, initWasm } from "./wasm-init-browser.js";
`;

const entryPath = `${tempDir}/browser-entry.ts`;
await Deno.writeTextFile(entryPath, browserEntry);

console.log("\nBundling with esbuild...");

// Bundle with esbuild
const result = await esbuild.build({
  entryPoints: [entryPath],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: `${OUTPUT_DIR}/tidy-ts-bundle.js`,
  minify: false, // Keep readable for debugging
  sourcemap: true,
  // Externalize nothing - bundle everything
  external: [],
  plugins: [
    {
      name: "resvg-wasm-browser",
      setup(build) {
        // Stub out resvg-wasm-init for browser (SVG rendering not needed in tests)
        // Must come before wasm-init-browser since both match *wasm-init*.ts
        build.onResolve({ filter: /resvg-wasm-init\.ts$/ }, () => {
          return { path: "resvg-stub", namespace: "resvg-stub" };
        });
        build.onLoad({ filter: /.*/, namespace: "resvg-stub" }, () => {
          return {
            contents: `
              // Stub for resvg-wasm - not used in browser bundle
              export function initResvgWasm() { throw new Error("SVG rendering not available in browser bundle"); }
            `,
            loader: "js",
          };
        });
      },
    },
    {
      name: "wasm-init-browser",
      setup(build) {
        // Replace ALL wasm-init.ts imports with our browser version
        // Use a namespace to ensure single module instance
        build.onResolve({ filter: /wasm-init\.ts$/ }, () => {
          return { path: "wasm-init-browser", namespace: "wasm-init-browser" };
        });
        // Also catch imports from the temp dir entry point
        build.onResolve({ filter: /wasm-init-browser\.js$/ }, () => {
          return { path: "wasm-init-browser", namespace: "wasm-init-browser" };
        });
        build.onLoad(
          { filter: /.*/, namespace: "wasm-init-browser" },
          () => {
            return {
              contents: wasmInitBrowser,
              loader: "js",
              resolveDir: tempDir, // For resolving ./tidy_ts_dataframe.internal.js
            };
          },
        );
      },
    },
    {
      name: "node-builtins-browser",
      setup(build) {
        // Stub out node: built-in imports for browser
        build.onResolve({ filter: /^node:/ }, (args) => {
          return { path: args.path, namespace: "node-builtin" };
        });
        build.onLoad({ filter: /.*/, namespace: "node-builtin" }, (args) => {
          // Return empty stubs - these code paths won't be hit in browser
          return {
            contents: `
              // Stub for ${args.path} - not available in browser
              export const Worker = undefined;
              export default {};
            `,
            loader: "js",
          };
        });
      },
    },
    {
      name: "shims-browser",
      setup(build) {
        // Replace @tidy-ts/shims imports with browser-compatible stubs
        build.onResolve({ filter: /^@tidy-ts\/shims$/ }, () => {
          return { path: "shims-browser", namespace: "shims-browser" };
        });
        build.onLoad(
          { filter: /.*/, namespace: "shims-browser" },
          () => {
            return {
              contents: `
              // Browser stubs for @tidy-ts/shims
              export const Runtime = { Browser: "browser", Deno: "deno", Node: "node", Bun: "bun" };
              export const currentRuntime = "browser";
              export function dirname() { throw new Error("Not available in browser"); }
              export function fileURLToPath() { throw new Error("Not available in browser"); }
              export function readFileSync() { throw new Error("Not available in browser"); }
              export function resolve() { throw new Error("Not available in browser"); }
              export function writeFileSync() { throw new Error("Not available in browser"); }
              export function writeTextFile() { throw new Error("Not available in browser"); }
              export function readTextFile() { throw new Error("Not available in browser"); }
              export function loadUrl() { throw new Error("Not available in browser"); }
            `,
              loader: "js",
            };
          },
        );
      },
    },
  ],
});

if (result.errors.length > 0) {
  console.error("Build errors:", result.errors);
  Deno.exit(1);
}

// Clean up temp dir
await Deno.remove(tempDir, { recursive: true });

// Get output file size
const outputPath = `${OUTPUT_DIR}/tidy-ts-bundle.js`;
const outputStat = await Deno.stat(outputPath);
console.log(
  `\nBundle created: ${outputPath}`,
);
console.log(`Bundle size: ${(outputStat.size / 1024 / 1024).toFixed(2)} MB`);

await esbuild.stop();
console.log("\nDone!");
