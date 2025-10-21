import { readXLSX, readXLSXMetadata } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("T214 NIH grants analysis - inspect metadata first", async () => {
  const meta = await readXLSXMetadata(
    "./src/dataframe/ts/io/fixtures/T214 2024 RES PR GR and R01 EQ_New Appl_Awds_Succ Rate_Fund by Submiss.xlsx",
    { previewRows: 3 },
  );

  console.log("\n=== T214 File Metadata ===");
  console.log("Available sheets:", meta.sheets);
  console.log("Default sheet:", meta.defaultSheet);
  console.log("Total rows:", meta.preview.totalRows);
  console.log("\nFirst 3 rows:");
  meta.preview.firstRows.forEach((row: string[], i: number) => {
    console.log(`Row ${i}:`, row.slice(0, 4)); // Show first 4 columns only
  });
});

Deno.test("T214 NIH grants analysis - read with skip", async () => {
  // Row 0 contains a note, row 1 contains headers, row 2+ contain data
  // Use skip: 1 to make row 1 the header row
  // Only include first 3 columns to keep test simple
  // Note: Headers are trimmed automatically, so no trailing space in schema
  const T214Schema = z.object({
    FY: z.number(),
    "Table #214: NIH Research Project Grants and R01-Equivalent Grants": z
      .string(),
    "Research Project Grants - Success Rate": z.number(),
  });

  const grants = await readXLSX(
    "./src/dataframe/ts/io/fixtures/T214 2024 RES PR GR and R01 EQ_New Appl_Awds_Succ Rate_Fund by Submiss.xlsx",
    T214Schema,
    {
      skip: 1, // Skip the note row, use row 1 as headers
    },
  );

  console.log("\n=== T214 Grants Data ===");
  console.log(`Loaded ${grants.nrows()} rows`);

  // Show first few rows
  console.log("\nFirst 5 rows:");
  grants.sliceHead(5).print();

  // Count by fiscal year
  const yearCount = grants.count("FY");
  console.log("\nRecords by fiscal year:");
  yearCount.print();
});
