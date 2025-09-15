#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust chi-squared functions...\n");

  const testCases = [
    { func: "dchisq", distribution: "chi_squared", args: [1, 5, 0] },
    { func: "pchisq", distribution: "chi_squared", args: [1, 5, 1, 0] },
    { func: "qchisq", distribution: "chi_squared", args: [0.5, 5, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rchisq separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rchisqResult = await callR("rchisq", "chi_squared", 1, 5);
    console.log(`rchisq(5) = ${rchisqResult}`);
  } catch (error) {
    console.log(`rchisq: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
