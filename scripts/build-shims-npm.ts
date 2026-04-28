import * as esbuild from "esbuild";
import { rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SHIMS_DIR = "packages/shims";
const DIST_DIR = join(SHIMS_DIR, "dist");

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
};

await esbuild.build({
  entryPoints,
  outdir: DIST_DIR,
  format: "esm",
  platform: "node",
  target: "node18",
  bundle: true,
  splitting: true,
  external: ["node:*", "bun:*"],
});

// Write npm-specific package.json into dist/
const pkg = JSON.parse(readFileSync(join(SHIMS_DIR, "package.json"), "utf8"));
writeFileSync(join(DIST_DIR, "package.json"), JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  type: "module",
  main: "./mod.js",
  exports: {
    ".": "./mod.js",
    "./detect": "./detect.js",
    "./result": "./result.js",
    "./errors": "./errors.js",
    "./async": "./async.js",
    "./fetch": "./fetch.js",
    "./encryption": "./encryption/mod.js",
  },
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/jtmenchaca/tidy-ts.git" },
  homepage: "https://github.com/jtmenchaca/tidy-ts#readme",
  bugs: { url: "https://github.com/jtmenchaca/tidy-ts/issues" },
}, null, 2));

// Copy README into dist so npm publish includes it
cpSync(join(SHIMS_DIR, "README.md"), join(DIST_DIR, "README.md"));

console.log(`Built shims to ${DIST_DIR}`);
