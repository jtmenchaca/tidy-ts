import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("timeGroup() - group by day and aggregate", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: 100 },
    { timestamp: new Date("2023-01-01T14:00:00"), price: 110 },
    { timestamp: new Date("2023-01-02T10:00:00"), price: 120 },
    { timestamp: new Date("2023-01-02T14:00:00"), price: 130 },
  ]);

  const result = df
    .mutate({
      day: (row) => row.timestamp.toISOString().split("T")[0],
    })
    .groupBy("day")
    .summarize({
      avg_price: (g) => stats.mean(g.price),
      count: (g) => g.nrows(),
    })
    .print();

  expect(result.nrows()).toBe(2);
  expect(result[0].avg_price).toBe(105); // (100 + 110) / 2
  expect(result[1].avg_price).toBe(125); // (120 + 130) / 2
});

Deno.test("timeGroup() - group by hour", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 10 },
    { timestamp: new Date("2023-01-01T10:30:00"), value: 20 },
    { timestamp: new Date("2023-01-01T11:00:00"), value: 30 },
  ]);

  const result = df
    .mutate({
      hour: (row) => row.timestamp.getHours(),
    })
    .groupBy("hour")
    .summarize({
      sum_value: (g) => stats.sum(g.value),
    });

  expect(result.nrows()).toBe(2);
  expect(result[0].sum_value).toBe(30); // 10 + 20
  expect(result[1].sum_value).toBe(30);
});
