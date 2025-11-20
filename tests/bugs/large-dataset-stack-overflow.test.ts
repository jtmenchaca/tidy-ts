/**
 * Test for async detection stack overflow with large dataset (211k+ rows)
 */

// deno-lint-ignore-file no-explicit-any
import { createDataFrame, stats as s } from "../../src/dataframe/mod.ts";
import { expect } from "@std/expect";

Deno.test("async detection - large dataset (211k rows) should not stack overflow", () => {
  console.log("\n=== Creating large dataset ===\n");

  // Create dataset with 211,755 rows to match the DRG data size
  const rows = [];
  for (let i = 0; i < 211755; i++) {
    rows.push({
      icd10: `ICD${i % 100}`,
      mdc: `MDC${i % 20}`,
      drg: `${100 + (i % 500)}`,
    });
  }

  const data = createDataFrame(rows);
  console.log("✓ Created DataFrame with", data.nrows(), "rows");

  const withNumericDrg = data.mutate({
    drg_num: (row: any) => parseInt(row.drg),
  });
  console.log("✓ Added numeric DRG column");

  console.log("\n=== Testing summarize with s.min/s.max ===\n");

  // This should trigger async detection and potentially cause stack overflow
  const result = withNumericDrg
    .groupBy("icd10", "mdc")
    .summarize({
      drgStart: (g: any) => s.min(g.drg_num),
      drgEnd: (g: any) => s.max(g.drg_num),
    });

  console.log("\n✓ Summarize completed");
  console.log("Result type:", typeof result);
  console.log("Has nrows:", typeof result.nrows);

  // If the fix works, result should be a DataFrame, not a Promise
  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBeGreaterThan(0);

  console.log("✓ Result is a DataFrame with", result.nrows(), "rows");
});
