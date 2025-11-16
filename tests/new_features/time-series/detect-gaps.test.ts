import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("detectGaps() - identify missing time periods", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
    { timestamp: new Date("2023-01-01T10:05:00"), value: 110 },
    { timestamp: new Date("2023-01-01T10:20:00"), value: 120 }, // gap: 15 min
    { timestamp: new Date("2023-01-01T10:25:00"), value: 130 },
  ]);

  const expectedInterval = 5 * 60 * 1000; // 5 minutes
  const result = df.mutate({
    gap: (row, idx, df) => {
      if (idx === 0) return null;
      const diff = row.timestamp.getTime() - df[idx - 1].timestamp.getTime();
      return diff > expectedInterval ? diff : null;
    },
  });

  expect(result[0].gap).toBeNull();
  expect(result[1].gap).toBeNull();
  expect(result[2].gap).toBe(15 * 60 * 1000); // 15 minute gap
  expect(result[3].gap).toBeNull();
});

Deno.test("detectGaps() - filter rows with gaps", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
    { timestamp: new Date("2023-01-01T10:05:00"), value: 110 },
    { timestamp: new Date("2023-01-01T10:20:00"), value: 120 },
    { timestamp: new Date("2023-01-01T10:25:00"), value: 130 },
  ]);

  const expectedInterval = 5 * 60 * 1000;
  const gaps = df
    .mutate({
      gap: (row, idx, df) => {
        if (idx === 0) return null;
        const diff = row.timestamp.getTime() - df[idx - 1].timestamp.getTime();
        return diff > expectedInterval ? diff : null;
      },
    })
    .filter((row) => row.gap !== null)
    .print();

  expect(gaps.nrows()).toBe(1);
  expect(gaps[0].value).toBe(120);
});
