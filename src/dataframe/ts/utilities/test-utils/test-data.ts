import { createDataFrame } from "@tidy-ts/dataframe";

// Basic test data
export const starWarsData = createDataFrame([
  { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  {
    id: 2,
    name: "Chewbacca",
    mass: 112,
    species: "Wookiee",
    homeworld: "Kashyyyk",
  },
  { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
  { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
  { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
]);

// Empty data
export const emptyData = createDataFrame([]);

// Single row data
export const singleRowData = createDataFrame([
  { id: 1, name: "Test", value: 42 },
]);

// Data with missing values
export const dataWithMissing = createDataFrame([
  { id: 1, name: "Alice", score: 85, flag: true },
  { id: 2, name: "Bob", score: 92, flag: false },
  { id: 3, name: null, score: null, flag: true },
  { id: 4, name: "Charlie", score: 78, flag: null },
  { id: 5, name: undefined, score: undefined, flag: false },
  { id: 6, name: "Diana", score: 88, flag: true },
]);

// Numeric data for statistical tests
export const numericData = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  { id: 3, value: 30 },
  { id: 4, value: 40 },
  { id: 5, value: 50 },
]);

// Data with Infinity values
export const infinityData = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: Infinity },
  { id: 3, value: -Infinity },
  { id: 4, value: 20 },
]);

// Data with NaN values
export const nanData = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: NaN },
  { id: 3, value: 20 },
  { id: 4, value: NaN },
]);

// Time series data
export const timeSeriesData = createDataFrame([
  { date: "2023-01-01", sales: 100 },
  { date: "2023-01-02", sales: 150 },
  { date: "2023-01-03", sales: 200 },
  { date: "2023-01-04", sales: 120 },
  { date: "2023-01-05", sales: 180 },
]);

// Large dataset for performance testing
export function createLargeDataset(size: number = 1000) {
  return createDataFrame(
    Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      value: Math.random() * 100,
      group: String.fromCharCode(65 + (i % 26)), // A-Z
      category: i % 10,
    })),
  );
}
