import type { DocEntry } from "../mcp-types.ts";

export const timeSeriesDocs: Record<string, DocEntry> = {
  timeSeriesOverview: {
    name: "Time Series Overview",
    category: "dataframe",
    signature: "downsample() / upsample() / fillForward() / fillBackward()",
    description:
      "Tidy-TS provides two functions for time-series resampling: `downsample()` for aggregating to lower frequencies (e.g., hourly → daily) and `upsample()` for expanding to higher frequencies with fill methods. Use `fillForward()` or `fillBackward()` to handle missing values after resampling.",
    imports: [
      'import { createDataFrame, stats } from "@tidy-ts/dataframe";',
    ],
    parameters: [],
    returns: "DataFrame with resampled data",
    examples: [
      '// COMPLETE EXAMPLE: Daily data → Weekly aggregation\nconst dailyData = createDataFrame([\n  { date: new Date("2023-01-01"), sales: 100 },\n  { date: new Date("2023-01-02"), sales: 150 },\n  { date: new Date("2023-01-03"), sales: null },  // Missing\n  { date: new Date("2023-01-04"), sales: 120 },\n  { date: new Date("2023-01-05"), sales: 180 },\n  { date: new Date("2023-01-06"), sales: null },  // Missing\n  { date: new Date("2023-01-07"), sales: 200 },\n  { date: new Date("2023-01-08"), sales: 160 },\n]);\n\n// Step 1: Fill missing values first\nconst filled = dailyData.fillForward("sales");\n\n// Step 2: Downsample to weekly\nconst weekly = filled.downsample({\n  timeColumn: "date",\n  frequency: "1W",\n  aggregations: {\n    sales: stats.sum,  // Total weekly sales\n  }\n});',
      '// COMPLETE EXAMPLE: Weekly → Daily with forward fill\nconst weeklyData = createDataFrame([\n  { date: new Date("2023-01-01"), price: 100 },\n  { date: new Date("2023-01-08"), price: 110 },\n]);\n\nconst daily = weeklyData.upsample({\n  timeColumn: "date",\n  frequency: "1D",\n  fillMethod: "forward",\n});\n// Result: Daily data from Jan 1-8 with prices forward-filled',
    ],
    related: ["downsample", "upsample", "fillForward", "fillBackward"],
    bestPractices: [
      "✓ API DESIGN: Tidy-TS uses separate downsample() and upsample() functions",
      "✓ DOWNSAMPLE: Aggregate high-frequency → low-frequency (requires aggregation functions)",
      "✓ UPSAMPLE: Expand low-frequency → high-frequency (requires fill method)",
      "✓ FILL FIRST: Fill missing values before downsampling for accurate aggregations",
      "✓ FILL AFTER: Use fillForward/fillBackward after upsample if needed",
    ],
  },

  downsample: {
    name: "downsample",
    category: "dataframe",
    signature:
      "downsample({ timeColumn, frequency, aggregations, startDate?, endDate? }): DataFrame<...>",
    description:
      "Downsample time-series data by aggregating high-frequency data to lower frequency (e.g., hourly → daily, daily → weekly). Groups rows by time buckets and applies aggregation functions. The time column must be of type Date (or Date | null).",
    imports: [
      'import { createDataFrame, stats } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "timeColumn: Name of the Date column to use for downsampling",
      "frequency: Target frequency string or object:",
      "  - Seconds: '1S', '5S', '15S', '30S'",
      "  - Minutes: '1min', '5min', '15min', '30min'",
      "  - Hours: '1H', '6H', '12H'",
      "  - Days: '1D', '7D'",
      "  - Weeks: '1W'",
      "  - Months: '1M'",
      "  - Quarters: '1Q'",
      "  - Years: '1Y'",
      "  - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }",
      "aggregations: Object mapping column names to aggregation functions:",
      "  - Use stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last",
      "  - Can create new columns (e.g., { open: stats.first, high: stats.max, low: stats.min, close: stats.last })",
      "startDate: Optional start date for downsampling period",
      "endDate: Optional end date for downsampling period",
    ],
    returns: "DataFrame with downsampled data",
    examples: [
      '// Downsample hourly to daily\nconst hourly = createDataFrame([\n  { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },\n  { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },\n  { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },\n  { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },\n]);\nconst daily = hourly.downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: {\n    price: stats.mean,\n    volume: stats.sum\n  }\n})\n// Result: 2 rows (one per day)\n// Day 1: price = 110 (mean of 100, 110, 120), volume = 60 (sum of 10, 20, 30)\n// Day 2: price = 130, volume = 40',
      '// WEEKLY RESAMPLING: Daily → Weekly\nconst dailySales = createDataFrame([\n  { date: new Date("2023-01-01"), revenue: 1000, orders: 10 },\n  { date: new Date("2023-01-02"), revenue: 1200, orders: 12 },\n  // ... more daily data\n  { date: new Date("2023-01-14"), revenue: 1500, orders: 15 },\n]);\nconst weekly = dailySales.downsample({\n  timeColumn: "date",\n  frequency: "1W",\n  aggregations: {\n    revenue: stats.sum,   // Total weekly revenue\n    orders: stats.sum,    // Total weekly orders\n  }\n});',
      '// WEEKLY + FILL MISSING: Complete workflow\nconst data = createDataFrame([...]);\n// Step 1: Fill missing values\nconst filled = data.fillForward("price");\n// Step 2: Downsample to weekly\nconst weekly = filled.downsample({\n  timeColumn: "date",\n  frequency: "1W",\n  aggregations: { price: stats.mean }\n});',
      '// Downsample with OHLC pattern (Open, High, Low, Close)\nconst ohlc = df.downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: {\n    open: stats.first,  // First price in period\n    high: stats.max,    // Highest price\n    low: stats.min,     // Lowest price\n    close: stats.last   // Last price\n  }\n})',
      '// Works with grouped DataFrames\nconst result = df.groupBy("symbol").downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: {\n    price: stats.mean\n  }\n})',
      '// With date range\nconst result = df.downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: { price: stats.mean },\n  startDate: new Date("2023-01-01"),\n  endDate: new Date("2023-01-31")\n})',
    ],
    related: [
      "upsample",
      "groupBy",
      "summarize",
      "fillForward",
      "fillBackward",
    ],
    bestPractices: [
      "✓ GOOD: Use for converting from higher to lower frequency (e.g., hourly → daily)",
      "✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this",
      "✓ GOOD: Use aggregation functions like stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last",
      "✓ GOOD: Preserves grouping when called on grouped DataFrames",
      "✓ GOOD: Can create new columns during downsampling (e.g., OHLC pattern)",
      "✓ GOOD: Use startDate/endDate to define explicit time ranges",
      "✓ GROUPING BEHAVIOR - without startDate: Each group starts from its own first data point",
      "✓ GROUPING BEHAVIOR - with startDate: All groups align to the same startDate. Buckets before a group's first data point will have empty arrays [] which aggregate to null/NaN",
      "✓ EMPTY BUCKETS: Buckets with no data receive empty arrays [] passed to aggregation functions, which typically return null/NaN. This is NOT forward-filled automatically",
      "✓ CUSTOM AGGREGATION: Can use custom functions like (values: unknown[]) => { return values.length > 0 ? stats.mean(values) : 0 } to handle empty buckets",
    ],
    antiPatterns: [
      "❌ BAD: Using non-Date column for timeColumn - TypeScript will error",
      "❌ BAD: Using for upsampling - use upsample() instead",
    ],
  },

  upsample: {
    name: "upsample",
    category: "dataframe",
    signature:
      "upsample({ timeColumn, frequency, fillMethod, startDate?, endDate? }): DataFrame<...>",
    description:
      "Upsample time-series data by filling low-frequency data to higher frequency (e.g., daily → hourly). Generates a complete time sequence and fills missing values using forward or backward fill.",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "timeColumn: Name of the Date column to use for upsampling",
      "frequency: Target frequency string or object:",
      "  - Seconds: '1S', '5S', '15S', '30S'",
      "  - Minutes: '1min', '5min', '15min', '30min'",
      "  - Hours: '1H', '6H', '12H'",
      "  - Days: '1D', '7D'",
      "  - Weeks: '1W'",
      "  - Months: '1M'",
      "  - Quarters: '1Q'",
      "  - Years: '1Y'",
      "  - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }",
      "fillMethod: Fill strategy for missing values:",
      "  - 'forward': Carry forward the last known value (forward fill)",
      "  - 'backward': Use the next known value (backward fill)",
      "startDate: Optional start date for upsampling period",
      "endDate: Optional end date for upsampling period",
    ],
    returns: "DataFrame with upsampled data",
    examples: [
      '// Upsample daily to hourly with forward fill\nconst daily = createDataFrame([\n  { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },\n  { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },\n]);\nconst hourly = daily.upsample({\n  timeColumn: "timestamp",\n  frequency: "1H",\n  fillMethod: "forward"\n})\n// Result: 3 rows (10:00, 11:00, 12:00)\n// 10:00: value = 100\n// 11:00: value = 100 (forward filled)\n// 12:00: value = 200',
      '// Upsample with backward fill\nconst hourly = daily.upsample({\n  timeColumn: "timestamp",\n  frequency: "1H",\n  fillMethod: "backward"\n})',
      '// With date range\nconst result = df.upsample({\n  timeColumn: "timestamp",\n  frequency: "6H",\n  fillMethod: "forward",\n  startDate: new Date("2023-01-01"),\n  endDate: new Date("2023-01-31")\n})',
      '// Grouping behavior: without startDate, each group starts from its own first data point\nconst df = createDataFrame([\n  { symbol: "AAPL", timestamp: new Date("2023-01-05T00:00:00"), price: 100 },\n  { symbol: "GOOG", timestamp: new Date("2023-01-01T00:00:00"), price: 200 },\n]);\nconst result = df.groupBy("symbol").upsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  fillMethod: "forward"\n});\n// AAPL starts from 2023-01-05, GOOG starts from 2023-01-01',
      '// Grouping behavior: with startDate, all groups align to same startDate\n// Missing values before first data point will be null (not filled)\nconst result = df.groupBy("symbol").upsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  fillMethod: "forward",\n  startDate: new Date("2023-01-01"),\n  endDate: new Date("2023-01-10")\n});\n// Both AAPL and GOOG will have buckets starting from 2023-01-01\n// AAPL will have null for 2023-01-01 through 2023-01-04 (no value to fill from)',
    ],
    related: ["downsample", "fillForward", "fillBackward"],
    bestPractices: [
      "✓ GOOD: Use for converting from lower to higher frequency (e.g., daily → hourly)",
      "✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this",
      "✓ GOOD: Forward fill is most common - carries last known value forward",
      "✓ GOOD: Backward fill uses next known value - useful for looking ahead",
      "✓ GOOD: Use startDate/endDate to define explicit time ranges",
      "✓ GROUPING BEHAVIOR - without startDate: Each group starts from its own first data point",
      "✓ GROUPING BEHAVIOR - with startDate: All groups align to the same startDate. Values before a group's first data point will be null (cannot fill from non-existent data)",
      "✓ FILL LIMITATIONS: Forward fill cannot fill values that come before the first data point. Backward fill cannot fill values after the last data point",
    ],
    antiPatterns: [
      "❌ BAD: Using non-Date column for timeColumn - TypeScript will error",
      "❌ BAD: Using for downsampling - use downsample() instead",
    ],
  },
};
