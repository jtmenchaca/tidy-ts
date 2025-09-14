export const starWarsExample = `import { createDataFrame, stats } from "@tidy-ts/dataframe";

// 1. Create a DataFrame from your data
const characters = createDataFrame([
  { name: "Luke", species: "Human", mass_kg: 77, height_cm: 172, homeworld: "Tatooine" },
  { name: "Anakin", species: "Human", mass_kg: 84, height_cm: 188, homeworld: "Tatooine" },
  { name: "Shmi", species: "Human", mass_kg: 55, height_cm: 160, homeworld: "Tatooine" },
  { name: "C-3PO", species: "Droid", mass_kg: 75, height_cm: 167, homeworld: "Tatooine" },
  { name: "Leia", species: "Human", mass_kg: 49, height_cm: 150, homeworld: "Alderaan" },
  { name: "Bail Organa", species: "Human", mass_kg: 70, height_cm: 175, homeworld: "Alderaan" },
  { name: "Han", species: "Human", mass_kg: 80, height_cm: 180, homeworld: "Corellia" },
  { name: "Chewbacca", species: "Wookiee", mass_kg: 112, height_cm: 228, homeworld: "Kashyyyk" },
]);

// 2. Transform your data with method chaining
const analysis = characters

  // Add calculated columns
  .mutate({
    mass_lbs: (r) => r.mass_kg * 2.20462,
    height_in: (r) => r.height_cm / 2.54,
  })

  // Group your data
  .groupBy("homeworld")

  // Calculate summary statistics by groups
  .summarize({
    avg_mass_lbs: (group) => stats.mean(group.mass_lbs),
    avg_height_in: (group) => stats.mean(group.height_in),
    character_count: (group) => group.nrows()
  })

  // Sort the results
  .arrange("avg_mass_lbs", "desc");

// 3. View your results
analysis.print("Character analysis by Homeworld:");`;
