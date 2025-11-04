/**
 * Performance comparison: DataFrame creation from rows vs columns
 * Tests creating a 1M row DataFrame using both approaches
 */

import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { expect } from "@std/expect";

const ROWS = 1_000_000;

Deno.test("DataFrame creation: rows vs columns performance", () => {
  console.log(
    `\n=== DataFrame Creation Performance (${ROWS.toLocaleString()} rows) ===\n`,
  );

  // Test 1: Create from rows
  const rowsStart = performance.now();
  const rowData = [];
  for (let i = 0; i < ROWS; i++) {
    rowData.push({
      id: i,
      name: `Person_${i}`,
      age: 20 + (i % 50),
      score: Math.random() * 100,
      active: i % 2 === 0,
    });
  }
  const rowDataCreated = performance.now();
  const dfFromRows = createDataFrame(rowData);
  const rowsEnd = performance.now();

  const rowDataTime = rowDataCreated - rowsStart;
  const rowDFTime = rowsEnd - rowDataCreated;
  const rowTotalTime = rowsEnd - rowsStart;

  console.log("From Rows:");
  console.log(`  Data preparation: ${rowDataTime.toFixed(2)}ms`);
  console.log(`  DataFrame creation: ${rowDFTime.toFixed(2)}ms`);
  console.log(`  Total: ${rowTotalTime.toFixed(2)}ms`);

  // Test 2: Create from columns
  const colsStart = performance.now();
  const ids = new Array(ROWS);
  const names = new Array(ROWS);
  const ages = new Array(ROWS);
  const scores = new Array(ROWS);
  const actives = new Array(ROWS);

  for (let i = 0; i < ROWS; i++) {
    ids[i] = i;
    names[i] = `Person_${i}`;
    ages[i] = 20 + (i % 50);
    scores[i] = Math.random() * 100;
    actives[i] = i % 2 === 0;
  }
  const colDataCreated = performance.now();

  const dfFromColumns = createDataFrame({
    columns: {
      id: ids,
      name: names,
      age: ages,
      score: scores,
      active: actives,
    },
  });
  const colsEnd = performance.now();

  const colDataTime = colDataCreated - colsStart;
  const colDFTime = colsEnd - colDataCreated;
  const colTotalTime = colsEnd - colsStart;

  console.log("\nFrom Columns:");
  console.log(`  Data preparation: ${colDataTime.toFixed(2)}ms`);
  console.log(`  DataFrame creation: ${colDFTime.toFixed(2)}ms`);
  console.log(`  Total: ${colTotalTime.toFixed(2)}ms`);

  // Comparison
  const speedup = rowTotalTime / colTotalTime;
  console.log("\nComparison:");
  console.log(`  Rows total time: ${rowTotalTime.toFixed(2)}ms`);
  console.log(`  Columns total time: ${colTotalTime.toFixed(2)}ms`);
  if (speedup > 1) {
    console.log(`  Columns are ${speedup.toFixed(2)}x faster than rows`);
  } else {
    console.log(`  Rows are ${(1 / speedup).toFixed(2)}x faster than columns`);
  }

  // Verify both DataFrames have correct structure
  expect(dfFromRows.nrows()).toBe(ROWS);
  expect(dfFromColumns.nrows()).toBe(ROWS);
  expect(dfFromRows.ncols()).toBe(5);
  expect(dfFromColumns.ncols()).toBe(5);

  // Verify deterministic fields match (not random scores)
  expect(dfFromRows[0].id).toBe(0);
  expect(dfFromColumns[0].id).toBe(0);
  expect(dfFromRows[0].name).toBe("Person_0");
  expect(dfFromColumns[0].name).toBe("Person_0");
  expect(dfFromRows[0].age).toBe(20);
  expect(dfFromColumns[0].age).toBe(20);
  expect(dfFromRows[0].active).toBe(true);
  expect(dfFromColumns[0].active).toBe(true);

  expect(dfFromRows[ROWS - 1].id).toBe(ROWS - 1);
  expect(dfFromColumns[ROWS - 1].id).toBe(ROWS - 1);
  expect(dfFromRows[ROWS - 1].name).toBe(`Person_${ROWS - 1}`);
  expect(dfFromColumns[ROWS - 1].name).toBe(`Person_${ROWS - 1}`);

  console.log(
    "\n✓ Both methods produce valid DataFrames with correct structure\n",
  );
});
