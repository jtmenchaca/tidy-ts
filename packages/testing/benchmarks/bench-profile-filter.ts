#!/usr/bin/env -S deno run -A
/**
 * Profile filter call overhead by enabling __TIDY_PROFILE flag.
 * Shows exactly where time goes in filter calls.
 */

(globalThis as any).__TIDY_PROFILE = true;

import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const rows = Array.from({ length: N }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// Warmup
console.log("=== Warmup ===");
df.filter((r) => r.x > 50);

console.log("\n=== Profiled filter (r => r.x > 50) ===");
let t = performance.now();
df.filter((r) => r.x > 50);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

console.log("\n=== Profiled filter (r => r.x > 50 && r.y < 25) ===");
t = performance.now();
df.filter((r) => r.x > 50 && r.y < 25);
console.log(`  TOTAL: ${(performance.now() - t).toFixed(4)}ms`);

console.log("\nDone.");
