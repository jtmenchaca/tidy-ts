# Time-Series Data Cleaning - Test Plan

## Overview
This document outlines common time-series data cleaning operations and prioritizes test files to create.

## Priority 1: Core Operations (Already Implemented)
These operations exist and need minimal test examples:

### ✅ 1. asof-join.test.ts
**Status**: Implemented, needs minimal examples
**Use Cases**:
- Join trades to nearest prior quotes (backward)
- Join events to future measurements (forward)
- Join with tolerance (within time window)
- Join with grouping (by symbol/category)

### ✅ 2. lag-lead.test.ts
**Status**: Implemented, needs minimal examples
**Use Cases**:
- Compare current value to previous (lag)
- Compare current value to next (lead)
- Calculate period-over-period changes
- Use with grouped time series

### ✅ 3. fill-forward-backward.test.ts
**Status**: Implemented, needs minimal examples
**Use Cases**:
- Forward fill missing prices/values
- Backward fill missing values
- Handle gaps in time series
- Fill within groups

## Priority 2: Common Time-Series Operations (Need Implementation)

### 4. time-filter.test.ts
**Use Cases**:
- Filter by date range: `df.filter(row => row.date >= start && row.date <= end)`
- Filter by time window: last N days, last N hours
- Filter by time of day: business hours, specific hours
- Filter by day of week: weekdays only, weekends only
- Filter by month/quarter: specific periods

**Example**:
```ts
// Filter last 7 days
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
df.filter(row => row.timestamp >= weekAgo)
```

### 5. time-diff.test.ts
**Use Cases**:
- Calculate time differences between consecutive rows
- Calculate time since first/last observation
- Calculate time until next observation
- Time differences within groups

**Example**:
```ts
df.mutate({
  time_diff: (row, idx, df) => {
    if (idx === 0) return null;
    return row.timestamp - df[idx - 1].timestamp;
  }
})
```

### 6. time-group.test.ts
**Use Cases**:
- Group by time periods: hour, day, week, month, quarter, year
- Group by custom periods: 15-minute intervals, business days
- Aggregate within time groups
- Handle timezone-aware grouping

**Example**:
```ts
df.mutate({
  hour: (row) => new Date(row.timestamp).getHours(),
  day: (row) => new Date(row.timestamp).toISOString().split('T')[0]
})
.groupBy("day")
.summarize({ avg_price: (g) => mean(g.price) })
```

### 7. rolling-window.test.ts
**Use Cases**:
- Rolling mean/sum/min/max over time windows
- Rolling statistics: std dev, variance
- Time-based windows: last N hours, last N days
- Row-based windows: last N rows
- Handle edge cases: partial windows at start/end

**Example**:
```ts
// Rolling 7-day average
df.mutate({
  rolling_avg: (row, idx, df) => {
    const window = df.slice({ start: Math.max(0, idx - 6), end: idx + 1 });
    return mean(window.extract("price"));
  }
})
```

### 8. resample.test.ts
**Use Cases**:
- Downsample: hourly to daily, daily to weekly
- Upsample: daily to hourly (with interpolation/fill)
- Resample with aggregation: mean, sum, first, last
- Handle missing periods in resampled data
- Custom frequency: 15-minute, 30-minute intervals

**Example**:
```ts
// Resample hourly to daily
df.groupBy((row) => {
  const d = new Date(row.timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
})
.summarize({
  avg_price: (g) => mean(g.price),
  volume: (g) => sum(g.volume)
})
```

### 9. detect-gaps.test.ts
**Use Cases**:
- Detect missing time periods
- Identify gaps larger than threshold
- Flag irregular intervals
- Find missing dates in expected sequence

**Example**:
```ts
df.mutate({
  gap: (row, idx, df) => {
    if (idx === 0) return null;
    const diff = row.timestamp - df[idx - 1].timestamp;
    return diff > expectedInterval ? diff : null;
  }
})
.filter(row => row.gap !== null)
```

### 10. interpolate.test.ts
**Use Cases**:
- Linear interpolation between known values
- Forward/backward fill (already have, but can combine)
- Interpolate missing values in time series
- Handle edge cases: all nulls, single value

**Example**:
```ts
// Linear interpolation for missing values
df.mutate({
  price_interpolated: (row, idx, df) => {
    if (row.price !== null) return row.price;
    // Find previous and next non-null values
    // Interpolate linearly
  }
})
```

## Priority 3: Advanced Operations (Lower Priority)

### 11. timezone-convert.test.ts
**Use Cases**:
- Convert timestamps between timezones
- Handle daylight saving time transitions
- Localize naive timestamps

### 12. time-parse.test.ts
**Use Cases**:
- Parse various date/time string formats
- Handle multiple timezone formats
- Validate date/time values

### 13. time-sort.test.ts
**Use Cases**:
- Ensure chronological order
- Sort by multiple time columns
- Handle unsorted time series

### 14. duplicate-time.test.ts
**Use Cases**:
- Detect duplicate timestamps
- Handle duplicate timestamps (keep first/last/all)
- Aggregate duplicates

## Implementation Status

| Test File | Status | Priority | Notes |
|-----------|--------|----------|-------|
| asof-join.test.ts | ✅ Created | P1 | Minimal examples done |
| lag-lead.test.ts | ✅ Created | P1 | Minimal examples done |
| fill-forward-backward.test.ts | ✅ Created | P1 | Minimal examples done |
| time-filter.test.ts | ⏳ TODO | P2 | Common use case |
| time-diff.test.ts | ⏳ TODO | P2 | Common use case |
| time-group.test.ts | ⏳ TODO | P2 | Common use case |
| rolling-window.test.ts | ⏳ TODO | P2 | May need implementation |
| resample.test.ts | ⏳ TODO | P2 | May need implementation |
| detect-gaps.test.ts | ⏳ TODO | P2 | Useful for data quality |
| interpolate.test.ts | ⏳ TODO | P2 | Useful for missing data |
| timezone-convert.test.ts | ⏳ TODO | P3 | Lower priority |
| time-parse.test.ts | ⏳ TODO | P3 | Lower priority |
| time-sort.test.ts | ⏳ TODO | P3 | Lower priority |
| duplicate-time.test.ts | ⏳ TODO | P3 | Lower priority |

## Next Steps

1. **Complete Priority 1 tests** (already started):
   - ✅ asof-join.test.ts
   - ✅ lag-lead.test.ts
   - ✅ fill-forward-backward.test.ts

2. **Create Priority 2 tests** (most common use cases):
   - Start with time-filter.test.ts (uses existing filter)
   - Then time-diff.test.ts (uses existing mutate)
   - Then time-group.test.ts (uses existing groupBy + date manipulation)
   - Then rolling-window.test.ts (may need new functions)
   - Then resample.test.ts (may need new functions)

3. **Consider implementations**:
   - Rolling window functions (if not exist)
   - Resampling functions (if not exist)
   - Time grouping helpers (if needed)

## Notes

- Most Priority 2 operations can be done with existing DataFrame methods
- Rolling windows and resampling may need new helper functions
- Focus on minimal examples that demonstrate common patterns
- Each test file should have 3-5 minimal examples covering key use cases

