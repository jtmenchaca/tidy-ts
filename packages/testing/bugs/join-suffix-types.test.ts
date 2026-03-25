import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Bug: The simple innerJoin API ignores suffixes in the return type
 * when there are conflicting column names.
 *
 * `.innerJoin(other, "id", { suffixes: { left: "", right: "_window" } })`
 *   → Runtime: correctly produces `start_window`, `end_window`
 *   → Types: still shows `start`, `end` (no suffix in type)
 *
 * Workaround: Use the object-based API:
 *   `.innerJoin(other, { keys: ["id"], suffixes: { left: "", right: "_window" } })`
 */

Deno.test("innerJoin - simple API suffix types not reflected on conflicting columns", () => {
  // Both DataFrames share `start` and `end` columns (conflicting names).
  const events = createDataFrame([
    { id: "a", date: "2024-01-15", start: "2024-01-01", end: "2024-01-31" },
    { id: "b", date: "2024-02-20", start: "2024-02-01", end: "2024-02-28" },
  ]);

  const intervals = createDataFrame([
    { id: "a", start: "2024-01-10", end: "2024-01-20" },
    { id: "b", start: "2024-02-10", end: "2024-02-25" },
  ]);

  // Simple API: suffixes applied at runtime but NOT in the type system.
  const resultSimple = events.innerJoin(intervals, "id", {
    suffixes: { left: "", right: "_window" },
  });

  // Runtime columns are correctly suffixed
  expect(resultSimple.columns()).toEqual([
    "id",
    "date",
    "start",
    "end",
    "start_window",
    "end_window",
  ]);

  // But the type system doesn't know about `start_window` / `end_window`.
  // Uncomment to see type error:
  // const _sw: string = resultSimple[0].start_window; // TS2339: Property 'start_window' does not exist
  // const _ew: string = resultSimple[0].end_window;   // TS2339: Property 'end_window' does not exist
});

Deno.test("innerJoin - object API suffix types correctly reflected", () => {
  const events = createDataFrame([
    { id: "a", date: "2024-01-15", start: "2024-01-01", end: "2024-01-31" },
    { id: "b", date: "2024-02-20", start: "2024-02-01", end: "2024-02-28" },
  ]);

  const intervals = createDataFrame([
    { id: "a", start: "2024-01-10", end: "2024-01-20" },
    { id: "b", start: "2024-02-10", end: "2024-02-25" },
  ]);

  // Object API: suffixes correctly reflected in both runtime AND types.
  const resultObject = events.innerJoin(intervals, {
    keys: ["id"],
    suffixes: { left: "", right: "_window" },
  });

  expect(resultObject.columns()).toEqual([
    "id",
    "date",
    "start",
    "end",
    "start_window",
    "end_window",
  ]);

  // Types work correctly here:
  const _start: string = resultObject[0].start;
  const _end: string = resultObject[0].end;
  const _startWindow: string = resultObject[0].start_window;
  const _endWindow: string = resultObject[0].end_window;

  expect(_start).toBe("2024-01-01");
  expect(_end).toBe("2024-01-31");
  expect(_startWindow).toBe("2024-01-10");
  expect(_endWindow).toBe("2024-01-20");
});
