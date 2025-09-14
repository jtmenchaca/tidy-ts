// tests/read_arrow.test.ts
import { expect } from "@std/expect";
import { z } from "zod";
import { type DataFrame, read_arrow } from "@tidy-ts/dataframe";
import { tableToIPC, tableFromArrays, int32, utf8, float32, bool, type Table } from "@uwdata/flechette";

/*───────────────────────────────────────────────────────────────────────────┐
│  0 · test helper - create arrow buffer from data                          │
└───────────────────────────────────────────────────────────────────────────*/
function createArrowBuffer(data: Record<string, unknown[]>): ArrayBuffer {
  const table = tableFromArrays(data, {
    types: {
      id: int32(),
      name: utf8(),
      email: utf8(),
      age: int32(),
      active: bool(),
    },
  });
  const ipc = tableToIPC(table, {});
  if (!ipc) throw new Error("Failed to create IPC buffer");
  // Convert to proper ArrayBuffer
  const buffer = new ArrayBuffer(ipc.length);
  const view = new Uint8Array(buffer);
  view.set(ipc);
  return buffer;
}

function tableToBuffer(table: Table): ArrayBuffer {
  const ipc = tableToIPC(table, {});
  if (!ipc) throw new Error("Failed to create IPC buffer");
  // Convert to proper ArrayBuffer
  const buffer = new ArrayBuffer(ipc.length);
  const view = new Uint8Array(buffer);
  view.set(ipc);
  return buffer;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  1 · basic inference + coercion                                           │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow · primitive coercion & type-inference", async () => {
  const Row = z.object({
    id: z.number().int(),
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().optional(),
    active: z.boolean(),
  });

  // Create test data
  const testData = {
    id: [1, 2, 3],
    name: ["John Doe", "Jane Smith", "Bob Johnson"],
    email: ["john@example.com", "jane@example.com", "bob@example.com"],
    age: [30, 25, null], // null for optional field
    active: [true, false, true],
  };

  const buffer = createArrowBuffer(testData);
  const df = await read_arrow(buffer, Row);

  console.log("Parsed DataFrame:", JSON.stringify(df, null, 2));
  console.log("DataFrame length:", df.nrows());

  expect(df.nrows()).toBe(3);
  expect(df[0].id).toBe(1);
  expect(df[0].active).toBe(true);
  expect(df[2].age).toBeUndefined(); // null → undefined (optional)

  console.log("First row:", df[0]);
  console.log("Third row age:", df[2].age);

  // compile-time check
  type T = typeof df[0];
  const _ok: T = { id: 9, name: "x", email: "x@x.x", active: false };

  console.log("Test 1 completed successfully");
});

/*───────────────────────────────────────────────────────────────────────────┐
│  2 · NA handling (nullable vs optional)                                   │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow · NA handling for nullable / optional", async () => {
  const Row = z.object({
    score: z.number().nullable(), // null → null
    rating: z.number().optional(), // null → undefined
  });

  const testData = {
    score: [85.5, null, 92.0],
    rating: [4.2, null, 3.8],
  };

  const table = tableFromArrays(testData, {
    types: {
      score: float32(),
      rating: float32(),
    },
  });
  const buffer = tableToBuffer(table);

  const df = await read_arrow(buffer, Row);

  console.log("NA handling test:", JSON.stringify(df, null, 2));
  
  expect(df[0].score).toBe(85.5);
  expect(df[1].score).toBeNull(); // nullable field gets null
  expect(df[1].rating).toBeUndefined(); // optional field gets undefined
  expect(df[2].score).toBe(92.0);
});

/*───────────────────────────────────────────────────────────────────────────┐
│  3 · date & boolean coercion                                              │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow · date & boolean coercion", async () => {
  const Row = z.object({
    id: z.number().int(),
    ok: z.boolean(),
    when: z.date(),
  });

  const testData = {
    id: [1, 2, 3],
    ok: [true, false, true],
    when: ["2023-01-01", "2023-02-15", "2023-12-31"], // strings to be coerced to dates
  };

  const table = tableFromArrays(testData, {
    types: {
      id: int32(),
      ok: bool(),
      when: utf8(),
    },
  });
  const buffer = tableToBuffer(table);

  const df = await read_arrow(buffer, Row);

  console.log("Parsed DataFrame:", JSON.stringify(df, null, 2));

  expect(df[0].when).toBeInstanceOf(Date);
  expect(df[1].ok).toBe(false);

  console.log(
    "First row when (should be Date):",
    df[0].when,
    typeof df[0].when,
  );
  console.log("Second row ok (should be false):", df[1].ok);
});

/*───────────────────────────────────────────────────────────────────────────┐
│  4 · validation error bubbles out                                         │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow · throws on invalid row", async () => {
  const Row = z.object({
    id: z.number().positive(),
  });

  const testData = {
    id: [1, -2, 3], // -2 should fail positive() validation
  };

  const table = tableFromArrays(testData, {
    types: {
      id: int32(),
    },
  });
  const buffer = tableToBuffer(table);

  // The function should throw an error when encountering invalid data
  await expect(read_arrow(buffer, Row)).rejects.toThrow();
});

/*───────────────────────────────────────────────────────────────────────────┐
│  5 · file reading with read_arrow()                                       │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow() · file reading with schema validation", async () => {
  const Row = z.object({
    id: z.number().int(),
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().optional(),
    active: z.boolean(),
  });

  // Create test data and write to temporary Arrow file
  const testData = {
    id: [1, 2, 3],
    name: ["John Doe", "Jane Smith", "Bob Johnson"],
    email: ["john@example.com", "jane@example.com", "bob@example.com"],
    age: [30, 25, null],
    active: [true, false, true],
  };

  const buffer = createArrowBuffer(testData);
  const tempFile = "./temp_test.arrow";
  await Deno.writeFile(tempFile, new Uint8Array(buffer));

  try {
    console.log("Reading Arrow file with schema validation...");

    const df = await read_arrow(tempFile, Row, {
      naValues: ["", "NA"],
    });

    console.log("Parsed DataFrame:", JSON.stringify(df, null, 2));

    expect(df.nrows()).toBe(3);
    expect(df[0].id).toBe(1);
    expect(df[0].name).toBe("John Doe");
    expect(df[0].email).toBe("john@example.com");
    expect(df[0].age).toBe(30);
    expect(df[0].active).toBe(true);

    expect(df[1].age).toBe(25);
    expect(df[2].age).toBeUndefined(); // null becomes undefined for optional

    // Type checking
    type T = typeof df[0];
    const _ok: T = { id: 9, name: "x", email: "x@x.x", active: false };

    console.log("Test 5 completed successfully");
  } finally {
    // Clean up temporary file
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
});

/*───────────────────────────────────────────────────────────────────────────┐
│  6 · type inference test (similar to docs issue)                         │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow · type inference with complex schema", async () => {
  // Define Zod schema for Arrow data - handles type conversion and validation
  const JediAcademySchema = z.object({
    name: z.string(),
    species: z.string(),
    homeworld: z.string(),
    lightsaber_color: z.string(),
    rank: z.string(),
    force_sensitivity: z.number(), // Arrow numbers
  });

  // Create Arrow data - Jedi Academy enrollment records
  const jediAcademyData = {
    name: [
      "Luke Skywalker",
      "Obi-Wan Kenobi", 
      "Yoda",
      "Mace Windu",
      "Ahsoka Tano",
      "Anakin Skywalker",
    ],
    species: ["Human", "Human", "Unknown", "Human", "Togruta", "Human"],
    homeworld: ["Tatooine", "Stewjon", "Unknown", "Haruun Kal", "Shili", "Tatooine"],
    lightsaber_color: ["blue", "blue", "green", "purple", "white", "blue"],
    rank: ["Jedi Knight", "Jedi Master", "Grand Master", "Jedi Master", "Jedi Padawan", "Jedi Knight"],
    force_sensitivity: [9.2, 9.5, 10.0, 9.3, 8.7, 9.8],
  };

  const table = tableFromArrays(jediAcademyData, {
    types: {
      name: utf8(),
      species: utf8(), 
      homeworld: utf8(),
      lightsaber_color: utf8(),
      rank: utf8(),
      force_sensitivity: float32(),
    },
  });
  const buffer = tableToBuffer(table);

  // Read Arrow with schema validation
  const jediAcademyDataFrame = await read_arrow(buffer, JediAcademySchema);

  // TypeScript knows the exact structure after Zod validation
  // This should work without type instantiation errors
  const _typeCheck: DataFrame<z.infer<typeof JediAcademySchema>> =
    jediAcademyDataFrame;
  void _typeCheck; // Suppress unused variable warning

  jediAcademyDataFrame.print("DataFrame created from Jedi Academy Arrow data:");

  expect(jediAcademyDataFrame.nrows()).toBe(6);
  expect(jediAcademyDataFrame.columns()).toEqual([
    "name",
    "species",
    "homeworld",
    "lightsaber_color",
    "rank",
    "force_sensitivity",
  ]);
  // Check that force sensitivity values are approximately correct (float32 precision)
  expect(jediAcademyDataFrame.force_sensitivity[0]).toBeCloseTo(9.2, 1);
  expect(jediAcademyDataFrame.force_sensitivity[1]).toBe(9.5);
  expect(jediAcademyDataFrame.force_sensitivity[2]).toBe(10.0);
  expect(jediAcademyDataFrame.force_sensitivity[3]).toBeCloseTo(9.3, 1);
  expect(jediAcademyDataFrame.force_sensitivity[4]).toBeCloseTo(8.7, 1);
  expect(jediAcademyDataFrame.force_sensitivity[5]).toBeCloseTo(9.8, 1);
});

/*───────────────────────────────────────────────────────────────────────────┐
│  7 · column filtering                                                     │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_arrow · column filtering", async () => {
  const Row = z.object({
    name: z.string(),
    age: z.number(),
  });

  const testData = {
    id: [1, 2, 3],
    name: ["Alice", "Bob", "Charlie"],
    age: [25, 30, 35],
    email: ["alice@example.com", "bob@example.com", "charlie@example.com"],
  };

  const table = tableFromArrays(testData, {
    types: {
      id: int32(),
      name: utf8(),
      age: int32(),
      email: utf8(),
    },
  });
  const buffer = tableToBuffer(table);

  // Only read specific columns
  const df = await read_arrow(buffer, Row, {
    columns: ["name", "age"],
  });

  expect(df.nrows()).toBe(3);
  expect(df.columns()).toEqual(["name", "age"]);
  expect(df[0].name).toBe("Alice");
  expect(df[0].age).toBe(25);
});