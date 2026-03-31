/**
 * Runtime tests for the generic DataFrame functions in test-join.ts.
 * Exercises each function with concrete data to verify they work at runtime,
 * not just at the type level.
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import {
  testMutateSelect,
  testInnerJoin,
  testJoinedFieldAccess_innerJoin,
  testJoinedFieldAccess_leftJoin,
  testJoinedFieldAccess_rightJoin,
  testJoinedFieldAccess_outerJoin,
} from "./test-join.ts";

// ── Test data ──────────────────────────────────────────────────────────────

const refDate1 = Temporal.PlainDateTime.from("2024-01-15T00:00");
const refDate2 = Temporal.PlainDateTime.from("2024-03-20T00:00");
const refDate3 = Temporal.PlainDateTime.from("2024-06-01T00:00");

// ── 1. testMutateSelect ────────────────────────────────────────────────────

Deno.test("testMutateSelect — mutate + select on generic DataFrame", async () => {
  const referenceDates = createDataFrame([
    { id: "A", enrollmentDate: refDate1 },
    { id: "B", enrollmentDate: refDate2 },
    { id: "C", enrollmentDate: refDate3 },
  ]); 

  const result =  await testMutateSelect({
    referenceDates,
    referenceFieldName: "enrollmentDate",
  });

  expect(result.nrows()).toBe(3);
  expect(result.columns()).toEqual(["id", "_refDate"]);
  expect(result[0].id).toBe("A");
  expect(result[0]._refDate).toEqual(refDate1);
  expect(result[2]._refDate).toEqual(refDate3);
});

// ── 3. testInnerJoin ───────────────────────────────────────────────────────

Deno.test("testInnerJoin — innerJoin generic DataFrame on 'id'", () => {
  const events = createDataFrame([
    { id: "A", eventDate: refDate1, code: "X1" },
    { id: "B", eventDate: refDate2, code: "X2" },
    { id: "C", eventDate: refDate3, code: "X3" },
    { id: "D", eventDate: refDate1, code: "X4" },
  ]);

  const anchors = createDataFrame([
    { id: "A", _refDate: refDate1 },
    { id: "C", _refDate: refDate3 },
  ]);

  const result = testInnerJoin({
    events,
    fieldName: "eventDate",
    codeField: "code",
    anchors,
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].id).toBe("A");
  expect(result[0].code).toBe("X1");
  expect(result[0]._refDate).toEqual(refDate1);
  expect(result[1].id).toBe("C");
});

// ── Shared test data for join field access tests ─────────────────────────

const events = createDataFrame([
  { id: "A", eventDate: refDate1, code: "X1" },  // 2024-01-15
  { id: "B", eventDate: refDate2, code: "X2" },  // 2024-03-20
  { id: "C", eventDate: refDate3, code: "X3" },  // 2024-06-01
  { id: "D", eventDate: refDate1, code: "X4" },  // 2024-01-15
]);

const anchors = createDataFrame([
  { id: "A", _refDate: Temporal.PlainDateTime.from("2024-01-20T00:00") },  // eventDate within 14 days
  { id: "B", _refDate: Temporal.PlainDateTime.from("2024-01-01T00:00") },  // eventDate NOT within 14 days
  { id: "C", _refDate: Temporal.PlainDateTime.from("2024-06-10T00:00") },  // eventDate within 14 days
]);

const joinOpts = {
  events,
  fieldName: "eventDate" as const,
  codeField: "code" as const,
  anchors,
};

// ── 6a. testJoinedFieldAccess_innerJoin ──────────────────────────────────

Deno.test("testJoinedFieldAccess_innerJoin — generic field access on inner join result", () => {
  const result = testJoinedFieldAccess_innerJoin(joinOpts);

  // A: eventDate=Jan15, _refDate=Jan20, window=Jan06..Jan20 → Jan15 >= Jan06 ✓
  // B: eventDate=Mar20, _refDate=Jan01, window=Dec18..Jan01 → Mar20 >= Dec18 ✓
  // C: eventDate=Jun01, _refDate=Jun10, window=May27..Jun10 → Jun01 >= May27 ✓
  // D: no match in anchors → excluded by inner join
  expect(result.nrows()).toBe(3);
  expect(result[0].id).toBe("A");
  expect(result[0]._refDate).toBeDefined();
});

// ── 6b. testJoinedFieldAccess_leftJoin ───────────────────────────────────

Deno.test("testJoinedFieldAccess_leftJoin — generic field access on left join result", () => {
  const result = testJoinedFieldAccess_leftJoin(joinOpts);

  // Same filter as inner join, but D has no anchor match → _refDate undefined → filtered out
  // A, B, C all match and pass filter (same as inner join analysis)
  expect(result.nrows()).toBe(3);
  expect(result[0].id).toBe("A");
});

// ── 6c. testJoinedFieldAccess_rightJoin ──────────────────────────────────

Deno.test("testJoinedFieldAccess_rightJoin — generic field access on right join result", () => {
  const result = testJoinedFieldAccess_rightJoin(joinOpts);

  // Right join keeps all anchor rows (A, B, C). _refDate is always defined.
  // Filter is `wStart != null` which is always true, so all 3 rows pass.
  expect(result.nrows()).toBe(3);
  expect(result[0]._refDate).toBeDefined();
});

// ── 6d. testJoinedFieldAccess_outerJoin ──────────────────────────────────

Deno.test("testJoinedFieldAccess_outerJoin — generic field access on outer join result", () => {
  const result = testJoinedFieldAccess_outerJoin(joinOpts);

  // Outer join: A, B, C, D all present. D has no anchor → _refDate undefined → filtered out.
  // A, B, C have _refDate → wStart != null → pass filter.
  expect(result.nrows()).toBe(3);
  expect(result[0]._refDate).toBeDefined();
});
