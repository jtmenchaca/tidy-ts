import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("timeDiff() - calculate time differences between rows", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
    { timestamp: new Date("2023-01-01T10:05:00"), value: 110 },
    { timestamp: new Date("2023-01-01T10:15:00"), value: 120 },
  ]);

  const result = df.mutate({
    time_diff_ms: (row, idx, df) => {
      if (idx === 0) return null;
      return row.timestamp.getTime() - df[idx - 1].timestamp.getTime();
    },
  });

  expect(result[0].time_diff_ms).toBeNull();
  expect(result[1].time_diff_ms).toBe(5 * 60 * 1000); // 5 minutes
  expect(result[2].time_diff_ms).toBe(10 * 60 * 1000); // 10 minutes
});

Deno.test("timeDiff() - time since first observation", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
    { timestamp: new Date("2023-01-01T10:05:00"), value: 110 },
    { timestamp: new Date("2023-01-01T10:15:00"), value: 120 },
  ]);

  const firstTime = df[0].timestamp.getTime();
  const result = df.mutate({
    elapsed_ms: (row) => row.timestamp.getTime() - firstTime,
  });

  expect(result[0].elapsed_ms).toBe(0);
  expect(result[1].elapsed_ms).toBe(5 * 60 * 1000);
  expect(result[2].elapsed_ms).toBe(15 * 60 * 1000);
});
