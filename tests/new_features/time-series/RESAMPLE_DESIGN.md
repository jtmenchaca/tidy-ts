# Ideal Developer Experience for Resampling

This document outlines the ideal API design for time-series resampling in tidy-ts, balancing simplicity, power, and consistency with existing patterns.

## 🎯 Design Principles

1. **Consistent with tidy-ts**: Follows method chaining, functional style
2. **Intuitive**: Clear, readable, self-documenting
3. **Flexible**: Handles both downsampling (aggregate) and upsampling (fill/interpolate)
4. **Type-safe**: Full TypeScript support
5. **Composable**: Works with existing verbs (filter, mutate, etc.)

---

## 📋 Proposed API Design

### Option 1: Method-Based (Recommended) ⭐

**Most intuitive, follows tidy-ts patterns**

```typescript
// Downsample: Hourly → Daily (aggregate)
const daily = df.resample("timestamp", "1D", {
  price: "mean",           // Simple string aggregation
  volume: "sum",
  high: "max",
  low: "min",
  open: "first",
  close: "last"
});

// Downsample: Daily → Weekly
const weekly = df.resample("timestamp", "1W", {
  sales: stats.sum,         // Function-based aggregation
  revenue: (group) => stats.mean(group.revenue),
  count: (group) => group.nrows()
});

// Upsample: Daily → Hourly (forward fill)
const hourly = df.resample("timestamp", "1H", {
  method: "forward"        // or "backward", "interpolate"
});

// Upsample: Daily → Hourly (with custom fill)
const hourly2 = df.resample("timestamp", "1H", {
  price: "forward",
  volume: 0                // Fill with constant
});

// Custom frequency: 15-minute intervals
const quarterHourly = df.resample("timestamp", "15min", {
  value: "mean"
});

// With grouping: Resample per symbol
const resampled = df
  .groupBy("symbol")
  .resample("timestamp", "1D", {
    price: "last",
    volume: "sum"
  });
```

**Pros:**
- ✅ Very intuitive and readable
- ✅ Consistent with `groupBy().summarize()` pattern
- ✅ Type-safe column names
- ✅ Supports both simple strings and functions
- ✅ Handles upsampling naturally

**Cons:**
- ⚠️ Requires new method implementation

---

### Option 2: Helper Function-Based

**More functional, less method chaining**

```typescript
import { resample } from "@tidy-ts/dataframe";

// Downsample
const daily = resample(df, "timestamp", "1D", {
  price: "mean",
  volume: "sum"
});

// Upsample
const hourly = resample(df, "timestamp", "1H", {
  method: "forward"
});
```

**Pros:**
- ✅ Functional style
- ✅ Can be used in pipelines

**Cons:**
- ❌ Less discoverable (not on DataFrame)
- ❌ Doesn't feel as "tidy-ts-like"

---

### Option 3: Hybrid (Method + Helper)

**Method for DataFrame, helper for advanced use cases**

```typescript
// Simple case: method
const daily = df.resample("timestamp", "1D", { price: "mean" });

// Advanced case: helper function
const custom = resample(df, "timestamp", {
  frequency: "1D",
  aggregations: { price: "mean" },
  start: new Date("2023-01-01"),
  end: new Date("2023-12-31"),
  closed: "left",
  label: "left"
});
```

**Pros:**
- ✅ Best of both worlds
- ✅ Simple for common cases
- ✅ Powerful for advanced cases

**Cons:**
- ⚠️ Two APIs to learn

---

## 🏆 Recommended: Option 1 (Method-Based)

### Full API Specification

```typescript
// Method signature
df.resample<T>(
  timeColumn: keyof T,
  frequency: Frequency,
  options: ResampleOptions<T>
): DataFrame<ResampledRow<T>>

// Frequency types
type Frequency = 
  | "1S" | "5S" | "15S" | "30S"      // Seconds
  | "1min" | "5min" | "15min" | "30min" | "1H"  // Minutes/Hours
  | "1D" | "1W" | "1M" | "1Q" | "1Y"  // Days/Weeks/Months/Quarters/Years
  | number                              // Custom milliseconds
  | {                                    // Advanced frequency
      value: number;
      unit: "ms" | "s" | "min" | "h" | "d" | "w" | "M" | "Q" | "Y";
    };

// Resample options
type ResampleOptions<T> = 
  // Downsampling (aggregate)
  | {
      [K in keyof T]?: AggregationFunction<T, K> | string;
    }
  // Upsampling (fill/interpolate)
  | {
      method?: "forward" | "backward" | "interpolate" | "nearest";
      [K in keyof T]?: "forward" | "backward" | "interpolate" | number | null;
    }
  // Mixed (some columns aggregate, some fill)
  | {
      [K in keyof T]?: AggregationFunction<T, K> | string | "forward" | "backward" | "interpolate" | number | null;
    };

// Aggregation function
type AggregationFunction<T, K extends keyof T> = 
  | ((group: GroupedDataFrame<T>) => unknown)
  | "mean" | "sum" | "min" | "max" | "first" | "last" | "count";
```

---

## 📚 Usage Examples

### Example 1: Simple Downsampling (Most Common)

```typescript
// Stock prices: Minute → Hourly
const hourly = df.resample("timestamp", "1H", {
  price: "last",        // Last price in hour (closing price)
  volume: "sum",        // Total volume
  high: "max",          // Highest price
  low: "min"            // Lowest price
});
```

### Example 2: Downsampling with Custom Aggregations

```typescript
// Sales data: Daily → Weekly
const weekly = df.resample("timestamp", "1W", {
  sales: stats.sum,
  revenue: stats.sum,
  avg_order_value: (group) => stats.sum(group.revenue) / stats.sum(group.orders),
  customer_count: (group) => stats.uniqueCount(group.customer_id)
});
```

### Example 3: Upsampling with Forward Fill

```typescript
// Daily data → Hourly (carry forward last value)
const hourly = df.resample("timestamp", "1H", {
  method: "forward"  // Applies to all columns
});

// Or per-column
const hourly2 = df.resample("timestamp", "1H", {
  price: "forward",
  volume: 0,         // Fill with zero
  status: null       // Fill with null
});
```

### Example 4: Upsampling with Interpolation

```typescript
// Temperature data: Hourly → 15-minute (interpolate)
const quarterHourly = df.resample("timestamp", "15min", {
  temperature: "interpolate",
  humidity: "forward"  // Different method per column
});
```

### Example 5: With Grouping

```typescript
// Resample per symbol (common in financial data)
const resampled = df
  .groupBy("symbol")
  .resample("timestamp", "1D", {
    price: "last",
    volume: "sum"
  });
```

### Example 6: Custom Frequency

```typescript
// 15-minute intervals
const custom = df.resample("timestamp", "15min", {
  value: "mean"
});

// Or explicit
const custom2 = df.resample("timestamp", { value: 15, unit: "min" }, {
  value: "mean"
});
```

### Example 7: Mixed Aggregation and Fill

```typescript
// Some columns aggregate, some fill
const mixed = df.resample("timestamp", "1H", {
  price: "last",        // Aggregate
  volume: "sum",        // Aggregate
  status: "forward",    // Fill
  metadata: null        // Fill with null
});
```

---

## 🔄 Comparison with Current Approach

### Current (Manual):
```typescript
const result = df
  .mutate({
    day: (row) => row.timestamp.toISOString().split("T")[0],
  })
  .groupBy("day")
  .summarize({
    avg_price: (g) => stats.mean(g.price),
    total_volume: (g) => stats.sum(g.volume),
  });
```

### Proposed (Resample):
```typescript
const result = df.resample("timestamp", "1D", {
  price: "mean",
  volume: "sum"
});
```

**Benefits:**
- ✅ 3 lines → 1 line
- ✅ No manual date string manipulation
- ✅ More readable and intent-clear
- ✅ Handles edge cases (timezone, DST, etc.)
- ✅ Supports upsampling naturally

---

## 🎨 Frequency String Reference

| String | Meaning | Example |
|--------|---------|---------|
| `"1S"` | 1 second | Tick data |
| `"5S"` | 5 seconds | High-frequency data |
| `"15S"` | 15 seconds | Sensor data |
| `"1min"` | 1 minute | Stock prices |
| `"5min"` | 5 minutes | Trading data |
| `"15min"` | 15 minutes | Common interval |
| `"30min"` | 30 minutes | Common interval |
| `"1H"` | 1 hour | Hourly data |
| `"1D"` | 1 day | Daily data |
| `"1W"` | 1 week | Weekly data |
| `"1M"` | 1 month | Monthly data |
| `"1Q"` | 1 quarter | Quarterly data |
| `"1Y"` | 1 year | Yearly data |

---

## 🚀 Implementation Considerations

### 1. Frequency Parsing
- Parse frequency strings into milliseconds
- Handle edge cases (DST, month boundaries, etc.)
- Support custom frequencies

### 2. Downsampling (Aggregation)
- Group rows by time buckets
- Apply aggregation functions per bucket
- Handle empty buckets (optional: include with nulls)

### 3. Upsampling (Fill/Interpolate)
- Generate time sequence for target frequency
- Fill missing values using specified method
- Handle edge cases (start/end of data)

### 4. Performance
- Efficient grouping by time buckets
- Optimize for common frequencies
- Support large datasets

### 5. Type Safety
- Infer result types from aggregations
- Type-safe column names
- Preserve grouping structure

---

## 📝 Alternative: Simpler API (If Full Implementation is Complex)

If full resampling is too complex initially, we could start with a simpler helper:

```typescript
// Simple helper function
import { resample } from "@tidy-ts/dataframe";

// Downsample only
const daily = resample(df, "timestamp", "1D", {
  price: "mean",
  volume: "sum"
});

// Uses groupBy internally but handles date grouping automatically
```

This could be implemented as:
```typescript
function resample<T>(
  df: DataFrame<T>,
  timeColumn: keyof T,
  frequency: Frequency,
  aggregations: Record<string, AggregationFunction>
) {
  return df
    .mutate({
      _resample_key: (row) => {
        // Convert timestamp to frequency bucket
        return toFrequencyBucket(row[timeColumn], frequency);
      }
    })
    .groupBy("_resample_key")
    .summarize(aggregations)
    .drop("_resample_key");
}
```

---

## ✅ Recommendation

**Start with Option 1 (Method-Based)** because:
1. Most intuitive and discoverable
2. Consistent with tidy-ts patterns (`groupBy`, `mutate`, etc.)
3. Handles both downsampling and upsampling
4. Type-safe and composable
5. Can be implemented incrementally (downsample first, then upsample)

**Implementation Phases:**
1. **Phase 1**: Basic downsampling with string aggregations (`"mean"`, `"sum"`, etc.)
2. **Phase 2**: Function-based aggregations
3. **Phase 3**: Upsampling with fill methods
4. **Phase 4**: Advanced features (custom frequencies, interpolation, etc.)

