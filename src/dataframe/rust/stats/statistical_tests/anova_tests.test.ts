#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust ANOVA functions...\n");

  // Test data - three groups
  const group1 = [1, 2, 3, 4, 5];
  const group2 = [2, 3, 4, 5, 6];
  const group3 = [3, 4, 5, 6, 7];
  const groups = [group1, group2, group3];

  const testCases = [
    {
      testName: "One-way ANOVA",
      func: "aov.one",
      distribution: "anova",
      args: [JSON.stringify(groups), "0.05"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}
