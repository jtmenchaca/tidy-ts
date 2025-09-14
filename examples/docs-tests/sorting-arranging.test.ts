import { describe, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Sorting and Arranging Data", () => {
  it("should demonstrate basic sorting", () => {
    // Create a DataFrame with student data
    const students = createDataFrame([
      { id: 1, name: "Charlie", age: 35, score: 78 },
      { id: 2, name: "Alice", age: 25, score: 85 },
      { id: 3, name: "Bob", age: 30, score: 92 },
    ]);

    // Sort by age (ascending by default)
    const sortedByAge = students.arrange("age");
    sortedByAge.print("Students sorted by age (youngest first):");

    // Sort by score in descending order
    const sortedByScore = students.arrange("score", "desc");
    sortedByScore.print("Students sorted by score (highest first):");

    // Type check: arrange preserves exact types
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      age: number;
      score: number;
    }> = sortedByAge;
    void _typeCheck; // Suppress unused variable warning
  });

  it("should demonstrate multi-column sorting", () => {
    // Create data with multiple sorting criteria
    const employees = createDataFrame([
      { id: 1, name: "Alice", age: 25, score: 85, department: "Engineering" },
      { id: 2, name: "Bob", age: 30, score: 92, department: "Marketing" },
      { id: 3, name: "Charlie", age: 25, score: 78, department: "Engineering" },
      { id: 4, name: "Diana", age: 30, score: 88, department: "Marketing" },
    ]);

    // Sort by department first, then by score descending within each department
    const sorted = employees
      .arrange("department", "asc")
      .arrange("score", "desc");

    sorted.print("Employees sorted by department, then by score:");
  });

  it("should demonstrate sorting with calculated values", () => {
    // Create student grade data
    const grades = createDataFrame([
      { id: 1, name: "Alice", math: 85, science: 90, english: 80 },
      { id: 2, name: "Bob", math: 92, science: 88, english: 95 },
      { id: 3, name: "Charlie", math: 78, science: 85, english: 90 },
    ]);

    // Calculate average grade and sort by it
    const withAverage = grades
      .mutate({
        average: (row) => (row.math + row.science + row.english) / 3,
      })
      .arrange("average", "desc");

    withAverage.print("Students ranked by average grade:");
  });

  it("should demonstrate finding top performers", () => {
    const sales = createDataFrame([
      { id: 1, name: "Alice", region: "North", sales: 50000 },
      { id: 2, name: "Bob", region: "South", sales: 75000 },
      { id: 3, name: "Charlie", region: "North", sales: 60000 },
      { id: 4, name: "Diana", region: "East", sales: 80000 },
    ]);

    // Find top 2 performers
    const topPerformers = sales
      .arrange("sales", "desc")
      .head(2);

    topPerformers.print("Top 2 sales performers:");

    // Find best performer in each region
    const bestByRegion = sales
      .groupBy("region")
      .summarise({
        top_sales: (group) =>
          group.sliceMax("sales", 1).extractHead("name", 1) || "N/A",
        max_sales: (group) =>
          group.sliceMax("sales", 1).extractHead("sales", 1) || 0,
      })
      .arrange("max_sales", "desc");

    bestByRegion.print("Best performer by region:");
  });

  it("should demonstrate sorting with null values", () => {
    // Create data with some missing values
    const incompleteData = createDataFrame([
      { id: 1, name: "Alice", age: 25, score: 85 },
      { id: 2, name: "Bob", age: null, score: 92 },
      { id: 3, name: "Charlie", age: 35, score: null },
      { id: 4, name: "Diana", age: 28, score: 88 },
    ]);

    // Sort by age (nulls typically go to the end)
    const sortedByAge = incompleteData.arrange("age");
    sortedByAge.print("Data sorted by age (nulls handled):");

    // Sort by score
    const sortedByScore = incompleteData.arrange("score");
    sortedByScore.print("Data sorted by score (nulls handled):");
  });

  it("should demonstrate string sorting", () => {
    // Create data with string values
    const products = createDataFrame([
      { id: 1, name: "Charlie", category: "Zebra", price: 15.99 },
      { id: 2, name: "Alice", category: "Apple", price: 2.50 },
      { id: 3, name: "Bob", category: "Banana", price: 1.25 },
    ]);

    // Sort by name alphabetically
    const sortedByName = products.arrange("name");
    sortedByName.print("Products sorted by name:");

    // Sort by category alphabetically
    const sortedByCategory = products.arrange("category");
    sortedByCategory.print("Products sorted by category:");

    // Sort by price (numeric)
    const sortedByPrice = products.arrange("price");
    sortedByPrice.print("Products sorted by price:");
  });
});
