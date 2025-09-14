// Code examples for grouping and aggregation
export const groupingExamples = {
  basicGroupBy: `import { createDataFrame, stats } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172, year: 2023 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167, year: 2023 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96, year: 2023 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202, year: 2024 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228, year: 2024 },
]);

// Basic species analysis
const speciesAnalysis = people
  .groupBy("species")
  .summarise({
    count: (group) => group.nrows(),
    avg_height: (group) => stats.round(stats.mean(group.height), 1),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    max_height: (group) => stats.max(group.height),
    min_mass: (group) => stats.min(group.mass),
  })
  .arrange("avg_mass", "desc");

speciesAnalysis.print("Species analysis:");`,

  multipleColumnGrouping: `// Group by multiple columns
const multiGroupAnalysis = people
  .groupBy("species", "year")
  .summarise({
    count: (group) => group.nrows(),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    avg_height: (group) => stats.round(stats.mean(group.height), 1),
    total_mass: (group) => stats.sum(group.mass),
  })
  .arrange("species", "year");

multiGroupAnalysis.print("Multi-column grouping analysis:");`,

  calculatedCategories: `// Group by calculated categories
const categoryAnalysis = people
  .mutate({
    mass_category: (row) => {
      if (row.mass < 50) return "Light";
      if (row.mass < 100) return "Medium";
      return "Heavy";
    },
    height_category: (row) => {
      if (row.height < 150) return "Short";
      if (row.height < 200) return "Medium";
      return "Tall";
    },
  })
  .groupBy(["mass_category", "height_category"])
  .summarise({
    count: (group) => group.nrows(),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    avg_height: (group) => stats.round(stats.mean(group.height), 1),
  })
  .arrange("count", "desc");

categoryAnalysis.print("Category analysis:");`,

  conditionalAggregation: `// Basic aggregation with conditional logic
const basicAnalysis = people
  .groupBy("species")
  .summarise({
    total_count: (group) => group.nrows(),
    heavy_count: (group) => group.filter((row) => row.mass > 100).nrows(),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    top_performer: (group) => {
      return group.sliceMax("mass", 1).extractHead("name", 1) || "N/A";
    },
  })
  .arrange("avg_mass", "desc");

basicAnalysis.print("Basic species analysis:");`,
};