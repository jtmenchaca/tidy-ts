import { createDataFrame } from "../../dataframe/index.ts";
import { expect } from "@std/expect";

Deno.test("extractNthWhereSorted - Basic functionality", () => {
  const df = createDataFrame([
    { name: "Alice", score: 95, department: "Engineering" },
    { name: "Bob", score: 87, department: "Sales" },
    { name: "Carol", score: 92, department: "Engineering" },
    { name: "Dave", score: 88, department: "Marketing" },
  ]);

  // Test descending order (highest first)
  const topPerformer = df.extractNthWhereSorted("name", "score", "desc");
  expect(topPerformer).toBe("Alice");

  const topDept = df.extractNthWhereSorted("department", "score", "desc");
  expect(topDept).toBe("Engineering");

  // Test second place descending
  const secondBest = df.extractNthWhereSorted("name", "score", "desc", 2);
  expect(secondBest).toBe("Carol");

  const secondBestDept = df.extractNthWhereSorted(
    "department",
    "score",
    "desc",
    2,
  );
  expect(secondBestDept).toBe("Engineering");

  // Test ascending order (lowest first)
  const worstPerformer = df.extractNthWhereSorted("name", "score", "asc");
  expect(worstPerformer).toBe("Bob");

  const worstDept = df.extractNthWhereSorted("department", "score", "asc");
  expect(worstDept).toBe("Sales");

  // Test second place ascending
  const secondWorst = df.extractNthWhereSorted("name", "score", "asc", 2);
  expect(secondWorst).toBe("Dave");

  const secondWorstDept = df.extractNthWhereSorted(
    "department",
    "score",
    "asc",
    2,
  );
  expect(secondWorstDept).toBe("Marketing");

  // Test out of bounds
  const outOfBounds = df.extractNthWhereSorted("name", "score", "desc", 10);
  expect(outOfBounds).toBeUndefined();
});

Deno.test("extractNthWhereSorted - With ties", () => {
  const df = createDataFrame([
    { name: "Alice", score: 95, department: "Engineering" },
    { name: "Bob", score: 95, department: "Sales" },
    { name: "Carol", score: 92, department: "Engineering" },
    { name: "Dave", score: 88, department: "Marketing" },
  ]);

  // With ties, should return the first one encountered
  const topPerformer = df.extractNthWhereSorted("name", "score", "desc");
  expect(topPerformer).toBe("Alice"); // First in original order

  const topDept = df.extractNthWhereSorted("department", "score", "desc");
  expect(topDept).toBe("Engineering"); // First in original order

  // Second place should be the second tied value
  const secondBest = df.extractNthWhereSorted("name", "score", "desc", 2);
  expect(secondBest).toBe("Bob");
});

Deno.test("extractNthWhereSorted - With null/undefined values", () => {
  const df = createDataFrame([
    { name: "Alice", score: 95, department: "Engineering" },
    { name: "Bob", score: null, department: "Sales" },
    { name: "Carol", score: 92, department: "Engineering" },
    { name: "Dave", score: undefined, department: "Marketing" },
  ]);

  // Should handle null/undefined values correctly
  const topPerformer = df.extractNthWhereSorted("name", "score", "desc");
  expect(topPerformer).toBe("Alice");

  const topDept = df.extractNthWhereSorted("department", "score", "desc");
  expect(topDept).toBe("Engineering");

  // Null/undefined values should be sorted to the end
  const thirdBest = df.extractNthWhereSorted("name", "score", "desc", 3);
  expect(thirdBest).toBe("Bob"); // First null value
});

Deno.test("extractNthWhereSorted - Empty DataFrame", () => {
  const emptyDf = createDataFrame([]);

  // For empty DataFrames, we need to cast to any to bypass type checking
  // deno-lint-ignore no-explicit-any
  const result = (emptyDf as any).extractNthWhereSorted(
    "name",
    "score",
    "desc",
  );
  expect(result).toBeUndefined();

  // deno-lint-ignore no-explicit-any
  const resultWithRank = (emptyDf as any).extractNthWhereSorted(
    "name",
    "score",
    "desc",
    2,
  );
  expect(resultWithRank).toBeUndefined();
});

Deno.test("extractNthWhereSorted - Single row", () => {
  const singleRowDf = createDataFrame([
    { name: "Alice", score: 95, department: "Engineering" },
  ]);

  const result = singleRowDf.extractNthWhereSorted("name", "score", "desc");
  expect(result).toBe("Alice");

  const resultWithRank = singleRowDf.extractNthWhereSorted(
    "name",
    "score",
    "desc",
    2,
  );
  expect(resultWithRank).toBeUndefined();
});

Deno.test("extractNthWhereSorted - Grouped data", () => {
  const df = createDataFrame([
    { name: "Alice", score: 95, department: "Engineering" },
    { name: "Bob", score: 87, department: "Sales" },
    { name: "Carol", score: 92, department: "Engineering" },
    { name: "Dave", score: 88, department: "Sales" },
  ]);

  const grouped = df.groupBy("department");

  // Test within each group
  const engineeringTop = grouped
    .filter((row) => row.department === "Engineering")
    .extractNthWhereSorted("name", "score", "desc");
  expect(engineeringTop).toBe("Alice");

  const salesTop = grouped
    .filter((row) => row.department === "Sales")
    .extractNthWhereSorted("name", "score", "desc");
  expect(salesTop).toBe("Dave");
});

Deno.test("extractNthWhereSorted - Date sorting", () => {
  const df = createDataFrame([
    { name: "Alice", date: new Date("2024-01-15"), department: "Engineering" },
    { name: "Bob", date: new Date("2024-01-10"), department: "Sales" },
    { name: "Carol", date: new Date("2024-01-20"), department: "Engineering" },
    { name: "Dave", date: new Date("2024-01-12"), department: "Marketing" },
  ]);

  // Test with dates (should sort by date)
  const latestPerformer = df.extractNthWhereSorted("name", "date", "desc");
  expect(latestPerformer).toBe("Carol");

  const latestDept = df.extractNthWhereSorted("department", "date", "desc");
  expect(latestDept).toBe("Engineering");

  const secondLatest = df.extractNthWhereSorted("name", "date", "desc", 2);
  expect(secondLatest).toBe("Alice");

  // Test ascending
  const earliestPerformer = df.extractNthWhereSorted("name", "date", "asc");
  expect(earliestPerformer).toBe("Bob");

  const earliestDept = df.extractNthWhereSorted("department", "date", "asc");
  expect(earliestDept).toBe("Sales");
});

Deno.test("extractNthWhereSorted - String sorting", () => {
  const df = createDataFrame([
    { name: "Alice", city: "Zebra", department: "Engineering" },
    { name: "Bob", city: "Alpha", department: "Sales" },
    { name: "Carol", city: "Beta", department: "Engineering" },
    { name: "Dave", city: "Charlie", department: "Marketing" },
  ]);

  // Test with strings (should sort alphabetically)
  const lastAlphabetically = df.extractNthWhereSorted("name", "city", "desc");
  expect(lastAlphabetically).toBe("Alice");

  const lastDept = df.extractNthWhereSorted("department", "city", "desc");
  expect(lastDept).toBe("Engineering");

  const secondLast = df.extractNthWhereSorted("name", "city", "desc", 2);
  expect(secondLast).toBe("Dave");

  // Test ascending
  const firstAlphabetically = df.extractNthWhereSorted("name", "city", "asc");
  expect(firstAlphabetically).toBe("Bob");

  const firstDept = df.extractNthWhereSorted("department", "city", "asc");
  expect(firstDept).toBe("Sales");
});

Deno.test("extractNthWhereSorted - Type safety", () => {
  const df = createDataFrame([
    { name: "Alice", score: 95, department: "Engineering" },
    { name: "Bob", score: 87, department: "Sales" },
  ]);

  // These should compile without errors
  const name: string | undefined = df.extractNthWhereSorted(
    "name",
    "score",
    "desc",
  );
  const score: number | undefined = df.extractNthWhereSorted(
    "score",
    "score",
    "desc",
  );
  const dept: string | undefined = df.extractNthWhereSorted(
    "department",
    "score",
    "desc",
  );

  expect(name).toBe("Alice");
  expect(score).toBe(95);
  expect(dept).toBe("Engineering");
});
