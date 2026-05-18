/**
 * Build script with spinner feedback for each step.
 * Replaces the shell one-liner: pnpm wasmbuild && pnpm napibuild && ...
 *
 * Usage: deno run -A scripts/build.ts
 */

import process from "node:process";
import { join } from "node:path";
import { createSpinner } from "@tidy-ts/shims/spinner";

// --- Rust change detection ---

async function newestMtime(dir: string): Promise<number> {
  let newest = 0;
  for await (const entry of Deno.readDir(dir)) {
    const path = join(dir, entry.name);
    if (entry.isDirectory) {
      newest = Math.max(newest, await newestMtime(path));
    } else if (entry.name.endsWith(".rs") || entry.name.endsWith(".toml")) {
      const stat = await Deno.stat(path);
      if (stat.mtime) newest = Math.max(newest, stat.mtime.getTime());
    }
  }
  return newest;
}

async function rustChanged(): Promise<boolean> {
  const sourceNewest = Math.max(
    await newestMtime("packages/dataframe/rust"),
    (await Deno.stat("Cargo.toml")).mtime?.getTime() ?? 0,
    (await Deno.stat("Cargo.lock")).mtime?.getTime() ?? 0,
  );

  const outputs = [
    "packages/dataframe/lib/tidy_ts_dataframe.wasm",
    "packages/dataframe/lib/tidy_ts_dataframe.darwin-arm64.node",
    "packages/npm-darwin-arm64/tidy_ts_dataframe.darwin-arm64.node",
  ];

  for (const path of outputs) {
    try {
      const stat = await Deno.stat(path);
      if (!stat.mtime || stat.mtime.getTime() < sourceNewest) return true;
    } catch {
      return true; // output doesn't exist
    }
  }
  return false;
}

// --- Build steps ---

interface Step {
  label: string;
  cmd: string[];
  skip?: () => Promise<boolean>;
}

const needsRustBuild = rustChanged();

const steps: Step[] = [
  { label: "Building WASM", cmd: ["pnpm", "wasmbuild"], skip: async () => !(await needsRustBuild) },
  { label: "Building native addon [darwin-arm64]", cmd: ["pnpm", "napibuild"], skip: async () => !(await needsRustBuild) },
  { label: "Building native addon [win32-x64]", cmd: ["pnpm", "napibuild:win32-x64"], skip: async () => !(await needsRustBuild) },
  { label: "Type checking shims", cmd: ["pnpm", "check:shims"] },
  { label: "Type checking dataframe", cmd: ["pnpm", "check:dataframe"] },
  { label: "Type checking graph", cmd: ["pnpm", "check:graph"] },
  { label: "Testing dataframe", cmd: ["pnpm", "test:dataframe"] },
  { label: "Building npm packages", cmd: ["pnpm", "build:npm"] },
  { label: "Committing build artifacts", cmd: ["sh", "-c", "git add packages/dataframe/lib/ && git commit -m 'build'"] },
];

for (const step of steps) {
  if (step.skip && await step.skip()) {
    console.log(`⊘ ${step.label} (no changes)`);
    continue;
  }

  const spinner = createSpinner(step.label);

  const command = new Deno.Command(step.cmd[0], {
    args: step.cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    await spinner.stop(`✓ ${step.label}`);
  } else {
    await spinner.stop(`✗ ${step.label}`);
    const err = new TextDecoder().decode(stderr);
    const out = new TextDecoder().decode(stdout);
    if (err.length) console.error(err);
    else if (out.length) console.error(out);
    process.exit(code);
  }
}

console.log("\nBuild complete.");
