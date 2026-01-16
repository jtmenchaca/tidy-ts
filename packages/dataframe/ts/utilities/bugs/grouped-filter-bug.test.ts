import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("BUG: Grouped Filter Not Working Correctly", () => {
  const starWarsData = createDataFrame([
    { name: "Luke", species: "Human", mass: 77, homeworld: "Tatooine" },
    { name: "C-3PO", species: "Droid", mass: 75, homeworld: "Tatooine" },
    { name: "R2-D2", species: "Droid", mass: 32, homeworld: "Naboo" },
    { name: "Darth Vader", species: "Human", mass: 136, homeworld: "Tatooine" },
    { name: "Leia", species: "Human", mass: 49, homeworld: "Alderaan" },
    { name: "Owen", species: "Human", mass: 120, homeworld: "Tatooine" },
    { name: "Beru", species: "Human", mass: 75, homeworld: "Tatooine" },
    { name: "R5-D4", species: "Droid", mass: 32, homeworld: "Tatooine" },
    { name: "Biggs", species: "Human", mass: 84, homeworld: "Tatooine" },
    { name: "Obi-Wan", species: "Human", mass: 77, homeworld: "Stewjon" },
  ]);

  // Group by species and filter for mass > 50
  const grouped = starWarsData.groupBy("species");
  const filteredWithGroups = grouped.filter((row) => row.mass > 50);

  console.log(
    "After filtering for mass > 50, the DataFrame should only contain rows with mass > 50:",
  );
  filteredWithGroups.print();

  // After filtering for mass > 50, there should be NO rows with mass <= 50
  const lowMassRows = filteredWithGroups.filter((row) => row.mass <= 50);

  console.log(
    "But when we check for rows with mass <= 50, we still find some:",
  );
  lowMassRows.print();

  // BUG: This test fails because grouped filter doesn't work correctly
  // Expected: 0 rows with mass <= 50
  // Actual: 3 rows with mass <= 50 (R2-D2, Leia, R5-D4)
  expect(lowMassRows.nrows()).toBe(0);
});
