# Time Series

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [downsample](#downsample)
- [upsample](#upsample)

---

## downsample

Downsample time-series data by aggregating high-frequency data to lower frequency (e.g., hourly → daily). Groups rows by time buckets and applies aggregation functions. The time column must be of type Date (or Date | null).

### Signature

```typescript
downsample({ timeColumn, frequency, aggregations, startDate?, endDate? }): DataFrame<...>
```

### Import

```typescript
import { createDataFrame, stats } from "@tidy-ts/dataframe";
```

### Parameters

- timeColumn: Name of the Date column to use for downsampling
- frequency: Target frequency string or object:
-   - Seconds: '1S', '5S', '15S', '30S'
-   - Minutes: '1min', '5min', '15min', '30min'
-   - Hours: '1H', '6H', '12H'
-   - Days: '1D', '7D'
-   - Weeks: '1W'
-   - Months: '1M'
-   - Quarters: '1Q'
-   - Years: '1Y'
-   - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }
- aggregations: Object mapping column names to aggregation functions:
-   - Use stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last
-   - Can create new columns (e.g., { open: stats.first, high: stats.max, low: stats.min, close: stats.last })
- startDate: Optional start date for downsampling period
- endDate: Optional end date for downsampling period

### Returns

DataFrame with downsampled data

### Examples

```typescript
// Downsample hourly to daily
const hourly = createDataFrame([
  { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },
  { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },
  { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },
  { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },
]);
const daily = hourly.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    price: stats.mean,
    volume: stats.sum
  }
})
// Result: 2 rows (one per day)
// Day 1: price = 110 (mean of 100, 110, 120), volume = 60 (sum of 10, 20, 30)
// Day 2: price = 130, volume = 40
// Downsample with OHLC pattern (Open, High, Low, Close)
const ohlc = df.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    open: stats.first,  // First price in period
    high: stats.max,    // Highest price
    low: stats.min,     // Lowest price
    close: stats.last   // Last price
  }
})
// Works with grouped DataFrames
const result = df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    price: stats.mean
  }
})
// With date range
const result = df.downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: stats.mean },
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-31")
})
// Grouping behavior: without startDate, each group starts from its own first data point
const df = createDataFrame([
  { symbol: "AAPL", timestamp: new Date("2023-01-05T10:00:00"), price: 100 },
  { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00"), price: 200 },
]);
const result = df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: stats.mean }
});
// AAPL starts from 2023-01-05, GOOG starts from 2023-01-01
// Grouping behavior: with startDate, all groups align to same startDate
// Groups that start after startDate will have null/NaN for empty buckets
const result = df.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: { price: stats.mean },
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-10")
});
// Both AAPL and GOOG will have buckets starting from 2023-01-01
// AAPL will have null/NaN for 2023-01-01 through 2023-01-04
```

### Best Practices

- ✓ GOOD: Use for converting from higher to lower frequency (e.g., hourly → daily)
- ✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this
- ✓ GOOD: Use aggregation functions like stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last
- ✓ GOOD: Preserves grouping when called on grouped DataFrames
- ✓ GOOD: Can create new columns during downsampling (e.g., OHLC pattern)
- ✓ GOOD: Use startDate/endDate to define explicit time ranges
- ✓ GROUPING BEHAVIOR - without startDate: Each group starts from its own first data point
- ✓ GROUPING BEHAVIOR - with startDate: All groups align to the same startDate. Buckets before a group's first data point will have empty arrays [] which aggregate to null/NaN
- ✓ EMPTY BUCKETS: Buckets with no data receive empty arrays [] passed to aggregation functions, which typically return null/NaN. This is NOT forward-filled automatically
- ✓ CUSTOM AGGREGATION: Can use custom functions like (values: unknown[]) => { return values.length > 0 ? stats.mean(values) : 0 } to handle empty buckets

### Anti-patterns

- ❌ BAD: Using non-Date column for timeColumn - TypeScript will error
- ❌ BAD: Using for upsampling - use upsample() instead

### Related

`upsample`, `groupBy`, `summarize`, `fillForward`, `fillBackward`

---

## upsample

Upsample time-series data by filling low-frequency data to higher frequency (e.g., daily → hourly). Generates a complete time sequence and fills missing values using forward or backward fill.

### Signature

```typescript
upsample({ timeColumn, frequency, fillMethod, startDate?, endDate? }): DataFrame<...>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- timeColumn: Name of the Date column to use for upsampling
- frequency: Target frequency string or object:
-   - Seconds: '1S', '5S', '15S', '30S'
-   - Minutes: '1min', '5min', '15min', '30min'
-   - Hours: '1H', '6H', '12H'
-   - Days: '1D', '7D'
-   - Weeks: '1W'
-   - Months: '1M'
-   - Quarters: '1Q'
-   - Years: '1Y'
-   - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }
- fillMethod: Fill strategy for missing values:
-   - 'forward': Carry forward the last known value (forward fill)
-   - 'backward': Use the next known value (backward fill)
- startDate: Optional start date for upsampling period
- endDate: Optional end date for upsampling period

### Returns

DataFrame with upsampled data

### Examples

```typescript
// Upsample daily to hourly with forward fill
const daily = createDataFrame([
  { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
  { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },
]);
const hourly = daily.upsample({
  timeColumn: "timestamp",
  frequency: "1H",
  fillMethod: "forward"
})
// Result: 3 rows (10:00, 11:00, 12:00)
// 10:00: value = 100
// 11:00: value = 100 (forward filled)
// 12:00: value = 200
// Upsample with backward fill
const hourly = daily.upsample({
  timeColumn: "timestamp",
  frequency: "1H",
  fillMethod: "backward"
})
// With date range
const result = df.upsample({
  timeColumn: "timestamp",
  frequency: "6H",
  fillMethod: "forward",
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-31")
})
// Grouping behavior: without startDate, each group starts from its own first data point
const df = createDataFrame([
  { symbol: "AAPL", timestamp: new Date("2023-01-05T00:00:00"), price: 100 },
  { symbol: "GOOG", timestamp: new Date("2023-01-01T00:00:00"), price: 200 },
]);
const result = df.groupBy("symbol").upsample({
  timeColumn: "timestamp",
  frequency: "1D",
  fillMethod: "forward"
});
// AAPL starts from 2023-01-05, GOOG starts from 2023-01-01
// Grouping behavior: with startDate, all groups align to same startDate
// Missing values before first data point will be null (not filled)
const result = df.groupBy("symbol").upsample({
  timeColumn: "timestamp",
  frequency: "1D",
  fillMethod: "forward",
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-01-10")
});
// Both AAPL and GOOG will have buckets starting from 2023-01-01
// AAPL will have null for 2023-01-01 through 2023-01-04 (no value to fill from)
```

### Best Practices

- ✓ GOOD: Use for converting from lower to higher frequency (e.g., daily → hourly)
- ✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this
- ✓ GOOD: Forward fill is most common - carries last known value forward
- ✓ GOOD: Backward fill uses next known value - useful for looking ahead
- ✓ GOOD: Use startDate/endDate to define explicit time ranges
- ✓ GROUPING BEHAVIOR - without startDate: Each group starts from its own first data point
- ✓ GROUPING BEHAVIOR - with startDate: All groups align to the same startDate. Values before a group's first data point will be null (cannot fill from non-existent data)
- ✓ FILL LIMITATIONS: Forward fill cannot fill values that come before the first data point. Backward fill cannot fill values after the last data point

### Anti-patterns

- ❌ BAD: Using non-Date column for timeColumn - TypeScript will error
- ❌ BAD: Using for downsampling - use downsample() instead

### Related

`downsample`, `fillForward`, `fillBackward`

---
