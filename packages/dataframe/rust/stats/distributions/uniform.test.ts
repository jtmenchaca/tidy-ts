#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust uniform functions...\n");

  const testCases = [
    { func: "dunif", distribution: "uniform", args: [0.5, 0, 1, 0] },
    { func: "punif", distribution: "uniform", args: [0.5, 0, 1, 1, 0] },
    { func: "qunif", distribution: "uniform", args: [0.5, 0, 1, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test runif separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const runifResult = await callR("runif", "uniform", 1, 0, 1);
    console.log(`runif(0, 1) = ${runifResult}`);
  } catch (error) {
    console.log(`runif: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
