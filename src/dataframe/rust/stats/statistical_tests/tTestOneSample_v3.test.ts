#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust tTestOneSample function...\n");

  // Test data
  const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const testCases = [
    {
      testName: "tTestOneSample (two.sided, α=0.05)",
      func: "t.test.one",
      distribution: "t_test",
      args: [JSON.stringify(sample), "0", "two.sided", "0.05"],
    },
    {
      testName: "tTestOneSample (less, α=0.01)",
      func: "t.test.one",
      distribution: "t_test",
      args: [JSON.stringify(sample), "0", "less", "0.01"],
    },
    {
      testName: "tTestOneSample (greater, α=0.10)",
      func: "t.test.one",
      distribution: "t_test",
      args: [JSON.stringify(sample), "0", "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
