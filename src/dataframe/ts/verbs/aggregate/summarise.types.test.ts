import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

// Test data with mixed types
const testData = createDataFrame([
  {
    name: "Luke",
    mass: 77,
    species: "Human",
    homeworld: "Tatooine",
    sex: "MALE",
  },
  {
    name: "Leia",
    mass: 49,
    species: "Human",
    homeworld: "Alderaan",
    sex: "FEMALE",
  },
  {
    name: "Chewbacca",
    mass: 112,
    species: "Wookiee",
    homeworld: "Kashyyyk",
    sex: "MALE",
  },
  {
    name: "C-3PO",
    mass: 75,
    species: "Droid",
    homeworld: "Tatooine",
    sex: null,
  },
  { name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo", sex: null },
]);

// Test 1: Ungrouped summarise
const ungroupedSummary = testData
  .summarise({
    avg_mass: (df) => stats.mean(df.mass),
    total_count: (df) => df.nrows(),
  });

// Type assertion to verify ungrouped summarise types
const _ungroupedTypeCheck: DataFrame<{
  avg_mass: number;
  total_count: number;
}> = ungroupedSummary;

console.log("Ungrouped summarise type checking passed!");

// Test 2: Single group summarise
const singleGroupSummary = testData
  .groupBy("species")
  .summarise({
    avg_mass: (df) => stats.mean(df.mass, true),
    count: (df) => df.nrows(),
    male_count: (df) => stats.countValue(df.sex, "MALE"),
  });

// Type assertion to verify single group summarise types
const _singleGroupTypeCheck: DataFrame<{
  species: string;
  avg_mass: number;
  count: number;
  male_count: number;
}> = singleGroupSummary;

console.log("Single group summarise type checking passed!");

// Test 3: Multiple group summarise
const multiGroupSummary = testData
  .groupBy("species", "homeworld")
  .summarise({
    avg_mass: (df) => stats.mean(df.mass, true),
    count: (df) => df.nrows(),
    male_count: (df) => stats.countValue(df.sex, "MALE"),
    female_count: (df) => stats.countValue(df.sex, "FEMALE"),
  });

// Type assertion to verify multiple group summarise types
const _multiGroupTypeCheck: DataFrame<{
  species: string;
  homeworld: string;
  avg_mass: number;
  count: number;
  male_count: number;
  female_count: number;
}> = multiGroupSummary;

console.log("Multiple group summarise type checking passed!");
