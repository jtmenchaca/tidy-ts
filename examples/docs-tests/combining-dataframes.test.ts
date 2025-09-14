import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Combining DataFrames", () => {
  it("should combine two DataFrames with bindRows", () => {
    const df1 = createDataFrame([
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
    ]);

    const df2 = createDataFrame([
      { id: 3, name: "Charlie", age: 35 },
      { id: 4, name: "Diana", age: 28 },
    ]);

    const combined = df1.bindRows(df2);

    // Type check: bindRows preserves exact types
    const _combinedTypeCheck: DataFrame<{
      id: number;
      name: string;
      age: number;
    }> = combined;
    void _combinedTypeCheck; // Suppress unused variable warning

    combined.print("Combined DataFrames:");

    expect(combined.nrows()).toBe(4);
    expect(combined.columns()).toEqual(["id", "name", "age"]);
    expect(combined.toArray()).toEqual([
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Charlie", age: 35 },
      { id: 4, name: "Diana", age: 28 },
    ]);
  });

  it("should combine multiple DataFrames at once", () => {
    const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
    const df2 = createDataFrame([{ id: 2, name: "Bob" }]);
    const df3 = createDataFrame([{ id: 3, name: "Charlie" }]);

    const combined = df1.bindRows(df2, df3);

    // Type check: bindRows with multiple DataFrames preserves exact types
    const _multipleCombinedTypeCheck: DataFrame<{
      id: number;
      name: string;
    }> = combined;
    void _multipleCombinedTypeCheck; // Suppress unused variable warning

    combined.print("Multiple DataFrames combined:");

    expect(combined.nrows()).toBe(3);
    expect(combined.toArray()).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);
  });

  it("should handle DataFrames with different columns", () => {
    const df1 = createDataFrame([
      { id: 1, name: "Alice", age: 25 },
    ]);

    const df2 = createDataFrame([
      { id: 2, name: "Bob", age: 30, salary: 50000 },
    ]);

    const combined = df1.bindRows(df2);

    // Type check: bindRows with different columns makes missing columns optional
    const _differentColumnsTypeCheck: typeof combined = combined;
    void _differentColumnsTypeCheck; // Suppress unused variable warning

    combined.print("Different columns handled:");

    expect(combined.nrows()).toBe(2);
    expect(combined.columns()).toEqual(["id", "name", "age", "salary"]);
    expect(combined.toArray()).toEqual([
      { id: 1, name: "Alice", age: 25, salary: undefined },
      { id: 2, name: "Bob", age: 30, salary: 50000 },
    ]);
  });

  it("should work with spread operator, but why not use bindRows?", () => {
    const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
    const df2 = createDataFrame([{ id: 2, name: "Bob" }]);

    const combined = createDataFrame([...df1, ...df2]);

    // Type check: spread operator combination preserves exact types
    const _spreadCombinedTypeCheck: DataFrame<{
      id: number;
      name: string;
    }> = combined;
    void _spreadCombinedTypeCheck; // Suppress unused variable warning

    combined.print("Spread operator combination:");

    expect(combined.nrows()).toBe(2);
    expect(combined.toArray()).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });
});
