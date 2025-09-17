#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust mannWhitneyTest function...\n");

  // Test data
  const sample1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sample2 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const testCases = [
    {
      testName: "mannWhitneyTest (two.sided, α=0.05)",
      func: "wilcox.test.mannwhitney",
      distribution: "mann_whitney",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "two.sided", "0.05"],
    },
    {
      testName: "mannWhitneyTest (less, α=0.01)",
      func: "wilcox.test.mannwhitney",
      distribution: "mann_whitney",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "less", "0.01"],
    },
    {
      testName: "mannWhitneyTest (greater, α=0.10)",
      func: "wilcox.test.mannwhitney",
      distribution: "mann_whitney",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
