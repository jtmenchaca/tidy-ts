#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust zTestTwoSample function...\n");

  // Test data
  const sample1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sample2 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const testCases = [
    {
      testName: "zTestTwoSample (two.sided, α=0.05)",
      func: "z.test.two",
      distribution: "z_test",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "two.sided", "0.05"],
    },
    {
      testName: "zTestTwoSample (less, α=0.01)",
      func: "z.test.two",
      distribution: "z_test",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "less", "0.01"],
    },
    {
      testName: "zTestTwoSample (greater, α=0.10)",
      func: "z.test.two",
      distribution: "z_test",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
