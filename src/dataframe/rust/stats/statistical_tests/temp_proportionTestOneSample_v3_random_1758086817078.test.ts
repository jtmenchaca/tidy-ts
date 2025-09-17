#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust proportionTestOneSample_v3 with random data...\n");

  const testCases = [
  {
    "testName": "Random One-sample proportion test (p₀=0.54, greater, α=0.01)",
    "func": "prop.test.one",
    "distribution": "proportion_test",
    "args": [
      "[1,0,0,0,0,0,1,1,0,1,0]",
      "0.5382722010250569",
      "greater",
      "0.01"
    ]
  }
];

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}