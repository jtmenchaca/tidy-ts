import * as esbuild from "esbuild";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DF_DIR = "packages/dataframe";
const DIST_DIR = join(DF_DIR, "dist");

// Clean dist
rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

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
    "@tidy-ts/dataframe-*",
    "zod",
    "vega",
    "vega-embed",
    "vega-lite",
    "temporal-polyfill",
  ],
});

// Copy WASM file next to the JS output
cpSync(join(DF_DIR, "lib/tidy_ts_dataframe.wasm"), join(DIST_DIR, "tidy_ts_dataframe.wasm"));

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

// Write npm-specific package.json into dist/
const pkg = JSON.parse(readFileSync(join(DF_DIR, "package.json"), "utf8"));
writeFileSync(join(DIST_DIR, "package.json"), JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  description: "Type-safe data analytics and statistics framework for TypeScript.",
  type: "module",
  main: "./index.js",
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/jtmenchaca/tidy-ts.git" },
  homepage: "https://github.com/jtmenchaca/tidy-ts#readme",
  bugs: { url: "https://github.com/jtmenchaca/tidy-ts/issues" },
  keywords: ["dataframe", "data-analysis", "statistics", "typescript", "glm", "regression", "tidy-data"],
  dependencies: {
    "@tidy-ts/shims": "1.4.2",
    "zod": "^4.1.8",
    "vega": "^6.2.0",
    "vega-embed": "^7.0.2",
    "vega-lite": "^6.4.1",
    "temporal-polyfill": "^0.3.2",
  },
  optionalDependencies: {
    "@tidy-ts/dataframe-darwin-arm64": pkg.version,
    "@tidy-ts/dataframe-win32-x64": pkg.version,
  },
}, null, 2));

// Copy README into dist so npm publish includes it
cpSync(join(DF_DIR, "README.md"), join(DIST_DIR, "README.md"));

console.log(`Built dataframe to ${DIST_DIR}`);
