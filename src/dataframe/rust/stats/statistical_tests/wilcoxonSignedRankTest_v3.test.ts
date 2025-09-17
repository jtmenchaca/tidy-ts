#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust wilcoxonSignedRankTest function...\n");

  // Test data - paired samples
  const before = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const after = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const testCases = [
    {
      testName: "wilcoxonSignedRankTest (two.sided, α=0.05)",
      func: "wilcox.test.signedrank",
      distribution: "wilcoxon",
      args: [JSON.stringify(before), JSON.stringify(after), "two.sided", "0.05"],
    },
    {
      testName: "wilcoxonSignedRankTest (less, α=0.01)",
      func: "wilcox.test.signedrank",
      distribution: "wilcoxon",
      args: [JSON.stringify(before), JSON.stringify(after), "less", "0.01"],
    },
    {
      testName: "wilcoxonSignedRankTest (greater, α=0.10)",
      func: "wilcox.test.signedrank",
      distribution: "wilcoxon",
      args: [JSON.stringify(before), JSON.stringify(after), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
