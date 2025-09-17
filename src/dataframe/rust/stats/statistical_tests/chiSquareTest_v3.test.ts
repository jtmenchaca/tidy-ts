#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust chiSquareTest function...\n");

  // Test data - 2x2 contingency table
  const contingencyTable = [
    [10, 20], // Row 1
    [15, 25], // Row 2
  ];

  const testCases = [
    {
      testName: "chiSquareTest (2x2)",
      func: "chisq.test.independence",
      distribution: "chi_square",
      args: [JSON.stringify(contingencyTable)],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
