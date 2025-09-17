#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust post-hoc test functions...\n");

  // Test data - same groups used across all tests
  const groups = [
    [12.1, 13.4, 11.8, 14.2, 12.9],
    [15.2, 16.1, 14.8, 17.3, 15.9],
    [12.3, 13.1, 12.8, 13.5, 12.9],
    [18.1, 19.2, 17.8, 18.9, 19.5],
  ];
  const alpha = 0.05;

  const testCases = [
    {
      testName: "Tukey HSD",
      func: "post.hoc.tukey",
      distribution: "post_hoc_tests",
      args: [JSON.stringify(groups), alpha.toString()],
    },
    {
      testName: "Games-Howell",
      func: "post.hoc.gameshowell", 
      distribution: "post_hoc_tests",
      args: [JSON.stringify(groups), alpha.toString()],
    },
    {
      testName: "Dunn's Test",
      func: "post.hoc.dunn",
      distribution: "post_hoc_tests",
      args: [JSON.stringify(groups), alpha.toString()],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}