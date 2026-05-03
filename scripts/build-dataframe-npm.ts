import * as esbuild from "esbuild";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const DF_DIR = "packages/dataframe";
const DIST_DIR = join(DF_DIR, "dist");
const TSC_DIR = join(DIST_DIR, ".tsc");

// Clean dist
rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

// --- Step 1: Bundle JS with esbuild ---
await esbuild.build({
  entryPoints: { index: join(DF_DIR, "mod.ts") },
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
    "@tidy-ts/dataframe-*",
    "zod",
    "vega",
    "vega-embed",
    "vega-lite",
  ],
});

// Copy WASM files and supporting assets next to the JS output
cpSync(join(DF_DIR, "lib/tidy_ts_dataframe.wasm"), join(DIST_DIR, "tidy_ts_dataframe.wasm"));
cpSync(join(DF_DIR, "lib/tidy_ts_dataframe.internal.js"), join(DIST_DIR, "tidy_ts_dataframe.internal.js"));
cpSync(join(DF_DIR, "ts/graph/resvg-wasm-2.6.3-alpha.0_bg.wasm"), join(DIST_DIR, "resvg-wasm-2.6.3-alpha.0_bg.wasm"));
cpSync(join(DF_DIR, "ts/graph/fonts"), join(DIST_DIR, "fonts"), { recursive: true });

// Fix WASM paths in bundled JS — original code has ../../lib/tidy_ts_dataframe.wasm
// which won't resolve from dist/. Rewrite to ./tidy_ts_dataframe.wasm since it's alongside.
for (const file of readdirSync(DIST_DIR)) {
  if (!file.endsWith(".js")) continue;
  const path = join(DIST_DIR, file);
  let content = readFileSync(path, "utf8");
  if (content.includes("tidy_ts_dataframe.wasm")) {
    content = content.replaceAll("../../lib/tidy_ts_dataframe.wasm", "./tidy_ts_dataframe.wasm");
    content = content.replaceAll("lib/tidy_ts_dataframe.wasm", "./tidy_ts_dataframe.wasm");
    writeFileSync(path, content);
  }
}

// --- Step 2: Generate .d.ts via tsc + rollup-plugin-dts ---

// Write temporary build-time global declarations
const GLOBALS_PATH = join(DF_DIR, "_build-globals.d.ts");
writeFileSync(GLOBALS_PATH, `\
// Auto-generated at build time — provides globals not in @types/node
declare const Deno: any;
declare namespace Temporal {
  type ComparisonResult = -1 | 0 | 1;
  class PlainDate { constructor(y: number, m: number, d: number); static from(item: any, options?: any): PlainDate; static compare(a: PlainDate, b: PlainDate): ComparisonResult; readonly year: number; readonly month: number; readonly day: number; toString(): string; toJSON(): string; equals(other: PlainDate): boolean; }
  class PlainTime { constructor(h?: number, m?: number, s?: number, ms?: number, us?: number, ns?: number); static from(item: any, options?: any): PlainTime; static compare(a: PlainTime, b: PlainTime): ComparisonResult; readonly hour: number; readonly minute: number; readonly second: number; toString(): string; toJSON(): string; }
  class PlainDateTime { constructor(y: number, m: number, d: number, h?: number, min?: number, s?: number, ms?: number, us?: number, ns?: number); static from(item: any, options?: any): PlainDateTime; static compare(a: PlainDateTime, b: PlainDateTime): ComparisonResult; toString(): string; toJSON(): string; }
  class PlainMonthDay { static from(item: any, options?: any): PlainMonthDay; toString(): string; toJSON(): string; }
  class PlainYearMonth { static from(item: any, options?: any): PlainYearMonth; toString(): string; toJSON(): string; }
  class ZonedDateTime { static from(item: any, options?: any): ZonedDateTime; static compare(a: ZonedDateTime, b: ZonedDateTime): ComparisonResult; toString(): string; toJSON(): string; }
  class Instant { constructor(epochNanoseconds: bigint); static from(item: any): Instant; static fromEpochMilliseconds(ms: number): Instant; static fromEpochNanoseconds(ns: bigint): Instant; static compare(a: Instant, b: Instant): ComparisonResult; readonly epochMilliseconds: number; readonly epochNanoseconds: bigint; toString(): string; toJSON(): string; }
  class Duration { constructor(y?: number, mo?: number, w?: number, d?: number, h?: number, min?: number, s?: number, ms?: number, us?: number, ns?: number); static from(item: any): Duration; static compare(a: Duration, b: Duration): ComparisonResult; readonly sign: ComparisonResult; readonly blank: boolean; toString(): string; toJSON(): string; }
  const Now: { instant(): Instant; zonedDateTimeISO(tz?: string): ZonedDateTime; plainDateTimeISO(tz?: string): PlainDateTime; plainDateISO(tz?: string): PlainDate; plainTimeISO(tz?: string): PlainTime; timeZoneId(): string; };
}
`);

// Write temporary tsconfig
const TSCONFIG_PATH = join(DF_DIR, "tsconfig.build.json");
const dfAbsDir = resolve(DF_DIR);
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
    rootDir: dfAbsDir,
    types: ["node"],
    typeRoots: [resolve("node_modules/@types")],
    paths: {
      "@tidy-ts/shims": [`${shimsAbsDir}/mod.ts`],
      "@tidy-ts/shims/*": [`${shimsAbsDir}/*.ts`, `${shimsAbsDir}/*/index.ts`],
    },
  },
  files: [resolve(GLOBALS_PATH)],
  include: [`${dfAbsDir}/**/*.ts`],
  exclude: [
    `${dfAbsDir}/node_modules/**`,
    `${dfAbsDir}/dist/**`,
    `${dfAbsDir}/**/*.test.ts`,
    `${dfAbsDir}/rust/**`,
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
  console.error("ERROR: tsc did not emit declaration files for dataframe");
  process.exit(1);
}

// Bundle .d.ts with rollup-plugin-dts
const bundle = await rollup({
  input: { index: `${TSC_DIR}/mod.d.ts` },
  plugins: [dts()],
  external: [
    "zod",
    /^@tidy-ts\/shims/,
    /^@tidy-ts\/dataframe-/,
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
const pkg = JSON.parse(readFileSync(join(DF_DIR, "package.json"), "utf8"));
writeFileSync(join(DIST_DIR, "package.json"), JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  description: "Type-safe data analytics and statistics framework for TypeScript.",
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
  keywords: ["dataframe", "data-analysis", "statistics", "typescript", "glm", "regression", "tidy-data"],
  dependencies: {
    "@tidy-ts/shims": "1.4.6",
    "zod": "^4.1.8",
  },
  optionalDependencies: {
    "@tidy-ts/dataframe-darwin-arm64": pkg.version,
    "@tidy-ts/dataframe-win32-x64": pkg.version,
    "vega": "^6.2.0",
    "vega-embed": "^7.0.2",
    "vega-lite": "^6.4.1",
  },
}, null, 2));

// Copy README into dist so npm publish includes it
cpSync(join(DF_DIR, "README.md"), join(DIST_DIR, "README.md"));

console.log(`Built dataframe to ${DIST_DIR}`);
