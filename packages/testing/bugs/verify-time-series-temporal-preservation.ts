import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

function header(label: string) {
  console.log("\n=== " + label + " ===");
}

// Case 1: JS Date input
header("downsample: Date → Date");
{
  const df = createDataFrame([
    { ts: new Date("2024-03-04T09:00:00Z"), price: 10 },
    { ts: new Date("2024-03-04T10:00:00Z"), price: 11 },
    { ts: new Date("2024-03-05T09:00:00Z"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1D",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0));
}

// Case 2: Instant input
header("downsample: Instant → Instant");
{
  const df = createDataFrame([
    { ts: Temporal.Instant.from("2024-03-04T09:00:00Z"), price: 10 },
    { ts: Temporal.Instant.from("2024-03-04T10:00:00Z"), price: 11 },
    { ts: Temporal.Instant.from("2024-03-05T09:00:00Z"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1D",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0));
}

// Case 3: PlainDateTime input
header("downsample: PlainDateTime → PlainDateTime");
{
  const df = createDataFrame([
    { ts: Temporal.PlainDateTime.from("2024-03-04T09:00:00"), price: 10 },
    { ts: Temporal.PlainDateTime.from("2024-03-04T10:00:00"), price: 11 },
    { ts: Temporal.PlainDateTime.from("2024-03-05T09:00:00"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1D",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0));
}

// Case 4: PlainDate input
header("downsample: PlainDate → PlainDate");
{
  const df = createDataFrame([
    { ts: Temporal.PlainDate.from("2024-03-04"), price: 10 },
    { ts: Temporal.PlainDate.from("2024-03-05"), price: 11 },
    { ts: Temporal.PlainDate.from("2024-03-06"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1D",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0));
}

// Case 5: ZonedDateTime input
header("downsample: ZonedDateTime → ZonedDateTime");
{
  const df = createDataFrame([
    { ts: Temporal.ZonedDateTime.from("2024-03-04T09:00:00-05:00[America/New_York]"), price: 10 },
    { ts: Temporal.ZonedDateTime.from("2024-03-04T10:00:00-05:00[America/New_York]"), price: 11 },
    { ts: Temporal.ZonedDateTime.from("2024-03-05T09:00:00-05:00[America/New_York]"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1D",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0));
}

// upsample equivalents
header("upsample: Date → Date");
{
  const df = createDataFrame([
    { ts: new Date("2024-03-04T00:00:00Z"), price: 10 },
    { ts: new Date("2024-03-04T06:00:00Z"), price: 11 },
  ]);
  const out = df.upsample({ timeColumn: "ts", frequency: "1H", fillMethod: "forward" });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0), "(", out.nrows(), "rows)");
}

header("upsample: Instant → Instant");
{
  const df = createDataFrame([
    { ts: Temporal.Instant.from("2024-03-04T00:00:00Z"), price: 10 },
    { ts: Temporal.Instant.from("2024-03-04T06:00:00Z"), price: 11 },
  ]);
  const out = df.upsample({ timeColumn: "ts", frequency: "1H", fillMethod: "forward" });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0), "(", out.nrows(), "rows)");
}

header("upsample: PlainDateTime → PlainDateTime");
{
  const df = createDataFrame([
    { ts: Temporal.PlainDateTime.from("2024-03-04T00:00:00"), price: 10 },
    { ts: Temporal.PlainDateTime.from("2024-03-04T06:00:00"), price: 11 },
  ]);
  const out = df.upsample({ timeColumn: "ts", frequency: "1H", fillMethod: "forward" });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0), "(", out.nrows(), "rows)");
}

header("upsample: ZonedDateTime → ZonedDateTime");
{
  const df = createDataFrame([
    { ts: Temporal.ZonedDateTime.from("2024-03-04T00:00:00-05:00[America/New_York]"), price: 10 },
    { ts: Temporal.ZonedDateTime.from("2024-03-04T06:00:00-05:00[America/New_York]"), price: 11 },
  ]);
  const out = df.upsample({ timeColumn: "ts", frequency: "1H", fillMethod: "forward" });
  const t0 = out.ts[0];
  console.log("class:", t0.constructor.name, "value:", String(t0), "(", out.nrows(), "rows)");
}
