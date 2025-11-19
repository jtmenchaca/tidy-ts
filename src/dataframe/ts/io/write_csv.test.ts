import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { readTextFile, remove, stat, test } from "@tidy-ts/shims";
import { writeCSV } from "./write_csv.ts";

test("writeCSV() basic functionality", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ]);

  const tempFile = "./test-basic.csv";
  writeCSV(df, tempFile);

  const content = await readTextFile(tempFile);
  expect(content).toBe("id,name,age\r\n1,Alice,30\r\n2,Bob,25\r\n");

  await remove(tempFile);
});

test("writeCSV() no options needed", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const tempFile = "./test-simple.csv";
  writeCSV(df, tempFile);

  const content = await readTextFile(tempFile);
  expect(content).toBe("id,name\r\n1,Alice\r\n2,Bob\r\n");

  await remove(tempFile);
});

test("writeCSV() chaining works", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ]);

  const tempFile = "./test-chaining.csv";

  writeCSV(df, tempFile);

  const result = df
    .mutate({ doubleAge: (row) => row.age * 2 })
    .filter((row) => row.doubleAge > 50);

  expect(result.nrows()).toBe(1);
  expect(result[0].name).toBe("Alice");
  expect(result[0].doubleAge).toBe(60);

  expect((await stat(tempFile)).isFile).toBe(true);
  await remove(tempFile);
});

test("writeCSV() empty DataFrame", async () => {
  const emptyDf = createDataFrame([]);
  const tempFile = "./test-empty.csv";

  writeCSV(emptyDf, tempFile);

  const content = await readTextFile(tempFile);
  expect(content).toBe("");

  await remove(tempFile);
});

test("writeCSV() with special characters", async () => {
  const df = createDataFrame([
    { name: "Alice, Smith", description: 'He said "Hello"' },
    { name: "Bob\nJohnson", description: "Line\nbreak" },
  ]);

  const tempFile = "./test-special.csv";
  writeCSV(df, tempFile);

  const content = await readTextFile(tempFile);
  expect(content).toContain('"Alice, Smith"');
  expect(content).toContain('"He said ""Hello"""');
  expect(content).toContain('"Bob\nJohnson"');

  await remove(tempFile);
});
