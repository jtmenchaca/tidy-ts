import { readXLSXMetadata } from "./read_xlsx.ts";
import { expect } from "@std/expect";
import { test } from "@tidy-ts/shims";

test("readXLSXMetadata - columnFormats detects date columns", async () => {
  const meta = await readXLSXMetadata(
    "packages/dataframe/ts/io/fixtures/date-boolean.xlsx",
  );

  expect(meta.columnFormats.length).toBe(3);

  const byCol = Object.fromEntries(
    meta.columnFormats.map((f) => [f.column, f]),
  );

  expect(byCol["id"].formatCode).toBe("General");
  expect(byCol["id"].numFmtId).toBe(0);

  expect(byCol["ok"].formatCode).toBe("General");
  expect(byCol["ok"].numFmtId).toBe(0);

  expect(byCol["when"].formatCode).toBe("mm-dd-yy");
  expect(byCol["when"].numFmtId).toBe(14);
});

test("readXLSXMetadata - columnFormats for non-date file", async () => {
  const meta = await readXLSXMetadata(
    "packages/dataframe/ts/io/fixtures/single-row.xlsx",
  );

  expect(meta.columnFormats.length).toBe(3);

  for (const fmt of meta.columnFormats) {
    expect(fmt.formatCode).toBe("General");
    expect(fmt.numFmtId).toBe(0);
  }
});

test("readXLSXMetadata - columnFormats distinguishes date vs datetime", async () => {
  const meta = await readXLSXMetadata(
    "packages/dataframe/ts/io/fixtures/mixed-types.xlsx",
  );

  expect(meta.columnFormats.length).toBe(6);

  const byCol = Object.fromEntries(
    meta.columnFormats.map((f) => [f.column, f]),
  );

  // Non-date columns
  expect(byCol["name"].formatCode).toBe("General");
  expect(byCol["age"].formatCode).toBe("General");
  expect(byCol["score"].formatCode).toBe("General");
  expect(byCol["active"].formatCode).toBe("General");

  // Date column (built-in format 14)
  expect(byCol["date"].formatCode).toBe("mm-dd-yy");
  expect(byCol["date"].numFmtId).toBe(14);

  // Datetime column (custom format)
  expect(byCol["datetime"].formatCode).toContain("h:mm");
  expect(byCol["datetime"].numFmtId).toBe(166);
});
