export const starWarsExample = `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

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
    avg_mass_lbs: (group) => s.mean(group.mass_lbs),
    avg_height_in: (group) => s.mean(group.height_in),
    character_count: (group) => group.nrows()
  })

  // Sort the results
  .arrange("avg_mass_lbs", "desc");

// 3. View your results
analysis.print("Character analysis by Homeworld:");

// 4. Advanced statistical analysis
const heightData = characters.height_cm;

// Descriptive statistics
console.log("Height mean:", s.mean(heightData));
console.log("Height std:", s.stdev(heightData));

// Probability distributions
const normalSample = s.dist.normal.random(170, 15);  // Random height sample
const heightPercentile = s.dist.normal.probability(180, 170, 15);  // P(Height ≤ 180)
console.log("Height percentile for 180cm:", heightPercentile);

// Statistical testing
const humanHeights = characters.filter("species", "Human").height_cm;
const tTest = s.test.t.oneSample(humanHeights, 170, "two-sided", 0.05);
console.log("T-test p-value:", tTest.pValue);`;
