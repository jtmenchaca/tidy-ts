#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust proportionTestTwoSample function...\n");

  // Test data - binary outcomes (0s and 1s)
  const sample1 = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1]; // 7 successes out of 10
  const sample2 = [0, 1, 0, 1, 1, 0, 1, 0, 1, 1]; // 6 successes out of 10

  const testCases = [
    {
      testName: "proportionTestTwoSample (two.sided, α=0.05)",
      func: "prop.test.two",
      distribution: "proportion_test",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "two.sided", "0.05"],
    },
    {
      testName: "proportionTestTwoSample (less, α=0.01)",
      func: "prop.test.two",
      distribution: "proportion_test",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "less", "0.01"],
    },
    {
      testName: "proportionTestTwoSample (greater, α=0.10)",
      func: "prop.test.two",
      distribution: "proportion_test",
      args: [JSON.stringify(sample1), JSON.stringify(sample2), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
