/**
 * Resample Demo - Interactive Examples
 *
 * This file demonstrates the resample() function with real-world examples.
 * Each test shows the input data, the operation, and the output with .print().
 */

import { createDataFrame, stats } from "@tidy-ts/dataframe";

// ============================================================================
// Demo 1: Downsampling - Hourly Stock Prices to Daily Averages
// ============================================================================

Deno.test("Demo 1: Downsample hourly prices to daily averages", () => {
  console.log("\n📊 Demo 1: Hourly → Daily Stock Prices\n");

  // Input: Hourly stock prices (using UTC midnight-based times for clarity)
  const hourlyPrices = createDataFrame([
    {
      timestamp: new Date("2024-01-01T00:00:00Z"),
      symbol: "AAPL",
      price: 150.00,
      volume: 1000,
    },
    {
      timestamp: new Date("2024-01-01T01:00:00Z"),
      symbol: "AAPL",
      price: 151.50,
      volume: 1200,
    },
    {
      timestamp: new Date("2024-01-01T02:00:00Z"),
      symbol: "AAPL",
      price: 149.75,
      volume: 800,
    },
    {
      timestamp: new Date("2024-01-02T00:00:00Z"),
      symbol: "AAPL",
      price: 152.00,
      volume: 1500,
    },
    {
      timestamp: new Date("2024-01-02T01:00:00Z"),
      symbol: "AAPL",
      price: 153.25,
      volume: 2000,
    },
  ]);

  console.log("Input (hourly data):");
  hourlyPrices.print();

  // Downsample to daily: calculate daily average price and total volume
  const dailyPrices = hourlyPrices
    .downsample({
      timeColumn: "timestamp",
      frequency: "1D",
      aggregations: {
        avg_price: stats.mean, // Average price per day
        total_volume: stats.sum, // Total volume per day
      },
    })
    .select("timestamp", "avg_price", "total_volume"); // Show only relevant columns

  console.log("\nOutput (daily aggregates):");
  dailyPrices.print();

  console.log("\n✅ Result: 5 hourly rows → 2 daily rows");
  console.log("   Jan 1: avg_price = 150.42, total_volume = 3000");
  console.log("   Jan 2: avg_price = 152.63, total_volume = 3500\n");
});

// ============================================================================
// Demo 2: Upsampling - Daily Data to Hourly with Forward Fill
// ============================================================================

Deno.test("Demo 2: Upsample daily data to hourly with forward fill", () => {
  console.log("\n📊 Demo 2: Daily → Hourly (Forward Fill)\n");

  // Input: Daily temperature readings
  const dailyTemp = createDataFrame([
    {
      timestamp: new Date("2024-01-01T00:00:00Z"),
      location: "NYC",
      temp_f: 32,
    },
    {
      timestamp: new Date("2024-01-02T00:00:00Z"),
      location: "NYC",
      temp_f: 28,
    },
  ]);

  console.log("Input (daily temperatures):");
  dailyTemp.print();

  // Upsample to hourly: fill missing hours with most recent value
  const hourlyTemp = dailyTemp.upsample({
    timeColumn: "timestamp",
    frequency: "6H", // Every 6 hours for demo brevity
    fillMethod: "forward", // Carry forward the last known value
  });

  console.log("\nOutput (hourly data with forward fill):");
  hourlyTemp.print();

  console.log("\n✅ Result: 2 daily rows → 9 six-hourly rows");
  console.log("   Each day's temperature is forward-filled across hours\n");
});

// ============================================================================
// Demo 3: OHLC (Open-High-Low-Close) Aggregation
// ============================================================================

Deno.test("Demo 3: Create OHLC bars from tick data", () => {
  console.log("\n📊 Demo 3: Tick Data → OHLC Bars\n");

  // Input: Tick-by-tick trades
  const ticks = createDataFrame([
    { timestamp: new Date("2024-01-01T09:00:00Z"), price: 100.00 },
    { timestamp: new Date("2024-01-01T09:15:00Z"), price: 102.50 },
    { timestamp: new Date("2024-01-01T09:30:00Z"), price: 101.00 },
    { timestamp: new Date("2024-01-01T09:45:00Z"), price: 103.00 },
    { timestamp: new Date("2024-01-01T10:00:00Z"), price: 99.50 },
    { timestamp: new Date("2024-01-01T10:15:00Z"), price: 100.75 },
  ]);

  console.log("Input (tick data):");
  ticks.print();

  // Create hourly OHLC bars
  const ohlc = ticks.downsample({
    timeColumn: "timestamp",
    frequency: "1H",
    aggregations: {
      open: stats.first, // First price in the hour
      high: stats.max, // Highest price in the hour
      low: stats.min, // Lowest price in the hour
      close: stats.last, // Last price in the hour
    },
  });

  console.log("\nOutput (hourly OHLC):");
  ohlc.print();

  console.log("\n✅ Result: Standard OHLC candlestick data");
  console.log("   Hour 1: Open=100, High=103, Low=100, Close=103");
  console.log("   Hour 2: Open=99.5, High=100.75, Low=99.5, Close=100.75\n");
});

// ============================================================================
// Demo 4: Multi-Symbol Grouped Resampling
// ============================================================================

Deno.test("Demo 4: Resample multiple stocks at once", () => {
  console.log("\n📊 Demo 4: Multi-Symbol Grouped Resampling\n");

  // Input: Hourly data for multiple stocks
  const multiStock = createDataFrame([
    { timestamp: new Date("2024-01-01T09:00:00Z"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2024-01-01T10:00:00Z"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2024-01-01T09:00:00Z"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2024-01-01T10:00:00Z"), symbol: "MSFT", price: 302 },
    { timestamp: new Date("2024-01-02T09:00:00Z"), symbol: "AAPL", price: 152 },
    { timestamp: new Date("2024-01-02T09:00:00Z"), symbol: "MSFT", price: 305 },
  ]);

  console.log("Input (multi-symbol hourly):");
  multiStock.print();

  // Group by symbol, then resample each group to daily
  const dailyBySymbol = multiStock
    .groupBy("symbol")
    .downsample({
      timeColumn: "timestamp",
      frequency: "1D",
      aggregations: {
        daily_avg: stats.mean,
      },
    });

  console.log("\nOutput (daily averages per symbol):");
  dailyBySymbol.print();

  console.log("\n✅ Result: Each symbol gets its own daily aggregates");
  console.log("   AAPL: Jan 1 avg=150.5, Jan 2 avg=152");
  console.log("   MSFT: Jan 1 avg=301, Jan 2 avg=305\n");
});

// ============================================================================
// Demo 5: Calendar-Aware Monthly Aggregation
// ============================================================================

Deno.test("Demo 5: Calendar months (not 30-day periods)", () => {
  console.log("\n📊 Demo 5: Calendar-Aware Monthly Aggregation\n");

  // Input: Daily sales over Q1
  const dailySales = createDataFrame([
    { timestamp: new Date("2024-01-15T00:00:00Z"), sales: 1000 },
    { timestamp: new Date("2024-02-15T00:00:00Z"), sales: 1200 },
    { timestamp: new Date("2024-03-15T00:00:00Z"), sales: 1100 },
  ]);

  console.log("Input (daily sales):");
  dailySales.print();

  // Aggregate to calendar months (Jan, Feb, Mar)
  const monthlySales = dailySales.downsample({
    timeColumn: "timestamp",
    frequency: "1M", // Calendar months, not 30-day periods!
    aggregations: {
      total_sales: stats.sum,
    },
  });

  console.log("\nOutput (monthly totals):");
  monthlySales.print();

  console.log("\n✅ Result: Aligns to calendar month boundaries");
  console.log("   January 1st, February 1st, March 1st");
  console.log("   (Not arbitrary 30-day periods from epoch!)\n");
});

// ============================================================================
// Demo 6: Date Range Control with startDate/endDate
// ============================================================================

Deno.test("Demo 6: Specify exact date ranges", () => {
  console.log("\n📊 Demo 6: Fiscal Year Alignment\n");

  // Input: Sporadic sales data
  const sales = createDataFrame([
    { timestamp: new Date("2024-04-15T00:00:00Z"), revenue: 10000 },
    { timestamp: new Date("2024-05-20T00:00:00Z"), revenue: 15000 },
    { timestamp: new Date("2024-06-10T00:00:00Z"), revenue: 12000 },
  ]);

  console.log("Input (sporadic sales):");
  sales.print();

  // Resample to fiscal Q2 (Apr-Jun), filling gaps with nulls
  const fiscalQ2 = sales.downsample({
    timeColumn: "timestamp",
    frequency: "1M",
    aggregations: {
      monthly_revenue: stats.sum,
    },
    startDate: new Date("2024-04-01T00:00:00Z"), // Start of fiscal Q2
    endDate: new Date("2024-06-30T23:59:59Z"), // End of fiscal Q2
  });

  console.log("\nOutput (fiscal Q2 months):");
  fiscalQ2.print();

  console.log("\n✅ Result: Exact 3-month range from Apr 1 - Jun 30");
  console.log("   All months present even if no data (nulls for missing)");
  console.log("   Perfect for fiscal reporting!\n");
});

// ============================================================================
// Demo 7: Forward Fill
// ============================================================================

Deno.test("Demo 7: Forward fill for upsampling", () => {
  console.log("\n📊 Demo 7: Forward Fill Upsampling\n");

  // Input: Daily sensor data with gaps
  const sensorData = createDataFrame([
    { timestamp: new Date("2024-01-01T00:00:00Z"), temp: 72, humidity: 45 },
    { timestamp: new Date("2024-01-03T00:00:00Z"), temp: 75, humidity: 50 },
  ]);

  console.log("Input (sensor data with gaps):");
  sensorData.print();

  // Upsample to daily: forward fill
  const filled = sensorData.upsample({
    timeColumn: "timestamp",
    frequency: "1D",
    fillMethod: "forward", // Carry forward last values
  });

  console.log("\nOutput (filled daily data):");
  filled.print();

  console.log("\n✅ Result: Forward fill creates daily observations");
  console.log("   Jan 2: temp=72, humidity=45 (both carried forward)\n");
});
