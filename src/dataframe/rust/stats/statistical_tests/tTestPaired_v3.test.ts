#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust tTestPaired function...\n");

  // Test data - paired samples with some variation
  const before = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const after = [1.5, 2.8, 3.2, 4.1, 5.3, 6.7, 7.9, 8.4, 9.6, 10.2];

  const testCases = [
    {
      testName: "tTestPaired (two.sided, α=0.05)",
      func: "t.test.paired",
      distribution: "t_test",
      args: [
        JSON.stringify(before),
        JSON.stringify(after),
        "two.sided",
        "0.05",
      ],
    },
    {
      testName: "tTestPaired (less, α=0.01)",
      func: "t.test.paired",
      distribution: "t_test",
      args: [JSON.stringify(before), JSON.stringify(after), "less", "0.01"],
    },
    {
      testName: "tTestPaired (greater, α=0.10)",
      func: "t.test.paired",
      distribution: "t_test",
      args: [JSON.stringify(before), JSON.stringify(after), "greater", "0.10"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
