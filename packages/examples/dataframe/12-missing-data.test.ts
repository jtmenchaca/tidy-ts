import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tidy-ts/shims";

test("Missing Data - Null and Undefined Support", () => {
  const data = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: 85 },
    { id: 2, name: null, age: 30, score: undefined },
    { id: 3, name: "Charlie", age: null, score: 92 },
  ]);

  expect(data.nrows()).toBe(3);
  expect(data[1].name).toBe(null);
  expect(data[1].score).toBe(undefined);
  expect(data[2].age).toBe(null);
});

test("Missing Data - Remove NA Option", () => {
  const data = createDataFrame([
    { id: 1, value: 10 },
    { id: 2, value: null },
    { id: 3, value: 20 },
    { id: 4, value: undefined },
  ]);

  const total = s.sum(data.value, { removeNull: true, removeUndefined: true });
  const average = s.mean(data.value, {
    removeNull: true,
    removeUndefined: true,
  });
  const maximum = s.max(data.value, {
    removeNull: true,
    removeUndefined: true,
  });

  expect(total).toBe(30);
  expect(average).toBe(15);
  expect(maximum).toBe(20);
});

test("Missing Data - Replace NA With Defaults", () => {
  const messyData = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: 85 },
    { id: 2, name: null, age: 30, score: null },
    { id: 3, name: "Charlie", age: null, score: 92 },
  ]);

  const cleaned = messyData.replaceNA({
    name: "Unknown",
    age: 0,
    score: -1,
  });

  expect(cleaned[1].name).toBe("Unknown");
  expect(cleaned[1].score).toBe(-1);
  expect(cleaned[2].age).toBe(0);
});
