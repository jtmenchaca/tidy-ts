/**
 * IDEAL Developer Experience Examples for Resampling
 *
 * This file shows what the ideal resampling API would look like.
 * These are examples of the desired API, not actual implementations.
 */

import { createDataFrame, stats } from "@tidy-ts/dataframe";

// ============================================================================
// EXAMPLE 1: Simple Downsampling (Most Common Use Case)
// ============================================================================

Deno.test("Ideal: Simple hourly to daily resampling", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },
    { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },
  ]);

  // IDEAL API: Simple, readable, one line
  const _daily = df.resample("timestamp", "1D", {
    price: "mean", // Average price per day
    volume: "sum", // Total volume per day
  });

  // vs CURRENT APPROACH (3 lines, manual date manipulation):
  // const daily = df
  //   .mutate({ day: (row) => row.timestamp.toISOString().split("T")[0] })
  //   .groupBy("day")
  //   .summarize({
  //     price: (g) => stats.mean(g.price),
  //     volume: (g) => stats.sum(g.volume),
  //   });

  // Expected: 2 rows (one per day)
  // Day 1: price=110 (mean of 100,110,120), volume=60 (sum of 10,20,30)
  // Day 2: price=130, volume=40
});

// ============================================================================
// EXAMPLE 2: Financial Data (OHLC - Open, High, Low, Close)
// ============================================================================

Deno.test("Ideal: Stock price resampling with OHLC", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T09:30:00"), price: 100, volume: 1000 },
    { timestamp: new Date("2023-01-01T09:31:00"), price: 101, volume: 500 },
    { timestamp: new Date("2023-01-01T09:32:00"), price: 99, volume: 800 },
    { timestamp: new Date("2023-01-01T09:33:00"), price: 102, volume: 600 },
  ]);

  // IDEAL API: Clear intent, handles common financial patterns
  const _hourly = df.resample("timestamp", "1H", {
    open: "first", // First price in period
    high: "max", // Highest price
    low: "min", // Lowest price
    close: "last", // Last price (closing price)
    volume: "sum", // Total volume
  });

  // Result columns: timestamp, open, high, low, close, volume
});

// ============================================================================
// EXAMPLE 3: Custom Aggregations
// ============================================================================

Deno.test("Ideal: Custom aggregation functions", () => {
  const df = createDataFrame([
    {
      timestamp: new Date("2023-01-01"),
      sales: 100,
      orders: 10,
      revenue: 1000,
    },
    {
      timestamp: new Date("2023-01-02"),
      sales: 150,
      orders: 15,
      revenue: 1500,
    },
  ]);

  // IDEAL API: Supports both strings and functions
  const _weekly = df.resample("timestamp", "1W", {
    total_sales: "sum", // Simple string
    total_revenue: stats.sum, // Stats function
    avg_order_value: (group) => { // Custom function
      return stats.sum(group.revenue) / stats.sum(group.orders);
    },
    customer_count: (group) => stats.uniqueCount(group.customer_id),
  });
});

// ============================================================================
// EXAMPLE 4: Upsampling with Forward Fill
// ============================================================================

Deno.test("Ideal: Upsample daily to hourly with forward fill", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T00:00:00"), price: 100 },
    { timestamp: new Date("2023-01-02T00:00:00"), price: 110 },
  ]);

  // IDEAL API: Simple upsampling
  const _hourly = df.resample("timestamp", "1H", {
    method: "forward", // Forward fill all columns
  });

  // Result: 48 rows (24 hours × 2 days)
  // All hours in day 1 have price=100
  // All hours in day 2 have price=110
});

// ============================================================================
// EXAMPLE 5: Upsampling with Per-Column Fill Methods
// ============================================================================

Deno.test("Ideal: Different fill methods per column", () => {
  const df = createDataFrame([
    {
      timestamp: new Date("2023-01-01"),
      price: 100,
      volume: 0,
      status: "active",
    },
    {
      timestamp: new Date("2023-01-03"),
      price: 110,
      volume: 50,
      status: "inactive",
    },
  ]);

  // IDEAL API: Per-column control
  const _daily = df.resample("timestamp", "1D", {
    price: "forward", // Carry price forward
    volume: 0, // Fill volume with zero
    status: null, // Fill status with null
  });

  // Day 1: price=100, volume=0, status="active"
  // Day 2: price=100 (forward), volume=0, status=null
  // Day 3: price=110, volume=50, status="inactive"
});

// ============================================================================
// EXAMPLE 6: Upsampling with Interpolation
// ============================================================================

Deno.test("Ideal: Interpolate missing values", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T00:00:00"), temperature: 20 },
    { timestamp: new Date("2023-01-01T02:00:00"), temperature: 24 },
  ]);

  // IDEAL API: Linear interpolation
  const _hourly = df.resample("timestamp", "1H", {
    temperature: "interpolate", // Linear interpolation
  });

  // Result: 3 rows
  // 00:00: temperature=20
  // 01:00: temperature=22 (interpolated)
  // 02:00: temperature=24
});

// ============================================================================
// EXAMPLE 7: Grouped Resampling (Very Common in Financial Data)
// ============================================================================

Deno.test("Ideal: Resample per symbol", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-01T11:00:00"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-01T10:00:00"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-01T11:00:00"), symbol: "MSFT", price: 301 },
  ]);

  // IDEAL API: Works with grouped data
  const _daily = df
    .groupBy("symbol")
    .resample("timestamp", "1D", {
      price: "last",
      volume: "sum",
    });

  // Resamples within each symbol group
  // Result: 2 rows (one per symbol per day)
});

// ============================================================================
// EXAMPLE 8: Custom Frequencies
// ============================================================================

Deno.test("Ideal: Custom time intervals", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T00:00:00"), value: 10 },
    { timestamp: new Date("2023-01-01T00:15:00"), value: 20 },
    { timestamp: new Date("2023-01-01T00:30:00"), value: 30 },
  ]);

  // IDEAL API: Flexible frequency specification
  const _quarterHourly = df.resample("timestamp", "15min", {
    value: "mean",
  });

  // Or explicit
  const _custom = df.resample("timestamp", { value: 15, unit: "min" }, {
    value: "mean",
  });
});

// ============================================================================
// EXAMPLE 9: Mixed Aggregation and Fill
// ============================================================================

Deno.test("Ideal: Some columns aggregate, some fill", () => {
  const df = createDataFrame([
    {
      timestamp: new Date("2023-01-01T10:00:00"),
      price: 100,
      volume: 10,
      status: "open",
    },
    {
      timestamp: new Date("2023-01-01T11:00:00"),
      price: 110,
      volume: 20,
      status: "open",
    },
  ]);

  // IDEAL API: Mix aggregation and fill in one call
  const _hourly = df.resample("timestamp", "30min", {
    price: "last", // Aggregate: last price
    volume: "sum", // Aggregate: sum volume
    status: "forward", // Fill: carry forward
  });
});

// ============================================================================
// EXAMPLE 10: Real-World Workflow
// ============================================================================

Deno.test("Ideal: Complete time-series analysis workflow", () => {
  // Raw minute-level stock data
  const minuteData = createDataFrame([
    {
      timestamp: new Date("2023-01-01T09:30:00"),
      symbol: "AAPL",
      price: 150,
      volume: 1000,
    },
    {
      timestamp: new Date("2023-01-01T09:31:00"),
      symbol: "AAPL",
      price: 151,
      volume: 500,
    },
    // ... more rows
  ]);

  // IDEAL API: Clean, readable pipeline
  const _analysis = minuteData
    .filter((row) => row.volume > 0) // Remove zero-volume trades
    .groupBy("symbol") // Group by symbol
    .resample("timestamp", "1D", { // Resample to daily
      open: "first",
      high: "max",
      low: "min",
      close: "last",
      volume: "sum",
    })
    .mutate({
      daily_return: (row) => (row.close - row.open) / row.open,
      volatility: stats.rolling("close", 20, stats.sd),
    })
    .filter((row) => row.daily_return !== null);

  // vs CURRENT APPROACH (much more verbose):
  // const analysis = minuteData
  //   .filter(row => row.volume > 0)
  //   .mutate({ day: (row) => row.timestamp.toISOString().split("T")[0] })
  //   .groupBy("symbol", "day")
  //   .summarize({
  //     open: (g) => g[0].price,
  //     high: (g) => stats.max(g.price),
  //     low: (g) => stats.min(g.price),
  //     close: (g) => g[g.nrows() - 1].price,
  //     volume: (g) => stats.sum(g.volume),
  //   })
  //   .mutate({
  //     daily_return: (row) => (row.close - row.open) / row.open,
  //     volatility: stats.rolling("close", 20, stats.sd),
  //   })
  //   .filter(row => row.daily_return !== null);
});

// ============================================================================
// KEY BENEFITS OF IDEAL API
// ============================================================================

/**
 * Benefits:
 *
 * 1. **Readability**: Intent is clear - "resample to daily, aggregate price as mean"
 * 2. **Conciseness**: 1 line vs 3-5 lines for common operations
 * 3. **Type Safety**: Full TypeScript support, autocomplete for column names
 * 4. **Flexibility**: Supports strings, functions, and mixed operations
 * 5. **Consistency**: Follows tidy-ts patterns (method chaining, functional style)
 * 6. **Power**: Handles both downsampling and upsampling
 * 7. **Composability**: Works with groupBy, filter, mutate, etc.
 * 8. **No Manual Date Manipulation**: Handles timezone, DST, month boundaries automatically
 */
