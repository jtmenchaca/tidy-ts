# Interpolation Implementation Plan

## Overview

Interpolation fills missing values by estimating them based on surrounding known values. Unlike forward/backward fill (which copy values), interpolation calculates intermediate values using mathematical methods.

## Design Pattern

Following the established pattern from `fillForward`/`fillBackward` and `rolling`:

1. **DataFrame Method**: `.interpolate()` - operates on DataFrame columns
2. **Stats Function**: `stats.interpolate()` - operates on arrays (for use in `mutate`, `rolling`, etc.)

## Implementation Components

### 1. DataFrame Method: `.interpolate()`

**Location**: `src/dataframe/ts/verbs/missing-data/interpolate.verb.ts`

**Signature**:
```typescript
interpolate(
  valueColumn: keyof T & string,
  method: "linear" | "spline",
  xColumn: keyof T & string  // Required: numeric or Date column for x-axis
): DataFrame<T>
```

**Behavior**:
- Interpolates null/undefined values in `valueColumn`
- **Method is required** - must specify "linear" or "spline"
- **xColumn is required** - numeric or Date column that defines the x-axis spacing
- Only interpolates values that have both a previous and next non-null value
- Leading/trailing nulls remain null (can't interpolate without bounds)
- Creates new DataFrame without modifying original

**Examples**:
```typescript
// Linear interpolation with numeric x-axis
df.interpolate("value", "linear", "position")

// Linear interpolation with Date x-axis
df.interpolate("price", "linear", "timestamp")

// Spline interpolation
df.interpolate("temperature", "spline", "timestamp")
```

### 2. Stats Function: `stats.interpolate()`

**Location**: `src/dataframe/ts/stats/window/interpolate.ts`

**Signature**:
```typescript
// For numbers
interpolate(values: (number | null | undefined)[], xValues: (number | Date)[], method: "linear" | "spline"): number[]

// For Dates
interpolate(values: (Date | null | undefined)[], xValues: (number | Date)[], method: "linear" | "spline"): Date[]
```

**Behavior**:
- Takes array of values (may contain nulls)
- **xValues is required** - array of numeric or Date values that define x-axis spacing
- **Method is required** - must specify "linear" or "spline"
- Returns array with interpolated values
- Same length as input
- Works with **numbers and Dates** (both can be interpolated mathematically)
  - Numbers: Direct interpolation
  - Dates: Interpolate timestamps (milliseconds), return Date objects

**Examples**:
```typescript
// Array-based usage with numbers (linear)
stats.interpolate([100, null, null, 200], [1, 2, 3, 4], "linear")
// Returns: [100, 133.33, 166.67, 200]

// Array-based usage with numbers (spline)
stats.interpolate([100, null, null, 200], [1, 2, 3, 4], "spline")
// Returns: [100, 133.33, 166.67, 200] (smoother curve)

// Array-based usage with Dates
const dates = [
  new Date("2023-01-01"),
  null,
  null,
  new Date("2023-01-04")
];
stats.interpolate(dates, [1, 2, 3, 4], "linear")
// Returns: [Date("2023-01-01"), Date("2023-01-02"), Date("2023-01-03"), Date("2023-01-04")]

// Use in mutate with numbers
df.mutate({
  interpolated: (row, idx, df) => {
    const values = df.value;
    const xValues = df.position; // or df.timestamp.map(t => t.getTime())
    return stats.interpolate(values, xValues, "linear")[idx];
  }
})

// Use in mutate with Dates
df.mutate({
  interpolated_date: (row, idx, df) => {
    const dates = df.date_column;
    const xValues = df.timestamp.map(t => t.getTime());
    return stats.interpolate(dates, xValues, "linear")[idx];
  }
})
```

## Interpolation Methods

### 1. Linear Interpolation (Default) ⭐⭐⭐⭐⭐

**Formula**: `y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)`

**When to use**:
- Most common use case
- Works well for continuous data (sensor readings, stock prices)
- Works for Dates too (interpolates timestamps)
- Simple and fast
- Good default choice

**Implementation**:
- For each null value, find previous and next non-null values
- Calculate ratio: `(current_time - prev_time) / (next_time - prev_time)`
- **For numbers**: `prev_value + ratio * (next_value - prev_value)`
- **For Dates**: 
  - Convert to timestamps: `prev_ms = prev_date.getTime()`, `next_ms = next_date.getTime()`
  - Interpolate: `interpolated_ms = prev_ms + ratio * (next_ms - prev_ms)`
  - Convert back: `new Date(interpolated_ms)`

### 2. Spline Interpolation ⭐⭐⭐⭐

**When to use**:
- Smoother curves than linear
- Better for data with known smoothness properties
- More computationally expensive
- Requires at least 4 points for cubic splines
- Common in scientific/engineering applications

**Implementation**:
- Use cubic splines (most common)
- For fewer than 4 points, fall back to linear interpolation
- Ensure smooth first and second derivatives at knots
- Handle edge cases (leading/trailing nulls still can't be interpolated)

## Edge Cases & Behavior

### Leading/Trailing Nulls
- **Cannot interpolate** without both bounds
- **Behavior**: Leave as null (same as forward/backward fill)
- **Rationale**: No way to estimate without boundary values

### Single Null Between Values
- **Can interpolate**: Has both previous and next values
- **Example**: `[100, null, 200]` → `[100, 150, 200]`

### Multiple Consecutive Nulls
- **Can interpolate**: Each null has bounds
- **Example**: `[100, null, null, 200]` → `[100, 133.33, 166.67, 200]`

### All Nulls
- **Cannot interpolate**: No bounds available
- **Behavior**: Return all nulls

### Non-Numeric/Non-Date Values
- **DataFrame method**: TypeScript should enforce numeric or Date column
- **Stats function**: Only works with numeric or Date arrays
- **Behavior**: Type error or runtime error for strings, objects, etc.
- **Dates**: Converted to/from milliseconds for interpolation, returned as Date objects

### X-Axis Column Types
- **Numeric**: Any numeric scale (position, time in ms, etc.)
- **Date**: Convert to numeric using `.getTime()` for interpolation
- **Required**: Must be provided (no default to row index)

## Type Definitions

### DataFrame Method Types
**Location**: `src/dataframe/ts/verbs/missing-data/interpolate.types.ts`

```typescript
export type InterpolateMethod<Row extends object> = <
  ValueCol extends keyof Row & string,
  XCol extends keyof Row & string,
>(
  valueColumn: ValueCol,
  method: "linear" | "spline",
  xColumn: XCol
) => DataFrame<Row>;  // Type doesn't change (nulls become numbers)
```

**Note**: Type system can't easily express "null becomes number", so we keep the same type but document the behavior.

## Integration Points

### 1. Add to DataFrame Interface
**File**: `src/dataframe/ts/dataframe/types/dataframe.type.ts`
- Add `interpolate: InterpolateMethod<Row>`

### 2. Wire Up in resolve-verb.ts
**File**: `src/dataframe/ts/dataframe/implementation/resolve-verb.ts`
- Import `interpolate` verb
- Add handler for `prop === "interpolate"`

### 3. Export Stats Function
**File**: `src/dataframe/ts/stats/stats.ts`
- Import `interpolate` from `window/interpolate.ts`
- Add to `stats` object: `readonly interpolate: typeof interpolate`

### 4. Export Verb
**File**: `src/dataframe/ts/verbs/missing-data/index.ts`
- Add `export * from "./interpolate.verb.ts";`

## Test Cases

### Basic Functionality
1. ✅ Linear interpolation with numeric x-axis
2. ✅ Linear interpolation with Date x-axis
3. ✅ Spline interpolation with numeric x-axis
4. ✅ Spline interpolation with Date x-axis
5. ✅ Single null between two values
6. ✅ Multiple consecutive nulls
7. ✅ Leading nulls (should remain null)
8. ✅ Trailing nulls (should remain null)
9. ✅ All nulls (should remain null)
10. ✅ No nulls (should return unchanged)

### Edge Cases
11. ✅ Single row DataFrame
12. ✅ Empty DataFrame
13. ✅ Date x-axis column (convert to numeric)
14. ✅ Numeric x-axis column
15. ✅ Date value column (interpolate timestamps, return Dates)
16. ✅ Numeric value column
17. ✅ Non-numeric/non-Date value column (should error or handle gracefully)
18. ✅ Spline with fewer than 4 points (should fall back to linear)
19. ✅ Unevenly spaced x-axis values

### Integration
14. ✅ Works with grouped DataFrames
15. ✅ Works with `mutate()` using `stats.interpolate()`
16. ✅ Works with `rolling()` using `stats.interpolate()`

### Stats Function
17. ✅ Array-based usage with times array (numbers)
18. ✅ Array-based usage without times (uses indices)
19. ✅ Array-based usage with Date values
20. ✅ Array-based usage with Date time column
21. ✅ Handles nulls at start/end
22. ✅ Returns same length array
23. ✅ Date interpolation returns Date objects

## Comparison with fillForward/fillBackward

| Feature | fillForward | fillBackward | interpolate |
|---------|-------------|--------------|-------------|
| **Method** | Copy last value | Copy next value | Calculate intermediate value |
| **Use case** | Carry forward | Carry backward | Estimate between values |
| **Requires x-axis** | No | No | Yes (required) |
| **Works with** | Any type | Any type | Numbers and Dates |
| **Leading nulls** | Remain null | Remain null | Remain null |
| **Trailing nulls** | Remain null | Remain null | Remain null |
| **Multiple nulls** | All get same value | All get same value | Each gets unique value |

## Implementation Order

1. **Stats function** (`stats.interpolate`) - simpler, can test independently
2. **DataFrame method** (`.interpolate()`) - uses stats function internally
3. **Type definitions** - ensure type safety
4. **Integration** - wire up to DataFrame interface
5. **Tests** - comprehensive test coverage
6. **Documentation** - JSDoc and MCP docs

## Future Enhancements

1. **Polynomial interpolation** - higher-order polynomials (probably not worth it)
2. **Extrapolation** - estimate values outside bounds (dangerous but sometimes needed)
3. **Method selection** - auto-detect best method based on data characteristics
4. **Additional spline types** - different boundary conditions (natural, clamped, etc.)

## Notes

- **Why x-axis is required**: Interpolation needs actual spacing between points to work correctly
- **Why linear and spline**: Linear is most common, spline is second most common and provides smoother results
- **Why numbers and Dates**: Both can be converted to numeric for interpolation (Dates via getTime())
- **Why leading/trailing nulls remain**: Can't interpolate without bounds (use forward/backward fill for those)
- **Why spline falls back to linear**: Cubic splines need at least 4 points; fewer points use linear interpolation

