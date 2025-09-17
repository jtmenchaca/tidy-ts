#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust fishersExactTest function...\n");

  // Test data - 2x2 contingency table
  const contingencyTable = [
    [5, 10], // Row 1
    [8, 12], // Row 2
  ];

  const testCases = [
    {
      testName: "fishersExactTest (2x2)",
      func: "fisher.test.exact",
      distribution: "fishers_exact",
      args: [JSON.stringify(contingencyTable)],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
