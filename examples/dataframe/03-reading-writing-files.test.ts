import {
  createDataFrame,
  readCSV,
  readXLSX,
  writeCSV,
  writeXLSX,
} from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("File I/O - Read CSV", async () => {
  const MtcarsSchema = z.object({
    model: z.string(),
    mpg: z.number(),
    cyl: z.number(),
    disp: z.number(),
    hp: z.number(),
    drat: z.number(),
    wt: z.number(),
    qsec: z.number(),
    vs: z.number(),
    am: z.number(),
    gear: z.number(),
    carb: z.number(),
  });

  const mtcars = await readCSV("examples/fixtures/mtcars.csv", MtcarsSchema);

  mtcars.print("Motor Trend Car Road Tests (mtcars):");

  expect(mtcars.nrows()).toBeGreaterThan(0);
  expect(mtcars.columns()).toContain("model");
  expect(mtcars.columns()).toContain("mpg");
});

Deno.test("File I/O - Read XLSX", async () => {
  const PenguinSchema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().nullable(),
    bill_depth_mm: z.number().nullable(),
    flipper_length_mm: z.number().nullable(),
    body_mass_g: z.number().nullable(),
    sex: z.string().nullable(),
    year: z.number(),
  });

  const penguins = await readXLSX(
    "examples/fixtures/penguins.xlsx",
    PenguinSchema,
  );

  penguins.sliceHead(5).print("Penguins Dataset (first 5 rows):");

  expect(penguins.nrows()).toBeGreaterThan(0);
  expect(penguins.columns()).toContain("species");
  expect(penguins.columns()).toContain("island");
});

Deno.test("File I/O - Write CSV", async () => {
  const data = createDataFrame([
    { id: 1, name: "Alice", score: 85 },
    { id: 2, name: "Bob", score: 92 },
    { id: 3, name: "Charlie", score: 78 },
  ]);

  await writeCSV(data, "examples/fixtures/test-output.csv");

  const readBack = await readCSV(
    "examples/fixtures/test-output.csv",
    z.object({
      id: z.number(),
      name: z.string(),
      score: z.number(),
    }),
  );

  expect(readBack.nrows()).toBe(3);
  expect(readBack[0].name).toBe("Alice");
});

Deno.test("File I/O - Write XLSX", async () => {
  const data = createDataFrame([
    { id: 1, name: "Alice", score: 85 },
    { id: 2, name: "Bob", score: 92 },
    { id: 3, name: "Charlie", score: 78 },
  ]);

  await writeXLSX("examples/fixtures/test-output.xlsx", data);

  const readBack = await readXLSX(
    "examples/fixtures/test-output.xlsx",
    z.object({
      id: z.number(),
      name: z.string(),
      score: z.number(),
    }),
  );

  expect(readBack.nrows()).toBe(3);
  expect(readBack[0].name).toBe("Alice");
});

Deno.test("File I/O - CSV with String Data", async () => {
  const csvString = `name,age,city
Alice,25,New York
Bob,30,San Francisco
Charlie,35,Boston`;

  const data = await readCSV(
    csvString,
    z.object({
      name: z.string(),
      age: z.number(),
      city: z.string(),
    }),
  );

  expect(data.nrows()).toBe(3);
  expect(data[0].name).toBe("Alice");
  expect(data[1].city).toBe("San Francisco");
});
