import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Reshaping - Pivot Wider", () => {
  const salesLong = createDataFrame([
    { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
    { year: 2023, quarter: "Q1", product: "Widget B", sales: 1500 },
    { year: 2023, quarter: "Q2", product: "Widget A", sales: 1200 },
    { year: 2023, quarter: "Q2", product: "Widget B", sales: 1800 },
  ]);

  const salesWide = salesLong.pivotWider({
    namesFrom: "product",
    valuesFrom: "sales",
    expectedColumns: ["Widget A", "Widget B"],
  });

  salesWide.print("Sales Data (Wide Format):");

  expect(salesWide.nrows()).toBe(2);
  expect(salesWide.columns()).toContain("Widget A");
  expect(salesWide.columns()).toContain("Widget B");
});

Deno.test("Reshaping - Pivot Longer", () => {
  const gradesWide = createDataFrame([
    { id: 1, name: "Alice", math: 85, science: 92, english: 78 },
    { id: 2, name: "Bob", math: 90, science: 88, english: 85 },
    { id: 3, name: "Charlie", math: 78, science: 95, english: 92 },
  ]);

  const gradesLong = gradesWide.pivotLonger({
    cols: ["math", "science", "english"],
    namesTo: "subject",
    valuesTo: "score",
  });

  gradesLong.print("Student Grades (Long Format):");

  expect(gradesLong.nrows()).toBe(9);
  expect(gradesLong.columns()).toContain("subject");
  expect(gradesLong.columns()).toContain("score");
});

Deno.test("Reshaping - Regional Comparison", () => {
  const regionalSales = createDataFrame([
    { year: 2023, region: "North", product: "Widget A", sales: 1000 },
    { year: 2023, region: "North", product: "Widget B", sales: 1500 },
    { year: 2023, region: "South", product: "Widget A", sales: 800 },
    { year: 2023, region: "South", product: "Widget B", sales: 1200 },
    { year: 2024, region: "North", product: "Widget A", sales: 1100 },
    { year: 2024, region: "North", product: "Widget B", sales: 1600 },
    { year: 2024, region: "South", product: "Widget A", sales: 900 },
    { year: 2024, region: "South", product: "Widget B", sales: 1300 },
  ]);

  const regionComparison = regionalSales.pivotWider({
    namesFrom: "region",
    valuesFrom: "sales",
    expectedColumns: ["North", "South"],
  });

  expect(regionComparison.columns()).toContain("North");
  expect(regionComparison.columns()).toContain("South");
});

Deno.test("Reshaping - Complex Reshape", () => {
  const studentData = createDataFrame([
    { id: 1, name: "Alice", math: 85, science: 92, english: 78 },
    { id: 2, name: "Bob", math: 90, science: 88, english: 85 },
  ]);

  const longFormat = studentData.pivotLonger({
    cols: ["math", "science", "english"],
    namesTo: "subject",
    valuesTo: "score",
  });

  expect(longFormat.nrows()).toBe(6);

  const backToWide = longFormat.pivotWider({
    namesFrom: "subject",
    valuesFrom: "score",
    expectedColumns: ["math", "science", "english"],
  });

  expect(backToWide.columns()).toContain("math");
  expect(backToWide.columns()).toContain("science");
  expect(backToWide.columns()).toContain("english");
});

Deno.test("Reshaping - Handling Missing Values", () => {
  const incompleteData = createDataFrame([
    { id: 1, category: "A", value: 10 },
    { id: 2, category: "B", value: 20 },
    { id: 3, category: "A", value: null },
    { id: 4, category: "B", value: 30 },
  ]);

  const pivoted = incompleteData.pivotWider({
    namesFrom: "category",
    valuesFrom: "value",
    expectedColumns: ["A", "B"],
  });

  expect(pivoted.columns()).toContain("A");
  expect(pivoted.columns()).toContain("B");
});
