#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, callRust } from "./test-helpers.ts";

async function main() {
  console.log("Detailed correlation comparison...\n");

  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [2.1, 3.9, 6.1, 7.8, 10.2, 11.9, 14.1, 15.8, 18.1, 20.2];

  console.log("Test data:");
  console.log("x:", x);
  console.log("y:", y);
  console.log("");

  try {
    // Test Pearson correlation
    console.log("=== PEARSON CORRELATION ===");

    const rPearson = await callR(
      "cor.test.pearson",
      "correlation",
      JSON.stringify(x),
      JSON.stringify(y),
      "pearson",
    );
    console.log("R result:", rPearson);

    const rustPearson = await callRust(
      "cor.test.pearson",
      JSON.stringify(x),
      JSON.stringify(y),
      "pearson",
    );
    console.log("Rust result:", rustPearson);

    console.log(
      "Difference in test_statistic:",
      Math.abs(rPearson.test_statistic - rustPearson.test_statistic),
    );
    console.log(
      "Difference in p_value:",
      Math.abs(rPearson.p_value - rustPearson.p_value),
    );

    console.log("\n=== SPEARMAN CORRELATION ===");

    const rSpearman = await callR(
      "cor.test.spearman",
      "correlation",
      JSON.stringify(x),
      JSON.stringify(y),
      "spearman",
    );
    console.log("R result:", rSpearman);

    const rustSpearman = await callRust(
      "cor.test.spearman",
      JSON.stringify(x),
      JSON.stringify(y),
      "spearman",
    );
    console.log("Rust result:", rustSpearman);

    console.log(
      "Difference in test_statistic:",
      Math.abs(rSpearman.test_statistic - rustSpearman.test_statistic),
    );
    console.log(
      "Difference in p_value:",
      Math.abs(rSpearman.p_value - rustSpearman.p_value),
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
