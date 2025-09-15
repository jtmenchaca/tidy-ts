// tests/read_csv-types.test.ts
import { z } from "zod";
import { type DataFrame, read_csv } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Define a Zod schema for our CSV data
const PenguinsSchema = z.object({
  species: z.string(),
  island: z.string(),
  bill_length_mm: z.number().nullable(),
  bill_depth_mm: z.number().nullable(),
  flipper_length_mm: z.number().nullable(),
  body_mass_g: z.number().nullable(),
  sex: z.string().nullable(),
  year: z.number(),
});

Deno.test("read_csv type inference and validation", async () => {
  // Read CSV content with automatic type conversion and validation
  const penguinsCsv =
    `species,island,bill_length_mm,bill_depth_mm,flipper_length_mm,body_mass_g,sex,year
Adelie,Torgersen,39.1,18.7,181,3750,male,2007
Adelie,Torgersen,39.5,17.4,186,3800,female,2007
Adelie,Torgersen,40.3,18.0,195,3250,female,2007
Adelie,Torgersen,NA,NA,NA,NA,NA,2007
Adelie,Torgersen,36.7,19.3,193,3450,female,2007`;

  const penguins = await read_csv(penguinsCsv, PenguinsSchema, {
    skipEmptyLines: true,
    naValues: ["", "NA", "NULL", "null"],
  });

  console.log("Penguins data loaded from CSV:");
  penguins.slice(0, 5).print(); // Show first 5 rows
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
  ]);

  // Test specific values and types
  expect(penguins[0].species).toBe("Adelie");
  expect(penguins[0].bill_length_mm).toBe(39.1);
  expect(penguins[0].year).toBe(2007);

  // Test null handling from NA values
  expect(penguins[3].bill_length_mm).toBeNull();
  expect(penguins[3].sex).toBeNull();
  expect(penguins[3].year).toBe(2007); // year should still be valid
});

// Test with different data types
Deno.test("read_csv mixed data types", async () => {
  const MixedSchema = z.object({
    id: z.number(),
    name: z.string(),
    active: z.boolean(),
    score: z.number().nullable(),
    category: z.string().optional(),
  });

  const mixedCsv = `id,name,active,score,category
1,Alice,true,95.5,A
2,Bob,false,87.2,B
3,Charlie,true,NA,
4,Diana,false,92.0,A`;

  const mixed = await read_csv(mixedCsv, MixedSchema, {
    naValues: ["", "NA"],
  });

  // Type check for mixed types
  const _mixedTypeCheck: DataFrame<{
    id: number;
    name: string;
    active: boolean;
    score: number | null;
    category?: string | undefined;
  }> = mixed;

  void _mixedTypeCheck;

  expect(mixed.nrows()).toBe(4);
  expect(mixed[0].id).toBe(1);
  expect(mixed[0].active).toBe(true);
  expect(mixed[0].score).toBe(95.5);
  expect(mixed[2].score).toBeNull(); // NA converted to null
  expect(mixed[2].category).toBeUndefined(); // Empty optional field
});

// Test reading from actual CSV fixture file
Deno.test("read_csv from fixture file", async () => {
  const UserSchema = z.object({
    user_id: z.number(),
    full_name: z.string(),
    email_address: z.string(),
  });

  const users = await read_csv(
    "./src/dataframe/ts/io/fixtures/user-info.csv",
    UserSchema,
  );

  // Type check for file reading
  const _userTypeCheck: DataFrame<z.infer<typeof UserSchema>> = users;
  void _userTypeCheck;

  expect(users.nrows()).toBeGreaterThan(0);
  expect(users.columns()).toEqual(["user_id", "full_name", "email_address"]);

  // Verify first row has expected types
  expect(typeof users[0].user_id).toBe("number");
  expect(typeof users[0].full_name).toBe("string");
  expect(typeof users[0].email_address).toBe("string");

  // Verify actual values
  expect(users[0].user_id).toBe(1);
  expect(users[0].full_name).toBe("John");
  expect(users[0].email_address).toBe("j@x.com");
});
