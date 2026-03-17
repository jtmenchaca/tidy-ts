import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// deno-lint-ignore no-explicit-any
type AnyZodObject = z.ZodObject<any>;

// Row schema → Columnar schema: wraps each field in z.array()
function rowToColumnar<T extends AnyZodObject>(
  rowSchema: T,
) {
  const shape = rowSchema.shape as Record<string, z.ZodTypeAny>;
  const columnarShape: Record<string, z.ZodTypeAny> = {};
  for (const key in shape) {
    columnarShape[key] = z.array(shape[key]);
  }
  return z.object(columnarShape);
}

// Columnar schema → Row schema: unwraps z.array() from each field
function columnarToRow<T extends AnyZodObject>(
  colSchema: T,
) {
  const shape = colSchema.shape as Record<string, z.ZodTypeAny>;
  const rowShape: Record<string, z.ZodTypeAny> = {};
  for (const key in shape) {
    const field = shape[key];
    if (field instanceof z.ZodArray) {
      rowShape[key] = field.element as z.ZodTypeAny;
    }
  }
  return z.object(rowShape);
}

const schema = z.object({
  id: z.number(),
  name: z.string(),
  score: z.number().nullable(),
  active: z.boolean(),
});

const rows = [
  { id: 1, name: "Alice", score: 95, active: true },
  { id: 2, name: "Bob", score: null, active: false },
  { id: 3, name: "Charlie", score: 87, active: true },
];

Deno.test("what does zod see when parsing a dataframe directly", () => {
  const df = createDataFrame(rows, schema);

  // Try parsing the dataframe itself as a single object
  const asObject = schema.safeParse(df);
  console.log("schema.safeParse(df):", asObject.success);
  if (asObject.success) {
    console.log("  data:", asObject.data);
  } else {
    console.log("  issues:", asObject.error.issues);
  }

  // Try parsing as an array of objects
  const asArray = z.array(schema).safeParse(df);
  console.log("\nz.array(schema).safeParse(df):", asArray.success);
  if (asArray.success) {
    console.log("  data:", asArray.data);
  } else {
    console.log("  issues:", asArray.error.issues);
  }

  // What does zod think the type is?
  const asUnknown = z.unknown().safeParse(df);
  console.log("\nz.unknown().safeParse(df):", asUnknown.success);
  console.log("  typeof df:", typeof df);
  console.log("  Array.isArray(df):", Array.isArray(df));
  console.log("  df instanceof Object:", df instanceof Object);
  console.log("  Object.keys(df):", Object.keys(df));
  console.log("  JSON.stringify(df):", JSON.stringify(df));

  // What about z.any?
  const asAny = z.any().safeParse(df);
  console.log("\nz.any().safeParse(df):", asAny.success);
  if (asAny.success) {
    console.log("  data type:", typeof asAny.data);
    console.log("  data:", asAny.data);
  }
});

// Columnar schema — matches what zod actually sees on a DataFrame
const columnarSchema = z.object({
  id: z.array(z.number()),
  name: z.array(z.string()),
  score: z.array(z.number().nullable()),
  active: z.array(z.boolean()),
});

Deno.test("columnar schema parses a dataframe directly", () => {
  const df = createDataFrame(rows, schema);

  const parsed = columnarSchema.safeParse(df);
  console.log("columnarSchema.safeParse(df):", parsed.success);
  if (parsed.success) {
    console.log("  data:", parsed.data);
  } else {
    console.log("  issues:", parsed.error.issues);
  }
});

Deno.test("rowToColumnar: converts row schema to columnar and parses df", () => {
  const df = createDataFrame(rows, schema);
  const derived = rowToColumnar(schema);

  const parsed = derived.safeParse(df);
  console.log("rowToColumnar(schema).safeParse(df):", parsed.success);
  if (parsed.success) {
    console.log("  data:", parsed.data);
  } else {
    console.log("  issues:", parsed.error.issues);
  }
  expect(parsed.success).toBe(true);
});

Deno.test("columnarToRow: converts columnar schema back to row schema", () => {
  const derived = columnarToRow(columnarSchema);

  // Should parse individual rows
  for (const row of rows) {
    const parsed = derived.safeParse(row);
    console.log("columnarToRow result.safeParse(row):", parsed.success, row);
    expect(parsed.success).toBe(true);
  }
});

Deno.test("roundtrip: row → columnar → row", () => {
  const columnar = rowToColumnar(schema);
  const backToRow = columnarToRow(columnar);

  for (const row of rows) {
    const parsed = backToRow.safeParse(row);
    expect(parsed.success).toBe(true);
  }

  // And the columnar parses the df
  const df = createDataFrame(rows, schema);
  const parsed = columnar.safeParse(df);
  expect(parsed.success).toBe(true);
});
