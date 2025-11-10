import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("extractUnique in summarize should return DataFrame with nrows", () => {
  const df = createDataFrame([
    { category: "A", pat_id: "p1" },
    { category: "A", pat_id: "p1" },
    { category: "A", pat_id: "p2" },
    { category: "B", pat_id: "p3" },
    { category: "B", pat_id: null },
  ]);

  const result = df
    .groupBy("category")
    .summarize({
      visit_count: (g) => g.nrows(),
      unique_patients: (g) =>
        g.removeNull("pat_id").extractUnique("pat_id").length,
    });

  // Verify result is a DataFrame with nrows method (not PromisedDataFrame)
  expect(typeof result.nrows).toBe("function");

  // Verify we can call nrows() successfully
  const nrows = result.nrows();
  expect(nrows).toBe(2); // Should have 2 groups (A and B)

  // Verify the result has the expected columns
  expect(result.columns()).toContain("category");
  expect(result.columns()).toContain("visit_count");
  expect(result.columns()).toContain("unique_patients");

  // Verify the actual values
  const resultArray = result.toArray();
  expect(resultArray.length).toBe(2);

  const categoryA = resultArray.find((r) => r.category === "A");
  expect(categoryA?.visit_count).toBe(3);
  expect(categoryA?.unique_patients).toBe(2); // p1 and p2

  const categoryB = resultArray.find((r) => r.category === "B");
  expect(categoryB?.visit_count).toBe(2);
  expect(categoryB?.unique_patients).toBe(1); // only p3 (null was removed)
});
