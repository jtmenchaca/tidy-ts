import { createDataFrame, str } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tests/shims";

test("String Splitting with strSplit", () => {
  console.log("=== String Splitting (strSplit) ===");

  // Sample data with delimited text
  const delimitedData = createDataFrame([
    { text: "apple,banana,cherry,date" },
    { text: "red|green|blue|yellow" },
    { text: "first;second;third;fourth" },
    { text: "one\ttwo\tthree\tfour" },
    { text: "alpha beta gamma delta" },
  ]);

  console.log("Delimited text data:");
  delimitedData.print();

  // Split by different delimiters
  const splitData = delimitedData
    .mutate({
      comma_split: (row) => str.split(row.text, ","),
      pipe_split: (row) => str.split(row.text, "\\|"),
      semicolon_split: (row) => str.split(row.text, ";"),
      tab_split: (row) => str.split(row.text, "\\t"),
      space_split: (row) => str.split(row.text, "\\s+"),
    });

  console.log("\nSplit by different delimiters:");
  splitData.print();

  // Split with limit
  const limitedSplitData = delimitedData
    .mutate({
      limited_comma: (row) => str.split(row.text, ","),
      limited_pipe: (row) => str.split(row.text, "\\|"),
    });

  console.log("\nSplit with limits:");
  limitedSplitData.print();

  // Split and extract specific parts
  const extractedParts = delimitedData
    .mutate({
      first_item: (row) => str.split(row.text, ",")[0],
      last_item: (row) => {
        const parts = str.split(row.text, ",");
        return parts[parts.length - 1];
      },
      item_count: (row) => str.split(row.text, ",").length,
    });

  console.log("\nExtracting specific parts:");
  extractedParts.print();

  // Split complex delimiters
  const complexData = createDataFrame([
    { text: "Name: John Doe, Age: 30, City: New York" },
    { text: "Product: Widget, Price: $19.99, Category: Tools" },
    { text: "Status: Active, Last Login: 2024-01-15, Role: Admin" },
  ]);

  console.log("\nComplex delimited data:");
  complexData.print();

  const parsedComplex = complexData
    .mutate({
      key_value_pairs: (row) => str.split(row.text, ",\\s*"),
      name: (row) => str.extract(row.text, "Name:\\s*([^,]+)"),
      age: (row) => str.extract(row.text, "Age:\\s*(\\d+)"),
      city: (row) => str.extract(row.text, "City:\\s*([^,]+)"),
    });

  console.log("\nParsed complex data:");
  parsedComplex.print();

  // Test assertions
  expect(splitData.filter((row) => row.comma_split.length > 1).nrows())
    .toBe(1);
  expect(splitData.filter((row) => row.pipe_split.length > 1).nrows())
    .toBe(
      1,
    );
  expect(
    splitData.filter((row) => row.semicolon_split.length > 1).nrows(),
  )
    .toBe(1);
  expect(extractedParts.filter((row) => row.item_count > 1).nrows()).toBe(
    1,
  );
});
