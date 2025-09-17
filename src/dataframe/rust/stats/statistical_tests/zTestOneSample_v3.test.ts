#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust zTestOneSample function...\n");

  // Test data
  const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const popMean = 5.5;
  const popStd = 2.0;

  const testCases = [
    {
      testName: "zTestOneSample (two.sided, α=0.05)",
      func: "z.test.one",
      distribution: "z_test",
      args: [JSON.stringify(sample), popMean.toString(), popStd.toString(), "two.sided", "0.05"],
    },
    {
      testName: "zTestOneSample (less, α=0.01)",
      func: "z.test.one",
      distribution: "z_test",
      args: [JSON.stringify(sample), popMean.toString(), popStd.toString(), "less", "0.01"],
    },
    {
      testName: "zTestOneSample (greater, α=0.10)",
      func: "z.test.one",
      distribution: "z_test",
      args: [JSON.stringify(sample), popMean.toString(), popStd.toString(), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
