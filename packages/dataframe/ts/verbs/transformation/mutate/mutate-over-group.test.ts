import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ── Core: group isolation ────────────────────────────────────────────────────

Deno.test("mutateOverGroup — cummax per group does not bleed", () => {
  const df = createDataFrame([
    { group: "A", value: 10 },
    { group: "A", value: 30 },
    { group: "A", value: 20 },
    { group: "B", value: 1 },
    { group: "B", value: 2 },
    { group: "B", value: 3 },
  ]);

  const result = df
    .groupBy("group")
    .mutateOverGroup({ cm: (g) => s.cummax(g.extract("value")) });

  result.print();

  const rows = result.toArray();
  const groupA = rows.filter((r) => r.group === "A");
  const groupB = rows.filter((r) => r.group === "B");

  expect(groupA.map((r) => r.cm)).toEqual([10, 30, 30]);
  expect(groupB.map((r) => r.cm)).toEqual([1, 2, 3]);
});

Deno.test("mutateOverGroup — lag per group does not bleed", () => {
  const df = createDataFrame([
    { id: "A", value: 100 },
    { id: "A", value: 200 },
    { id: "A", value: 300 },
    { id: "B", value: 10 },
    { id: "B", value: 20 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ prev: (g) => s.lag(g.extract("value")) });

  const rows = result.toArray();
  const a = rows.filter((r) => r.id === "A");
  const b = rows.filter((r) => r.id === "B");

  expect(a.map((r) => r.prev)).toEqual([undefined, 100, 200]);
  expect(b.map((r) => r.prev)).toEqual([undefined, 10]);
});

Deno.test("mutateOverGroup — cumsum per group", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 2 },
    { id: "A", value: 3 },
    { id: "B", value: 10 },
    { id: "B", value: 20 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ running: (g) => s.cumsum(g.extract("value")) });

  const rows = result.toArray();
  const a = rows.filter((r) => r.id === "A");
  const b = rows.filter((r) => r.id === "B");

  expect(a.map((r) => r.running)).toEqual([1, 3, 6]);
  expect(b.map((r) => r.running)).toEqual([10, 30]);
});

Deno.test("mutateOverGroup — cummin per group", () => {
  const df = createDataFrame([
    { id: "X", value: 5 },
    { id: "X", value: 3 },
    { id: "X", value: 7 },
    { id: "Y", value: 100 },
    { id: "Y", value: 50 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ runMin: (g) => s.cummin(g.extract("value")) });

  const rows = result.toArray();
  expect(rows.filter((r) => r.id === "X").map((r) => r.runMin)).toEqual([5, 3, 3]);
  expect(rows.filter((r) => r.id === "Y").map((r) => r.runMin)).toEqual([100, 50]);
});

Deno.test("mutateOverGroup — lead per group", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 2 },
    { id: "A", value: 3 },
    { id: "B", value: 10 },
    { id: "B", value: 20 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ next: (g) => s.lead(g.extract("value")) });

  const rows = result.toArray();
  expect(rows.filter((r) => r.id === "A").map((r) => r.next)).toEqual([2, 3, undefined]);
  expect(rows.filter((r) => r.id === "B").map((r) => r.next)).toEqual([20, undefined]);
});

// ── Chaining: mutateOverGroup → mutateOverGroup ──────────────────────────────

Deno.test("mutateOverGroup — chained calls reference prior columns", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 3 },
    { id: "A", value: 2 },
    { id: "B", value: 5 },
    { id: "B", value: 4 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ cumMax: (g) => s.cummax(g.extract("value")) })
    .mutateOverGroup({ prevCumMax: (g) => s.lag(g.extract("cumMax")) });

  const rows = result.toArray();
  const a = rows.filter((r) => r.id === "A");

  expect(a.map((r) => r.cumMax)).toEqual([1, 3, 3]);
  expect(a.map((r) => r.prevCumMax)).toEqual([undefined, 1, 3]);
});

// ── Chaining: mutateOverGroup → mutate (mixed) ──────────────────────────────

Deno.test("mutateOverGroup → mutate — row-level after group-level", () => {
  const df = createDataFrame([
    { id: "A", value: 10 },
    { id: "A", value: 20 },
    { id: "B", value: 5 },
    { id: "B", value: 15 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ prev: (g) => s.lag(g.extract("value"), { defaultValue: 0 }) })
    .mutate({ diff: (row) => row.value - row.prev });

  const rows = result.toArray();
  const a = rows.filter((r) => r.id === "A");
  const b = rows.filter((r) => r.id === "B");

  expect(a.map((r) => r.diff)).toEqual([10, 10]);
  expect(b.map((r) => r.diff)).toEqual([5, 10]);
});

// ── Chaining: mutate → mutateOverGroup ──────────────────────────────────────

Deno.test("mutate → mutateOverGroup — group-level after row-level", () => {
  const df = createDataFrame([
    { id: "A", x: 1, y: 2 },
    { id: "A", x: 3, y: 4 },
    { id: "B", x: 10, y: 20 },
    { id: "B", x: 30, y: 40 },
  ]);

  const result = df
    .mutate({ sum: (r) => r.x + r.y })
    .groupBy("id")
    .mutateOverGroup({ cumSum: (g) => s.cumsum(g.extract("sum")) });

  const rows = result.toArray();
  expect(rows.filter((r) => r.id === "A").map((r) => r.cumSum)).toEqual([3, 10]);
  expect(rows.filter((r) => r.id === "B").map((r) => r.cumSum)).toEqual([30, 100]);
});

// ── Ungrouped ────────────────────────────────────────────────────────────────

Deno.test("mutateOverGroup — ungrouped treats whole df as one group", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: 20 },
    { value: 30 },
  ]);

  const result = df.mutateOverGroup({
    cm: (g) => s.cummax(g.extract("value")),
  });

  expect(result.extract("cm")).toEqual([10, 20, 30]);
});

Deno.test("mutateOverGroup — ungrouped lag", () => {
  const df = createDataFrame([
    { value: 1 },
    { value: 2 },
    { value: 3 },
  ]);

  const result = df.mutateOverGroup({
    prev: (g) => s.lag(g.extract("value")),
  });

  expect(result.extract("prev")).toEqual([undefined, 1, 2]);
});

Deno.test("mutateOverGroup — ungrouped lead", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: 20 },
    { value: 30 },
  ]);

  const result = df.mutateOverGroup({
    next: (g) => s.lead(g.extract("value")),
  });

  expect(result.extract("next")).toEqual([20, 30, undefined]);
});

Deno.test("mutateOverGroup — ungrouped lag with defaultValue", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: 20 },
    { value: 30 },
  ]);

  const result = df.mutateOverGroup({
    prev: (g) => s.lag(g.extract("value"), { defaultValue: 0 }),
  });

  expect(result.extract("prev")).toEqual([0, 10, 20]);
});

Deno.test("mutateOverGroup — ungrouped lead with defaultValue", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: 20 },
    { value: 30 },
  ]);

  const result = df.mutateOverGroup({
    next: (g) => s.lead(g.extract("value"), { defaultValue: 0 }),
  });

  expect(result.extract("next")).toEqual([20, 30, 0]);
});

Deno.test("mutateOverGroup — ungrouped multiple columns", () => {
  const df = createDataFrame([
    { value: 5 },
    { value: 3 },
    { value: 8 },
    { value: 1 },
  ]);

  const result = df.mutateOverGroup({
    runMax: (g) => s.cummax(g.extract("value")),
    runMin: (g) => s.cummin(g.extract("value")),
    runSum: (g) => s.cumsum(g.extract("value")),
  });

  expect(result.extract("runMax")).toEqual([5, 5, 8, 8]);
  expect(result.extract("runMin")).toEqual([5, 3, 3, 1]);
  expect(result.extract("runSum")).toEqual([5, 8, 16, 17]);
});

// ── Multiple groups ──────────────────────────────────────────────────────────

Deno.test("mutateOverGroup — three groups", () => {
  const df = createDataFrame([
    { g: "X", v: 1 },
    { g: "Y", v: 10 },
    { g: "Z", v: 100 },
    { g: "X", v: 2 },
    { g: "Y", v: 20 },
    { g: "Z", v: 200 },
  ]);

  const result = df
    .groupBy("g")
    .mutateOverGroup({ cs: (g) => s.cumsum(g.extract("v")) });

  const rows = result.toArray();
  expect(rows.filter((r) => r.g === "X").map((r) => r.cs)).toEqual([1, 3]);
  expect(rows.filter((r) => r.g === "Y").map((r) => r.cs)).toEqual([10, 30]);
  expect(rows.filter((r) => r.g === "Z").map((r) => r.cs)).toEqual([100, 300]);
});

Deno.test("mutateOverGroup — single-row groups", () => {
  const df = createDataFrame([
    { id: "A", value: 42 },
    { id: "B", value: 99 },
    { id: "C", value: 7 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ prev: (g) => s.lag(g.extract("value")) });

  const rows = result.toArray();
  expect(rows.map((r) => r.prev)).toEqual([undefined, undefined, undefined]);
});

// ── Multiple columns in one call ─────────────────────────────────────────────

Deno.test("mutateOverGroup — multiple window functions in one call", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 5 },
    { id: "A", value: 3 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({
      runMax: (g) => s.cummax(g.extract("value")),
      runMin: (g) => s.cummin(g.extract("value")),
    });

  expect(result.extract("runMax")).toEqual([1, 5, 5]);
  expect(result.extract("runMin")).toEqual([1, 1, 1]);
});

// ── Error handling ───────────────────────────────────────────────────────────

Deno.test("mutateOverGroup — length mismatch throws (ungrouped)", () => {
  const df = createDataFrame([
    { value: 1 },
    { value: 2 },
    { value: 3 },
  ]);

  expect(() => {
    df.mutateOverGroup({
      bad: () => [1, 2],
    });
  }).toThrow("returned 2 values but DataFrame has 3 rows");
});

Deno.test("mutateOverGroup — length mismatch throws (grouped)", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 2 },
    { id: "B", value: 3 },
  ]);

  expect(() => {
    df.groupBy("id").mutateOverGroup({
      bad: () => [1],
    });
  }).toThrow("returned 1 values but group has 2 rows");
});

// ── Chaining with other verbs ────────────────────────────────────────────────

Deno.test("mutateOverGroup → filter → summarize", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 2 },
    { id: "A", value: 3 },
    { id: "B", value: 10 },
    { id: "B", value: 20 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ cs: (g) => s.cumsum(g.extract("value")) })
    .filter((r) => r.cs > 2)
    .groupBy("id")
    .summarize({ total: (g) => s.sum(g.extract("cs")) });

  const rows = result.toArray();
  const a = rows.find((r) => r.id === "A");
  const b = rows.find((r) => r.id === "B");

  // A: cumsum = [1, 3, 6], filter > 2 → [3, 6], sum = 9
  expect(a?.total).toBe(9);
  // B: cumsum = [10, 30], both > 2, sum = 40
  expect(b?.total).toBe(40);
});

Deno.test("mutateOverGroup — preserves grouping for subsequent operations", () => {
  const df = createDataFrame([
    { id: "A", value: 1 },
    { id: "A", value: 2 },
    { id: "B", value: 10 },
    { id: "B", value: 20 },
  ]);

  // After mutateOverGroup, grouping should be preserved
  const result = df
    .groupBy("id")
    .mutateOverGroup({ cs: (g) => s.cumsum(g.extract("value")) })
    .summarize({ maxCs: (g) => s.max(g.extract("cs")) });

  const rows = result.toArray();
  expect(rows.find((r) => r.id === "A")?.maxCs).toBe(3);
  expect(rows.find((r) => r.id === "B")?.maxCs).toBe(30);
});

// ── Overwriting existing columns ─────────────────────────────────────────────

Deno.test("mutateOverGroup — overwrites existing column", () => {
  const df = createDataFrame([
    { id: "A", value: 5 },
    { id: "A", value: 3 },
    { id: "A", value: 8 },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ value: (g) => s.cummax(g.extract("value")) });

  expect(result.extract("value")).toEqual([5, 5, 8]);
});

// ── Date/Temporal types ──────────────────────────────────────────────────────

Deno.test("mutateOverGroup — works with Date columns", () => {
  const df = createDataFrame([
    { id: "A", date: new Date("2024-01-01") },
    { id: "A", date: new Date("2024-01-15") },
    { id: "A", date: new Date("2024-01-10") },
    { id: "B", date: new Date("2024-06-01") },
    { id: "B", date: new Date("2024-03-01") },
  ]);

  const result = df
    .groupBy("id")
    .mutateOverGroup({ maxDate: (g) => s.cummax(g.extract("date")) });

  const rows = result.toArray();
  const a = rows.filter((r) => r.id === "A");
  expect(a[0].maxDate).toEqual(new Date("2024-01-01"));
  expect(a[1].maxDate).toEqual(new Date("2024-01-15"));
  expect(a[2].maxDate).toEqual(new Date("2024-01-15"));
});
