import { createDataFrame } from "../dataframe/index.ts";
import { writeXLSX } from "./write_xlsx.ts";
import { readXLSX } from "./read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

const TEST_FILE = "/tmp/test-multi-sheet.xlsx";

Deno.test("writeXLSX - single sheet with default name", async () => {
  const df = createDataFrame([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = await readXLSX(TEST_FILE, schema);

  expect(result.nrows()).toBe(2);
  const rows = result.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(rows[1].name).toBe("Bob");
});

Deno.test("writeXLSX - single sheet with custom name", async () => {
  const df = createDataFrame([
    { product: "Widget", price: 9.99 },
    { product: "Gadget", price: 19.99 },
  ]);

  await writeXLSX(df, TEST_FILE, { sheet: "Products" });

  const schema = z.object({
    product: z.string(),
    price: z.number(),
  });

  const result = await readXLSX(TEST_FILE, schema, { sheet: "Products" });

  expect(result.nrows()).toBe(2);
  const rows = result.toArray();
  expect(rows[0].product).toBe("Widget");
  expect(rows[1].product).toBe("Gadget");
});

Deno.test("writeXLSX - multiple sheets in same file", async () => {
  const users = createDataFrame([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ]);

  const products = createDataFrame([
    { product: "Widget", price: 9.99 },
    { product: "Gadget", price: 19.99 },
  ]);

  // Write first sheet
  await writeXLSX(users, TEST_FILE, { sheet: "Users" });

  // Write second sheet to same file
  await writeXLSX(products, TEST_FILE, { sheet: "Products" });

  // Read both sheets
  const userSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const productSchema = z.object({
    product: z.string(),
    price: z.number(),
  });

  const usersResult = await readXLSX(TEST_FILE, userSchema, { sheet: "Users" });
  const productsResult = await readXLSX(TEST_FILE, productSchema, {
    sheet: "Products",
  });

  expect(usersResult.nrows()).toBe(2);
  expect(productsResult.nrows()).toBe(2);

  const userRows = usersResult.toArray();
  expect(userRows[0].name).toBe("Alice");
  expect(userRows[1].name).toBe("Bob");

  const productRows = productsResult.toArray();
  expect(productRows[0].product).toBe("Widget");
  expect(productRows[1].product).toBe("Gadget");
});

Deno.test("writeXLSX - replace existing sheet", async () => {
  const df1 = createDataFrame([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ]);

  const df2 = createDataFrame([
    { name: "Charlie", age: 35 },
    { name: "David", age: 40 },
    { name: "Eve", age: 28 },
  ]);

  // Write initial data
  await writeXLSX(df1, TEST_FILE, { sheet: "Data" });

  // Replace with new data
  await writeXLSX(df2, TEST_FILE, { sheet: "Data" });

  // Read and verify
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = await readXLSX(TEST_FILE, schema, { sheet: "Data" });

  expect(result.nrows()).toBe(3);
  const rows = result.toArray();
  expect(rows[0].name).toBe("Charlie");
  expect(rows[1].name).toBe("David");
  expect(rows[2].name).toBe("Eve");
});

Deno.test("writeXLSX - three sheets in same file", async () => {
  const users = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const products = createDataFrame([
    { id: 101, product: "Widget" },
    { id: 102, product: "Gadget" },
  ]);

  const orders = createDataFrame([
    { order_id: 1001, user_id: 1, product_id: 101 },
    { order_id: 1002, user_id: 2, product_id: 102 },
  ]);

  // Write three sheets
  await writeXLSX(users, TEST_FILE, { sheet: "Users" });
  await writeXLSX(products, TEST_FILE, { sheet: "Products" });
  await writeXLSX(orders, TEST_FILE, { sheet: "Orders" });

  // Verify all three sheets
  const userSchema = z.object({ id: z.number(), name: z.string() });
  const productSchema = z.object({ id: z.number(), product: z.string() });
  const orderSchema = z.object({
    order_id: z.number(),
    user_id: z.number(),
    product_id: z.number(),
  });

  const usersResult = await readXLSX(TEST_FILE, userSchema, { sheet: "Users" });
  const productsResult = await readXLSX(TEST_FILE, productSchema, {
    sheet: "Products",
  });
  const ordersResult = await readXLSX(TEST_FILE, orderSchema, {
    sheet: "Orders",
  });

  expect(usersResult.nrows()).toBe(2);
  expect(productsResult.nrows()).toBe(2);
  expect(ordersResult.nrows()).toBe(2);

  const userRows = usersResult.toArray();
  expect(userRows[0].id).toBe(1);
  expect(userRows[1].id).toBe(2);
});

Deno.test("writeXLSX - preserve existing sheets when adding new", async () => {
  const sheet1 = createDataFrame([
    { col1: "A", col2: 1 },
    { col1: "B", col2: 2 },
  ]);

  const sheet2 = createDataFrame([
    { col1: "C", col2: 3 },
    { col1: "D", col2: 4 },
  ]);

  const sheet3 = createDataFrame([
    { col1: "E", col2: 5 },
    { col1: "F", col2: 6 },
  ]);

  // Write first sheet
  await writeXLSX(sheet1, TEST_FILE, { sheet: "First" });

  // Add second sheet
  await writeXLSX(sheet2, TEST_FILE, { sheet: "Second" });

  // Add third sheet
  await writeXLSX(sheet3, TEST_FILE, { sheet: "Third" });

  // Verify all three sheets still exist
  const schema = z.object({
    col1: z.string(),
    col2: z.number(),
  });

  const first = await readXLSX(TEST_FILE, schema, { sheet: "First" });
  const second = await readXLSX(TEST_FILE, schema, { sheet: "Second" });
  const third = await readXLSX(TEST_FILE, schema, { sheet: "Third" });

  expect(first.nrows()).toBe(2);
  expect(second.nrows()).toBe(2);
  expect(third.nrows()).toBe(2);

  const firstRows = first.toArray();
  expect(firstRows[0].col1).toBe("A");

  const secondRows = second.toArray();
  expect(secondRows[0].col1).toBe("C");

  const thirdRows = third.toArray();
  expect(thirdRows[0].col1).toBe("E");
});

Deno.test("writeXLSX - replace middle sheet preserves others", async () => {
  const sheet1 = createDataFrame([{ x: 1 }]);
  const sheet2 = createDataFrame([{ x: 2 }]);
  const sheet3 = createDataFrame([{ x: 3 }]);

  // Create three sheets
  await writeXLSX(sheet1, TEST_FILE, { sheet: "Sheet1" });
  await writeXLSX(sheet2, TEST_FILE, { sheet: "Sheet2" });
  await writeXLSX(sheet3, TEST_FILE, { sheet: "Sheet3" });

  // Replace middle sheet
  const newSheet2 = createDataFrame([{ x: 999 }]);
  await writeXLSX(newSheet2, TEST_FILE, { sheet: "Sheet2" });

  // Verify all sheets
  const schema = z.object({ x: z.number() });

  const s1 = await readXLSX(TEST_FILE, schema, { sheet: "Sheet1" });
  const s2 = await readXLSX(TEST_FILE, schema, { sheet: "Sheet2" });
  const s3 = await readXLSX(TEST_FILE, schema, { sheet: "Sheet3" });

  expect(s1.toArray()[0].x).toBe(1);
  expect(s2.toArray()[0].x).toBe(999); // Updated
  expect(s3.toArray()[0].x).toBe(3);
});
