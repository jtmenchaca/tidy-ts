/**
 * Demo: cycles through all three animations for 7 seconds each.
 * Usage: deno run -A packages/shims/spinner/demo.ts
 */

import process from "node:process";
import { createSpinner, type SpinnerStyle } from "./spinner.ts";

const styles: SpinnerStyle[] = ["lava", "invaders"];
const DURATION = 7;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const style of styles) {
  const spinner = createSpinner(`${style} — ${DURATION}s remaining`, style);
  for (let s = DURATION - 1; s > 0; s--) {
    await sleep(1000);
    spinner.update(`${style} — ${s}s remaining`);
  }
  await sleep(1000);
  await spinner.stop('Done');
}

console.log("\nAll animations demo complete!");
process.exit(0);
