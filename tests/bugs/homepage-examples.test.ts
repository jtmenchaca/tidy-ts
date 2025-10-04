import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

Deno.test("Homepage Examples Output", () => {
  console.log("=== Testing Homepage Examples Output ===\n");

  // Test 1: Data Creation
  console.log("1. Data Creation Example:");
  const characters = createDataFrame([
    { name: "Luke", species: "Human", mass_kg: 77, height_cm: 172 },
    { name: "Leia", species: "Human", mass_kg: 49, height_cm: 150 },
    { name: "C-3PO", species: "Droid", mass_kg: 75, height_cm: 167 },
    { name: "R2-D2", species: "Droid", mass_kg: 32, height_cm: 96 },
  ]);

  console.log("characters.print() output:");
  characters.print();
  console.log("");

  // Test 2: Data Transformation
  console.log("2. Data Transformation Example:");
  const analysis = characters.mutate({
    mass_lbs: (r) => r.mass_kg * 2.20462,
    height_in: (r) => r.height_cm / 2.54,
    bmi: (r) => r.mass_kg / ((r.height_cm / 100) ** 2),
  });

  console.log("analysis.print() output:");
  analysis.print("With calculated columns");
  console.log("");

  // Test 3: Grouping and Summarizing
  console.log("3. Grouping and Summarizing Example:");
  const summary = analysis
    .groupBy("species")
    .summarize({
      avg_mass_lbs: (group) => s.mean(group.mass_lbs),
      avg_height_in: (group) => s.mean(group.height_in),
      count: (group) => group.nrows(),
    })
    .arrange("avg_mass_lbs", "desc");

  console.log("summary.print() output:");
  summary.print("Summary by Species");
  console.log("");

  // Test 4: Statistical Tests
  console.log("4. Statistical Tests Example:");

  // First test - BMI comparison
  const humans = analysis.filter((r) => r.species === "Human");
  const droids = analysis.filter((r) => r.species === "Droid");

  const bmiTest = s.compare.twoGroups.centralTendency.toEachOther({
    x: humans.bmi,
    y: droids.bmi,
    parametric: "auto", // Auto-detects appropriate test based on normality
  });

  console.log(
    `Droid conspiracy? Test: ${bmiTest.test_name}, p-value: ${
      s.round(bmiTest.p_value, 3)
    }`,
  );

  // Second test - correlation between height and mass
  const heightMassTest = s.compare.twoGroups.association.toEachOther({
    x: analysis.height_cm,
    y: analysis.mass_kg,
    method: "auto",
  });

  console.log(heightMassTest);

  console.log(`Height-mass correlation? 
Test: ${heightMassTest.test_name}
${heightMassTest.effect_size.name}: ${
    s.round(heightMassTest.effect_size.value, 3)
  }
p-value: ${s.round(heightMassTest.p_value, 3)}`);
  console.log("");

  console.log("\n📋 Homepage examples demonstration complete");
});
