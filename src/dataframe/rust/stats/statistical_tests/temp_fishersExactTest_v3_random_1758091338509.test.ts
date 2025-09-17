#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust fishersExactTest_v3 with random data...\n");

  const testCases = [
  {
    "testName": "Random Fisher's exact test (2×2 table)",
    "func": "fisher.test.exact",
    "distribution": "fishers_exact",
    "args": [
      "[[5,6],[5,2]]"
    ]
  },
  {
    "testName": "Random Fisher's exact test (2×2 table)",
    "func": "fisher.test.exact",
    "distribution": "fishers_exact",
    "args": [
      "[[0,6],[1,12]]"
    ]
  }
];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}