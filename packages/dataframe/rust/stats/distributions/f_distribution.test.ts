#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust F distribution functions...\n");

  const testCases = [
    { func: "df", distribution: "f_distribution", args: [1, 5, 10, 0] },
    { func: "pf", distribution: "f_distribution", args: [1, 5, 10, 1, 0] },
    { func: "qf", distribution: "f_distribution", args: [0.5, 5, 10, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rf separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rfResult = await callR("rf", "f_distribution", 1, 5, 10);
    console.log(`rf(5, 10) = ${rfResult}`);
  } catch (error) {
    console.log(`rf: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
