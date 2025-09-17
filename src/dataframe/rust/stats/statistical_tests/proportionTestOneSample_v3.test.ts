#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust proportionTestOneSample function...\n");

  // Test data - binary outcomes (0s and 1s)
  const sample = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1]; // 7 successes out of 10
  const p0 = 0.5; // hypothesized proportion

  const testCases = [
    {
      testName: "proportionTestOneSample (two.sided, α=0.05)",
      func: "prop.test.one",
      distribution: "proportion_test",
      args: [JSON.stringify(sample), p0.toString(), "two.sided", "0.05"],
    },
    {
      testName: "proportionTestOneSample (less, α=0.01)",
      func: "prop.test.one",
      distribution: "proportion_test",
      args: [JSON.stringify(sample), p0.toString(), "less", "0.01"],
    },
    {
      testName: "proportionTestOneSample (greater, α=0.10)",
      func: "prop.test.one",
      distribution: "proportion_test",
      args: [JSON.stringify(sample), p0.toString(), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
