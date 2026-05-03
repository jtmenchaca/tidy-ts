// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { id: "P1", code: "A", val: 10 },
  { id: "P1", code: "A", val: 20 },
  { id: "P1", code: "B", val: 30 },
  { id: "P2", code: "A", val: 40 },
  { id: "P2", code: "A", val: 50 },
  { id: "P2", code: "B", val: 60 },
]);

Deno.test("shuffle - filtered grouped data preserves correct rows", () => {
  const filtered = df.filter((r: any) => r.code === "A");
  const result = filtered.groupBy("id").shuffle(42);

  // Should have 4 rows (all code "A" rows)
  expect(result.nrows()).toBe(4);

  // All rows must be from filtered set (no code "B" leaking through)
  const rows = [...result];
  for (const row of rows) {
    expect((row as any).code).toBe("A");
  }

  // All original filtered vals must be present
  const vals = rows.map((r: any) => r.val).sort((a: number, b: number) => a - b);
  expect(vals).toEqual([10, 20, 40, 50]);
});

Deno.test("shuffle - filtered grouped data is reproducible with seed", () => {
  const filtered = df.filter((r: any) => r.code === "A");
  const r1 = filtered.groupBy("id").shuffle(99);
  const r2 = filtered.groupBy("id").shuffle(99);
  expect(r1.toArray()).toEqual(r2.toArray());
});

Deno.test("shuffle - filter keeps all rows, grouped", () => {
  const allKept = df.filter((r: any) => r.val > 0);
  const result = allKept.groupBy("id").shuffle(42);
  expect(result.nrows()).toBe(6);
  const vals = [...result].map((r: any) => r.val).sort((a: number, b: number) => a - b);
  expect(vals).toEqual([10, 20, 30, 40, 50, 60]);
});

Deno.test("shuffle - filter removes 1 row, grouped", () => {
  const oneRemoved = df.filter((r: any) => !(r.id === "P1" && r.val === 30));
  const result = oneRemoved.groupBy("id").shuffle(42);
  expect(result.nrows()).toBe(5);
  const vals = [...result].map((r: any) => r.val).sort((a: number, b: number) => a - b);
  expect(vals).toEqual([10, 20, 40, 50, 60]);
});
