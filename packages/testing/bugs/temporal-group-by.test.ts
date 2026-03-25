import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "temporal-polyfill";

const NativeTemporal = Temporal;

Deno.test("groupBy - PlainDate as grouping key (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 10 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 20 },
    { date: NativeTemporal.PlainDate.from("2024-01-02"), value: 30 },
  ]);

  const grouped = df.groupBy("date").summarize({
    total: (g) => {
      let sum = 0;
      for (const row of g) sum += row.value;
      return sum;
    },
  });

  expect(grouped.nrows()).toBe(2);
  const sorted = grouped.arrange("total");
  expect(sorted[0].total).toBe(30);
  expect(sorted[1].total).toBe(30);
});

Deno.test("groupBy - PlainDate as grouping key (polyfill)", () => {
  const df = createDataFrame([
    { date: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 10 },
    { date: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 20 },
    { date: PolyfillTemporal.PlainDate.from("2024-01-02"), value: 30 },
  ]);

  const grouped = df.groupBy("date").summarize({
    total: (g) => {
      let sum = 0;
      for (const row of g) sum += row.value;
      return sum;
    },
  });

  expect(grouped.nrows()).toBe(2);
});

Deno.test("groupBy - Instant as grouping key (native)", () => {
  const t1 = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  const t2 = NativeTemporal.Instant.from("2024-01-02T00:00:00Z");

  const df = createDataFrame([
    { ts: t1, value: 10 },
    { ts: t1, value: 20 },
    { ts: t2, value: 30 },
  ]);

  const grouped = df.groupBy("ts").summarize({
    total: (g) => {
      let sum = 0;
      for (const row of g) sum += row.value;
      return sum;
    },
  });

  expect(grouped.nrows()).toBe(2);
});

Deno.test("groupBy - PlainDateTime as grouping key (native)", () => {
  const dt1 = NativeTemporal.PlainDateTime.from("2024-01-01T08:00:00");
  const dt2 = NativeTemporal.PlainDateTime.from("2024-01-01T16:00:00");

  const df = createDataFrame([
    { dt: dt1, value: 10 },
    { dt: dt1, value: 20 },
    { dt: dt2, value: 30 },
  ]);

  const grouped = df.groupBy("dt").summarize({
    total: (g) => {
      let sum = 0;
      for (const row of g) sum += row.value;
      return sum;
    },
  });

  expect(grouped.nrows()).toBe(2);
});
