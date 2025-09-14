import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("transpose - basic functionality", () => {
  const original = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
  ]);

  const transposed = original.transpose({ number_of_rows: 2 });

  expect(transposed.nrows()).toBe(3); // 3 original columns become 3 rows
  const result = transposed.toArray();

  // Check structure - should have __tidy_row_label__, __tidy_row_types__, row_0, row_1
  expect(result[0]).toHaveProperty("__tidy_row_label__");
  expect(result[0]).toHaveProperty("__tidy_row_types__");
  expect(result[0]).toHaveProperty("row_0");
  expect(result[0]).toHaveProperty("row_1");

  // Check the actual transposed values
  expect(result[0].__tidy_row_label__).toBe("name");
  expect(result[0].row_0).toBe("Alice");
  expect(result[0].row_1).toBe("Bob");

  expect(result[1].__tidy_row_label__).toBe("age");
  expect(result[1].row_0).toBe(25);
  expect(result[1].row_1).toBe(30);

  expect(result[2].__tidy_row_label__).toBe("score");
  expect(result[2].row_0).toBe(95.5);
  expect(result[2].row_1).toBe(87.2);
});

Deno.test("transpose - with custom row labels", () => {
  const original = createDataFrame([
    { student: "Alice", math: 85, english: 92 },
    { student: "Bob", math: 78, english: 88 },
    { student: "Charlie", math: 95, english: 85 },
  ]);

  const transposed = original
    .setRowLabels(["Alice", "Bob", "Charlie"])
    .transpose({
      number_of_rows: 3,
    });

  expect(transposed.nrows()).toBe(3); // student, math and english rows
  const result = transposed.toArray();

  // Should have Alice, Bob, Charlie as column names
  expect(result[0]).toHaveProperty("Alice");
  expect(result[0]).toHaveProperty("Bob");
  expect(result[0]).toHaveProperty("Charlie");

  // Check student row (first row)
  expect(result[0].__tidy_row_label__).toBe("student");
  expect(result[0].Alice).toBe("Alice");
  expect(result[0].Bob).toBe("Bob");
  expect(result[0].Charlie).toBe("Charlie");

  // Check math row (second row)
  expect(result[1].__tidy_row_label__).toBe("math");
  expect(result[1].Alice).toBe(85);
  expect(result[1].Bob).toBe(78);
  expect(result[1].Charlie).toBe(95);

  // Check english row (third row)
  expect(result[2].__tidy_row_label__).toBe("english");
  expect(result[2].Alice).toBe(92);
  expect(result[2].Bob).toBe(88);
  expect(result[2].Charlie).toBe(85);
});

Deno.test("transpose - numeric only data", () => {
  const original = createDataFrame([
    { x: 1, y: 2, z: 3 },
    { x: 4, y: 5, z: 6 },
  ]);

  const transposed = original.transpose({ number_of_rows: 2 });

  expect(transposed.nrows()).toBe(3);
  const result = transposed.toArray();

  expect(result[0]).toEqual({
    __tidy_row_label__: "x",
    __tidy_row_types__: { x: 1, y: 2, z: 3 },
    row_0: 1,
    row_1: 4,
  });

  expect(result[1]).toEqual({
    __tidy_row_label__: "y",
    __tidy_row_types__: { x: 1, y: 2, z: 3 },
    row_0: 2,
    row_1: 5,
  });

  expect(result[2]).toEqual({
    __tidy_row_label__: "z",
    __tidy_row_types__: { x: 1, y: 2, z: 3 },
    row_0: 3,
    row_1: 6,
  });
});

Deno.test("transpose - mixed data types", () => {
  const original = createDataFrame([
    { id: 1, name: "Alice", active: true, score: 95.5 },
    { id: 2, name: "Bob", active: false, score: 87.2 },
  ]);

  const transposed = original.transpose({ number_of_rows: 2 });

  expect(transposed.nrows()).toBe(4);
  const result = transposed.toArray();

  // Check that different data types are preserved
  expect(result[0].row_0).toBe(1); // number
  expect(result[0].row_1).toBe(2);

  expect(result[1].row_0).toBe("Alice"); // string
  expect(result[1].row_1).toBe("Bob");

  expect(result[2].row_0).toBe(true); // boolean
  expect(result[2].row_1).toBe(false);

  expect(result[3].row_0).toBe(95.5); // number
  expect(result[3].row_1).toBe(87.2);
});

Deno.test("transpose - single row", () => {
  const original = createDataFrame([
    { a: 10, b: 20, c: 30 },
  ]);

  const transposed = original.transpose({ number_of_rows: 1 });

  expect(transposed.nrows()).toBe(3);
  const result = transposed.toArray();

  expect(result[0]).toEqual({
    __tidy_row_label__: "a",
    __tidy_row_types__: { a: 10, b: 20, c: 30 },
    row_0: 10,
  });

  expect(result[1]).toEqual({
    __tidy_row_label__: "b",
    __tidy_row_types__: { a: 10, b: 20, c: 30 },
    row_0: 20,
  });

  expect(result[2]).toEqual({
    __tidy_row_label__: "c",
    __tidy_row_types__: { a: 10, b: 20, c: 30 },
    row_0: 30,
  });
});

Deno.test("transpose - single column", () => {
  const original = createDataFrame([
    { value: 1 },
    { value: 2 },
    { value: 3 },
  ]);

  const transposed = original.transpose({ number_of_rows: 3 });

  expect(transposed.nrows()).toBe(1);
  const result = transposed.toArray();

  expect(result[0]).toEqual({
    __tidy_row_label__: "value",
    __tidy_row_types__: { value: 1 },
    row_0: 1,
    row_1: 2,
    row_2: 3,
  });
});

Deno.test("transpose - with undefined values", () => {
  const original = createDataFrame([
    { a: 1, b: undefined, c: 3 },
    { a: undefined, b: 2, c: undefined },
  ]);

  const transposed = original.transpose({ number_of_rows: 2 });

  expect(transposed.nrows()).toBe(3);
  const result = transposed.toArray();

  expect(result[0].row_0).toBe(1);
  expect(result[0].row_1).toBe(undefined);

  expect(result[1].row_0).toBe(undefined);
  expect(result[1].row_1).toBe(2);

  expect(result[2].row_0).toBe(3);
  expect(result[2].row_1).toBe(undefined);
});

Deno.test("transpose - real world example - financial data", () => {
  const financials = createDataFrame([
    { company: "Apple", revenue: 365.8, profit: 94.7, employees: 154000 },
    { company: "Google", revenue: 282.8, profit: 76.0, employees: 156500 },
    { company: "Microsoft", revenue: 198.3, profit: 61.3, employees: 181000 },
  ]);

  const transposed = financials.setRowLabels(["Apple", "Google", "Microsoft"])
    .transpose({
      number_of_rows: 3,
    });

  expect(transposed.nrows()).toBe(4); // company, revenue, profit, employees
  const result = transposed.toArray();

  // Check revenue row
  const revenueRow = result.find((row) => row.__tidy_row_label__ === "revenue");
  expect(revenueRow).toBeTruthy();
  expect(revenueRow?.Apple).toBe(365.8);
  expect(revenueRow?.Google).toBe(282.8);
  expect(revenueRow?.Microsoft).toBe(198.3);

  // Check profit row
  const profitRow = result.find((row) => row.__tidy_row_label__ === "profit");
  expect(profitRow).toBeTruthy();
  expect(profitRow?.Apple).toBe(94.7);
  expect(profitRow?.Google).toBe(76.0);
  expect(profitRow?.Microsoft).toBe(61.3);

  // Check employees row
  const employeesRow = result.find((row) =>
    row.__tidy_row_label__ === "employees"
  );
  expect(employeesRow).toBeTruthy();
  expect(employeesRow?.Apple).toBe(154000);
  expect(employeesRow?.Google).toBe(156500);
  expect(employeesRow?.Microsoft).toBe(181000);
});

Deno.test("transpose - double transpose returns original structure", () => {
  const original = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
  ]);

  // First transpose
  const transposed = original.transpose({ number_of_rows: 2 });
  expect(transposed.nrows()).toBe(2); // name and age rows

  // Second transpose back (using the row count from first transpose)
  const doubleTransposed = transposed.transpose({ number_of_rows: 2 });
  expect(doubleTransposed.nrows()).toBe(2); // Back to Alice and Bob

  // Structure should be similar (though column order might differ)
  const result = doubleTransposed.toArray();
  expect(result).toHaveLength(2);

  // Should have some representation of the original data structure
  expect(result[0]).toHaveProperty("__tidy_row_label__");
  expect(result[1]).toHaveProperty("__tidy_row_label__");
});

Deno.test("transpose - preserves column order", () => {
  const original = createDataFrame([
    { first: 1, second: 2, third: 3, fourth: 4 },
    { first: 5, second: 6, third: 7, fourth: 8 },
  ]);

  const transposed = original.transpose({ number_of_rows: 2 });
  const result = transposed.toArray();

  // Row labels should preserve original column order
  expect(result[0].__tidy_row_label__).toBe("first");
  expect(result[1].__tidy_row_label__).toBe("second");
  expect(result[2].__tidy_row_label__).toBe("third");
  expect(result[3].__tidy_row_label__).toBe("fourth");
});

Deno.test("transpose - handles empty DataFrame", () => {
  const empty = createDataFrame<{ a: number; b: string }>([]);

  const transposed = empty.transpose({ number_of_rows: 0 });

  expect(transposed.nrows()).toBe(0);
  expect(transposed.toArray()).toEqual([]);
});
