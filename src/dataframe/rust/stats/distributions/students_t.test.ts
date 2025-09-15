#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust Student's t functions...\n");

  const testCases = [
    { func: "dt", distribution: "students_t", args: [1.5, 10, 0] },
    { func: "pt", distribution: "students_t", args: [1.5, 10, 1, 0] },
    { func: "qt", distribution: "students_t", args: [0.75, 10, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rt separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rtResult = await callR("rt", "students_t", 1, 10);
    console.log(`rt(10) = ${rtResult}`);
  } catch (error) {
    console.log(`rt: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
