#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust proportion test functions...\n");

  // Test data - binary outcomes (0s and 1s)
  const sample1 = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1]; // 7 successes out of 10
  const sample2 = [0, 1, 0, 1, 1, 0, 1, 0, 1, 1]; // 6 successes out of 10
  const p0 = 0.5; // hypothesized proportion

  const testCases = [
    {
      testName: "One-sample proportion test",
      func: "prop.test.one",
      distribution: "proportion_test",
      args: [JSON.stringify(sample1), p0.toString(), "two.sided", "0.05"],
    },
    {
      testName: "Two-sample proportion test",
      func: "prop.test.two",
      distribution: "proportion_test",
      args: [
        JSON.stringify(sample1),
        JSON.stringify(sample2),
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
