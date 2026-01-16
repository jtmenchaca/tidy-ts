// Tests for column-helpers.ts - edge cases that might reveal bugs
import { expect } from "@std/expect";
import {
  computeColumns,
  detectColumnTypes,
  isNumericColumn,
} from "./column-helpers.ts";

// Tests that explore UNKNOWN behavior and potential bugs

Deno.test("computeColumns - what happens with symbol keys?", () => {
  const sym = Symbol("test");
  const rows = [
    { a: 1, [sym]: "symbol" },
    { b: 2 },
  ];

  const result = computeColumns(rows);
  console.log("Symbol keys result:", result);
  expect(result).toEqual(["a", "b"]);
});

Deno.test("computeColumns - numeric string keys vs number keys", () => {
  const rows = [
    { "1": "string-one", 2: "number-two" },
    { 1: "number-one", "2": "string-two" },
  ];

  const result = computeColumns(rows);
  console.log("Numeric keys result:", result);
});

Deno.test("detectColumnTypes - what happens with 0 vs false vs null?", () => {
  const columns = {
    confusing: [0, false, null, "", undefined, NaN],
  };

  const result = detectColumnTypes(columns, ["confusing"]);
  console.log("Confusing values type:", result);
});

Deno.test("detectColumnTypes - exactly 50 values, mixed at position 50", () => {
  const mixedAt50 = [
    ...Array(49).fill(1),
    "MIXED",
  ];

  const columns = { boundary: mixedAt50 };
  const result = detectColumnTypes(columns, ["boundary"]);
  console.log("Boundary test result:", result);
});

Deno.test("detectColumnTypes - what if column array has holes?", () => {
  const sparseArray: unknown[] = [1, 2, 3];
  sparseArray[10] = "string";
  sparseArray[100] = 4;

  const columns = { sparse: sparseArray };
  const result = detectColumnTypes(columns, ["sparse"]);
  console.log("Sparse array result:", result, "length:", sparseArray.length);
});

Deno.test("detectColumnTypes - objects with same toString() but different types", () => {
  class CustomNumber {
    constructor(private val: number) {}
    toString() {
      return this.val.toString();
    }
    valueOf() {
      return this.val;
    }
  }

  const columns = {
    tricky: [42, new CustomNumber(42), "42", new Number(42)],
  };

  const result = detectColumnTypes(columns, ["tricky"]);
  console.log("Tricky objects result:", result);
});

Deno.test("detectColumnTypes - what about boxed primitives?", () => {
  const columns = {
    boxed: [
      new String("hello"),
      "world",
      new Number(42),
      123,
      new Boolean(true),
      false,
    ],
  };

  const result = detectColumnTypes(columns, ["boxed"]);
  console.log("Boxed primitives result:", result);
});

Deno.test("detectColumnTypes - extremely large sampling case", () => {
  const huge = Array(1_000_000).fill(1);
  huge[999_999] = "last";

  const start = performance.now();
  const columns = { huge };
  const result = detectColumnTypes(columns, ["huge"]);
  const time = performance.now() - start;

  console.log("Huge array result:", result, "time:", time + "ms");
  expect(result.huge).toBe("number");
  expect(time).toBeLessThan(100);
});

Deno.test("detectColumnTypes - circular reference objects", () => {
  const obj1: { name: string; ref?: unknown } = { name: "obj1" };
  const obj2: { name: string; ref?: unknown } = { name: "obj2" };
  obj1.ref = obj2;
  obj2.ref = obj1;

  const columns = {
    circular: [obj1, obj2, { name: "normal" }],
  };

  const result = detectColumnTypes(columns, ["circular"]);
  console.log("Circular reference result:", result);
});

Deno.test("isNumericColumn - what about numeric strings?", () => {
  const rows = [
    { col: "123" },
    { col: "45.67" },
    { col: "1e10" },
  ];

  const result = isNumericColumn(rows, "col");
  console.log("Numeric strings result:", result);
  expect(result).toBe(false);
});

Deno.test("isNumericColumn - BigInt values", () => {
  const rows = [
    { col: 1n },
    { col: 2n },
    { col: 123n },
  ];

  const result = isNumericColumn(rows, "col");
  console.log("BigInt result:", result);
  expect(result).toBe(false);
});
