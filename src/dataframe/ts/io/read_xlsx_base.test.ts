import { parseXLSXRaw } from "./read_xlsx.ts";
import { expect } from "@std/expect";

Deno.test("parseXLSXRaw - parse test-xlsx.xlsx", async () => {
  const data = await parseXLSXRaw("src/dataframe/ts/io/test-xlsx.xlsx");

  // Expected data structure:
  // test1, test2, test3
  // 1, a, apple
  // 2, b, banana
  // 3, c, apple
  // 4, d, banana
  // 5, e, apple
  // 6, f, banana
  // 7, h, apple
  // 8, i, banana
  // 9, j, apple
  // 10, k, banana

  expect(data.length).toBe(11); // 1 header + 10 data rows

  // Check headers
  expect(data[0]).toEqual(["test1", "test2", "test3"]);

  // Check first data row
  expect(data[1]).toEqual(["1", "a", "apple"]);

  // Check second data row
  expect(data[2]).toEqual(["2", "b", "banana"]);

  // Check last data row
  expect(data[10]).toEqual(["10", "k", "banana"]);

  // Verify alternating pattern in test3 column
  expect(data[1][2]).toBe("apple");
  expect(data[2][2]).toBe("banana");
  expect(data[3][2]).toBe("apple");
  expect(data[4][2]).toBe("banana");
});

Deno.test("parseXLSXRaw - single row", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
  );

  expect(data.length).toBe(2); // header + 1 data row
  expect(data[0]).toEqual(["name", "age", "city"]);
  expect(data[1][0]).toBe("Alice");
});

Deno.test("parseXLSXRaw - empty cells", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/empty-cells.xlsx",
  );

  expect(data.length).toBeGreaterThan(1);
  // Should handle empty cells
  expect(data[0]).toEqual(["col1", "col2", "col3", "col4"]);
});

Deno.test("parseXLSXRaw - mixed types", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/mixed-types.xlsx",
  );

  expect(data.length).toBe(4); // header + 3 data rows
  expect(data[0]).toEqual(["name", "age", "score", "active", "date"]);
  expect(data[1][0]).toBe("Alice");
  expect(data[1][1]).toBe("25"); // Numbers come as strings
});

Deno.test("parseXLSXRaw - wide table (30+ columns)", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/wide-table.xlsx",
  );

  expect(data.length).toBe(2); // header + 1 data row
  expect(data[0].length).toBeGreaterThan(25); // At least 26 columns (a-z)
  expect(data[0][0]).toBe("a");
  expect(data[0][25]).toBe("z");
});

Deno.test("parseXLSXRaw - large numbers", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/large-numbers.xlsx",
  );

  expect(data.length).toBeGreaterThan(1);
  expect(data[0]).toEqual(["id", "value", "scientific"]);
});

Deno.test("parseXLSXRaw - long strings", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/long-strings.xlsx",
  );

  expect(data.length).toBeGreaterThan(1);
  expect(data[0]).toEqual(["id", "description"]);
  // Should handle long text cells
  expect(data[1][1].length).toBeGreaterThan(50);
});

Deno.test("parseXLSXRaw - special characters", async () => {
  const data = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/special-chars.xlsx",
  );

  expect(data.length).toBeGreaterThan(1);
  expect(data[0]).toEqual(["text", "symbols", "unicode"]);
});

Deno.test("parseXLSXRaw - mtcars dataset", async () => {
  const data = await parseXLSXRaw("src/dataframe/ts/io/fixtures/mtcars.xlsx");

  expect(data.length).toBeGreaterThan(1);
  // mtcars has 12 columns (rowname + 11 variables)
  expect(data[0].length).toBe(12);
});

Deno.test("parseXLSXRaw - penguins dataset", async () => {
  const data = await parseXLSXRaw("src/dataframe/ts/io/fixtures/penguins.xlsx");

  expect(data.length).toBeGreaterThan(1);
  expect(data[0][0]).toBe("species");
});
