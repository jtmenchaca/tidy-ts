import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tests/shims";

test("Extract Nth Where Sorted - Real-World Examples", () => {
  console.log(
    "=== Extract Nth Where Sorted - Real-World Examples ===",
  );

  // ============================================================================
  // 1. EMPLOYEE PERFORMANCE ANALYSIS
  // ============================================================================
  console.log("\n=== 1. Employee Performance Analysis ===");

  const employees = createDataFrame([
    {
      name: "Alice Johnson",
      department: "Engineering",
      score: 95,
      salary: 120000,
    },
    { name: "Bob Smith", department: "Sales", score: 87, salary: 90000 },
    {
      name: "Carol Davis",
      department: "Engineering",
      score: 92,
      salary: 115000,
    },
    { name: "Dave Wilson", department: "Marketing", score: 88, salary: 85000 },
    { name: "Eve Brown", department: "Sales", score: 91, salary: 95000 },
    {
      name: "Frank Miller",
      department: "Engineering",
      score: 89,
      salary: 110000,
    },
  ]);

  console.log("Employee data:");
  employees.print();

  // Find top performers using the new method
  const topPerformer = employees.extractNthWhereSorted("name", "score", "desc");
  const topPerformerDept = employees.extractNthWhereSorted(
    "department",
    "score",
    "desc",
  );
  const topPerformerSalary = employees.extractNthWhereSorted(
    "salary",
    "score",
    "desc",
  );

  console.log(
    `\nTop performer: ${topPerformer} (${topPerformerDept}, $${topPerformerSalary})`,
  );

  // Find second-best performer
  const secondBest = employees.extractNthWhereSorted(
    "name",
    "score",
    "desc",
    2,
  );
  const secondBestDept = employees.extractNthWhereSorted(
    "department",
    "score",
    "desc",
    2,
  );
  console.log(`Second best: ${secondBest} (${secondBestDept})`);

  // Find worst performer
  const worstPerformer = employees.extractNthWhereSorted(
    "name",
    "score",
    "asc",
  );
  const worstPerformerDept = employees.extractNthWhereSorted(
    "department",
    "score",
    "asc",
  );
  console.log(`Worst performer: ${worstPerformer} (${worstPerformerDept})`);

  // Test assertions
  expect(topPerformer).toBe("Alice Johnson");
  expect(topPerformerDept).toBe("Engineering");
  expect(topPerformerSalary).toBe(120000);
  expect(secondBest).toBe("Carol Davis");
  expect(worstPerformer).toBe("Bob Smith");

  // ============================================================================
  // 2. SALES ANALYSIS BY REGION
  // ============================================================================
  console.log("\n=== 2. Sales Analysis by Region ===");

  const salesData = createDataFrame([
    { region: "North", product: "Widget A", sales: 15000, units: 100 },
    { region: "North", product: "Widget B", sales: 12000, units: 80 },
    { region: "South", product: "Widget A", sales: 18000, units: 120 },
    { region: "South", product: "Widget C", sales: 14000, units: 90 },
    { region: "East", product: "Widget B", sales: 16000, units: 110 },
    { region: "East", product: "Widget A", sales: 13000, units: 85 },
    { region: "West", product: "Widget C", sales: 17000, units: 95 },
    { region: "West", product: "Widget B", sales: 11000, units: 75 },
  ]);

  console.log("Sales data:");
  salesData.print();

  // Find best performing product by sales
  const bestProductBySales = salesData.extractNthWhereSorted(
    "product",
    "sales",
    "desc",
  );
  const bestRegionBySales = salesData.extractNthWhereSorted(
    "region",
    "sales",
    "desc",
  );
  const bestUnitsBySales = salesData.extractNthWhereSorted(
    "units",
    "sales",
    "desc",
  );

  console.log(
    `\nBest product by sales: ${bestProductBySales} (${bestRegionBySales}, ${bestUnitsBySales} units)`,
  );

  // Find best performing product by units
  const bestProductByUnits = salesData.extractNthWhereSorted(
    "product",
    "units",
    "desc",
  );
  const bestRegionByUnits = salesData.extractNthWhereSorted(
    "region",
    "units",
    "desc",
  );
  const bestSalesByUnits = salesData.extractNthWhereSorted(
    "sales",
    "units",
    "desc",
  );

  console.log(
    `Best product by units: ${bestProductByUnits} (${bestRegionByUnits}, $${bestSalesByUnits})`,
  );

  // Find worst performing product
  const worstProduct = salesData.extractNthWhereSorted(
    "product",
    "sales",
    "asc",
  );
  const worstRegion = salesData.extractNthWhereSorted("region", "sales", "asc");
  console.log(`Worst product: ${worstProduct} (${worstRegion})`);

  // Test assertions
  expect(bestProductBySales).toBe("Widget A");
  expect(bestRegionBySales).toBe("South");
  expect(bestProductByUnits).toBe("Widget A");
  expect(worstProduct).toBe("Widget B");

  // ============================================================================
  // 3. STUDENT GRADE ANALYSIS
  // ============================================================================
  console.log("\n=== 3. Student Grade Analysis ===");

  const students = createDataFrame([
    { name: "Alice", math: 95, science: 88, english: 92, grade: "A" },
    { name: "Bob", math: 87, science: 91, english: 85, grade: "B" },
    { name: "Carol", math: 92, science: 89, english: 94, grade: "A" },
    { name: "Dave", math: 78, science: 85, english: 88, grade: "B" },
    { name: "Eve", math: 96, science: 93, english: 89, grade: "A" },
  ]);

  console.log("Student data:");
  students.print();

  // Find students with highest scores in each subject
  const mathChampion = students.extractNthWhereSorted("name", "math", "desc");
  const scienceChampion = students.extractNthWhereSorted(
    "name",
    "science",
    "desc",
  );
  const englishChampion = students.extractNthWhereSorted(
    "name",
    "english",
    "desc",
  );

  console.log(`\nMath champion: ${mathChampion}`);
  console.log(`Science champion: ${scienceChampion}`);
  console.log(`English champion: ${englishChampion}`);

  // Find students with lowest scores
  const mathStruggler = students.extractNthWhereSorted("name", "math", "asc");
  const scienceStruggler = students.extractNthWhereSorted(
    "name",
    "science",
    "asc",
  );
  const englishStruggler = students.extractNthWhereSorted(
    "name",
    "english",
    "asc",
  );

  console.log(`Math struggler: ${mathStruggler}`);
  console.log(`Science struggler: ${scienceStruggler}`);
  console.log(`English struggler: ${englishStruggler}`);

  // Test assertions
  expect(mathChampion).toBe("Eve");
  expect(scienceChampion).toBe("Eve");
  expect(englishChampion).toBe("Carol");
  expect(mathStruggler).toBe("Dave");
  expect(scienceStruggler).toBe("Dave");
  expect(englishStruggler).toBe("Bob");

  // ============================================================================
  // 4. COMPARISON WITH OLD APPROACH
  // ============================================================================
  console.log("\n=== 4. Comparison with Old Approach ===");

  // Old verbose approach
  const oldWayTopPerformer = employees
    .sliceMax("score", 1)
    .extract("name")[0];

  const oldWaySecondBest = employees
    .sliceMax("score", 2)
    .extract("name")[1];

  // New concise approach
  const newWayTopPerformer = employees.extractNthWhereSorted(
    "name",
    "score",
    "desc",
  );
  const newWaySecondBest = employees.extractNthWhereSorted(
    "name",
    "score",
    "desc",
    2,
  );

  console.log("Old approach (verbose):");
  console.log(`  Top performer: ${oldWayTopPerformer}`);
  console.log(`  Second best: ${oldWaySecondBest}`);

  console.log("\nNew approach (concise):");
  console.log(`  Top performer: ${newWayTopPerformer}`);
  console.log(`  Second best: ${newWaySecondBest}`);

  // Verify they produce the same results
  expect(oldWayTopPerformer).toBe(newWayTopPerformer);
  expect(oldWaySecondBest).toBe(newWaySecondBest);

  console.log("\n✅ Both approaches produce identical results!");

  // ============================================================================
  // 5. EDGE CASES AND ERROR HANDLING
  // ============================================================================
  console.log("\n=== 5. Edge Cases and Error Handling ===");

  // Empty DataFrame
  const emptyDf = createDataFrame([]);
  // deno-lint-ignore no-explicit-any
  const emptyResult = (emptyDf as any).extractNthWhereSorted(
    "name",
    "score",
    "desc",
  );
  console.log(`Empty DataFrame result: ${emptyResult}`);

  // Single row
  const singleRowDf = createDataFrame([{ name: "Alice", score: 95 }]);
  const singleResult = singleRowDf.extractNthWhereSorted(
    "name",
    "score",
    "desc",
  );
  console.log(`Single row result: ${singleResult}`);

  // Out of bounds rank
  const outOfBounds = employees.extractNthWhereSorted(
    "name",
    "score",
    "desc",
    100,
  );
  console.log(`Out of bounds rank result: ${outOfBounds}`);

  // Test assertions
  expect(emptyResult).toBeUndefined();
  expect(singleResult).toBe("Alice");
  expect(outOfBounds).toBeUndefined();

  // ============================================================================
  // 6. TYPE SAFETY DEMONSTRATION
  // ============================================================================
  console.log("\n=== 6. Type Safety Demonstration ===");

  // These should compile without errors and have proper types
  const name: string | undefined = employees.extractNthWhereSorted(
    "name",
    "score",
    "desc",
  );
  const score: number | undefined = employees.extractNthWhereSorted(
    "score",
    "score",
    "desc",
  );
  const department: string | undefined = employees.extractNthWhereSorted(
    "department",
    "score",
    "desc",
  );
  const salary: number | undefined = employees.extractNthWhereSorted(
    "salary",
    "score",
    "desc",
  );

  console.log(`Name type: ${typeof name}`);
  console.log(`Score type: ${typeof score}`);
  console.log(`Department type: ${typeof department}`);
  console.log(`Salary type: ${typeof salary}`);

  // Test assertions
  expect(typeof name).toBe("string");
  expect(typeof score).toBe("number");
  expect(typeof department).toBe("string");
  expect(typeof salary).toBe("number");

  console.log("\n✅ All examples completed successfully!");
  console.log(
    "🎉 The new extractNthWhereSorted method works perfectly!",
  );
});
