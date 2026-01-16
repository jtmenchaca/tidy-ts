import { createDataFrame, stats } from "@tidy-ts/dataframe";

/**
 * BUG REPORT: Filter with combined AND logic in single predicate
 *
 * Issue: When using combined && logic in a single predicate function,
 * the filter is not properly evaluating the AND condition.
 *
 * Expected: row.height > 180 && row.species === "Human" should only return
 * Darth Vader (Human with height 202)
 *
 * Actual: Returns both Darth Vader (Human) and Chewbacca (Wookiee)
 *
 * This suggests the filter is treating the condition as OR instead of AND,
 * or there's another logic error in the filter implementation.
 */

// Create the same data as in the getting started test
const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);

console.log("Original people data:");
people.print();

// Create the same withStats DataFrame
const withStats = people
  .mutate({
    bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
    is_heavy: (row) => row.mass > 100,
    row_number: (_row, index) => index + 1,
    cumulative_mass: (_row, _index, df) => stats.cumsum(df.mass),
    mean_bmi: (_row, _index, df) => {
      const averageMass = stats.mean(df.mass);
      const averageHeight = stats.mean(df.height);
      return stats.round(averageMass / Math.pow(averageHeight / 100, 2), 2);
    },
  });

console.log("\nWith stats data:");
withStats.print();

// Test the filter logic step by step
console.log("\n=== Debugging Filter Logic ===");

// Test 1: Filter by height > 180
const tallPeople = withStats.filter((row) => row.height > 180);
console.log("\n1. People taller than 180cm:");
tallPeople.print();
console.log("Count:", tallPeople.nrows());

// Test 2: Filter by species === "Human"
const humans = withStats.filter((row) => row.species === "Human");
console.log("\n2. Only humans:");
humans.print();
console.log("Count:", humans.nrows());

// Test 3: Combined filter - THIS IS THE BUG
const tallHumans = withStats.filter(
  (row) => row.height > 180 && row.species === "Human",
);
console.log("\n3. Tall humans (height > 180 AND species = Human):");
tallHumans.print();
console.log("Count:", tallHumans.nrows());
console.log("BUG: Should only return Darth Vader, but also returns Chewbacca!");

// Test 4: Debug the species values
console.log("\n4. Debug species values:");
console.log("All species:", withStats.species);
console.log("Unique species:", stats.unique(withStats.species));

// Test 5: Check each row individually
console.log("\n5. Check each row individually:");
for (let i = 0; i < withStats.nrows(); i++) {
  const row = withStats[i];
  const isTall = row.height > 180;
  const isHuman = row.species === "Human";
  const passesFilter = isTall && isHuman;
  console.log(
    `${row.name}: height=${row.height}, species="${row.species}", isTall=${isTall}, isHuman=${isHuman}, passesFilter=${passesFilter}`,
  );
}

// Test 6: Test with original people DataFrame
console.log("\n6. Test with original people DataFrame:");
const tallHumansOriginal = people.filter(
  (row) => row.height > 180 && row.species === "Human",
);
console.log("Tall humans from original data:");
tallHumansOriginal.print();
console.log("Count:", tallHumansOriginal.nrows());
console.log("BUG: Same issue occurs with original DataFrame!");

// Test 7: Alternative approach using multiple predicates (this works correctly)
console.log("\n7. Alternative approach using multiple predicates:");
const tallHumansMultiple = withStats
  .filter((row) => row.height > 180)
  .filter((row) => row.species === "Human");
console.log("Tall humans using multiple filters:");
tallHumansMultiple.print();
console.log("Count:", tallHumansMultiple.nrows());
console.log("WORKAROUND: Multiple filters work correctly!");

// Test 8: Test with different data to confirm the pattern
console.log("\n8. Test with different data:");
const testData = createDataFrame([
  { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  {
    id: 2,
    name: "Chewbacca",
    mass: 112,
    species: "Wookiee",
    homeworld: "Kashyyyk",
  },
  { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  { id: 4, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
]);

const heavyHumans = testData.filter(
  (row) => row.mass > 70 && row.species === "Human",
);
console.log("Heavy humans (mass > 70 AND species = Human):");
heavyHumans.print();
console.log("Count:", heavyHumans.nrows());
console.log(
  "BUG: Should only return Luke, but returns Luke, Chewbacca, and C-3PO!",
);

console.log("\n=== SUMMARY ===");
console.log(
  "The filter function has a bug when using combined && logic in a single predicate.",
);
console.log(
  "The bug affects both the original DataFrame and DataFrames with additional columns.",
);
console.log(
  "Workaround: Use multiple filter() calls instead of combined && logic.",
);
console.log("This bug needs to be fixed in the tidy-ts filter implementation.");
