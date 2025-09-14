import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

const mtcars = createDataFrame([
  { name: "Mazda RX4", cyl: 6, disp: 160, hp: 110, vs: 0, am: 1, mpg: 21.0 },
  {
    name: "Mazda RX4 Wag",
    cyl: 6,
    disp: 160,
    hp: 110,
    vs: 0,
    am: 1,
    mpg: 21.0,
  },
  { name: "Datsun 710", cyl: 4, disp: 108, hp: 93, vs: 1, am: 1, mpg: 22.8 },
  {
    name: "Hornet 4 Drive",
    cyl: 6,
    disp: 258,
    hp: 110,
    vs: 1,
    am: 0,
    mpg: 21.4,
  },
  {
    name: "Hornet Sportabout",
    cyl: 8,
    disp: 360,
    hp: 175,
    vs: 0,
    am: 0,
    mpg: 18.7,
  },
  { name: "Valiant", cyl: 6, disp: 225, hp: 105, vs: 1, am: 0, mpg: 18.1 },
]);

Deno.test("slice basic indices", () => {
  const result = mtcars.slice(1, 3);
  expect(result.nrows()).toBe(2);
  expect(result[0].name).toBe("Mazda RX4 Wag");
  expect(result[1].name).toBe("Datsun 710");
});

Deno.test("slice_head basic", () => {
  const result = mtcars.head(2);
  expect(result.nrows()).toBe(2);
  expect(result[0].name).toBe("Mazda RX4");
  expect(result[1].name).toBe("Mazda RX4 Wag");
});

Deno.test("tail basic", () => {
  const result = mtcars.tail(2);
  expect(result.nrows()).toBe(2);
  expect(result[0].name).toBe("Hornet Sportabout");
  expect(result[1].name).toBe("Valiant");
});

Deno.test("sliceMin basic", () => {
  const result = mtcars.sliceMin("mpg", 2);
  expect(result.nrows()).toBe(2);
  expect(result[0].mpg).toBe(18.1);
  expect(result[1].mpg).toBe(18.7);
});

Deno.test("sliceMax basic", () => {
  const result = mtcars.sliceMax("hp", 2);
  expect(result.nrows()).toBe(2);
  expect(result[0].hp).toBe(175);
  expect(result[1].hp).toBe(110);
});

Deno.test("sample basic (nrows())", () => {
  const result = mtcars.sample(3);
  expect(result.nrows()).toBe(3);
});

Deno.test("head grouped", () => {
  const result = mtcars.groupBy("cyl").head(1);
  // Should return first row of each group in group order: 6, 4, 8
  expect(result.nrows()).toBe(3);
  expect(result[0].cyl).toBe(6);
  expect(result[1].cyl).toBe(4);
  expect(result[2].cyl).toBe(8);
});

Deno.test("tail grouped", () => {
  const result = mtcars.groupBy("cyl").tail(1);
  // Should return last row of each group in group order: 6, 4, 8
  expect(result.nrows()).toBe(3);
  expect(result[0].cyl).toBe(6);
  expect(result[1].cyl).toBe(4);
  expect(result[2].cyl).toBe(8);
});

Deno.test("sliceMin grouped", () => {
  const result = mtcars.groupBy("cyl").sliceMin("mpg", 1);
  // Should return min mpg row of each group in group order: 6, 4, 8
  expect(result.nrows()).toBe(3);
  expect(result[0].cyl).toBe(6);
  expect(result[1].cyl).toBe(4);
  expect(result[2].cyl).toBe(8);
});

Deno.test("sliceMax grouped", () => {
  const result = mtcars.groupBy("cyl").sliceMax("mpg", 1);
  // Should return max mpg row of each group in group order: 6, 4, 8
  expect(result.nrows()).toBe(3);
  expect(result[0].cyl).toBe(6);
  expect(result[1].cyl).toBe(4);
  expect(result[2].cyl).toBe(8);
});

Deno.test("sample grouped (nrows())", () => {
  const result = mtcars.groupBy("cyl").sample(2);
  // Should return 2 rows per group (if group has at least 2 rows)
  expect(result.nrows()).toBe(4); // 6-cyl: 2 rows, 4-cyl: 1 row, 8-cyl: 1 row
});
