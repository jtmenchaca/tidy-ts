import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("sliceHead with grouped + filtered data", () => {
  const df = createDataFrame([
    { group: "A", value: 5, flag: false },
    { group: "A", value: 1, flag: true },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 3, flag: false },
    { group: "B", value: 1, flag: true },
    { group: "B", value: 7, flag: true },
    { group: "C", value: 1, flag: true },
    { group: "C", value: 2, flag: false },
    { group: "C", value: 9, flag: false },
  ]);

  const result = df
    .groupBy("group")
    .filter((r) => r.value === 1)
    .sliceHead(1);

  expect(result.nrows()).toBe(3);
  expect([...result].map((r) => r.value)).toEqual([1, 1, 1]);
});

Deno.test("sliceTail with grouped + filtered data", () => {
  const df = createDataFrame([
    { group: "A", value: 1, flag: true },
    { group: "A", value: 2, flag: true },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 3, flag: true },
    { group: "B", value: 4, flag: true },
    { group: "B", value: 7, flag: false },
    { group: "C", value: 5, flag: true },
    { group: "C", value: 6, flag: true },
    { group: "C", value: 9, flag: false },
  ]);

  const result = df
    .groupBy("group")
    .filter((r) => r.flag === true)
    .sliceTail(1);

  expect(result.nrows()).toBe(3);
  expect([...result].map((r) => r.value)).toEqual([2, 4, 6]);
});

Deno.test("slice with grouped + filtered data", () => {
  const df = createDataFrame([
    { group: "A", value: 1, flag: true },
    { group: "A", value: 2, flag: true },
    { group: "A", value: 3, flag: true },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 4, flag: true },
    { group: "B", value: 5, flag: true },
    { group: "B", value: 6, flag: true },
    { group: "B", value: 7, flag: false },
  ]);

  const result = df
    .groupBy("group")
    .filter((r) => r.flag === true)
    .slice(1, 3);

  expect(result.nrows()).toBe(4);
  expect([...result].map((r) => r.value)).toEqual([2, 3, 5, 6]);
});

Deno.test("sliceMin with grouped + filtered data", () => {
  const df = createDataFrame([
    { group: "A", value: 5, flag: true },
    { group: "A", value: 1, flag: true },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 3, flag: true },
    { group: "B", value: 7, flag: true },
    { group: "B", value: 2, flag: false },
  ]);

  const result = df
    .groupBy("group")
    .filter((r) => r.flag === true)
    .sliceMin("value", 1);

  expect(result.nrows()).toBe(2);
  expect([...result].map((r) => r.value)).toEqual([1, 3]);
});

Deno.test("sliceMax with grouped + filtered data", () => {
  const df = createDataFrame([
    { group: "A", value: 5, flag: true },
    { group: "A", value: 10, flag: true },
    { group: "A", value: 8, flag: false },
    { group: "B", value: 3, flag: true },
    { group: "B", value: 7, flag: true },
    { group: "B", value: 20, flag: false },
  ]);

  const result = df
    .groupBy("group")
    .filter((r) => r.flag === true)
    .sliceMax("value", 1);

  expect(result.nrows()).toBe(2);
  expect([...result].map((r) => r.value)).toEqual([10, 7]);
});

Deno.test("sample with grouped + filtered data", () => {
  const df = createDataFrame([
    { group: "A", value: 1, flag: true },
    { group: "A", value: 2, flag: true },
    { group: "A", value: 3, flag: true },
    { group: "A", value: 99, flag: false },
    { group: "B", value: 4, flag: true },
    { group: "B", value: 5, flag: true },
    { group: "B", value: 6, flag: true },
    { group: "B", value: 99, flag: false },
  ]);

  const result = df
    .groupBy("group")
    .filter((r) => r.flag === true)
    .sample(2, 42);

  expect(result.nrows()).toBe(4);
  // Should only contain values that had flag === true
  expect([...result].every((r) => r.value !== 99)).toBe(true);
});
