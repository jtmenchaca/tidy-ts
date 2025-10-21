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
