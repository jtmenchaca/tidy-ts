import { expect } from "@std/expect";
import { chunk } from "./helpers.ts";
import { stats as s } from "./stats.ts";

Deno.test("chunk() - basic functionality", () => {
  const numbers = [1, 2, 3, 4, 5, 6, 7];
  const result = chunk(numbers, 3);

  expect(result).toEqual([
    [1, 2, 3],
    [4, 5, 6],
    [7],
  ]);
});

Deno.test("chunk() - via stats.chunk", () => {
  const numbers = [1, 2, 3, 4, 5, 6, 7];
  const result = s.chunk(numbers, 3);

  expect(result).toEqual([
    [1, 2, 3],
    [4, 5, 6],
    [7],
  ]);
});

Deno.test("chunk() - exact division", () => {
  const numbers = [1, 2, 3, 4, 5, 6];
  const result = s.chunk(numbers, 2);

  expect(result).toEqual([
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
});

Deno.test("chunk() - single element chunks", () => {
  const numbers = [1, 2, 3];
  const result = s.chunk(numbers, 1);

  expect(result).toEqual([[1], [2], [3]]);
});

Deno.test("chunk() - chunk size larger than array", () => {
  const numbers = [1, 2, 3];
  const result = s.chunk(numbers, 10);

  expect(result).toEqual([[1, 2, 3]]);
});

Deno.test("chunk() - empty array", () => {
  const numbers: number[] = [];
  const result = s.chunk(numbers, 3);

  expect(result).toEqual([]);
});

Deno.test("chunk() - works with strings", () => {
  const letters = ["a", "b", "c", "d", "e"];
  const result = s.chunk(letters, 2);

  expect(result).toEqual([
    ["a", "b"],
    ["c", "d"],
    ["e"],
  ]);
});

Deno.test("chunk() - works with objects", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  const result = s.chunk(items, 2);

  expect(result).toEqual([
    [{ id: 1 }, { id: 2 }],
    [{ id: 3 }, { id: 4 }],
  ]);
});

Deno.test("chunk() - throws on invalid chunk size", () => {
  const numbers = [1, 2, 3];

  expect(() => s.chunk(numbers, 0)).toThrow(
    "Chunk size must be a positive integer",
  );
  expect(() => s.chunk(numbers, -1)).toThrow(
    "Chunk size must be a positive integer",
  );
  expect(() => s.chunk(numbers, 1.5)).toThrow(
    "Chunk size must be a positive integer",
  );
});

Deno.test("chunk() - throws on non-array input", () => {
  expect(() => s.chunk("not an array" as any, 2)).toThrow(
    "First argument must be an array",
  );
});
