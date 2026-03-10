import { readXLSX } from "./read_xlsx.ts";
import { writeXLSX } from "./write_xlsx.ts";
import { createDataFrame } from "../dataframe/index.ts";
import { expect } from "@std/expect";
import { remove, test } from "@tidy-ts/shims";
import { z } from "zod";

test("datetime roundtrip - preserves time components across DST boundary", async () => {
  const df = createDataFrame([
    { name: "Alice", event_date: new Date(2025, 0, 15, 14, 30, 45) },
    { name: "Bob", event_date: new Date(2025, 6, 1, 8, 15, 0) },
  ]);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(df, tempPath);

    const schema = z.object({
      name: z.string(),
      event_date: z.date(),
    });
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(2);
    const rows = reloaded.toArray();

    // Alice: 2025-01-15 14:30:45 (standard time)
    expect(rows[0].name).toBe("Alice");
    expect(rows[0].event_date.getFullYear()).toBe(2025);
    expect(rows[0].event_date.getMonth()).toBe(0);
    expect(rows[0].event_date.getDate()).toBe(15);
    expect(rows[0].event_date.getHours()).toBe(14);
    expect(rows[0].event_date.getMinutes()).toBe(30);
    expect(rows[0].event_date.getSeconds()).toBe(45);

    // Bob: 2025-07-01 08:15:00 (daylight saving time)
    expect(rows[1].name).toBe("Bob");
    expect(rows[1].event_date.getFullYear()).toBe(2025);
    expect(rows[1].event_date.getMonth()).toBe(6);
    expect(rows[1].event_date.getDate()).toBe(1);
    expect(rows[1].event_date.getHours()).toBe(8);
    expect(rows[1].event_date.getMinutes()).toBe(15);
    expect(rows[1].event_date.getSeconds()).toBe(0);
  } finally {
    await remove(tempPath);
  }
});

test("datetime roundtrip - date-only values stay at midnight", async () => {
  const df = createDataFrame([
    { id: 1, date: new Date(2025, 2, 15) },
    { id: 2, date: new Date(2025, 11, 25) },
  ]);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(df, tempPath);

    const schema = z.object({ id: z.number(), date: z.date() });
    const reloaded = await readXLSX(tempPath, schema);

    const rows = reloaded.toArray();
    for (const row of rows) {
      expect(row.date.getHours()).toBe(0);
      expect(row.date.getMinutes()).toBe(0);
      expect(row.date.getSeconds()).toBe(0);
    }

    expect(rows[0].date.getFullYear()).toBe(2025);
    expect(rows[0].date.getMonth()).toBe(2);
    expect(rows[0].date.getDate()).toBe(15);

    expect(rows[1].date.getFullYear()).toBe(2025);
    expect(rows[1].date.getMonth()).toBe(11);
    expect(rows[1].date.getDate()).toBe(25);
  } finally {
    await remove(tempPath);
  }
});
