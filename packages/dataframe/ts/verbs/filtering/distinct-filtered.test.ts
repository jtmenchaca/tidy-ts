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

Deno.test("distinct - on filtered data (ungrouped)", () => {
  const filtered = df.filter((r: any) => r.code === "A");
  const result = filtered.distinct("id");
  expect(result.nrows()).toBe(2);
  const ids = [...result].map((r: any) => r.id).sort();
  expect(ids).toEqual(["P1", "P2"]);
});

Deno.test("distinct - on filtered data (grouped)", () => {
  const filtered = df.filter((r: any) => r.code === "A");
  const result = filtered.groupBy("id").distinct("code");
  expect(result.nrows()).toBe(2); // 1 unique code per group (both "A")
  const out = [...result].map((r: any) => ({ id: r.id, code: r.code }));
  expect(out).toEqual([
    { id: "P1", code: "A" },
    { id: "P2", code: "A" },
  ]);
});

Deno.test("distinct - filtered data doesn't leak unfiltered rows", () => {
  // Filter removes all code "B" rows
  const filtered = df.filter((r: any) => r.code === "A");
  const result = filtered.distinct("code");
  expect(result.nrows()).toBe(1);
  expect(result[0].code).toBe("A");
});

Deno.test("distinct - filter keeps all rows", () => {
  const allKept = df.filter((r: any) => r.val > 0);
  const result = allKept.groupBy("id").distinct("code");
  expect(result.nrows()).toBe(4); // P1: A,B; P2: A,B
});

Deno.test("distinct - filter removes 1 row", () => {
  // Remove P1's code B row
  const oneRemoved = df.filter(
    (r: any) => !(r.id === "P1" && r.code === "B"),
  );
  const result = oneRemoved.groupBy("id").distinct("code");
  // P1: only A; P2: A,B
  expect(result.nrows()).toBe(3);
  const out = [...result].map((r: any) => `${r.id}:${r.code}`).sort();
  expect(out).toEqual(["P1:A", "P2:A", "P2:B"]);
});

Deno.test("distinct - filter then mutate then distinct", () => {
  const result = df
    .filter((r: any) => r.code === "A")
    .mutate({ label: (r: any) => `${r.id}-${r.code}` })
    .distinct("label");
  expect(result.nrows()).toBe(2);
  const labels = [...result].map((r: any) => r.label).sort();
  expect(labels).toEqual(["P1-A", "P2-A"]);
});
