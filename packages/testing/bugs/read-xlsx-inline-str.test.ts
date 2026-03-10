import { expect } from "@std/expect";
import { readXLSX, readXLSXMetadata } from "@tidy-ts/dataframe";

const FIXTURE =
  "packages/testing/bugs/fixtures/ec_hospip_hospop_unique_vs_20250508.xlsx";

Deno.test("readXLSX - handles data descriptor ZIP and inline strings", async () => {
  const df = await readXLSX(FIXTURE, { no_types: true, skip: 1 });

  expect(df.nrows()).toBe(114820);
  expect(df.ncols()).toBe(14);
  expect(df.columns()).toEqual([
    "Value Set Name",
    "Value Set OID",
    "Definition Version",
    "Expansion Version",
    "Purpose: Clinical Focus",
    "Purpose: Data Element Scope",
    "Purpose: Inclusion Criteria",
    "Purpose: Exclusion Criteria",
    "Code",
    "Description",
    "Code System",
    "Code System OID",
    "Code System Version",
    "Expansion ID",
  ]);

  // Spot-check first data row
  const first = df.slice(0, 1).toArray()[0];
  expect(first["Value Set Name"]).toBe("20 to 42 Plus Weeks Gestation");
  expect(first["Code"]).toBe("Z3A.20");
});

Deno.test("readXLSXMetadata - works with data descriptor ZIP", async () => {
  const meta = await readXLSXMetadata(FIXTURE);

  expect(meta.sheets).toEqual([{ name: "EC, HOSPIP and HOSPOP", index: 0 }]);
});
