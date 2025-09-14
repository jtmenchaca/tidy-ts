/**
 * DataFrame system testing - edge cases, limits, and comprehensive validation
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("DataFrame View System - Edge Cases and Limits", () => {
  console.log("\n=== DataFrame View System Edge Cases ===");

  // Setup test data in proper array format
  const df = createDataFrame([
    { id: 1, name: "Alice", value: 10, category: "A" },
    { id: 2, name: "Bob", value: 20, category: "B" },
    { id: 3, name: "Charlie", value: 30, category: "A" },
    { id: 4, name: "David", value: 40, category: "B" },
    { id: 5, name: "Eve", value: 50, category: "A" },
  ]);
  console.log("Original DataFrame created with 5 rows");

  // Test basic operations
  expect(df.nrows()).toBe(5);
  expect(df.ncols()).toBe(4);
  expect(df.columns()).toEqual(["id", "name", "value", "category"]);

  // Test row access
  expect(df[0].name).toBe("Alice");
  expect(df[4].name).toBe("Eve");

  // Test column access
  const names = df.name;
  expect(names).toEqual(["Alice", "Bob", "Charlie", "David", "Eve"]);

  // Test filtering
  const filtered = df.filter((row) => row.category === "A");
  expect(filtered.nrows()).toBe(3);
  expect(filtered[0].name).toBe("Alice");

  // Test chaining
  const chained = df
    .filter((row) => row.value > 20)
    .select("name", "value")
    .arrange("value", "desc");

  expect(chained.nrows()).toBe(3);
  expect(chained[0].name).toBe("Eve");
  expect(chained[0].value).toBe(50);

  console.log("✅ Basic operations work correctly");
});

Deno.test("DataFrame - Large Dataset Handling", () => {
  console.log("\n=== Large Dataset Handling ===");

  // Create a larger dataset
  const largeData = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Person${i + 1}`,
    value: Math.random() * 100,
    category: i % 2 === 0 ? "A" : "B",
  }));

  const largeDf = createDataFrame(largeData);
  console.log(`Large DataFrame created with ${largeDf.nrows()} rows`);

  expect(largeDf.nrows()).toBe(1000);
  expect(largeDf.ncols()).toBe(4);

  // Test operations on large dataset
  const filtered = largeDf.filter((row) => row.category === "A");
  expect(filtered.nrows()).toBe(500);

  const grouped = largeDf.groupBy("category");
  expect(grouped.__groups?.size).toBe(2);

  const summary = grouped.summarise({
    count: (g) => g.nrows(),
    avg_value: (g) => g.value.reduce((a, b) => a + b, 0) / g.value.length,
  });
  expect(summary.nrows()).toBe(2);

  console.log("✅ Large dataset operations work correctly");
});

Deno.test("DataFrame - Memory and Performance Edge Cases", () => {
  console.log("\n=== Memory and Performance Edge Cases ===");

  // Test with very wide data (many columns)
  const wideData = Array.from({ length: 10 }, (_, i) => {
    // deno-lint-ignore no-explicit-any
    const row: Record<string, any> = { id: i + 1 };
    for (let j = 0; j < 50; j++) {
      row[`col_${j}`] = Math.random();
    }
    return row;
  });

  const wideDf = createDataFrame(wideData);
  console.log(`Wide DataFrame created with ${wideDf.ncols()} columns`);

  expect(wideDf.nrows()).toBe(10);
  expect(wideDf.ncols()).toBe(51); // 1 id + 50 data columns

  // Test column access on wide data
  const firstCol = wideDf.col_0;
  expect(firstCol.length).toBe(10);

  // Test operations on wide data
  const selected = wideDf.select("id", "col_0", "col_1");
  expect(selected.ncols()).toBe(3);

  console.log("✅ Wide dataset operations work correctly");
});

Deno.test("DataFrame - Error Handling and Edge Cases", () => {
  console.log("\n=== Error Handling and Edge Cases ===");

  // Test with problematic data
  const problematicData = [
    { id: 1, name: "Normal", value: 10 },
    { id: 2, name: null, value: null },
    { id: 3, name: undefined, value: undefined },
    { id: 4, name: "", value: 0 },
    { id: 5, name: "NaN", value: NaN },
  ];

  const df = createDataFrame(problematicData);
  console.log("DataFrame created with problematic data");

  expect(df.nrows()).toBe(5);
  expect(df.ncols()).toBe(3);

  // Test that operations don't crash with problematic data
  expect(() =>
    df.filter((row) => {
      return row.value !== null && row.value !== undefined && row.value > 5;
    })
  ).not.toThrow();
  expect(() => df.select("id", "name")).not.toThrow();
  expect(() => df.arrange("value")).not.toThrow();

  // Test with empty operations
  const emptyFiltered = df.filter(() => false);
  expect(emptyFiltered.nrows()).toBe(0);

  // @ts-expect-error - select() with no arguments should be caught at compile time
  expect(() => df.select()).toThrow(
    'Column "undefined" not found. Available columns: [id, name, value]',
  );

  console.log("✅ Error handling works correctly");
});

Deno.test("DataFrame - Type Safety and Edge Cases", () => {
  console.log("\n=== Type Safety and Edge Cases ===");

  // Test with mixed types
  const mixedData = [
    { id: 1, value: 10, flag: true, text: "hello" },
    { id: 2, value: "20", flag: 1, text: 123 },
    { id: 3, value: null, flag: false, text: null },
  ];

  const df = createDataFrame(mixedData);
  console.log("DataFrame created with mixed types");

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(4);

  // Test that operations handle mixed types gracefully
  expect(() => df.filter((row) => row.id > 1)).not.toThrow();
  expect(() => df.select("id", "value")).not.toThrow();

  // Test column access with mixed types
  const values = df.value;
  expect(values.length).toBe(3);
  expect(values[0]).toBe(10);
  expect(values[1]).toBe("20");
  expect(values[2]).toBe(null);

  console.log("✅ Type safety edge cases handled correctly");
});
