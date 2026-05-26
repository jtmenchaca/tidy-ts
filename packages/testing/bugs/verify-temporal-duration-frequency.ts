import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

function h(label: string) {
  console.log("\n=== " + label + " ===");
}

// === downsample with Temporal.Duration ===
h("downsample: Date column + Temporal.Duration({minutes: 5})");
{
  const df = createDataFrame([
    { ts: new Date("2024-03-04T09:00:00Z"), price: 10 },
    { ts: new Date("2024-03-04T09:03:00Z"), price: 11 },
    { ts: new Date("2024-03-04T09:06:00Z"), price: 12 },
    { ts: new Date("2024-03-04T09:08:00Z"), price: 13 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: Temporal.Duration.from({ minutes: 5 }),
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  console.log("rows:", out.nrows(), "first ts:", out.ts[0].toISOString());
}

h("downsample: Instant column + Temporal.Duration({hours: 1})");
{
  const df = createDataFrame([
    { ts: Temporal.Instant.from("2024-03-04T09:00:00Z"), price: 10 },
    { ts: Temporal.Instant.from("2024-03-04T09:30:00Z"), price: 11 },
    { ts: Temporal.Instant.from("2024-03-04T10:00:00Z"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: Temporal.Duration.from({ hours: 1 }),
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  console.log(
    "rows:",
    out.nrows(),
    "first ts:",
    out.ts[0].toString(),
    "class:",
    out.ts[0].constructor.name,
  );
}

h("downsample: PlainDate column + Temporal.Duration({months: 1})");
{
  const df = createDataFrame([
    { ts: Temporal.PlainDate.from("2024-01-15"), price: 10 },
    { ts: Temporal.PlainDate.from("2024-02-15"), price: 12 },
    { ts: Temporal.PlainDate.from("2024-03-15"), price: 14 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: Temporal.Duration.from({ months: 1 }),
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  console.log(
    "rows:",
    out.nrows(),
    "first ts:",
    out.ts[0].toString(),
    "class:",
    out.ts[0].constructor.name,
  );
}

h("upsample: Date column + Temporal.Duration({minutes: 30})");
{
  const df = createDataFrame([
    { ts: new Date("2024-03-04T09:00:00Z"), price: 10 },
    { ts: new Date("2024-03-04T11:00:00Z"), price: 20 },
  ]);
  const out = df.upsample({
    timeColumn: "ts",
    frequency: Temporal.Duration.from({ minutes: 30 }),
    fillMethod: "forward",
  });
  console.log("rows:", out.nrows());
}

h("downsample: existing string shape still works ('1H')");
{
  const df = createDataFrame([
    { ts: new Date("2024-03-04T09:00:00Z"), price: 10 },
    { ts: new Date("2024-03-04T09:30:00Z"), price: 11 },
    { ts: new Date("2024-03-04T10:00:00Z"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1H",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  console.log("rows:", out.nrows());
}
