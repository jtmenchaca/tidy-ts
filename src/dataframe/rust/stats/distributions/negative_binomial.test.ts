#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust negative binomial functions...\n");

  const testCases = [
    {
      func: "dnbinom",
      distribution: "negative_binomial",
      args: [2, 5, 0.3, 0],
    },
    {
      func: "pnbinom",
      distribution: "negative_binomial",
      args: [2, 5, 0.3, 1, 0],
    },
    {
      func: "qnbinom",
      distribution: "negative_binomial",
      args: [0.0287955, 5, 0.3, 1, 0],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rnbinom separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rnbinomResult = await callR(
      "rnbinom",
      "negative_binomial",
      1,
      5,
      0.3,
    );
    console.log(`rnbinom(5, 0.3) = ${rnbinomResult}`);
  } catch (error) {
    console.log(`rnbinom: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
