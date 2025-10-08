import { expect } from "@std/expect";
import { createDataFrame, s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  unit: z.string().nullable(),
  value: z.number().nullable(),
});

Deno.test("s.mean should handle groups with all null values", () => {
  const df = createDataFrame([
    { unit: "pg/mL", value: 500 },
    { unit: "pg/mL", value: 600 },
    { unit: null, value: null }, // Group with null unit and null value
    { unit: null, value: null }, // Another row with null unit and null value
  ], schema);

  console.log("\nOriginal data:");
  df.print();

  // This should not throw an error
  const grouped = df
    .groupBy("unit")
    .summarize({
      count: (g) => g.nrows(),
      mean_value: (g) => s.mean(g.value, true), // removeNA = true
    });

  console.log("\nGrouped data:");
  grouped.print();

  expect(grouped.nrows()).toBe(2); // One group for "pg/mL", one for null
});

Deno.test("s.mean returns null when all values are null even with removeNA=true", () => {
  const df = createDataFrame([
    { unit: null, value: null },
    { unit: null, value: null },
  ], schema);

  console.log("\nAll null values:");
  df.print();

  // This should return null instead of throwing
  const result = df
    .groupBy("unit")
    .summarize({
      mean_value: (g) => s.mean(g.value, true),
    });

  console.log("\nResult:");
  result.print();

  expect(result.nrows()).toBe(1);
  expect(result.mean_value[0]).toBe(null);
});
