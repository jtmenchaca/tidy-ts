// Multiple smaller code examples for the homepage

export const dataCreationExample =
  `import { createDataFrame } from "@tidy-ts/dataframe";

// 🚀 Load character data from the galaxy
const characters = createDataFrame([
  { name: "Luke", species: "Human", mass_kg: 77, height_cm: 172 },
  { name: "Leia", species: "Human", mass_kg: 49, height_cm: 150 },
  { name: "C-3PO", species: "Droid", mass_kg: 75, height_cm: 167 },
  { name: "R2-D2", species: "Droid", mass_kg: 32, height_cm: 96 },
]);

characters.print();

// Output:
// ┌───────┬────────┬─────────┬───────────┐
// │ name  │ species│ mass_kg │ height_cm │
// ├───────┼────────┼─────────┼───────────┤
// │ Luke  │ Human  │ 77      │ 172       │
// │ Leia  │ Human  │ 49      │ 150       │
// │ C-3PO │ Droid  │ 75      │ 167       │
// │ R2-D2 │ Droid  │ 32      │ 96        │
// └───────┴────────┴─────────┴───────────┘`;

export const dataTransformationExample =
  `// 🔧 Transform data with calculated columns
const analysis = characters
  .mutate({
    mass_lbs: (row) => row.mass_kg * 2.20462,  // Convert to pounds
    height_in: (row) => row.height_cm / 2.54,  // Convert to inches
    bmi: (row) => row.mass_kg / ((row.height_cm / 100) ** 2),  // Body Mass Index
  })
  .select("name", "mass_lbs", "height_in", "bmi");

analysis.print("Character Analysis with Calculations");

// Output:
// Character Analysis with Calculations
// ┌───────┬──────────┬───────────┬─────────┐
// │ name  │ mass_lbs │ height_in │ bmi     │
// ├───────┼──────────┼───────────┼─────────┤
// │ Luke  │ 169.76   │ 67.72     │ 26.03   │
// │ Leia  │ 108.03   │ 59.06     │ 21.78   │
// │ C-3PO │ 165.35   │ 65.75     │ 26.89   │
// │ R2-D2 │ 70.55    │ 37.80     │ 34.72   │
// └───────┴──────────┴───────────┴─────────┘`;

export const groupingExample = `import { stats as s } from "@tidy-ts/dataframe";

// 📊 Group by species and calculate statistics
const summary = analysis
  .groupBy("species")
  .summarize({
    avg_mass_lbs: (group) => s.mean(group.mass_lbs),
    avg_height_in: (group) => s.mean(group.height_in),
    count: (group) => group.nrows(),
  })
  .arrange("avg_mass_lbs", "desc");

summary.print("Species Comparison Report");

// Output:
// Species Comparison Report
// ┌────────┬───────────────┬───────────────┬───────┐
// │ species│ avg_mass_lbs  │ avg_height_in │ count │
// ├────────┼───────────────┼───────────────┼───────┤
// │ Human  │ 138.90        │ 63.39         │ 2     │
// │ Droid  │ 117.95        │ 51.78         │ 2     │
// └────────┴───────────────┴───────────────┴───────┘`;

export const statisticalTestExample =
  `// Test 1: Are droid proportions (suspiciously?) similar to human proportions?
const humans = analysis.filter((r) => r.species === "Human");
const droids = analysis.filter((r) => r.species === "Droid");

const bmiTest = s.compare.twoGroups.centralTendency.toEachOther({
  x: humans.bmi,
  y: droids.bmi,
  parametric: "auto", // Auto-detects appropriate test
});

console.log(\`Droid conspiracy? Test: \${bmiTest.testName}, p-value: \${s.round(bmiTest.pValue, 3)}\`);

// Output:
// Droid conspiracy? Test: Independent T-Test, p-value: 0.261

// Test 2: Are height and mass correlated among all characters?
const heightMassTest = s.compare.twoGroups.association.toEachOther({
  x: analysis.height_cm,
  y: analysis.mass_kg,
  method: "auto", // Selects best choice between Pearson, Spearman, or Kendall
});

console.log(\`Height and mass correlation?
Test: \${heightMassTest.testName}
\${heightMassTest.effectSize.name}: \${s.round(heightMassTest.effectSize.value, 3)}
p-value: \${s.round(heightMassTest.pValue, 3)}\`);


// Output:
// Height and mass correlation? 
// Test: Kendall's rank correlation tau
// Kendall's Tau: 1
// p-value: 0.083`;
