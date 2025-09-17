#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust pearsonTest function...\n");

  // Test data - two correlated variables
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [2.1, 3.9, 6.1, 7.8, 10.2, 11.9, 14.1, 15.8, 18.1, 20.2];

  const testCases = [
    {
      testName: "pearsonTest",
      func: "cor.test.pearson",
      distribution: "correlation",
      args: [JSON.stringify(x), JSON.stringify(y), "pearson"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
