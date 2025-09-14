import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("writeCSV() basic functionality", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ]);

  const tempFile = "./test-basic.csv";
  df.writeCSV(tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toBe("id,name,age\r\n1,Alice,30\r\n2,Bob,25\r\n");

  Deno.removeSync(tempFile);
});

Deno.test("writeCSV() no options needed", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const tempFile = "./test-simple.csv";
  df.writeCSV(tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toBe("id,name\r\n1,Alice\r\n2,Bob\r\n");

  Deno.removeSync(tempFile);
});

Deno.test("writeCSV() chaining works", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ]);

  const tempFile = "./test-chaining.csv";

  const result = df
    .writeCSV(tempFile)
    .mutate({ doubleAge: (row) => row.age * 2 })
    .filter((row) => row.doubleAge > 50);

  expect(result.nrows()).toBe(1);
  expect(result[0].name).toBe("Alice");
  expect(result[0].doubleAge).toBe(60);

  expect(Deno.statSync(tempFile).isFile).toBe(true);
  Deno.removeSync(tempFile);
});

Deno.test("writeCSV() empty DataFrame", () => {
  const emptyDf = createDataFrame([]);
  const tempFile = "./test-empty.csv";

  emptyDf.writeCSV(tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toBe("");

  Deno.removeSync(tempFile);
});

Deno.test("writeCSV() with special characters", () => {
  const df = createDataFrame([
    { name: "Alice, Smith", description: 'He said "Hello"' },
    { name: "Bob\nJohnson", description: "Line\nbreak" },
  ]);

  const tempFile = "./test-special.csv";
  df.writeCSV(tempFile);

  const content = Deno.readTextFileSync(tempFile);
  expect(content).toContain('"Alice, Smith"');
  expect(content).toContain('"He said ""Hello"""');
  expect(content).toContain('"Bob\nJohnson"');

  Deno.removeSync(tempFile);
});
