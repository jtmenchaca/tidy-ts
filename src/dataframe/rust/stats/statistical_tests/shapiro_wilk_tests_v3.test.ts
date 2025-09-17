#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust Shapiro-Wilk test functions...\n");

  // Simple test data
  const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const testCases = [
    {
      testName: "Shapiro-Wilk test",
      func: "shapiro.test.normality",
      distribution: "shapiro_wilk",
      args: [JSON.stringify(sample)],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
