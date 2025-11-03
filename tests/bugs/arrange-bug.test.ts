/**
 * Test: Verify arrange() with multiple columns works correctly
 */

import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { expect } from "@std/expect";

Deno.test("arrange with multiple columns sorts correctly", () => {
  const data = createDataFrame([
    { pat_enc_csn_id: 100, note_id: 1, line: 3, text: "Third" },
    { pat_enc_csn_id: 100, note_id: 1, line: 1, text: "First" },
    { pat_enc_csn_id: 100, note_id: 2, line: 2, text: "Note2-Second" },
    { pat_enc_csn_id: 100, note_id: 1, line: 2, text: "Second" },
    { pat_enc_csn_id: 200, note_id: 1, line: 2, text: "Patient2-Second" },
    { pat_enc_csn_id: 100, note_id: 2, line: 1, text: "Note2-First" },
    { pat_enc_csn_id: 200, note_id: 1, line: 1, text: "Patient2-First" },
  ]);

  console.log("Before arrange:");
  data.print();

  const sorted = data.arrange("pat_enc_csn_id", "note_id", "line");

  console.log("\nAfter arrange:");
  sorted.print();

  const rows = sorted.toArray();

  // Verify correct sort order: patient 100, note 1, lines 1,2,3
  expect(rows[0]).toEqual({
    pat_enc_csn_id: 100,
    note_id: 1,
    line: 1,
    text: "First",
  });
  expect(rows[1]).toEqual({
    pat_enc_csn_id: 100,
    note_id: 1,
    line: 2,
    text: "Second",
  });
  expect(rows[2]).toEqual({
    pat_enc_csn_id: 100,
    note_id: 1,
    line: 3,
    text: "Third",
  });

  // Then patient 100, note 2, lines 1,2
  expect(rows[3]).toEqual({
    pat_enc_csn_id: 100,
    note_id: 2,
    line: 1,
    text: "Note2-First",
  });
  expect(rows[4]).toEqual({
    pat_enc_csn_id: 100,
    note_id: 2,
    line: 2,
    text: "Note2-Second",
  });

  // Finally patient 200, note 1, lines 1,2
  expect(rows[5]).toEqual({
    pat_enc_csn_id: 200,
    note_id: 1,
    line: 1,
    text: "Patient2-First",
  });
  expect(rows[6]).toEqual({
    pat_enc_csn_id: 200,
    note_id: 1,
    line: 2,
    text: "Patient2-Second",
  });

  console.log("✓ Multi-column arrange works correctly");
});

Deno.test("arrange single column descending", () => {
  const df = createDataFrame([
    { id: 1, value: 3 },
    { id: 2, value: 1 },
    { id: 3, value: 2 },
  ]);

  const sorted = df.arrange("value", "desc");
  const rows = sorted.toArray();

  expect(rows.map((r) => r.value)).toEqual([3, 2, 1]);
});

Deno.test("arrange array syntax with mixed directions", () => {
  const df = createDataFrame([
    { a: 1, b: 2, id: "x" },
    { a: 1, b: 3, id: "y" },
    { a: 2, b: 1, id: "z" },
    { a: 2, b: 9, id: "w" },
  ]);

  const sorted = df.arrange(["a", "b"], ["asc", "desc"]);
  const out = sorted.toArray();

  // Within a=1, b is descending (3 then 2). Then a=2 with b descending (9 then 1)
  expect(out.map((r) => r.id)).toEqual(["y", "x", "w", "z"]);
});

Deno.test("arrange treats null/undefined as last (ascending)", () => {
  const df = createDataFrame([
    { v: 2 },
    { v: null },
    { v: 1 },
    { v: undefined },
  ]);

  const sorted = df.arrange("v");
  const values = sorted.toArray().map((r) => r.v);

  // Ascending with NA last
  expect(values).toEqual([1, 2, null, undefined]);
});

Deno.test("arrange array + single shared direction (desc)", () => {
  const df = createDataFrame([
    { x: 1, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 5 },
    { x: 2, y: 15 },
  ]);

  const sorted = df.arrange(["x", "y"], "desc");
  const pairs = sorted.toArray().map((r) => [r.x, r.y]);

  // Both columns descending lexicographically by (x, y)
  expect(pairs).toEqual([
    [2, 15],
    [2, 5],
    [1, 20],
    [1, 10],
  ]);
});

Deno.test("arrange throws on invalid variadic array second argument", () => {
  const df = createDataFrame([
    { a: 2, b: 1 },
    { a: 1, b: 2 },
  ]);

  // Using array as second parameter in variadic form should throw; use array form instead
  // deno-lint-ignore no-explicit-any
  expect(() => (df as any).arrange("a", ["b"]))
    .toThrow();
});

Deno.test("arrange within groups sorts per-group and preserves group block order", () => {
  const df = createDataFrame([
    { grp: "A", val: 1, id: "a1" },
    { grp: "A", val: 2, id: "a2" },
    { grp: "B", val: 1, id: "b1" },
    { grp: "B", val: 3, id: "b3" },
  ]);

  const sorted = df.groupBy("grp").arrange("val", "desc");
  const out = sorted.toArray();

  // Group A first, sorted desc by val, then Group B, sorted desc
  expect(out.map((r) => r.id)).toEqual(["a2", "a1", "b3", "b1"]);
});
