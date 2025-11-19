import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { writeCSV } from "../../src/dataframe/ts/io/write_csv.ts";

Deno.test("writeCSV - handles undefined values in columns", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30, city: "NYC" },
    { id: 2, name: "Bob", age: undefined, city: "LA" },
    { id: 3, name: "Charlie", age: 25, city: undefined },
    { id: 4, name: undefined, age: 35, city: "Chicago" },
  ]);

  const tempFile = "./test-undefined.csv";

  // Should not throw when writing CSV with undefined values
  writeCSV(df, tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toContain("id,name,age,city");
  expect(content).toContain("Alice");
  expect(content).toContain("Bob");
  expect(content).toContain("Charlie");

  Deno.removeSync(tempFile);
});

Deno.test("writeCSV - handles null values in columns", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30, city: "NYC" },
    { id: 2, name: "Bob", age: null, city: "LA" },
    { id: 3, name: "Charlie", age: 25, city: null },
  ]);

  const tempFile = "./test-null.csv";
  writeCSV(df, tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toContain("id,name,age,city");

  Deno.removeSync(tempFile);
});

Deno.test("writeCSV - handles mixed null and undefined values", () => {
  const df = createDataFrame([
    { id: 1, value: 100, status: "active" },
    { id: 2, value: null, status: "pending" },
    { id: 3, value: undefined, status: "inactive" },
    { id: 4, value: 50, status: null },
    { id: 5, value: 75, status: undefined },
  ]);

  const tempFile = "./test-mixed.csv";
  writeCSV(df, tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toContain("id,value,status");

  Deno.removeSync(tempFile);
});
