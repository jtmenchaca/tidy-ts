---
name: dataframe-time-series
description: downsample (aggregate to lower frequency) and upsample (expand to higher frequency with fill). Time column must be Date.
metadata:
  tags: dataframe, time-series, downsample, upsample, frequency
---

# Time series resampling

Tidy-ts has two distinct functions:

- **`downsample`** — aggregate high-frequency → low-frequency (e.g. hourly → daily). Requires aggregation functions.
- **`upsample`** — expand low-frequency → high-frequency (e.g. daily → hourly). Requires a fill method.

The time column accepts JS `Date` or any `Temporal.*` type (`Instant`, `ZonedDateTime`, `PlainDate`, `PlainDateTime`). Use `z.date()` for JS `Date`, or `zPlainDateTime` / `zInstant` / `zPlainDate` / `zZonedDateTime` from `@tidy-ts/shims` for Temporal types when reading via `readCSV` / `readXLSX`. **The output time column is the same type as the input** — e.g. `Temporal.Instant` in → `Temporal.Instant` out (in the same time zone for `ZonedDateTime`). `PlainTime` is rejected (no date component).

## Frequency

Three accepted shapes. Prefer `Temporal.Duration` when working with Temporal time columns — it's unambiguous and composes with the rest of the Temporal API.

```typescript
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

// Temporal.Duration — recommended
df.downsample({ timeColumn: "ts", frequency: Temporal.Duration.from({ minutes: 5 }), aggregations: { ... } });
df.downsample({ timeColumn: "ts", frequency: Temporal.Duration.from({ hours: 1 }), aggregations: { ... } });
df.downsample({ timeColumn: "ts", frequency: Temporal.Duration.from({ days: 1 }), aggregations: { ... } });
df.downsample({ timeColumn: "ts", frequency: Temporal.Duration.from({ months: 1 }), aggregations: { ... } });

// Convenience strings
df.downsample({ timeColumn: "ts", frequency: "5min", aggregations: { ... } });   // 5 minutes
df.downsample({ timeColumn: "ts", frequency: "1H",   aggregations: { ... } });   // 1 hour
df.downsample({ timeColumn: "ts", frequency: "1D",   aggregations: { ... } });   // 1 day
df.downsample({ timeColumn: "ts", frequency: "1M",   aggregations: { ... } });   // 1 month
df.downsample({ timeColumn: "ts", frequency: "1Y",   aggregations: { ... } });   // 1 year

// Raw milliseconds — for unusual buckets
df.downsample({ timeColumn: "ts", frequency: 45 * 60 * 1000, aggregations: { ... } });  // 45 min
```

| String                              | Equivalent `Temporal.Duration`                  |
|-------------------------------------|-------------------------------------------------|
| `"1S"`, `"5S"`, `"30S"`             | `{ seconds: 1 }` / `{ seconds: 5 }` etc.        |
| `"1min"`, `"5min"`, `"15min"`       | `{ minutes: 1 }` etc.                           |
| `"1H"`, `"6H"`, `"12H"`             | `{ hours: 1 }` etc.                             |
| `"1D"`, `"7D"`                      | `{ days: 1 }` etc.                              |
| `"1W"`                              | `{ weeks: 1 }`                                  |
| `"1M"`                              | `{ months: 1 }` *(calendar-aware on Temporal types)* |
| `"1Y"`                              | `{ years: 1 }` *(calendar-aware on Temporal types)* |

Quarters are expressed as `Temporal.Duration.from({ months: 3 })` (or `"3M"`). There is no `"1Q"` shape.

## downsample (aggregate)

### Aggregation shape

**Every entry in `aggregations` is `{ column, fn }`.** The key is the output column name; `column` is the source column to read; `fn` is the aggregator applied to that column's values within each bucket. There is no shorthand — a plain function is rejected (compile error and runtime throw) so there is no implicit "key matches a column" magic or fallback to "the first numeric column".

```typescript
import { createDataFrame, stats } from "@tidy-ts/dataframe";

// Hourly → daily
hourly.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    price:  { column: "price",  fn: stats.mean },
    volume: { column: "volume", fn: stats.sum },
  },
});

// OHLC: multiple outputs from one source column
df.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    open:  { column: "price", fn: stats.first },
    high:  { column: "price", fn: stats.max },
    low:   { column: "price", fn: stats.min },
    close: { column: "price", fn: stats.last },
  },
});

// Per-symbol
df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: { column: "price", fn: stats.mean } },
});

// Explicit date range
df.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: { column: "price", fn: stats.mean } },
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-31"),
});
```

### Empty bucket behavior

Buckets with no data invoke `fn` with `[]`. Most `stats.*` return `null` / `NaN` for empty arrays. Buckets are **not** automatically forward-filled. For custom handling, write the fn inline:

```typescript
aggregations: {
  price: {
    column: "price",
    fn: (values) => values.length > 0 ? stats.mean(values) : 0,
  },
}
```

### Grouping × startDate behavior

- Without `startDate`: each group starts from its own first data point.
- With `startDate`: all groups align to the same start; buckets before a group's first data point have empty arrays.

## upsample (expand)

```typescript
// Daily → hourly with forward fill
daily.upsample({
  timeColumn: "timestamp",
  frequency: "1H",
  fillMethod: "forward",        // or "backward"
});

// Explicit range
df.upsample({
  timeColumn: "timestamp",
  frequency: "6H",
  fillMethod: "forward",
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-31"),
});
```

Forward fill cannot fill values that come before the first data point; backward fill cannot fill after the last.

## Complete workflow (fill, then aggregate)

```typescript
const dailyData = createDataFrame([
  { date: new Date("2023-01-01"), sales: 100 },
  { date: new Date("2023-01-02"), sales: 150 },
  { date: new Date("2023-01-03"), sales: null }, // missing
  { date: new Date("2023-01-04"), sales: 120 },
  { date: new Date("2023-01-07"), sales: 200 },
]);

const filled = dailyData.fillForward("sales");

const weekly = filled.downsample({
  timeColumn: "date",
  frequency: "1W",
  aggregations: { sales: { column: "sales", fn: stats.sum } },
});
```

## Anti-patterns

- ❌ Plain function in `aggregations` (e.g. `price: stats.mean`) — must be `{ column: "price", fn: stats.mean }`. TypeScript rejects the shorthand; the runtime throws.
- ❌ Non-`Date` column passed as `timeColumn` — TypeScript will reject.
- ❌ Using `downsample` for upsampling or vice versa — they are separate functions.
- ❌ Assuming empty buckets get filled automatically during downsample — they don't.
