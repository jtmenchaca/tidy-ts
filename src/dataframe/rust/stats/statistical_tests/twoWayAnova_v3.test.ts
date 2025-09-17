#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust twoWayAnova function...\n");

  // Test data - 2x3 factorial design
  const data = [
    // Factor A level 1
    [
      [1, 2, 3, 4, 5], // Factor B level 1
      [2, 3, 4, 5, 6], // Factor B level 2
      [3, 4, 5, 6, 7], // Factor B level 3
    ],
    // Factor A level 2
    [
      [4, 5, 6, 7, 8], // Factor B level 1
      [5, 6, 7, 8, 9], // Factor B level 2
      [6, 7, 8, 9, 10], // Factor B level 3
    ],
  ];

  const testCases = [
    {
      testName: "twoWayAnova (α=0.05)",
      func: "aov.two",
      distribution: "two_way_anova",
      args: [JSON.stringify(data), "0.05"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
