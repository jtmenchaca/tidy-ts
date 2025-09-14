import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Performance Benchmarks", () => {
  it("should perform filter operations efficiently", () => {
    const data = createDataFrame([
      { id: 1, name: "Alice", age: 25, score: 85 },
      { id: 2, name: "Bob", age: 30, score: 92 },
      { id: 3, name: "Charlie", age: 35, score: 78 },
      { id: 4, name: "Diana", age: 28, score: 88 },
    ]);

    const start = performance.now();
    const filtered = data.filter((row) => row.score > 80);
    const end = performance.now();

    // Type check: filter preserves exact types
    const _filteredTypeCheck: DataFrame<{
      id: number;
      name: string;
      age: number;
      score: number;
    }> = filtered;
    void _filteredTypeCheck; // Suppress unused variable warning

    console.log(`Filter benchmark: ${(end - start).toFixed(2)}ms`);
    filtered.print("Filtered data:");

    expect(filtered.nrows()).toBe(3);
    expect(filtered.toArray()).toEqual([
      { id: 1, name: "Alice", age: 25, score: 85 },
      { id: 2, name: "Bob", age: 30, score: 92 },
      { id: 4, name: "Diana", age: 28, score: 88 },
    ]);
  });

  it("should perform mutate operations efficiently", () => {
    const data = createDataFrame([
      { id: 1, value: 10, category: "A" },
      { id: 2, value: 20, category: "B" },
      { id: 3, value: 30, category: "A" },
      { id: 4, value: 40, category: "B" },
    ]);

    const start = performance.now();
    const mutated = data.mutate({
      doubled: (row) => row.value * 2,
      category_upper: (row) => row.category.toUpperCase(),
    });
    const end = performance.now();

    console.log(`Mutate benchmark: ${(end - start).toFixed(2)}ms`);
    mutated.print("Mutated data:");

    expect(mutated.nrows()).toBe(4);
    expect(mutated.doubled).toEqual([20, 40, 60, 80]);
    expect(mutated.category_upper).toEqual(["A", "B", "A", "B"]);
  });

  it("should perform groupBy operations efficiently", () => {
    const data = createDataFrame([
      { id: 1, category: "A", value: 10 },
      { id: 2, category: "B", value: 20 },
      { id: 3, category: "A", value: 30 },
      { id: 4, category: "B", value: 40 },
    ]);

    const start = performance.now();
    const grouped = data.groupBy("category").summarise({
      count: (group) => group.nrows(),
      total: (group) => group.value.reduce((sum, v) => sum + v, 0),
    });
    const end = performance.now();

    console.log(`GroupBy benchmark: ${(end - start).toFixed(2)}ms`);
    grouped.print("Grouped data:");

    expect(grouped.nrows()).toBe(2);
    expect(grouped.columns()).toEqual(["category", "count", "total"]);
  });

  it("should perform join operations efficiently", () => {
    const left = createDataFrame([
      { id: 1, name: "Alice", dept_id: 10 },
      { id: 2, name: "Bob", dept_id: 20 },
      { id: 3, name: "Charlie", dept_id: 10 },
    ]);

    const right = createDataFrame([
      { dept_id: 10, dept_name: "Engineering" },
      { dept_id: 20, dept_name: "Marketing" },
    ]);

    const start = performance.now();
    const joined = left.innerJoin(right, "dept_id");
    const end = performance.now();

    console.log(`Join benchmark: ${(end - start).toFixed(2)}ms`);
    joined.print("Joined data:");

    expect(joined.nrows()).toBe(3);
    expect(joined.columns()).toEqual(["id", "name", "dept_id", "dept_name"]);
  });

  it("should handle large datasets efficiently", () => {
    // Create a larger dataset for testing
    const largeData = createDataFrame(
      Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        value: Math.random() * 100,
        category: i % 2 === 0 ? "A" : "B",
      })),
    );

    const start = performance.now();
    const processed = largeData
      .filter((row) => row.value > 50)
      .mutate({
        doubled: (row) => row.value * 2,
      })
      .groupBy("category")
      .summarise({
        count: (group) => group.nrows(),
        avg_value: (group) =>
          group.value.reduce((sum, v) => sum + v, 0) / group.value.length,
      });
    const end = performance.now();

    console.log(`Large dataset benchmark: ${(end - start).toFixed(2)}ms`);
    processed.print("Processed large dataset:");

    expect(processed.nrows()).toBe(2); // Two categories
    expect(processed.columns()).toEqual(["category", "count", "avg_value"]);
  });
});
