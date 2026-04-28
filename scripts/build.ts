/**
 * Build script with spinner feedback for each step.
 * Replaces the shell one-liner: pnpm wasmbuild && pnpm napibuild && ...
 *
 * Usage: deno run -A scripts/build.ts
 */

import { execSync } from "node:child_process";
import process from "node:process";
import { createSpinner } from "@tidy-ts/shims/spinner";

interface Step {
  label: string;
  command: string;
}

const steps: Step[] = [
  { label: "Building WASM", command: "pnpm wasmbuild" },
  { label: "Building native addon (darwin-arm64)", command: "pnpm napibuild" },
  { label: "Building native addon (win32-x64)", command: "pnpm napibuild:win32-x64" },
  { label: "Committing build artifacts", command: "git add -A && git commit -m 'build'" },
];

for (const step of steps) {
  const spinner = createSpinner(step.label);
  try {
    execSync(step.command, { stdio: "pipe" });
    await spinner.stop(`✓ ${step.label}`);
  } catch (err) {
    await spinner.stop(`✗ ${step.label}`);
    const output = (err as { stdout?: Uint8Array; stderr?: Uint8Array });
    if (output.stderr?.length) {
      console.error(new TextDecoder().decode(output.stderr));
    } else if (output.stdout?.length) {
      console.error(new TextDecoder().decode(output.stdout));
    }
    process.exit(1);
  }
}

console.log("\nBuild complete.");
