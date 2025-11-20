/**
 * Test to reproduce the groupBy().summarize() async detection issue
 *
 * Issue: When using s.min() and s.max() in summarize, the system may
 * incorrectly detect them as async and return PromisedDataFrame instead
 * of DataFrame, causing .nrows() to fail.
 */

import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "../../src/dataframe/mod.ts";

Deno.test("groupBy().summarize() with s.min/s.max should return DataFrame, not PromisedDataFrame", () => {
  // Create test data similar to the ICD mapping scenario
  const testData = createDataFrame([
    { icd10: "A00", mdc: "MDC01", drg: "100" },
    { icd10: "A00", mdc: "MDC01", drg: "105" },
    { icd10: "A00", mdc: "MDC01", drg: "110" },
    { icd10: "B01", mdc: "MDC02", drg: "200" },
    { icd10: "B01", mdc: "MDC02", drg: "210" },
    { icd10: "C02", mdc: "MDC03", drg: "300" },
  ]);

  // Add numeric DRG column
  const withNumericDrg = testData.mutate({
    drg_num: (row) => parseInt(row.drg),
  });

  console.log("withNumericDrg type:", typeof withNumericDrg);
  console.log("withNumericDrg has nrows:", typeof withNumericDrg.nrows);

  // This is the problematic line - using s.min and s.max in summarize
  const icdGroups = withNumericDrg
    .groupBy("icd10", "mdc")
    .summarize({
      drgStart: (g) => s.min(g.drg_num),
      drgEnd: (g) => s.max(g.drg_num),
    });

  console.log("icdGroups type:", typeof icdGroups);
  console.log("icdGroups constructor:", icdGroups.constructor.name);
  console.log("icdGroups has nrows:", typeof icdGroups.nrows);
  console.log("icdGroups keys:", Object.keys(icdGroups));

  // This should work - nrows() should be available
  const rowCount = icdGroups.nrows();

  expect(rowCount).toBe(3);

  // Verify the data is correct
  const rows = icdGroups.toArray();
  expect(rows).toEqual([
    { icd10: "A00", mdc: "MDC01", drgStart: 100, drgEnd: 110 },
    { icd10: "B01", mdc: "MDC02", drgStart: 200, drgEnd: 210 },
    { icd10: "C02", mdc: "MDC03", drgStart: 300, drgEnd: 300 },
  ]);
});

Deno.test("groupBy().summarize() with simple aggregations should work", () => {
  const testData = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 30 },
  ]);

  const result = testData
    .groupBy("category")
    .summarize({
      total: (g) => s.sum(g.value),
      avg: (g) => s.mean(g.value),
    });

  console.log("Simple aggregation result type:", typeof result);
  console.log("Simple aggregation has nrows:", typeof result.nrows);

  const rowCount = result.nrows();
  expect(rowCount).toBe(2);
});
