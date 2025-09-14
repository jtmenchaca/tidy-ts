import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("append - missing columns fill with undefined", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie" }, // Missing age column
    { id: 4, name: "Diana", email: "diana@test.com" }, // Missing age, extra email
  ]);

  console.log("=== df1 ===");
  console.log("df1 columns:", df1.columns());
  console.log(df1.toArray());

  console.log("\n=== df2 ===");
  console.log("df2 columns:", df2.columns());
  console.log(df2.toArray());

  // Test bind_rows for comparison
  const bindResult = df1.bindRows(df2);
  console.log("\n=== bindRows result ===");
  console.log("bindRows columns:", bindResult.columns());
  console.log(bindResult.toArray());

  const result = df1.append(df2);

  console.log("\n=== result ===");
  const resultArray = result.toArray();
  console.log("nrows:", result.nrows());
  console.log("result:", resultArray);

  console.log("\n=== expected ===");
  const expected = [
    { id: 1, name: "Alice", age: 25, email: undefined },
    { id: 2, name: "Bob", age: 30, email: undefined },
    { id: 3, name: "Charlie", age: undefined, email: undefined },
    { id: 4, name: "Diana", age: undefined, email: "diana@test.com" },
  ];
  console.log("expected:", expected);

  console.log("\n=== comparison ===");
  console.log(
    "Match:",
    JSON.stringify(resultArray) === JSON.stringify(expected),
  );

  expect(resultArray).toEqual(expected);
});
