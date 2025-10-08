// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "../../src/dataframe/mod.ts";

Deno.test("mutate group index debugging", () => {
  const testData = createDataFrame([
    { name: "Luke", mass: 77, species: "Human" },
    { name: "R2-D2", mass: 42, species: "Droid" },
    { name: "Leia", mass: 49, species: "Human" },
    { name: "C-3PO", mass: 75, species: "Droid" },
  ]);

  console.log("\n=== Original Data ===");
  testData.print();

  console.log("\n=== Group Structure ===");
  const grouped = testData.groupBy("species");
  console.log("Groups:", (grouped as any).__groups);

  console.log("\n=== After mutate with index ===");
  const result = grouped.mutate({
    indexWithinGroup: (_r, idx) => {
      const name = (_r as any).name;
      console.log(`Processing: idx=${idx}, name=${name}`);
      return idx + 1;
    },
  });

  result.print("result");

  // Check expected values
  const rows = result.toArray();
  console.log("\nFinal rows:", JSON.stringify(rows, null, 2));
});
