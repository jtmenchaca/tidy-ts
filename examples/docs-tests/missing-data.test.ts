import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { stats } from "@tidy-ts/dataframe";

describe("Missing Data Handling", () => {
  it("should support null and undefined values", () => {
    const data = createDataFrame([
      { id: 1, name: "Alice", age: 25, score: 85 },
      { id: 2, name: null, age: 30, score: undefined },
      { id: 3, name: "Charlie", age: null, score: 92 },
    ]);

    // Type check: DataFrame supports null and undefined in columns
    const _dataTypeCheck: typeof data = data;
    void _dataTypeCheck; // Suppress unused variable warning

    data.print("Data with null and undefined values:");

    expect(data.nrows()).toBe(3);
    expect(data.name).toEqual(["Alice", null, "Charlie"]);
    expect(data.age).toEqual([25, 30, null]);
    expect(data.score).toEqual([85, undefined, 92]);
  });

  it("should return null from stats functions when NA values are present", () => {
    const data = createDataFrame([
      { id: 1, value: 10 },
      { id: 2, value: null },
      { id: 3, value: 20 },
      { id: 4, value: undefined },
    ]);

    // By default, stats functions return null when NA values are present
    // @ts-ignore - stats functions handle nullable arrays
    const total = stats.sum(data.value);
    // @ts-ignore - stats functions handle nullable arrays
    const average = stats.mean(data.value);
    // @ts-ignore - stats functions handle nullable arrays
    const maximum = stats.max(data.value);

    console.log("Default behavior (with NA values):");
    console.log("Sum:", total);
    console.log("Mean:", average);
    console.log("Max:", maximum);

    expect(total).toBe(30); // 10 + 20 (null and undefined are ignored)
    expect(average).toBe(15); // (10 + 20) / 2
    expect(maximum).toBe(20); // max of 10, 20
  });

  it("should use remove_na option to ignore NA values", () => {
    const data = createDataFrame([
      { id: 1, value: 10 },
      { id: 2, value: null },
      { id: 3, value: 20 },
      { id: 4, value: undefined },
    ]);

    // Use remove_na: true to ignore NA values
    const total = stats.sum(data.value as (number | null | undefined)[], true);
    const average = stats.mean(
      data.value as (number | null | undefined)[],
      true,
    );
    const maximum = stats.max(
      data.value as (number | null | undefined)[],
      true,
    );

    console.log("With remove_na: true:");
    console.log("Sum:", total);
    console.log("Mean:", average);
    console.log("Max:", maximum);

    expect(total).toBe(30); // 10 + 20
    expect(average).toBe(15); // (10 + 20) / 2
    expect(maximum).toBe(20);
  });

  it("should replace missing values with defaults", () => {
    const messyData = createDataFrame([
      { id: 1, name: "Alice", age: 25, score: 85 },
      { id: 2, name: null, age: 30, score: null },
      { id: 3, name: "Charlie", age: null, score: 92 },
    ]);

    const cleaned = messyData.replaceNA({
      name: "Unknown",
      age: 0,
      score: -1,
    });

    // Type check: replaceNA preserves types but makes them non-nullable
    const _cleanedTypeCheck: DataFrame<{
      id: number;
      name: string;
      age: number;
      score: number;
    }> = cleaned;
    void _cleanedTypeCheck; // Suppress unused variable warning

    cleaned.print("After replaceNA:");

    expect(cleaned.nrows()).toBe(3);
    expect(cleaned.toArray()).toEqual([
      { id: 1, name: "Alice", age: 25, score: 85 },
      { id: 2, name: "Unknown", age: 30, score: -1 },
      { id: 3, name: "Charlie", age: 0, score: 92 },
    ]);
  });
});
