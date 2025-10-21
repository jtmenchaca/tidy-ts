/**
 * Dataset Profiling Example
 *
 * Demonstrates using the built-in .profile() method to analyze datasets.
 */

import { expect } from "@std/expect";
import { createDataFrame, readXLSX, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("Profile Penguins Dataset", async () => {
  // Load penguins dataset with a permissive schema
  const schema = z.object({
    studyName: z.string(),
    "Sample Number": z.number(),
    Species: z.string(),
    Region: z.string(),
    Island: z.string(),
    Stage: z.string(),
    "Individual ID": z.string(),
    "Clutch Completion": z.string(),
    "Date Egg": z.coerce.date().nullable(),
    "Culmen Length (mm)": z.number().nullable(),
    "Culmen Depth (mm)": z.number().nullable(),
    "Flipper Length (mm)": z.number().nullable(),
    "Body Mass (g)": z.number().nullable(),
    Sex: z.string().nullable(),
    "Delta 15 N (o/oo)": z.number().nullable(),
    "Delta 13 C (o/oo)": z.number().nullable(),
  });

  const penguins = await readXLSX(
    "./src/dataframe/ts/io/fixtures/penguins_raw.xlsx",
    schema,
  );

  // Profile the dataset using the built-in method
  const profile = penguins.profile();

  // Verify we got profiles for all columns
  expect(profile.nrows()).toBe(penguins.ncols());
  expect(profile.nrows()).toBeGreaterThan(0);
});

Deno.test("Profile with Custom DataFrame", () => {
  const sales = createDataFrame([
    { region: "North", product: "Widget", quantity: 10, price: 100.0 },
    { region: "South", product: "Widget", quantity: 20, price: 100.0 },
    { region: "East", product: "Gadget", quantity: 8, price: 150.0 },
    { region: "North", product: "Gadget", quantity: 15, price: 150.0 },
    { region: "South", product: "Widget", quantity: null, price: 100.0 },
  ]);

  const profile = sales.profile();

  profile.print();

  // Verify profile structure
  expect(profile.nrows()).toBe(4);

  // Check numeric column profile
  const quantityProfile = profile.filter((p) => p.column === "quantity");
  expect(quantityProfile.nrows()).toBe(1);
  expect(quantityProfile[0].type).toBe("numeric");
  expect(quantityProfile[0].nulls).toBe(1);

  // Check categorical column profile
  const regionProfile = profile.filter((p) => p.column === "region");
  expect(regionProfile.nrows()).toBe(1);
  expect(regionProfile[0].type).toBe("categorical");
  expect(regionProfile[0].unique).toBe(3);
});

Deno.test("Detailed Numeric Analysis", async () => {
  const schema = z.object({
    studyName: z.string(),
    "Sample Number": z.number(),
    Species: z.string(),
    Region: z.string(),
    Island: z.string(),
    Stage: z.string(),
    "Individual ID": z.string(),
    "Clutch Completion": z.string(),
    "Date Egg": z.coerce.date().nullable(),
    "Culmen Length (mm)": z.number().nullable(),
    "Culmen Depth (mm)": z.number().nullable(),
    "Flipper Length (mm)": z.number().nullable(),
    "Body Mass (g)": z.number().nullable(),
    Sex: z.string().nullable(),
    "Delta 15 N (o/oo)": z.number().nullable(),
    "Delta 13 C (o/oo)": z.number().nullable(),
  });

  const penguins = await readXLSX(
    "./src/dataframe/ts/io/fixtures/penguins_raw.xlsx",
    schema,
  );

  // Get numeric columns and perform detailed analysis
  const allColumns = penguins.columns();
  const numericCols: string[] = [];

  for (const col of allColumns) {
    // @ts-ignore - dynamic column access for profiling
    const values = penguins.extract(col);
    if (values.every((v: unknown) => v === null || typeof v === "number")) {
      numericCols.push(col);
    }
  }

  console.log("\nDetailed Numeric Analysis:");
  console.log("─".repeat(60));

  numericCols.forEach((col: string) => {
    // @ts-ignore - dynamic column access for profiling
    const values = penguins.extract(col).filter(
      (v: unknown) => v !== null,
    ) as number[];

    if (values.length > 0) {
      console.log(`\n${col}:`);
      console.log(`  Count: ${values.length}`);
      console.log(`  Mean:  ${s.mean(values).toFixed(2)}`);
      console.log(`  Std:   ${s.stdev(values).toFixed(2)}`);
      console.log(`  Min:   ${s.min(values).toFixed(2)}`);
      console.log(`  Q1:    ${s.quantile(values, 0.25).toFixed(2)}`);
      console.log(`  Median:${s.median(values).toFixed(2)}`);
      console.log(`  Q3:    ${s.quantile(values, 0.75).toFixed(2)}`);
      console.log(`  Max:   ${s.max(values).toFixed(2)}`);
    }
  });

  expect(numericCols.length).toBeGreaterThan(0);
});

Deno.test("Profile with Entirely Null Columns", () => {
  const data = createDataFrame([
    { name: "Alice", age: 30, missing_num: null, missing_str: null },
    { name: "Bob", age: 25, missing_num: null, missing_str: null },
    { name: "Charlie", age: 35, missing_num: null, missing_str: null },
  ]);

  const profile = data.profile();

  profile.print();

  // Should handle entirely null numeric column
  const missingNumProfile = profile.filter((p) => p.column === "missing_num");
  expect(missingNumProfile.nrows()).toBe(1);
  expect(missingNumProfile[0].nulls).toBe(3);
  expect(missingNumProfile[0].null_pct).toBe("100.0%");

  // Should handle entirely null string column
  const missingStrProfile = profile.filter((p) => p.column === "missing_str");
  expect(missingStrProfile.nrows()).toBe(1);
  expect(missingStrProfile[0].nulls).toBe(3);
  expect(missingStrProfile[0].null_pct).toBe("100.0%");
});

Deno.test("Profile with Undefined Values", () => {
  const data = createDataFrame([
    { name: "Alice", score: 85, optional: undefined },
    { name: "Bob", score: undefined, optional: undefined },
    { name: "Charlie", score: 92, optional: undefined },
  ]);

  const profile = data.profile();

  profile.print();

  // Check handling of undefined values
  const scoreProfile = profile.filter((p) => p.column === "score");
  expect(scoreProfile.nrows()).toBe(1);
  expect(scoreProfile[0].nulls).toBe(1);

  const optionalProfile = profile.filter((p) => p.column === "optional");
  expect(optionalProfile.nrows()).toBe(1);
  expect(optionalProfile[0].nulls).toBe(3);
  expect(optionalProfile[0].null_pct).toBe("100.0%");
});

Deno.test("Profile with Mixed Null and Undefined", () => {
  const data = createDataFrame([
    { id: 1, value: null },
    { id: 2, value: undefined },
    { id: 3, value: 42 },
    { id: 4, value: null },
  ]);

  const profile = data.profile();

  const valueProfile = profile.filter((p) => p.column === "value");
  expect(valueProfile.nrows()).toBe(1);
  expect(valueProfile[0].type).toBe("numeric");
  expect(valueProfile[0].nulls).toBe(3);
  expect(valueProfile[0].null_pct).toBe("75.0%");
  expect(valueProfile[0].count).toBe(4);
});

Deno.test("Profile with Single Value Column", () => {
  const data = createDataFrame([
    { category: "A", value: null },
    { category: "A", value: null },
    { category: "A", value: null },
  ]);

  const profile = data.profile();

  const categoryProfile = profile.filter((p) => p.column === "category");
  expect(categoryProfile.nrows()).toBe(1);
  expect(categoryProfile[0].type).toBe("categorical");
  expect(categoryProfile[0].unique).toBe(1);
  expect(categoryProfile[0].top_values).toContain("A");
});

Deno.test("Profile with Empty DataFrame", () => {
  const data = createDataFrame([]);

  const profile = data.profile();

  expect(profile.nrows()).toBe(0);
});

Deno.test("Profile with Mixed Type Column", () => {
  const data = createDataFrame([
    { mixed: 1 },
    { mixed: "text" },
    { mixed: 2 },
    { mixed: "more text" },
  ]);

  const profile = data.profile();

  const mixedProfile = profile.filter((p) => p.column === "mixed");
  expect(mixedProfile.nrows()).toBe(1);
  expect(mixedProfile[0].type).toBe("categorical");
  expect(mixedProfile[0].unique).toBe(4);
});

Deno.test("Profile with Boolean Column", () => {
  const data = createDataFrame([
    { active: true },
    { active: false },
    { active: true },
    { active: true },
  ]);

  const profile = data.profile();

  const boolProfile = profile.filter((p) => p.column === "active");
  expect(boolProfile.nrows()).toBe(1);
  expect(boolProfile[0].type).toBe("categorical");
  expect(boolProfile[0].unique).toBe(2);
  expect(boolProfile[0].top_values).toContain("true");
});

Deno.test("Profile with NaN Values", () => {
  const data = createDataFrame([
    { value: 1 },
    { value: NaN },
    { value: 2 },
    { value: 3 },
  ]);

  const profile = data.profile();

  const valueProfile = profile.filter((p) => p.column === "value");
  expect(valueProfile.nrows()).toBe(1);
  // NaN is typeof "number" so treated as numeric
  expect(valueProfile[0].type).toBe("numeric");
});
