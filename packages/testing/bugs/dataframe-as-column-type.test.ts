import {
  createDataFrame,
  type DataFrame,
  stats as s,
} from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

type ZodDataFrame<T extends Record<string, unknown>> = z.ZodType<
  DataFrame<T>,
  DataFrame<T> | Record<string, unknown[]>
>;

/**
 * Creates a Zod schema that parses columnar data into a typed DataFrame.
 * Follows the temporal-validator pattern: accepts either an existing DataFrame
 * (passthrough) or columnar data (validated + transformed).
 *
 * Usage:
 *   const schema = zDataFrame({ x: z.number(), y: z.string() });
 *   const df = schema.parse({ x: [1, 2], y: ["a", "b"] });
 *   // df is DataFrame<{ x: number; y: string }>
 */
function zDataFrame<T extends z.ZodRawShape>(
  shape: T,
): ZodDataFrame<{ [K in keyof T]: z.infer<T[K]> }> {
  type Row = { [K in keyof T]: z.infer<T[K]> };

  const columnarShape = Object.fromEntries(
    Object.entries(shape).map(([key, s]) => [key, z.array(s)]),
  ) as { [K in keyof T]: z.ZodArray<T[K]> };

  const fromColumnar = z.object(columnarShape).transform((columns, ctx) => {
    try {
      return createDataFrame({
        columns: columns as Record<string, readonly unknown[]>,
      }) as unknown as DataFrame<Row>;
    } catch (error: unknown) {
      ctx.addIssue(
        `Failed to create DataFrame: ${
          (error as { message?: string }).message ?? "unknown error"
        }`,
      );
      return z.NEVER;
    }
  });

  // deno-lint-ignore no-explicit-any
  const instance = z.custom<DataFrame<Row>>((val: any) =>
    val != null && typeof val === "object" && typeof val.nrows === "function" &&
    typeof val.columns === "function"
  );

  return z.union([instance, fromColumnar]) as ZodDataFrame<Row>;
}

/**
 * Exploring behavior when a column contains DataFrame values.
 * i.e., DataFrame<{ id: number; data: DataFrame<{ x: number }> }>
 */

Deno.test("DataFrame as column type - basic creation", () => {
  const nested = createDataFrame([
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);

  const df = createDataFrame([
    { id: 1, data: nested },
    { id: 2, data: nested },
  ]);

  console.log("--- df.print() ---");
  df.print();

  console.log("\n--- typeof column values ---");
  console.log("id column:", df.id);
  console.log("data column:", df.data);

  console.log("\n--- row access ---");
  console.log("df[0]:", df[0]);
  console.log("df[0].data:", df[0].data);

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(2);
});

Deno.test("DataFrame as column type - accessing nested DataFrame methods", () => {
  const nested1 = createDataFrame([
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);
  const nested2 = createDataFrame([
    { x: 3, y: 30 },
  ]);

  const df = createDataFrame([
    { id: 1, data: nested1 },
    { id: 2, data: nested2 },
  ]);

  // Can we call DataFrame methods on the nested value?
  console.log("--- nested DataFrame methods ---");
  console.log("df[0].data.nrows():", df[0].data.nrows());
  console.log("df[1].data.nrows():", df[1].data.nrows());
  console.log("df[0].data.columns():", df[0].data.columns());

  expect(df[0].data.nrows()).toBe(2);
  expect(df[1].data.nrows()).toBe(1);
});

Deno.test("DataFrame as column type - column array access", () => {
  const nested = createDataFrame([{ x: 1 }]);

  const df = createDataFrame([
    { id: 1, data: nested },
    { id: 2, data: nested },
  ]);

  // What does the data column look like as an array?
  console.log("--- data column as array ---");
  console.log("df.data:", df.data);
  console.log("df.data.length:", df.data.length);
  console.log("df.data[0]:", df.data[0]);
  console.log("df.data[0] === nested:", df.data[0] === nested);
});

Deno.test("DataFrame as column type - filter", () => {
  const nested1 = createDataFrame([{ x: 1 }, { x: 2 }]);
  const nested2 = createDataFrame([{ x: 3 }]);

  const df = createDataFrame([
    { id: 1, data: nested1 },
    { id: 2, data: nested2 },
  ]);

  const filtered = df.filter((row) => row.data.nrows() > 1);
  console.log("--- filtered ---");
  filtered.print();

  expect(filtered.nrows()).toBe(1);
  expect(filtered[0].id).toBe(1);
});

Deno.test("DataFrame as column type - mutate referencing nested", () => {
  const nested1 = createDataFrame([{ x: 1 }, { x: 2 }]);
  const nested2 = createDataFrame([{ x: 3 }]);

  const df = createDataFrame([
    { id: 1, data: nested1 },
    { id: 2, data: nested2 },
  ]);

  const mutated = df.mutate({
    nested_nrows: (row) => row.data.nrows(),
    nested_cols: (row) => row.data.columns().join(","),
  });

  console.log("--- mutated ---");
  mutated.print();

  expect(mutated[0].nested_nrows).toBe(2);
  expect(mutated[1].nested_nrows).toBe(1);
  expect(mutated[0].nested_cols).toBe("x");
});

Deno.test("DataFrame as column type - toJSON with nested DataFrames", () => {
  const nested = createDataFrame([
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);

  const df = createDataFrame([
    { id: 1, data: nested },
  ]);

  const json = df.toJSON();
  console.log("--- toJSON ---");
  console.log(JSON.stringify(json, null, 2));
});

Deno.test("DataFrame as column type - groupBy with nested DataFrame column", () => {
  const nested1 = createDataFrame([{ x: 1 }]);
  const nested2 = createDataFrame([{ x: 2 }]);

  const df = createDataFrame([
    { group: "a", id: 1, data: nested1 },
    { group: "a", id: 2, data: nested2 },
    { group: "b", id: 3, data: nested1 },
  ]);

  console.log("--- groupBy + summarize with nested DataFrame ---");
  const summary = df
    .groupBy("group")
    .summarize({
      count: (g) => g.nrows(),
      total_nested_rows: (g) => s.sum(g.data.map((d) => d.nrows())),
    });

  summary.print();

  expect(summary[0].count).toBe(2);
  expect(summary[0].total_nested_rows).toBe(2);
});

Deno.test("DataFrame as column type - select/drop", () => {
  const nested = createDataFrame([{ x: 1 }]);

  const df = createDataFrame([
    { id: 1, data: nested, extra: "foo" },
  ]);

  const selected = df.select("id", "data");
  console.log("--- select ---");
  selected.print();
  expect(selected.ncols()).toBe(2);
  expect(selected.columns()).toEqual(["id", "data"]);
});

Deno.test("Zod zDataFrame - parse columnar data into DataFrame", () => {
  const NestedSchema = zDataFrame({ x: z.number(), y: z.number() });

  const df = NestedSchema.parse({ x: [1, 2], y: [10, 20] });

  console.log("--- zod parsed DataFrame ---");
  df.print();

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(2);
  expect(df[0].x).toBe(1);
  expect(df[1].y).toBe(20);
  expect(df.columns()).toEqual(["x", "y"]);
});

Deno.test("Zod zDataFrame - passthrough existing DataFrame", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.number() });

  const existing = createDataFrame({ columns: { x: [1, 2], y: [10, 20] } });
  const df = Schema.parse(existing);

  console.log("--- zod passthrough ---");
  df.print();
  console.log("same reference:", df === existing);

  expect(df.nrows()).toBe(2);
  expect(df[0].x).toBe(1);
  expect(df).toBe(existing);
});

Deno.test("Zod zDataFrame - validation rejects bad data", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.string() });

  console.log("--- zod validation ---");

  // Should reject non-array values
  try {
    Schema.parse({ x: 1, y: "a" });
  } catch (e) {
    console.log("non-array rejected:", (e as Error).message);
  }

  // Should reject wrong element types
  try {
    Schema.parse({ x: [1, 2], y: [10, 20] });
  } catch (e) {
    console.log("wrong types rejected:", (e as Error).message);
  }

  expect(() => Schema.parse({ x: 1, y: "a" })).toThrow();
  expect(() => Schema.parse({ x: [1, 2], y: [10, 20] })).toThrow();

  // Should pass with correct types
  const df = Schema.parse({ x: [1, 2], y: ["a", "b"] });
  console.log("valid parse:");
  df.print();

  expect(df.nrows()).toBe(2);
  expect(df[0].y).toBe("a");
});

Deno.test("Zod zDataFrame - nested DataFrame column", () => {
  const NestedSchema = zDataFrame({ x: z.number() });
  const OuterSchema = zDataFrame({ id: z.number(), data: NestedSchema });

  // Outer has columnar data where 'data' column is an array of columnar objects
  const result = OuterSchema.parse({
    id: [1, 2],
    data: [
      { x: [10, 20] },
      { x: [30] },
    ],
  });

  console.log("--- nested zDataFrame ---");
  result.print();
  console.log("result[0].data:", result[0].data);
  console.log("result[0].data.nrows():", result[0].data.nrows());
  console.log("result[1].data.nrows():", result[1].data.nrows());

  expect(result.nrows()).toBe(2);
  expect(result[0].id).toBe(1);
  expect(result[0].data.nrows()).toBe(2);
  expect(result[1].data.nrows()).toBe(1);
  expect(result[0].data[0].x).toBe(10);
});
