import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("BUG: forEachCol Processing All Original Rows Instead of Filtered Rows", () => {
  const data = createDataFrame([
    { name: "Alice", age: 30, city: "NYC" },
    { name: "Bob", age: 25, city: "LA" },
    { name: "Charlie", age: 35, city: "NYC" },
  ]);

  // Filter for NYC residents only (should be Alice and Charlie)
  const filtered = data.filter((row) => row.city === "NYC");

  console.log(
    "Filtered DataFrame should only contain NYC residents (Alice and Charlie):",
  );
  filtered.print();

  const agesInNYC: number[] = [];
  const sideEffects: string[] = [];

  filtered
    .forEachRow((row) => {
      if (row.age > 30) {
        sideEffects.push(`${row.name} is over 30`);
      }
    })
    .forEachCol((colName, df) => {
      if (colName === "age") {
        console.log(
          `forEachCol processing age column - DataFrame has ${df.nrows()} rows`,
        );
        agesInNYC.push(...(df[colName]));
      }
    });

  console.log("Ages collected by forEachCol:", agesInNYC);
  console.log("Expected: [30, 35] (only Alice and Charlie)");
  console.log(
    "Actual: includes Bob's age 25, proving forEachCol processed ALL original rows",
  );

  // BUG: This test fails because forEachCol processes ALL original rows
  // Expected: [30, 35] (only Alice and Charlie from NYC)
  // Actual: [30, 25, 35] (includes Bob from LA)
  expect(agesInNYC).toEqual([30, 35]);
});
