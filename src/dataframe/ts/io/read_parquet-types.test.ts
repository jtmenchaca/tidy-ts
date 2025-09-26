// tests/readParquet-types.test.ts
import { z } from "zod";
import { type DataFrame, readParquet } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Define a Zod schema for our Parquet data
const PenguinsSchema = z.object({
  species: z.string(),
  island: z.string(),
  bill_length_mm: z.number().nullable(),
  bill_depth_mm: z.number().nullable(),
  flipper_length_mm: z.number().nullable(),
  body_mass_g: z.number().nullable(),
  sex: z.string().nullable(),
  year: z.number(),
  active: z.boolean().nullable(),
});

Deno.test("readParquet type inference and validation", async () => {
  const penguins = await readParquet(
    "./src/dataframe/ts/io/fixtures/penguins_test.parquet",
    PenguinsSchema,
    {
      naValues: ["", "NA", "NULL", "null"],
    },
  );

  console.log("Penguins data loaded from Parquet:");
  penguins.print(); // Show all rows
  console.log(`Total rows: ${penguins.nrows()}`);

  // Type check: Schema ensures proper typing
  const _penguinsTypeCheck: DataFrame<
    {
      species: string;
      island: string;
      bill_length_mm: number | null;
      bill_depth_mm: number | null;
      flipper_length_mm: number | null;
      body_mass_g: number | null;
      sex: string | null;
      year: number;
      active: boolean | null;
    }
  > = penguins;

  void _penguinsTypeCheck; // Suppress unused variable warning

  // Verify data integrity
  expect(penguins.nrows()).toBe(5);
  expect(penguins.columns()).toEqual([
    "species",
    "island",
    "bill_length_mm",
    "bill_depth_mm",
    "flipper_length_mm",
    "body_mass_g",
    "sex",
    "year",
    "active",
  ]);

  // Test specific values and types
  expect(penguins[0].species).toBe("Adelie");
  expect(penguins[0].bill_length_mm).toBe(39.1);
  expect(penguins[0].active).toBe(true);

  // Test null handling
  expect(penguins[3].bill_length_mm).toBeNull();
  expect(penguins[3].sex).toBeNull();
  expect(penguins[3].active).toBeNull();

  // Test boolean values
  expect(penguins[2].active).toBe(false);
  expect(penguins[4].active).toBe(true);
});

// Test with subset of columns
Deno.test("readParquet column selection preserves types", async () => {
  const BasicSchema = z.object({
    species: z.string(),
    bill_length_mm: z.number().nullable(),
    active: z.boolean().nullable(),
  });

  const penguins = await readParquet(
    "./src/dataframe/ts/io/fixtures/penguins_test.parquet",
    BasicSchema,
    {
      columns: ["species", "bill_length_mm", "active"],
    },
  );

  // Type check for subset
  const _basicTypeCheck: DataFrame<{
    species: string;
    bill_length_mm: number | null;
    active: boolean | null;
  }> = penguins;

  void _basicTypeCheck;

  expect(penguins.columns()).toEqual(["species", "bill_length_mm", "active"]);
  expect(penguins.nrows()).toBe(5);
  expect(penguins[0].species).toBe("Adelie");
  expect(penguins[0].bill_length_mm).toBe(39.1);
  expect(penguins[0].active).toBe(true);
});

// Test row range selection with types
Deno.test("readParquet row range preserves types", async () => {
  const penguins = await readParquet(
    "./src/dataframe/ts/io/fixtures/penguins_test.parquet",
    PenguinsSchema,
    {
      rowStart: 1,
      rowEnd: 3,
    },
  );

  // Type check still works with row ranges
  const _rangeTypeCheck: DataFrame<z.infer<typeof PenguinsSchema>> = penguins;
  void _rangeTypeCheck;

  expect(penguins.nrows()).toBe(2);
  expect(penguins[0].species).toBe("Adelie"); // This is row 1 from original
  expect(penguins[0].bill_length_mm).toBe(39.5);
  expect(penguins[1].bill_length_mm).toBe(40.3);
});
