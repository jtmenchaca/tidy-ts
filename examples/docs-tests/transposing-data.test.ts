import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Transposing Data", () => {
  it("should transpose data without row labels", () => {
    const data = createDataFrame([
      { product: "Widget A", q1: 100, q2: 120, q3: 110, q4: 130 },
      { product: "Widget B", q1: 80, q2: 90, q3: 95, q4: 105 },
    ]);

    const transposed = data.transpose({ number_of_rows: 2 });

    // Type check: transpose creates row_* columns with union types
    const _transposedTypeCheck: DataFrame<{
      "__tidy_row_label__": "product" | "q1" | "q2" | "q3" | "q4";
      "__tidy_row_types__": {
        product: string;
        q1: number;
        q2: number;
        q3: number;
        q4: number;
      };
      row_0: string | number;
      row_1: string | number;
    }> = transposed;
    void _transposedTypeCheck; // Suppress unused variable warning

    transposed.print("Transposed data:");

    expect(transposed.nrows()).toBe(5); // 5 original columns become 5 rows
    expect(transposed.columns()).toEqual([
      "__tidy_row_label__",
      "row_0",
      "row_1",
      "__tidy_row_types__",
    ]);
  });

  it("should transpose data with custom row labels", () => {
    const data = createDataFrame([
      { name: "Alice", math: 95, science: 88, english: 92 },
      { name: "Bob", math: 87, science: 94, english: 89 },
    ]);

    const withLabels = data.setRowLabels(["student_1", "student_2"]);
    const transposed = withLabels.transpose({ number_of_rows: 2 });

    transposed.print("Transposed with custom row labels:");

    expect(transposed.nrows()).toBe(4); // 4 original columns become 4 rows
    expect(transposed.columns()).toEqual([
      "__tidy_row_label__",
      "student_1",
      "student_2",
      "__tidy_row_types__",
    ]);
  });

  it("should perform double transpose (round-trip)", () => {
    const original = createDataFrame([
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
    ]);

    const transposed = original.transpose({ number_of_rows: 2 });
    const backToOriginal = transposed.transpose({ number_of_rows: 2 });

    console.log("Original data:");
    original.print();
    console.log("After double transpose:");
    backToOriginal.print();

    expect(backToOriginal.nrows()).toBe(2);
    expect(backToOriginal.columns()).toEqual([
      "__tidy_row_label__",
      "id",
      "name",
      "age",
    ]);
  });

  it("should handle mixed data types in transpose", () => {
    const data = createDataFrame([
      {
        id: 1,
        name: "Alice",
        active: true,
        score: 95.5,
        tags: ["smart", "friendly"],
      },
      {
        id: 2,
        name: "Bob",
        active: false,
        score: 87.2,
        tags: ["creative", "funny"],
      },
    ]);

    const transposed = data.setRowLabels(["user1", "user2"]).transpose({
      number_of_rows: 2,
    });

    transposed.print("Transposed mixed data types:");

    expect(transposed.nrows()).toBe(5); // 5 original columns become 5 rows
    expect(transposed.columns()).toEqual([
      "__tidy_row_label__",
      "user1",
      "user2",
      "__tidy_row_types__",
    ]);
  });

  it("should transpose quarterly data for time series analysis", () => {
    const quarterlyData = createDataFrame([
      { region: "North", jan: 1000, feb: 1100, mar: 1200, apr: 1300 },
      { region: "South", jan: 800, feb: 900, mar: 950, apr: 1000 },
      { region: "East", jan: 1200, feb: 1300, mar: 1400, apr: 1500 },
    ]);

    const monthlyView = quarterlyData
      .setRowLabels(["north", "south", "east"])
      .transpose({ number_of_rows: 3 });

    monthlyView.print("Monthly view (transposed for time series):");

    expect(monthlyView.nrows()).toBe(5); // 5 original columns become 5 rows
    expect(monthlyView.columns()).toEqual([
      "__tidy_row_label__",
      "north",
      "south",
      "east",
      "__tidy_row_types__",
    ]);
  });
});
