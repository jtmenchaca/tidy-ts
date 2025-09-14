// Code examples for stats module
export const statsModuleExamples = {
  basicDescriptiveStats: `import { createDataFrame, stats } from "@tidy-ts/dataframe";

const sampleData = createDataFrame([
  { id: 1, value: 10, category: "A", score: 85 },
  { id: 2, value: 20, category: "B", score: 92 },
  { id: 3, value: 15, category: "A", score: 78 },
  { id: 4, value: 25, category: "B", score: 88 },
  { id: 5, value: 12, category: "A", score: 95 },
  { id: 6, value: 30, category: "C", score: 82 },
  { id: 7, value: 18, category: "B", score: 90 },
  { id: 8, value: 22, category: "A", score: 87 },
]);

const values = sampleData.value;

console.log("Values:", values);
console.log("Sum:", stats.sum(values));
console.log("Mean:", stats.mean(values));
console.log("Median:", stats.median(values));
console.log("Min:", stats.min(values));
console.log("Max:", stats.max(values));`,

  quantilesAndPercentiles: `const quartiles = stats.quartiles(values);
const q25 = stats.quantile(values, 0.25);
const q75 = stats.quantile(values, 0.75);

console.log("Quartiles [Q25, Q50, Q75]:", quartiles);
console.log("25th percentile:", q25);
console.log("75th percentile:", q75);`,

  mutateWithStats: `const withStats = sampleData
  .mutate({
    value_centered: (row, _index, df) => {
      const mean = stats.mean(df.value);
      return row.value - mean;
    },
    value_quartile: (row, _index, df) => {
      const q = stats.quartiles(df.value);
      if (row.value <= q[0]) return "Q1";
      if (row.value <= q[1]) return "Q2";
      if (row.value <= q[2]) return "Q3";
      return "Q4";
    },
  });

withStats.print("Data with statistical measures:");`,

  rankingFunctions: `const ranks = stats.rank(values);
const uniqueCount = stats.uniqueCount(values);

console.log("Ranks:", ranks);
console.log("Unique count:", uniqueCount);`,

  mutateWithRanking: `const withRanking = sampleData
  .mutate({
    value_rank: (row, _index, df) => stats.rank(df.value, row.value),
  });

withRanking.print("Data with ranking information:");`,

  cumulativeFunctions: `const cumsum = stats.cumsum(values);
const cummax = stats.cummax(values);

console.log("Cumulative sum:", cumsum);
console.log("Cumulative max:", cummax);`,
};
