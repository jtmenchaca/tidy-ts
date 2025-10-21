import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("left join with empty DataFrame preserves columns (workaround: use column format)", () => {
  // Create left DataFrame with data
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const exampleSchema = z.object({
    id: z.number(),
    value: z.string(),
  });

  const right = createDataFrame([], exampleSchema);

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
