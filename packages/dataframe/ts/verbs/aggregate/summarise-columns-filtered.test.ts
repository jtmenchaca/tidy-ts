// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { id: "P1", code: "A", score1: 10, score2: 20 },
  { id: "P1", code: "A", score1: 30, score2: 40 },
  { id: "P1", code: "B", score1: 50, score2: 60 },
  { id: "P2", code: "A", score1: 70, score2: 80 },
  { id: "P2", code: "B", score1: 90, score2: 100 },
]);

Deno.test("summariseColumns - grouped on filtered data", () => {
  const filtered = df.filter((r: any) => r.code === "A");
  const result = filtered.groupBy("id").summariseColumns({
    colType: "number",
    columns: ["score1", "score2"],
    newColumns: [
      { prefix: "mean_", fn: (col) => stats.mean(col) },
    ],
  });

  expect(result.nrows()).toBe(2);
  const out = [...result].map((r: any) => ({
    id: r.id,
    m1: r.mean_score1,
    m2: r.mean_score2,
  }));
  expect(out).toEqual([
    { id: "P1", m1: 20, m2: 30 },  // (10+30)/2, (20+40)/2
    { id: "P2", m1: 70, m2: 80 },  // single row
  ]);
});

Deno.test("summariseColumns - ungrouped on filtered data", () => {
  const filtered = df.filter((r: any) => r.code === "A");
  const result = filtered.summariseColumns({
    colType: "number",
    columns: ["score1", "score2"],
    newColumns: [
      { prefix: "sum_", fn: (col) => stats.sum(col) },
    ],
  });

  expect(result.nrows()).toBe(1);
  expect(result[0]["sum_score1"]).toBe(110); // 10+30+70
  expect(result[0]["sum_score2"]).toBe(140); // 20+40+80
});

Deno.test("summariseColumns - filter keeps all rows, grouped", () => {
  const allKept = df.filter((r: any) => r.score1 > 0);
  const result = allKept.groupBy("id").summariseColumns({
    colType: "number",
    columns: ["score1"],
    newColumns: [
      { prefix: "sum_", fn: (col) => stats.sum(col) },
    ],
  });

  expect(result.nrows()).toBe(2);
  const out = [...result].map((r: any) => ({
    id: r.id,
    s: r.sum_score1,
  }));
  expect(out).toEqual([
    { id: "P1", s: 90 },  // 10+30+50
    { id: "P2", s: 160 }, // 70+90
  ]);
});
