#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust beta functions...\n");

  const testCases = [
    { func: "dbeta", distribution: "beta", args: [0.5, 2, 3, 0] },
    { func: "pbeta", distribution: "beta", args: [0.5, 2, 3, 1, 0] },
    { func: "qbeta", distribution: "beta", args: [0.6875, 2, 3, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rbeta separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rbetaResult = await callR("rbeta", "beta", 1, 2, 3);
    console.log(`rbeta(2, 3) = ${rbetaResult}`);
  } catch (error) {
    console.log(`rbeta: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
