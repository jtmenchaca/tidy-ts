import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { writeXLSX } from "../../src/dataframe/ts/io/write_xlsx.ts";
import { parseXLSXRaw } from "../../src/dataframe/ts/io/read_xlsx.ts";

Deno.test("Debug date serialization", async () => {
  const df = createDataFrame([
    { date: new Date("1900-01-01") },
    { date: new Date("1899-12-31") },
    { date: new Date("2099-12-31") },
    { date: new Date("1970-01-01") },
  ]);

  console.log("Original dates:");
  df.toArray().forEach((r, i) => console.log(`  ${i}:`, r.date));

  const testFile = "./tmp/test-date-debug.xlsx";

  try {
    await writeXLSX(df, testFile);

    const raw = await parseXLSXRaw(testFile);
    console.log("\nRaw XLSX values:");
    raw.slice(1).forEach((row, i) => console.log(`  ${i}:`, row[0]));
  } finally {
    try {
      await Deno.remove(testFile);
    } catch {
      // Ignore if file doesn't exist
    }
  }
});
