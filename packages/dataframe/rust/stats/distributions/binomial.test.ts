#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust binomial functions...\n");

  const testCases = [
    { func: "dbinom", distribution: "binomial", args: [3, 10, 0.5, 0] },
    { func: "pbinom", distribution: "binomial", args: [3, 10, 0.5, 1, 0] },
    { func: "qbinom", distribution: "binomial", args: [0.5, 10, 0.5, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rbinom separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rbinomResult = await callR("rbinom", "binomial", 1, 10, 0.5);
    console.log(`rbinom(10, 0.5) = ${rbinomResult}`);
  } catch (error) {
    console.log(`rbinom: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
