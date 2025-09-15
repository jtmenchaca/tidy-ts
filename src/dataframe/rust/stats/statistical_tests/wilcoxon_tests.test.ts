#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust Wilcoxon signed-rank test functions...\n");

  // Test data - paired samples
  const before = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const after = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const testCases = [
    {
      testName: "Wilcoxon signed-rank test",
      func: "wilcox.test.signedrank",
      distribution: "wilcoxon",
      args: [
        JSON.stringify(before),
        JSON.stringify(after),
        "two.sided",
        "0.05",
      ],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
