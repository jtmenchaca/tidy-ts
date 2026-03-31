/**
 * Runtime tests for the generic DataFrame functions in test-join.ts.
 * Exercises each function with concrete data to verify they work at runtime,
 * not just at the type level.
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { testMutateSelect, testInnerJoin } from "./test-join.ts";

// ── Test data ──────────────────────────────────────────────────────────────

const refDate1 = Temporal.PlainDateTime.from("2024-01-15T00:00");
const refDate2 = Temporal.PlainDateTime.from("2024-03-20T00:00");
const refDate3 = Temporal.PlainDateTime.from("2024-06-01T00:00");

// ── 1. testMutateSelect ────────────────────────────────────────────────────

Deno.test("testMutateSelect — mutate + select on generic DataFrame", () => {
  const referenceDates = createDataFrame([
    { id: "A", enrollmentDate: refDate1 },
    { id: "B", enrollmentDate: refDate2 },
    { id: "C", enrollmentDate: refDate3 },
  ]);

  const result = testMutateSelect({
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
