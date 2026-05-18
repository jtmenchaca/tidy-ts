import * as esbuild from "esbuild";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const GRAPH_DIR = "packages/graph";
const DIST_DIR = join(GRAPH_DIR, "dist");
const TSC_DIR = join(DIST_DIR, ".tsc");

// Clean dist
rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

// --- Step 1: Bundle JS with esbuild ---
await esbuild.build({
  entryPoints: { index: join(GRAPH_DIR, "mod.ts") },
  outdir: DIST_DIR,
  format: "esm",
  platform: "node",
  target: "node18",
  bundle: true,
  splitting: true,
  external: [
    "node:*",
    "bun:*",
    "@tidy-ts/shims",
    "@tidy-ts/shims/*",
    "@tidy-ts/dataframe",
    "@tidy-ts/dataframe/*",
    "vega",
    "vega-embed",
    "vega-lite",
  ],
});

// Copy resvg WASM and fonts next to JS output
cpSync(join(GRAPH_DIR, "ts/resvg-wasm-2.6.3-alpha.0_bg.wasm"), join(DIST_DIR, "resvg-wasm-2.6.3-alpha.0_bg.wasm"));
cpSync(join(GRAPH_DIR, "ts/fonts"), join(DIST_DIR, "fonts"), { recursive: true });

// --- Step 2: Generate .d.ts via tsc + rollup-plugin-dts ---

// Write temporary build-time global declarations
const GLOBALS_PATH = join(GRAPH_DIR, "_build-globals.d.ts");
writeFileSync(GLOBALS_PATH, `\
// Auto-generated at build time — provides globals not in @types/node
declare const Deno: any;
`);

// Write temporary tsconfig
const TSCONFIG_PATH = join(GRAPH_DIR, "tsconfig.build.json");
const graphAbsDir = resolve(GRAPH_DIR);
const dfAbsDir = resolve("packages/dataframe");
const shimsAbsDir = resolve("packages/shims");
writeFileSync(TSCONFIG_PATH, JSON.stringify({
  compilerOptions: {
    target: "ES2022",
    module: "ES2022",
    moduleResolution: "bundler",
    lib: ["ES2022", "DOM"],
    strict: false,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
    allowImportingTsExtensions: true,
    outDir: resolve(TSC_DIR),
    rootDir: graphAbsDir,
    types: ["node"],
    typeRoots: [resolve("node_modules/@types")],
    paths: {
      "@tidy-ts/dataframe": [`${dfAbsDir}/mod.ts`],
      "@tidy-ts/shims": [`${shimsAbsDir}/mod.ts`],
      "@tidy-ts/shims/*": [`${shimsAbsDir}/*.ts`, `${shimsAbsDir}/*/index.ts`],
    },
  },
  files: [resolve(GLOBALS_PATH)],
  include: [`${graphAbsDir}/**/*.ts`],
  exclude: [
    `${graphAbsDir}/node_modules/**`,
    `${graphAbsDir}/dist/**`,
    `${graphAbsDir}/**/*.test.ts`,
  ],
}, null, 2));

// Run tsc (may report errors but still emits with noEmitOnError=false default)
try {
  execSync(`npx tsc --project ${TSCONFIG_PATH}`, { stdio: "pipe" });
} catch {
  // tsc exits non-zero on type errors but still emits .d.ts files
}

// Clean up temporary files
rmSync(GLOBALS_PATH);
rmSync(TSCONFIG_PATH);

// Verify tsc output exists
if (!existsSync(join(TSC_DIR, "mod.d.ts"))) {
  console.error("ERROR: tsc did not emit declaration files for graph");
  process.exit(1);
}

// Bundle .d.ts with rollup-plugin-dts
const bundle = await rollup({
  input: { index: `${TSC_DIR}/mod.d.ts` },
  plugins: [dts()],
  external: [
    /^@tidy-ts\/shims/,
    /^@tidy-ts\/dataframe/,
    /^vega/,
  ],
  onwarn(warning) {
    if (warning.code !== "CIRCULAR_DEPENDENCY") {
      console.error(warning.toString());
    }
  },
});

await bundle.write({
  format: "es",
  dir: DIST_DIR,
  entryFileNames: "[name].d.ts",
  chunkFileNames: "chunks/[name].d.ts",
  minifyInternalExports: false,
});

// Clean up tsc intermediate output
rmSync(TSC_DIR, { recursive: true, force: true });

// --- Step 3: Write npm-specific package.json ---
const pkg = JSON.parse(readFileSync(join(GRAPH_DIR, "package.json"), "utf8"));
writeFileSync(join(DIST_DIR, "package.json"), JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  description: "Vega-Lite charting for @tidy-ts/dataframe.",
  type: "module",
  main: "./index.js",
  types: "./index.d.ts",
  exports: {
    ".": { types: "./index.d.ts", import: "./index.js" },
  },
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/jtmenchaca/tidy-ts.git" },
  homepage: "https://github.com/jtmenchaca/tidy-ts#readme",
  bugs: { url: "https://github.com/jtmenchaca/tidy-ts/issues" },
  keywords: ["dataframe", "graph", "chart", "vega", "vega-lite", "visualization", "tidy-ts"],
  dependencies: {
    "@tidy-ts/dataframe": pkg.version,
    "@tidy-ts/shims": "1.5.9",
  },
  optionalDependencies: {
    "vega": "^6.2.0",
    "vega-embed": "^7.0.2",
    "vega-lite": "^6.4.1",
  },
}, null, 2));

console.log(`Built graph to ${DIST_DIR}`);
