import { expect } from "@std/expect";
import { z } from "zod";
import { parseXLSXRaw, readXLSX, readXLSXMetadata } from "./read_xlsx.ts";

Deno.test("parseXLSXRaw - skip parameter skips rows", async () => {
  const rows = await parseXLSXRaw(
    "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
  );

  const rowsWithSkip = await parseXLSXRaw(
    "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
    { skip: 1 },
  );

  console.log("rowsWithSkip", rowsWithSkip);

  expect(rowsWithSkip.length).toBe(rows.length - 1);
  expect(rowsWithSkip[0]).toEqual(rows[1]);
});

Deno.test("readXLSX - skip parameter makes row 1 the header", async () => {
  // Only include first 4 columns for testing
  const T214Schema = z.object({
    FY: z.string(),
  });

  const df = await readXLSX(
    "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
    T214Schema,
    { skip: 1 },
  );

  df.print();

  expect(df.nrows()).toBeGreaterThan(0);
  const firstRow = df.toArray()[0];
  expect(firstRow.FY).toBe("2015");
});

Deno.test("readXLSXMetadata - returns file structure", async () => {
  const meta = await readXLSXMetadata(
    "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
  );

  expect(meta.sheets.length).toBeGreaterThan(0);
  expect(meta.defaultSheet).toBeTruthy();
  expect(meta.preview.totalRows).toBeGreaterThan(0);
  expect(meta.preview.firstRows.length).toBeGreaterThan(0);
});

Deno.test("readXLSXMetadata - preview shows first rows", async () => {
  const meta = await readXLSXMetadata(
    "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
    { previewRows: 3 },
  );
  console.log("meta", meta);

  expect(meta.preview.firstRows.length).toBe(3);
  expect(meta.preview.firstRows[0][0]).toContain("Defined as activity codes");
  expect(meta.preview.firstRows[1][0]).toBe("FY");
  expect(meta.preview.firstRows[2][0]).toBe("2015");
});

Deno.test("readXLSXMetadata - custom preview rows", async () => {
  const meta = await readXLSXMetadata(
    "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
    { previewRows: 2 },
  );
  console.log("meta", meta);

  expect(meta.preview.firstRows.length).toBe(2);
});
