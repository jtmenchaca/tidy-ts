#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust z-test functions...\n");

  // Test data
  const sample1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sample2 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const popMean = 5.5;
  const popStd = 2.0;

  const testCases = [
    {
      testName: "One-sample z-test",
      func: "z.test.one",
      distribution: "z_test",
      args: [
        JSON.stringify(sample1),
        popMean.toString(),
        popStd.toString(),
        "two.sided",
        "0.05",
      ],
    },
    {
      testName: "Two-sample z-test",
      func: "z.test.two",
      distribution: "z_test",
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
