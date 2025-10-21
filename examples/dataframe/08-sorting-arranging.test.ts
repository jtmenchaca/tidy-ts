import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Sorting - Basic Ascending", () => {
  const students = createDataFrame([
    { id: 1, name: "Charlie", age: 35, score: 78 },
    { id: 2, name: "Alice", age: 25, score: 85 },
    { id: 3, name: "Bob", age: 30, score: 92 },
  ]);

  const sortedByAge = students.arrange("age");

  expect(sortedByAge[0].name).toBe("Alice");
  expect(sortedByAge[2].name).toBe("Charlie");
});

Deno.test("Sorting - Basic Descending", () => {
  const students = createDataFrame([
    { id: 1, name: "Charlie", age: 35, score: 78 },
    { id: 2, name: "Alice", age: 25, score: 85 },
    { id: 3, name: "Bob", age: 30, score: 92 },
  ]);

  const sortedByScore = students.arrange("score", "desc");

  expect(sortedByScore[0].name).toBe("Bob");
  expect(sortedByScore[2].name).toBe("Charlie");
});

Deno.test("Sorting - Multi Column Sorting", () => {
  const employees = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: 85, department: "Engineering" },
    { id: 2, name: "Bob", age: 30, score: 92, department: "Marketing" },
    { id: 3, name: "Charlie", age: 25, score: 78, department: "Engineering" },
    { id: 4, name: "Diana", age: 30, score: 88, department: "Marketing" },
  ]);

  const sorted = employees.arrange("department", "asc");

  expect(sorted[0].department).toBe("Engineering");
  expect(sorted[0].name).toBe("Alice");
});

Deno.test("Sorting - With Calculated Values", () => {
  const grades = createDataFrame([
    { id: 1, name: "Alice", math: 85, science: 90, english: 80 },
    { id: 2, name: "Bob", math: 92, science: 88, english: 95 },
    { id: 3, name: "Charlie", math: 78, science: 85, english: 90 },
  ]);

  const withAverage = grades
    .mutate({
      average: (row) => (row.math + row.science + row.english) / 3,
    })
    .arrange("average", "desc");

  expect(withAverage[0].name).toBe("Bob");
});

Deno.test("Sorting - Finding Top Performers", () => {
  const sales = createDataFrame([
    { id: 1, name: "Alice", region: "North", sales: 50000 },
    { id: 2, name: "Bob", region: "South", sales: 75000 },
    { id: 3, name: "Charlie", region: "North", sales: 60000 },
    { id: 4, name: "Diana", region: "East", sales: 80000 },
  ]);

  const topPerformers = sales.arrange("sales", "desc").sliceHead(2);

  expect(topPerformers.nrows()).toBe(2);
  expect(topPerformers[0].name).toBe("Diana");
  expect(topPerformers[1].name).toBe("Bob");
});

Deno.test("Sorting - String Sorting", () => {
  const products = createDataFrame([
    { id: 1, name: "Charlie", category: "Zebra", price: 15.99 },
    { id: 2, name: "Alice", category: "Apple", price: 2.5 },
    { id: 3, name: "Bob", category: "Banana", price: 1.25 },
  ]);

  const sortedByName = products.arrange("name");
  expect(sortedByName[0].name).toBe("Alice");

  const sortedByCategory = products.arrange("category");
  expect(sortedByCategory[0].category).toBe("Apple");

  const sortedByPrice = products.arrange("price");
  expect(sortedByPrice[0].price).toBe(1.25);
});
