// Missing Data Verbs Examples - Compiler-tested examples for handling null/undefined values
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Missing Data Verbs Documentation
 *
 * Demonstrates handling of null, undefined, and missing values
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", mass: null as number | null, height: 167 },
 *   { id: 3, name: "R2-D2", mass: 32, height: null as number | null },
 *   { id: 4, name: "Leia", mass: null as number | null, height: null as number | null },
 * ]);
 *
 * const cleaned = people.replaceNA({
 *   mass: 0,
 *   height: 100
 * });
 *
 * console.table(cleaned);
 * ```
 */
function missingDataExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", mass: null as number | null, height: 167 },
    { id: 3, name: "R2-D2", mass: 32, height: null as number | null },
    {
      id: 4,
      name: "Leia",
      mass: null as number | null,
      height: null as number | null,
    },
  ]);

  // Replace missing values with defaults
  const cleaned = people.replaceNA({
    mass: 0,
    height: 100,
  });

  console.table(cleaned);

  return { cleaned };
}

Deno.test("Missing Data Verbs Documentation", () => {
  const results = missingDataExample();

  // Test missing data replacement
  expect(results.cleaned.nrows()).toBe(4);
  expect(results.cleaned.mass).toEqual([77, 0, 32, 0]); // nulls replaced with 0
  expect(results.cleaned.height).toEqual([172, 167, 100, 100]); // nulls replaced with 100
  expect(results.cleaned.name).toEqual(["Luke", "C-3PO", "R2-D2", "Leia"]);
});
