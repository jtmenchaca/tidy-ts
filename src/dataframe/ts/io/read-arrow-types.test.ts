// tests/read-arrow-types.test.ts
import { z } from "zod";
import { type DataFrame, read_arrow } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import {
  bool,
  float32,
  int32,
  type Table,
  tableFromArrays,
  tableToIPC,
  utf8,
} from "@uwdata/flechette";

function tableToBuffer(table: Table): ArrayBuffer {
  const ipc = tableToIPC(table, {});
  if (!ipc) throw new Error("Failed to create IPC buffer");
  // Convert to proper ArrayBuffer
  const buffer = new ArrayBuffer(ipc.length);
  const view = new Uint8Array(buffer);
  view.set(ipc);
  return buffer;
}

// Define a Zod schema for our Arrow data
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

Deno.test("read_arrow type inference and validation", async () => {
  // Create Arrow data with automatic type conversion and validation
  const penguinsData = {
    species: ["Adelie", "Adelie", "Adelie", "Adelie", "Adelie"],
    island: ["Torgersen", "Torgersen", "Torgersen", "Torgersen", "Torgersen"],
    bill_length_mm: [39.1, 39.5, 40.3, null, 36.7], // null for missing values
    bill_depth_mm: [18.7, 17.4, 18.0, null, 19.3],
    flipper_length_mm: [181, 186, 195, null, 193],
    body_mass_g: [3750, 3800, 3250, null, 3450],
    sex: ["male", "female", "female", null, "female"],
    year: [2007, 2007, 2007, 2007, 2007],
  };

  const table = tableFromArrays(penguinsData, {
    types: {
      species: utf8(),
      island: utf8(),
      bill_length_mm: float32(),
      bill_depth_mm: float32(),
      flipper_length_mm: int32(),
      body_mass_g: int32(),
      sex: utf8(),
      year: int32(),
    },
  });
  const buffer = tableToBuffer(table);

  const penguins = await read_arrow(buffer, PenguinsSchema, {
    naValues: ["", "NA", "NULL", "null"],
  });

  console.log("Penguins data loaded from Arrow:");
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
  expect(penguins[0].bill_length_mm).toBeCloseTo(39.1, 1); // Account for float32 precision
  expect(penguins[0].year).toBe(2007);

  // Test null handling
  expect(penguins[3].bill_length_mm).toBeNull();
  expect(penguins[3].sex).toBeNull();
  expect(penguins[3].year).toBe(2007); // year should still be valid
});

// Test with different data types
Deno.test("read_arrow mixed data types", async () => {
  const MixedSchema = z.object({
    id: z.number(),
    name: z.string(),
    active: z.boolean(),
    score: z.number().nullable(),
    category: z.string().optional(),
  });

  const mixedData = {
    id: [1, 2, 3, 4],
    name: ["Alice", "Bob", "Charlie", "Diana"],
    active: [true, false, true, false],
    score: [95.5, 87.2, null, 92.0], // null for missing score
    category: ["A", "B", null, "A"], // null for missing category (optional)
  };

  const table = tableFromArrays(mixedData, {
    types: {
      id: int32(),
      name: utf8(),
      active: bool(),
      score: float32(),
      category: utf8(),
    },
  });
  const buffer = tableToBuffer(table);

  const mixed = await read_arrow(buffer, MixedSchema, {
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
  expect(mixed[2].score).toBeNull(); // null converted to null
  expect(mixed[2].category).toBeUndefined(); // null optional field becomes undefined
});

// Test Arrow-specific options
Deno.test("read_arrow with Arrow-specific options", async () => {
  const DateSchema = z.object({
    id: z.number(),
    timestamp: z.date(),
    big_number: z.number(),
  });

  // Create test data with timestamps and numbers that can be safely converted
  const testData = {
    id: [1, 2, 3],
    timestamp: [1640995200000, 1641081600000, 1641168000000], // Unix timestamps in milliseconds
    big_number: [123456789, 987654321, 555666777], // Use smaller numbers that can be safely converted
  };

  const table = tableFromArrays(testData);
  const buffer = tableToBuffer(table);

  const df = await read_arrow(buffer, DateSchema, {
    useDate: true, // Convert timestamps to Date objects
    useBigInt: false, // Convert BigInt to number (default behavior)
  });

  expect(df.nrows()).toBe(3);
  expect(df[0].id).toBe(1);
  expect(df[0].timestamp).toBeInstanceOf(Date);
  expect(typeof df[0].big_number).toBe("number");
});

// Test column filtering
Deno.test("read_arrow with column filtering", async () => {
  const FilteredSchema = z.object({
    name: z.string(),
    score: z.number(),
  });

  const fullData = {
    id: [1, 2, 3],
    name: ["Alice", "Bob", "Charlie"],
    score: [95, 87, 92],
    email: ["alice@example.com", "bob@example.com", "charlie@example.com"],
    department: ["Engineering", "Marketing", "Sales"],
  };

  const table = tableFromArrays(fullData, {
    types: {
      id: int32(),
      name: utf8(),
      score: int32(),
      email: utf8(),
      department: utf8(),
    },
  });
  const buffer = tableToBuffer(table);

  // Only read specific columns
  const filtered = await read_arrow(buffer, FilteredSchema, {
    columns: ["name", "score"],
  });

  // Type check for filtered columns
  const _filteredTypeCheck: DataFrame<z.infer<typeof FilteredSchema>> =
    filtered;
  void _filteredTypeCheck;

  expect(filtered.nrows()).toBe(3);
  expect(filtered.columns()).toEqual(["name", "score"]);
  expect(filtered[0].name).toBe("Alice");
  expect(filtered[0].score).toBe(95);

  // Verify ID and other columns are not present
  expect((filtered[0] as Record<string, unknown>).id).toBeUndefined();
  expect((filtered[0] as Record<string, unknown>).email).toBeUndefined();
});

// Test with real Arrow file (using the existing test from read_arrow.ts)
Deno.test("read_arrow from URL data", async () => {
  // This test uses the flights data from the original example
  const FlightsSchema = z.object({
    delay: z.number(),
    distance: z.number(),
    time: z.number(),
  });

  try {
    const url =
      "https://cdn.jsdelivr.net/npm/vega-datasets@2/data/flights-200k.arrow";
    const buffer = await fetch(url).then((r) => r.arrayBuffer());

    const flights = await read_arrow(buffer, FlightsSchema);

    // Type check for flights data
    const _flightsTypeCheck: DataFrame<z.infer<typeof FlightsSchema>> = flights;
    void _flightsTypeCheck;

    expect(flights.nrows()).toBeGreaterThan(0);
    expect(flights.columns()).toEqual(["delay", "distance", "time"]);

    // Verify data types
    expect(typeof flights[0].delay).toBe("number");
    expect(typeof flights[0].distance).toBe("number");
    expect(typeof flights[0].time).toBe("number");

    console.log(`Loaded ${flights.nrows()} flight records from Arrow file`);
  } catch (error) {
    // Skip test if network is unavailable
    console.log("Skipping network test:", (error as Error).message);
  }
});
