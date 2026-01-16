// Bug Report: Normalize should be a stats function, not a DataFrame verb
// Expected: stats.normalize(values) returns array of normalized values
// Expected: stats.normalize(values, target) returns normalized value for specific target
// Current: df.normalize(column) exists but returns arrays instead of single values
//
// Based on rank function pattern, normalize should be:
// - stats.normalize(values) returns array of normalized values (0-1 range)
// - stats.normalize(values, target) returns normalized value for specific target
// - Should be removed from DataFrame verbs and moved to stats module
import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Bug: DataFrame normalize verb has been removed", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  // The DataFrame normalize verb has been removed
  // @ts-expect-error - normalize method no longer exists on DataFrame
  expect(() => people.normalize("mass")).toThrow();

  console.log("✅ DataFrame normalize verb successfully removed!");
  console.log("✅ Use stats.normalize() instead for normalization operations");
});

Deno.test("Bug: DataFrame normalize verb removed - use stats.normalize instead", () => {
  const data = createDataFrame([
    { value: 10 },
    { value: 20 },
    { value: 30 },
  ]);

  // DataFrame normalize verb has been removed
  // @ts-expect-error - normalize method no longer exists on DataFrame
  expect(() => data.normalize("value")).toThrow();

  // Use stats.normalize instead
  const values = [10, 20, 30];
  const normalized = stats.normalize(values);

  console.log("✅ Using stats.normalize instead:", normalized);
  expect(normalized).toEqual([0, 0.5, 1]);
});

Deno.test("How normalize should work as stats function (based on rank pattern)", () => {
  // DataFrame normalize verb has been removed
  const data = createDataFrame([{ value: 10 }, { value: 20 }, { value: 30 }]);
  // @ts-expect-error - normalize method no longer exists on DataFrame
  expect(() => data.normalize("value")).toThrow();
  console.log("✅ DataFrame normalize verb successfully removed!");

  // Expected behavior should be:
  // stats.normalize(values) -> returns array of normalized values [0, 0.5, 1]
  // stats.normalize(values, target) -> returns normalized value for specific target

  // For now, just document what we expect:
  const expectedValues = [0, 0.5, 1]; // 10->0, 20->0.5, 30->1
  console.log("Expected stats.normalize([10, 20, 30]):", expectedValues);
  console.log("Expected stats.normalize([10, 20, 30], 20):", 0.5);

  // DataFrame normalize verb has been completely removed

  // What we should get instead with stats.normalize:
  const normalized = stats.normalize([10, 20, 30]);
  expect(normalized).toEqual([0, 0.5, 1]);

  const singleValue = stats.normalize([10, 20, 30], 20);
  expect(singleValue).toBe(0.5);

  // Test with the original data
  const massValues = [77, 75];
  const normalizedMasses = stats.normalize(massValues);
  expect(normalizedMasses).toEqual([1, 0]); // 77->1, 75->0

  const singleMass = stats.normalize(massValues, 77);
  expect(singleMass).toBe(1);

  console.log("✅ stats.normalize works correctly!");
  console.log("Normalized masses:", normalizedMasses);
  console.log("Single mass (77):", singleMass);
});
