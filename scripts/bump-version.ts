/**
 * Bump the version across the entire monorepo.
 *
 * Usage:
 *   pnpm bump          # Report current version
 *   pnpm bump 1.4.1    # Bump to 1.4.1
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

if (!Deno.args[0]) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  console.log(`Current version: ${pkg.version}`);
  Deno.exit(0);
}

const NEW_VERSION = Deno.args[0];

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(NEW_VERSION)) {
  console.error(`Invalid version: ${NEW_VERSION}`);
  Deno.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function replaceInFile(
  path: string,
  replacements: [pattern: RegExp, replacement: string][],
) {
  let content = readFileSync(path, "utf8");
  let changed = false;
  for (const [pattern, replacement] of replacements) {
    const next = content.replace(pattern, replacement);
    if (next !== content) changed = true;
    content = next;
  }
  if (changed) {
    writeFileSync(path, content);
    console.log(`  updated ${path}`);
  } else {
    console.log(`  (no change) ${path}`);
  }
}

/** Replace `"version": "..."` in a JSON/JSONC file. */
function jsonVersion(path: string) {
  replaceInFile(path, [
    [/("version"\s*:\s*")[\d]+\.[\d]+\.[\d]+[^"]*"/, `$1${NEW_VERSION}"`],
  ]);
}

// ── Version locations ────────────────────────────────────────────────────────

console.log(`Bumping to ${NEW_VERSION}\n`);

// Root
jsonVersion("package.json");
jsonVersion("deno.jsonc");

// Cargo.toml
replaceInFile("Cargo.toml", [
  [/(version\s*=\s*")[\d]+\.[\d]+\.[\d]+[^"]*"/, `$1${NEW_VERSION}"`],
]);

// Dataframe
jsonVersion("packages/dataframe/package.json");
replaceInFile("packages/dataframe/deno.jsonc", [
  [/("version"\s*:\s*")[\d]+\.[\d]+\.[\d]+[^"]*"/, `$1${NEW_VERSION}"`],
  [/("@tidy-ts\/shims[^"]*"\s*:\s*"jsr:@tidy-ts\/shims@)[\d]+\.[\d]+\.[\d]+[^"]*"/g, `$1${NEW_VERSION}"`],
]);

// Shims
jsonVersion("packages/shims/package.json");
jsonVersion("packages/shims/deno.jsonc");

// Native addons
jsonVersion("packages/npm-darwin-arm64/package.json");
jsonVersion("packages/npm-win32-x64/package.json");

// Downstream shims imports (arrow, parquet)
replaceInFile("packages/arrow/deno.jsonc", [
  [/("@tidy-ts\/shims[^"]*"\s*:\s*"jsr:@tidy-ts\/shims@)[\d]+\.[\d]+\.[\d]+[^"]*"/g, `$1${NEW_VERSION}"`],
]);
replaceInFile("packages/parquet/deno.jsonc", [
  [/("@tidy-ts\/shims[^"]*"\s*:\s*"jsr:@tidy-ts\/shims@)[\d]+\.[\d]+\.[\d]+[^"]*"/g, `$1${NEW_VERSION}"`],
]);

// Build script shims dependency
replaceInFile("scripts/build-dataframe-npm.ts", [
  [/("@tidy-ts\/shims"\s*:\s*")[\d]+\.[\d]+\.[\d]+[^"]*"/, `$1${NEW_VERSION}"`],
]);

// Git commit
console.log(`\nCommitting...`);
execSync("git add -A", { stdio: "inherit" });
execSync(`git commit -m "v${NEW_VERSION}"`, { stdio: "inherit" });

console.log(`\nDone. All versions set to ${NEW_VERSION} and committed.`);
