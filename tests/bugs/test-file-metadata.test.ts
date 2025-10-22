/**
 * Test readCSVMetadata and readXLSXMetadata functions
 */

import { expect } from "@std/expect";
import { readCSVMetadata } from "../../src/dataframe/ts/io/read_csv.ts";
import { readXLSXMetadata } from "../../src/dataframe/ts/io/read_xlsx.ts";

Deno.test("readCSVMetadata - reads CSV file metadata", async () => {
  const csvPath = "./examples/dataframe/output/salesData.csv";

  const metadata = await readCSVMetadata(csvPath, { previewRows: 3 });

  console.log("\n=== CSV Metadata ===");
  console.log("Headers:", metadata.headers);
  console.log("Total Rows:", metadata.totalRows);
  console.log("Delimiter:", metadata.delimiter);
  console.log("First Rows:", metadata.firstRows);

  expect(metadata.headers).toBeDefined();
  expect(Array.isArray(metadata.headers)).toBe(true);
  expect(metadata.headers.length).toBeGreaterThan(0);
  expect(metadata.totalRows).toBeGreaterThanOrEqual(0);
  expect(metadata.delimiter).toBe(",");
  expect(Array.isArray(metadata.firstRows)).toBe(true);
  expect(metadata.firstRows.length).toBeLessThanOrEqual(3);
});

Deno.test("readCSVMetadata - handles TSV files", async () => {
  // Create a test TSV content
  const tsvContent = "name\tage\tCity\nAlice\t30\tNY\nBob\t25\tLA";

  const metadata = await readCSVMetadata(tsvContent, {
    previewRows: 2,
    comma: "\t",
  });

  console.log("\n=== TSV Metadata ===");
  console.log("Headers:", metadata.headers);
  console.log("First Rows:", metadata.firstRows);

  expect(metadata.headers).toEqual(["name", "age", "City"]);
  expect(metadata.delimiter).toBe("\t");
  expect(metadata.firstRows.length).toBe(2);
  expect(metadata.firstRows[0]).toEqual(["Alice", "30", "NY"]);
});

Deno.test("readXLSXMetadata - reads XLSX file metadata", async () => {
  const xlsxPath = "./examples/fixtures/penguins.xlsx";

  const metadata = await readXLSXMetadata(xlsxPath, { previewRows: 3 });

  console.log("\n=== XLSX Metadata ===");
  console.log("Sheets:", metadata.sheets);
  console.log("Default Sheet:", metadata.defaultSheet);
  console.log("Sheet Name:", metadata.sheetName);
  console.log("Headers:", metadata.headers);
  console.log("Total Rows:", metadata.totalRows);
  console.log("First Rows:", metadata.firstRows);

  expect(metadata.sheets).toBeDefined();
  expect(Array.isArray(metadata.sheets)).toBe(true);
  expect(metadata.sheets.length).toBeGreaterThan(0);
  expect(metadata.defaultSheet).toBeDefined();
  expect(metadata.sheetName).toBeDefined();
  expect(metadata.headers).toBeDefined();
  expect(Array.isArray(metadata.headers)).toBe(true);
  expect(metadata.totalRows).toBeGreaterThanOrEqual(0);
  expect(Array.isArray(metadata.firstRows)).toBe(true);
  expect(metadata.firstRows.length).toBeLessThanOrEqual(4); // +1 for header
});

Deno.test("readXLSXMetadata - reads specific sheet", async () => {
  const xlsxPath = "./examples/fixtures/penguins.xlsx";

  // First get all sheets
  const metadata = await readXLSXMetadata(xlsxPath);
  console.log("\n=== Available Sheets ===");
  metadata.sheets.forEach((s) => {
    console.log(`  - ${s.name} (index: ${s.index})`);
  });

  // Read first sheet by index
  const metadataByIndex = await readXLSXMetadata(xlsxPath, { sheet: 0 });
  expect(metadataByIndex.sheetName).toBe(metadata.sheets[0].name);

  console.log("\n✓ All metadata tests passed!");
});
