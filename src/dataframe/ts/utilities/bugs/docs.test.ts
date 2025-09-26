import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

Deno.test("Jedi Intelligence Unit: Homeworld Analysis", () => {
  // 1. Load character data
  const characters = createDataFrame([
    {
      name: "Luke",
      species: "Human",
      mass_kg: 77,
      height_cm: 172,
      homeworld: "Tatooine",
    },
    {
      name: "Anakin",
      species: "Human",
      mass_kg: 84,
      height_cm: 188,
      homeworld: "Tatooine",
    },
    {
      name: "Shmi",
      species: "Human",
      mass_kg: 55,
      height_cm: 160,
      homeworld: "Tatooine",
    },
    {
      name: "C-3PO",
      species: "Droid",
      mass_kg: 75,
      height_cm: 167,
      homeworld: "Tatooine",
    },
    {
      name: "R2-D2",
      species: "Droid",
      mass_kg: 32,
      height_cm: 96,
      homeworld: "Naboo",
    },
    {
      name: "Leia",
      species: "Human",
      mass_kg: 49,
      height_cm: 150,
      homeworld: "Alderaan",
    },
    {
      name: "Bail Organa",
      species: "Human",
      mass_kg: 70,
      height_cm: 175,
      homeworld: "Alderaan",
    },
    {
      name: "Han",
      species: "Human",
      mass_kg: 80,
      height_cm: 180,
      homeworld: "Corellia",
    },
    {
      name: "Chewbacca",
      species: "Wookiee",
      mass_kg: 112,
      height_cm: 228,
      homeworld: "Kashyyyk",
    },
  ]);

  // 2. Transform and summarize
  const analysis = characters
    .mutate({
      mass_lbs: (r) => r.mass_kg * 2.20462,
      height_in: (r) => r.height_cm / 2.54,
      bmi: (r) => r.mass_kg / ((r.height_cm / 100) ** 2),
    });

  const summary = analysis
    .groupBy("homeworld")
    .summarize({
      avg_mass_lbs: (group) => s.mean(group.mass_lbs),
      avg_height_in: (group) => s.mean(group.height_in),
      character_count: (group) => group.nrows(),
    })
    .arrange("avg_mass_lbs", "desc");

  summary.print("Character Analysis by Homeworld");

  // 3.  Hypothesis: Do Tatooine natives have lower body mass due to harsh desert conditions?

  const tatooine = characters.filter((r) => r.homeworld === "Tatooine");
  const others = characters.filter((r) => r.homeworld !== "Tatooine");

  const desertTest = s.compare.twoGroups.centralTendency.toEachOther({
    x: tatooine.mass_kg,
    y: others.mass_kg,
    parametric: "parametric",
  });

  console.log(`
📊 Tatooine vs Other Worlds – Mass Comparison
Test: ${desertTest.test_name}
p-value: ${desertTest.p_value.toFixed(4)}
Effect size (${desertTest.effect_size.name}): ${
    desertTest.effect_size.value.toFixed(3)
  }
Test statistic (${desertTest.test_statistic.name}): ${
    desertTest.test_statistic.value.toFixed(3)
  }
${Math.round(desertTest.confidence_interval.confidence_level * 100)}% CI: [${
    desertTest.confidence_interval.lower.toFixed(2)
  }, ${desertTest.confidence_interval.upper.toFixed(2)}]
Degrees of freedom: ${desertTest.degrees_of_freedom}
`);

  // 5. Hypothesis: Are droid proportions statistically similar to human body types?
  const humans = analysis.filter((r) => r.species === "Human");
  const droids = analysis.filter((r) => r.species === "Droid");

  const bmiTest = s.compare.twoGroups.centralTendency.toEachOther({
    x: humans.bmi,
    y: droids.bmi,
    parametric: "nonparametric",
  });

  console.log(`
📊 Human vs Droid BMI Comparison
Test: ${bmiTest.test_name}
p-value: ${bmiTest.p_value.toFixed(4)}
Effect size (${bmiTest.effect_size.name}): ${
    bmiTest.effect_size.value.toFixed(2)
  }
Test statistic (${bmiTest.test_statistic.name}): ${
    bmiTest.test_statistic.value.toFixed(2)
  }
`);

  // 🏅 Galactic Awards
  const tallest = characters
    .arrange("height_cm", "desc")
    .slice(0, 1)
    .extract("name")[0];
  // Or use one of the helper functions
  const heaviest = characters.sliceMax("mass_kg", 1).name[0];
  const lightest = characters.sliceMin("mass_kg", 1).name[0];

  console.log(`- 🗼 Tallest Character: ${tallest}`);
  console.log(`- 🏋️ Heaviest Character: ${heaviest}`);
  console.log(`- 🪶 Lightest Character: ${lightest}`);

  // 7. Iterate over the dataframe, whether by the rows or the columns
  console.log("\n🕵️ Imperial Watchlist Activity Log:");

  characters.forEachRow((char) => {
    if (char.homeworld === "Tatooine" && char.species === "Human") {
      console.log(
        `🔍 Subject flagged: ${char.name} (origin: Tatooine, species: ${char.species})`,
      );
    }
  });
});
