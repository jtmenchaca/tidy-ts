#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust t-test functions...\n");

  // Test data
  const sample1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sample2 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const sample2_paired = [1.1, 2.2, 2.9, 4.1, 5.2, 5.8, 7.1, 8.0, 9.1, 10.2]; // More realistic paired data
  const popMean = 5.5;

  const testCases = [
    {
      testName: "One-sample t-test",
      func: "t.test.one",
      distribution: "t_test",
      args: [JSON.stringify(sample1), popMean.toString(), "two.sided", "0.05"],
    },
    {
      testName: "Two-sample t-test",
      func: "t.test.two",
      distribution: "t_test",
      args: [
        JSON.stringify(sample1),
        JSON.stringify(sample2),
        "two.sided",
        "0.05",
      ],
    },
    {
      testName: "Paired t-test",
      func: "t.test.paired",
      distribution: "t_test",
      args: [
        JSON.stringify(sample1),
        JSON.stringify(sample2_paired),
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
