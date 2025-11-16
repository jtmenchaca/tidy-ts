import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("timeFilter() - filter by date range", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01"), price: 100 },
    { timestamp: new Date("2023-01-15"), price: 110 },
    { timestamp: new Date("2023-02-01"), price: 120 },
    { timestamp: new Date("2023-02-15"), price: 130 },
  ]);

  const start = new Date("2023-01-10");
  const end = new Date("2023-02-10");
  const filtered = df.filter(
    (row) => row.timestamp >= start && row.timestamp <= end,
  );

  expect(filtered.nrows()).toBe(2);
  expect(filtered[0].price).toBe(110);
  expect(filtered[1].price).toBe(120);
});

Deno.test("timeFilter() - filter last N days", () => {
  const now = new Date("2023-03-01");
  const df = createDataFrame([
    { timestamp: new Date("2023-02-20"), value: 10 },
    { timestamp: new Date("2023-02-25"), value: 20 },
    { timestamp: new Date("2023-03-01"), value: 30 },
  ]);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const filtered = df.filter((row) => row.timestamp >= sevenDaysAgo);

  expect(filtered.nrows()).toBe(2); // Feb 25 and March 1 are within 7 days
  expect(filtered[0].value).toBe(20);
  expect(filtered[1].value).toBe(30);
});
