import { parseXLSXRaw } from "../../src/dataframe/ts/io/read_xlsx.ts";
import { expect } from "@std/expect";

Deno.test("inspect multiple-tabs.xlsx structure", async () => {
  console.log("\n=== First sheet (default) ===");
  const first = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
  );
  console.log("Rows:", first.length);
  console.log("Headers:", first[0]);
  if (first.length > 1) {
    console.log("First data row:", first[1]);
  }

  console.log("\n=== Sheet by index 0 ===");
  const sheet0 = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    { sheet: 0 },
  );
  console.log("Rows:", sheet0.length);
  console.log("Headers:", sheet0[0]);

  console.log("\n=== Sheet by index 1 ===");
  const sheet1 = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    { sheet: 1 },
  );
  console.log("Rows:", sheet1.length);
  console.log("Headers:", sheet1[0]);

  console.log("\n=== Sheet by index 2 ===");
  const sheet2 = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    { sheet: 2 },
  );
  console.log("Rows:", sheet2.length);
  console.log("Headers:", sheet2[0]);

  console.log("\n=== Sheet by name: first-sheet ===");
  try {
    const firstSheet = await parseXLSXRaw(
      "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
      { sheet: "first-sheet" },
    );
    console.log("Rows:", firstSheet.length);
    console.log("Headers:", firstSheet[0]);
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }

  expect(true).toBe(true);
});
