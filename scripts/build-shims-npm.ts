import * as esbuild from "esbuild";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const SHIMS_DIR = "packages/shims";
const DIST_DIR = join(SHIMS_DIR, "dist");
const TSC_DIR = join(DIST_DIR, ".tsc");
const ROOT = resolve(".");

// Clean and recreate dist
rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });
mkdirSync(join(DIST_DIR, "encryption"), { recursive: true });

// Entry points matching deno.jsonc exports
const entryPoints: Record<string, string> = {
  mod: join(SHIMS_DIR, "mod.ts"),
  detect: join(SHIMS_DIR, "detect.ts"),
  result: join(SHIMS_DIR, "result.ts"),
  errors: join(SHIMS_DIR, "errors.ts"),
  async: join(SHIMS_DIR, "async.ts"),
  fetch: join(SHIMS_DIR, "fetch.ts"),
  "encryption/mod": join(SHIMS_DIR, "encryption/mod.ts"),
  "temporal-polyfill": join(SHIMS_DIR, "temporal-polyfill/impl.ts"),
  "temporal-zod": join(SHIMS_DIR, "temporal-zod/index.ts"),
  "temporal-zod/base": join(SHIMS_DIR, "temporal-zod/base/index.ts"),
};

// --- Step 1: Bundle JS with esbuild ---
await esbuild.build({
  entryPoints,
  outdir: DIST_DIR,
  format: "esm",
  platform: "node",
  target: "node18",
  bundle: true,
  splitting: true,
  external: ["node:*", "bun:*", "zod"],
});

// --- Step 2: Generate .d.ts files via tsc + rollup-plugin-dts ---
// (Following temporal-polyfill's approach: tsc emits per-file .d.ts, then rollup bundles them)

// Write temporary build-time global declarations (Deno + Temporal aren't in @types/node)
const GLOBALS_PATH = join(SHIMS_DIR, "_build-globals.d.ts");
writeFileSync(GLOBALS_PATH, `\
// Auto-generated at build time — provides globals that exist at runtime but not in @types/node
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

// Write temporary tsconfig for declaration emission
const TSCONFIG_PATH = join(SHIMS_DIR, "tsconfig.build.json");
const shimsAbsDir = resolve(SHIMS_DIR);
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
    rootDir: shimsAbsDir,
    types: ["node"],
    typeRoots: [resolve("node_modules/@types")],
  },
  files: [resolve(GLOBALS_PATH)],
  include: [`${shimsAbsDir}/**/*.ts`, `${shimsAbsDir}/**/*.d.ts`],
  exclude: [
    `${shimsAbsDir}/node_modules/**`,
    `${shimsAbsDir}/dist/**`,
    `${shimsAbsDir}/**/*.test.ts`,
    `${shimsAbsDir}/spinner/**`,
    `${shimsAbsDir}/test/**`,
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
  console.error("ERROR: tsc did not emit declaration files");
  process.exit(1);
}

// Bundle .d.ts files with rollup-plugin-dts
const dtsInputs: Record<string, string> = {
  mod: `${TSC_DIR}/mod.d.ts`,
  detect: `${TSC_DIR}/detect.d.ts`,
  result: `${TSC_DIR}/result.d.ts`,
  errors: `${TSC_DIR}/errors.d.ts`,
  async: `${TSC_DIR}/async.d.ts`,
  fetch: `${TSC_DIR}/fetch.d.ts`,
  "encryption/mod": `${TSC_DIR}/encryption/mod.d.ts`,
  "temporal-polyfill": `${TSC_DIR}/temporal-polyfill/impl.d.ts`,
  "temporal-zod": `${TSC_DIR}/temporal-zod/index.d.ts`,
  "temporal-zod/base": `${TSC_DIR}/temporal-zod/base/index.d.ts`,
};

const bundle = await rollup({
  input: dtsInputs,
  plugins: [dts()],
  external: ["zod"],
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
const pkg = JSON.parse(readFileSync(join(SHIMS_DIR, "package.json"), "utf8"));
writeFileSync(join(DIST_DIR, "package.json"), JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  type: "module",
  main: "./mod.js",
  types: "./mod.d.ts",
  exports: {
    ".":                 { types: "./mod.d.ts",               import: "./mod.js" },
    "./detect":          { types: "./detect.d.ts",            import: "./detect.js" },
    "./result":          { types: "./result.d.ts",            import: "./result.js" },
    "./errors":          { types: "./errors.d.ts",            import: "./errors.js" },
    "./async":           { types: "./async.d.ts",             import: "./async.js" },
    "./fetch":           { types: "./fetch.d.ts",             import: "./fetch.js" },
    "./encryption":      { types: "./encryption/mod.d.ts",    import: "./encryption/mod.js" },
    "./temporal-polyfill": { types: "./temporal-polyfill.d.ts", import: "./temporal-polyfill.js" },
    "./temporal-zod":    { types: "./temporal-zod.d.ts",      import: "./temporal-zod.js" },
    "./temporal-zod/base": { types: "./temporal-zod/base.d.ts", import: "./temporal-zod/base.js" },
  },
  dependencies: {
    "zod": "^4.1.8",
  },
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/jtmenchaca/tidy-ts.git" },
  homepage: "https://github.com/jtmenchaca/tidy-ts#readme",
  bugs: { url: "https://github.com/jtmenchaca/tidy-ts/issues" },
}, null, 2));

// Copy README into dist so npm publish includes it
cpSync(join(SHIMS_DIR, "README.md"), join(DIST_DIR, "README.md"));

console.log(`Built shims to ${DIST_DIR}`);
