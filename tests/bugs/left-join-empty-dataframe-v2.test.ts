import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("left join with empty DataFrame preserves columns (workaround: use column format)", () => {
  // Create left DataFrame with data
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  // WORKAROUND: Create empty DataFrame with explicit columns
  // Cannot use createDataFrame([] as Type[]) because TypeScript types are erased at runtime
  const right = createDataFrame({
    columns: {
      id: [] as number[],
      value: [] as string[],
    },
  });

  console.log("DEBUG: Right DataFrame columns:", right.columns());
  console.log("DEBUG: Right DataFrame nrows:", right.nrows());

  // Perform left join
  const result = left.leftJoin(right, "id");

  // Check if 'value' column exists
  const columnNames = Object.keys(result.at(0) || {});
  console.log("Columns after left join with empty DataFrame:", columnNames);
  console.log("Number of rows:", result.nrows());
  console.log("Sample row:", result.at(0));

  // With explicit column format, columns ARE preserved
  expect(columnNames.includes("value")).toBe(true);
  expect(result.nrows()).toBe(2);
  expect(result.at(0)?.value).toBe(undefined); // value column exists but is undefined
});

Deno.test("left join with non-empty DataFrame", () => {
  // Create left DataFrame
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ]);

  // Create right DataFrame with partial matches
  const right = createDataFrame([
    { id: 1, value: "A" },
    { id: 3, value: "C" },
  ]);

  // Perform left join
  const result = left.leftJoin(right, "id");

  const columnNames = Object.keys(result.at(0) || {});
  console.log("Columns after left join:", columnNames);
  console.log("Rows:", result.toArray());

  // Should have all columns
  expect(columnNames.includes("id")).toBe(true);
  expect(columnNames.includes("name")).toBe(true);
  expect(columnNames.includes("value")).toBe(true);
  expect(result.nrows()).toBe(3);
});
