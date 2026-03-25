/**
 * Tests for aggregate statistical functions (max, min, mean)
 */

import { expect } from "@std/expect";
import { all } from "./all.ts";
import { any } from "./any.ts";
import { max } from "./max.ts";
import { min } from "./min.ts";
import { mean } from "../descriptive/central-tendency/mean.ts";

// ============================================================================
// MAX TESTS
// ============================================================================

Deno.test("max - single number value", () => {
  expect(max(42)).toBe(42);
  expect(max(-5)).toBe(-5);
  expect(max(0)).toBe(0);
});

Deno.test("max - single NaN value", () => {
  const result = max(NaN);
  expect(Number.isNaN(result)).toBe(true);

  const resultRemoved = max(NaN, { removeNaN: true });
  expect(resultRemoved).toBe(null);
});

Deno.test("max - single Date value", () => {
  const date = new Date("2024-01-15");
  expect(max(date)).toEqual(date);
});

Deno.test("max - clean number array", () => {
  expect(max([1, 2, 3, 4, 5])).toBe(5);
  expect(max([5, 4, 3, 2, 1])).toBe(5);
  expect(max([-1, -2, -3])).toBe(-1);
  expect(max([42])).toBe(42);
});

Deno.test("max - empty array returns null", () => {
  expect(max([])).toBe(null);
});

Deno.test("max - array with null (no removal)", () => {
  const result = max([1, null, 3]);
  expect(result).toBe(null);
});

Deno.test("max - array with null (removeNull: true)", () => {
  const result = max([1, null, 3], { removeNull: true });
  expect(result).toBe(3);
});

Deno.test("max - array with undefined (no removal)", () => {
  const result = max([1, undefined, 3]);
  expect(result).toBe(null);
});

Deno.test("max - array with undefined (removeUndefined: true)", () => {
  const result = max([1, undefined, 3], { removeUndefined: true });
  expect(result).toBe(3);
});

Deno.test("max - array with NaN (no removal)", () => {
  const result = max([1, NaN, 3]);
  expect(Number.isNaN(result)).toBe(true);
});

Deno.test("max - array with NaN (removeNaN: true)", () => {
  const result = max([1, NaN, 3], { removeNaN: true });
  expect(result).toBe(3);
});

Deno.test("max - array with all nullable types", () => {
  const result = max([1, null, undefined, NaN, 5], {
    removeNull: true,
    removeUndefined: true,
    removeNaN: true,
  });
  expect(result).toBe(5);
});

Deno.test("max - array with only null/undefined returns null", () => {
  const result = max([null, undefined], {
    removeNull: true,
    removeUndefined: true,
  });
  expect(result).toBe(null);
});

Deno.test("max - Date array", () => {
  const dates = [
    new Date("2024-01-01"),
    new Date("2024-06-15"),
    new Date("2024-03-10"),
  ];
  expect(max(dates)).toEqual(new Date("2024-06-15"));
});

Deno.test("max - Date array with null", () => {
  const dates = [new Date("2024-01-01"), null, new Date("2024-03-10")];
  expect(max(dates)).toBe(null);
  expect(max(dates, { removeNull: true })).toEqual(new Date("2024-03-10"));
});

Deno.test("max - Infinity handling", () => {
  expect(max([1, Infinity, 3])).toBe(Infinity);
  expect(max([1, -Infinity, 3])).toBe(3);
});

// ============================================================================
// MIN TESTS
// ============================================================================

Deno.test("min - single number value", () => {
  expect(min(42)).toBe(42);
  expect(min(-5)).toBe(-5);
  expect(min(0)).toBe(0);
});

Deno.test("min - single NaN value", () => {
  const result = min(NaN);
  expect(Number.isNaN(result)).toBe(true);

  const resultRemoved = min(NaN, { removeNaN: true });
  expect(resultRemoved).toBe(null);
});

Deno.test("min - single Date value", () => {
  const date = new Date("2024-01-15");
  expect(min(date)).toEqual(date);
});

Deno.test("min - clean number array", () => {
  expect(min([1, 2, 3, 4, 5])).toBe(1);
  expect(min([5, 4, 3, 2, 1])).toBe(1);
  expect(min([-1, -2, -3])).toBe(-3);
  expect(min([42])).toBe(42);
});

Deno.test("min - empty array returns null", () => {
  expect(min([])).toBe(null);
});

Deno.test("min - array with null (no removal)", () => {
  const result = min([1, null, 3]);
  expect(result).toBe(null);
});

Deno.test("min - array with null (removeNull: true)", () => {
  const result = min([1, null, 3], { removeNull: true });
  expect(result).toBe(1);
});

Deno.test("min - array with undefined (no removal)", () => {
  const result = min([1, undefined, 3]);
  expect(result).toBe(null);
});

Deno.test("min - array with undefined (removeUndefined: true)", () => {
  const result = min([1, undefined, 3], { removeUndefined: true });
  expect(result).toBe(1);
});

Deno.test("min - array with NaN (no removal)", () => {
  const result = min([1, NaN, 3]);
  expect(Number.isNaN(result)).toBe(true);
});

Deno.test("min - array with NaN (removeNaN: true)", () => {
  const result = min([1, NaN, 3], { removeNaN: true });
  expect(result).toBe(1);
});

Deno.test("min - array with all nullable types", () => {
  const result = min([5, null, undefined, NaN, 1], {
    removeNull: true,
    removeUndefined: true,
    removeNaN: true,
  });
  expect(result).toBe(1);
});

Deno.test("min - array with only null/undefined returns null", () => {
  const result = min([null, undefined], {
    removeNull: true,
    removeUndefined: true,
  });
  expect(result).toBe(null);
});

Deno.test("min - Date array", () => {
  const dates = [
    new Date("2024-01-01"),
    new Date("2024-06-15"),
    new Date("2024-03-10"),
  ];
  expect(min(dates)).toEqual(new Date("2024-01-01"));
});

Deno.test("min - Date array with null", () => {
  const dates = [new Date("2024-01-01"), null, new Date("2024-03-10")];
  expect(min(dates)).toBe(null);
  expect(min(dates, { removeNull: true })).toEqual(new Date("2024-01-01"));
});

Deno.test("min - Infinity handling", () => {
  expect(min([1, Infinity, 3])).toBe(1);
  expect(min([1, -Infinity, 3])).toBe(-Infinity);
});

// ============================================================================
// MEAN TESTS
// ============================================================================

Deno.test("mean - single number value", () => {
  expect(mean(42)).toBe(42);
  expect(mean(-5)).toBe(-5);
  expect(mean(0)).toBe(0);
});

Deno.test("mean - single NaN value", () => {
  const result = mean(NaN);
  expect(Number.isNaN(result)).toBe(true);

  const resultRemoved = mean(NaN, { removeNaN: true });
  expect(resultRemoved).toBe(null);
});

Deno.test("mean - clean number array", () => {
  expect(mean([1, 2, 3, 4, 5])).toBe(3);
  expect(mean([10, 20, 30])).toBe(20);
  expect(mean([-1, -2, -3])).toBe(-2);
  expect(mean([42])).toBe(42);
});

Deno.test("mean - empty array returns null", () => {
  expect(mean([])).toBe(null);
});

Deno.test("mean - array with null (no removal)", () => {
  const result = mean([1, null, 3]);
  expect(result).toBe(null);
});

Deno.test("mean - array with null (removeNull: true)", () => {
  const result = mean([1, null, 5], { removeNull: true });
  expect(result).toBe(3); // (1 + 5) / 2 = 3
});

Deno.test("mean - array with undefined (no removal)", () => {
  const result = mean([1, undefined, 3]);
  expect(result).toBe(null);
});

Deno.test("mean - array with undefined (removeUndefined: true)", () => {
  const result = mean([1, undefined, 5], { removeUndefined: true });
  expect(result).toBe(3); // (1 + 5) / 2 = 3
});

Deno.test("mean - array with NaN (no removal)", () => {
  const result = mean([1, NaN, 3]);
  expect(Number.isNaN(result)).toBe(true);
});

Deno.test("mean - array with NaN (removeNaN: true)", () => {
  const result = mean([1, NaN, 5], { removeNaN: true });
  expect(result).toBe(3); // (1 + 5) / 2 = 3
});

Deno.test("mean - array with all nullable types", () => {
  const result = mean([1, null, undefined, NaN, 9], {
    removeNull: true,
    removeUndefined: true,
    removeNaN: true,
  });
  expect(result).toBe(5); // (1 + 9) / 2 = 5
});

Deno.test("mean - array with only null/undefined returns null", () => {
  const result = mean([null, undefined], {
    removeNull: true,
    removeUndefined: true,
  });
  expect(result).toBe(null);
});

Deno.test("mean - Infinity handling", () => {
  expect(mean([1, Infinity, 3])).toBe(Infinity);
  expect(mean([1, -Infinity, 3])).toBe(-Infinity);
  expect(mean([Infinity, -Infinity])).toBeNaN(); // Infinity + (-Infinity) = NaN
});

// ============================================================================
// TYPE TESTS - Compile-time verification of overload return types
// These tests verify that the correct return type is inferred at compile time.
// If any assignment fails to compile, the overloads are wrong.
// ============================================================================

Deno.test("TYPE: max overloads return correct types", () => {
  // Clean arrays return non-nullable
  const r1 = max([1, 2, 3]);
  const _t1: number = r1; // Should compile - clean array returns number

  const r2 = max([new Date(), new Date()]);
  const _t2: Date = r2; // Should compile - clean Date array returns Date

  // (number | null)[] with removeNull: true returns number
  const r3 = max([1, null, 3] as (number | null)[], { removeNull: true });
  const _t3: number = r3; // Should compile

  // (number | undefined)[] with removeUndefined: true returns number
  const r4 = max([1, undefined, 3] as (number | undefined)[], {
    removeUndefined: true,
  });
  const _t4: number = r4; // Should compile

  // (number | null | undefined)[] with both flags returns number
  const r5 = max([1, null, undefined, 3] as (number | null | undefined)[], {
    removeNull: true,
    removeUndefined: true,
  });
  const _t5: number = r5; // Should compile

  // (number | null | undefined)[] with only one flag returns number | null
  const r6 = max([1, null, undefined, 3] as (number | null | undefined)[], {
    removeNull: true,
  });
  const _t6: number | null = r6; // Should compile - still has undefined risk

  // Suppress unused variable warnings
  void [_t1, _t2, _t3, _t4, _t5, _t6];
});

Deno.test("TYPE: min overloads return correct types", () => {
  // Clean arrays return non-nullable
  const r1 = min([1, 2, 3]);
  const _t1: number = r1;

  const r2 = min([new Date(), new Date()]);
  const _t2: Date = r2;

  // (number | null)[] with removeNull: true returns number
  const r3 = min([1, null, 3] as (number | null)[], { removeNull: true });
  const _t3: number = r3;

  // (number | undefined)[] with removeUndefined: true returns number
  const r4 = min([1, undefined, 3] as (number | undefined)[], {
    removeUndefined: true,
  });
  const _t4: number = r4;

  // (number | null | undefined)[] with both flags returns number
  const r5 = min([1, null, undefined, 3] as (number | null | undefined)[], {
    removeNull: true,
    removeUndefined: true,
  });
  const _t5: number = r5;

  // (number | null | undefined)[] with only one flag returns number | null
  const r6 = min([1, null, undefined, 3] as (number | null | undefined)[], {
    removeUndefined: true,
  });
  const _t6: number | null = r6;

  void [_t1, _t2, _t3, _t4, _t5, _t6];
});

Deno.test("TYPE: mean overloads return correct types", () => {
  // Clean arrays return non-nullable
  const r1 = mean([1, 2, 3]);
  const _t1: number = r1;

  // (number | null)[] with removeNull: true returns number
  const r2 = mean([1, null, 3] as (number | null)[], { removeNull: true });
  const _t2: number = r2;

  // (number | undefined)[] with removeUndefined: true returns number
  const r3 = mean([1, undefined, 3] as (number | undefined)[], {
    removeUndefined: true,
  });
  const _t3: number = r3;

  // (number | null | undefined)[] with both flags returns number
  const r4 = mean([1, null, undefined, 3] as (number | null | undefined)[], {
    removeNull: true,
    removeUndefined: true,
  });
  const _t4: number = r4;

  // (number | null | undefined)[] with only one flag returns number | null
  const r5 = mean([1, null, undefined, 3] as (number | null | undefined)[], {
    removeNull: true,
  });
  const _t5: number | null = r5;

  void [_t1, _t2, _t3, _t4, _t5];
});

// ============================================================================
// ANY TESTS
// ============================================================================

Deno.test("any - single boolean value", () => {
  expect(any(true)).toBe(true);
  expect(any(false)).toBe(false);
});

Deno.test("any - clean boolean array", () => {
  expect(any([true, false, false])).toBe(true);
  expect(any([false, false, false])).toBe(false);
  expect(any([true, true, true])).toBe(true);
});

Deno.test("any - empty array returns null", () => {
  expect(any([])).toBe(null);
});

Deno.test("any - array with null (no removal) returns null", () => {
  expect(any([null, true])).toBe(null);
  expect(any([false, null])).toBe(null);
});

Deno.test("any - array with null (removeNull: true)", () => {
  expect(any([null, true], { removeNull: true })).toBe(true);
  expect(any([null, false], { removeNull: true })).toBe(false);
  expect(any([null, null], { removeNull: true })).toBe(null);
});

Deno.test("any - array with undefined (no removal) returns null", () => {
  expect(any([undefined, true])).toBe(null);
});

Deno.test("any - array with undefined (removeUndefined: true)", () => {
  expect(any([undefined, true], { removeUndefined: true })).toBe(true);
  expect(any([undefined, false], { removeUndefined: true })).toBe(false);
});

Deno.test("any - mixed null and undefined with both flags", () => {
  expect(
    any([null, undefined, true], { removeNull: true, removeUndefined: true }),
  ).toBe(true);
  expect(
    any([null, undefined, false], { removeNull: true, removeUndefined: true }),
  ).toBe(false);
  expect(any([null, undefined], { removeNull: true, removeUndefined: true }))
    .toBe(null);
});

// ============================================================================
// ALL TESTS
// ============================================================================

Deno.test("all - single boolean value", () => {
  expect(all(true)).toBe(true);
  expect(all(false)).toBe(false);
});

Deno.test("all - clean boolean array", () => {
  expect(all([true, true, true])).toBe(true);
  expect(all([true, false, true])).toBe(false);
  expect(all([false, false, false])).toBe(false);
});

Deno.test("all - empty array returns null", () => {
  expect(all([])).toBe(null);
});

Deno.test("all - array with null (no removal) returns null", () => {
  expect(all([null, true])).toBe(null);
  expect(all([true, null])).toBe(null);
});

Deno.test("all - array with null (removeNull: true)", () => {
  expect(all([null, true], { removeNull: true })).toBe(true);
  expect(all([null, false], { removeNull: true })).toBe(false);
  expect(all([null, null], { removeNull: true })).toBe(null);
});

Deno.test("all - array with undefined (no removal) returns null", () => {
  expect(all([undefined, true])).toBe(null);
});

Deno.test("all - array with undefined (removeUndefined: true)", () => {
  expect(all([undefined, true], { removeUndefined: true })).toBe(true);
  expect(all([undefined, false], { removeUndefined: true })).toBe(false);
});

Deno.test("all - mixed null and undefined with both flags", () => {
  expect(
    all([null, undefined, true], { removeNull: true, removeUndefined: true }),
  ).toBe(true);
  expect(
    all([null, undefined, false], { removeNull: true, removeUndefined: true }),
  ).toBe(false);
  expect(all([null, undefined], { removeNull: true, removeUndefined: true }))
    .toBe(null);
});

// ============================================================================
// TYPE TESTS - any/all
// ============================================================================

Deno.test("TYPE: any overloads return correct types", () => {
  const r1 = any([true, false]);
  const _t1: boolean = r1;

  const r2 = any([true, null] as (boolean | null)[], { removeNull: true });
  const _t2: boolean = r2;

  const r3 = any([true, undefined] as (boolean | undefined)[], {
    removeUndefined: true,
  });
  const _t3: boolean = r3;

  const r4 = any([true, null, undefined] as (boolean | null | undefined)[], {
    removeNull: true,
    removeUndefined: true,
  });
  const _t4: boolean = r4;

  const r5 = any([true, null, undefined] as (boolean | null | undefined)[], {
    removeNull: true,
  });
  const _t5: boolean | null = r5;

  void [_t1, _t2, _t3, _t4, _t5];
});

Deno.test("TYPE: all overloads return correct types", () => {
  const r1 = all([true, false]);
  const _t1: boolean = r1;

  const r2 = all([true, null] as (boolean | null)[], { removeNull: true });
  const _t2: boolean = r2;

  const r3 = all([true, undefined] as (boolean | undefined)[], {
    removeUndefined: true,
  });
  const _t3: boolean = r3;

  const r4 = all([true, null, undefined] as (boolean | null | undefined)[], {
    removeNull: true,
    removeUndefined: true,
  });
  const _t4: boolean = r4;

  const r5 = all([true, null, undefined] as (boolean | null | undefined)[], {
    removeNull: true,
  });
  const _t5: boolean | null = r5;

  void [_t1, _t2, _t3, _t4, _t5];
});
