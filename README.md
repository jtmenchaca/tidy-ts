# Tidy-TS

[![JSR](https://jsr.io/badges/@tidy-ts/dataframe)](https://jsr.io/@tidy-ts/dataframe)
[![JSR Score](https://jsr.io/badges/@tidy-ts/dataframe/score)](https://jsr.io/@tidy-ts/dataframe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🔗 [GitHub](https://github.com/jtmenchaca/tidy-ts) | 📚 [Documentation](https://jtmenchaca.github.io/tidy-ts/)**

Type-safe data analytics and statistics framework for TypeScript. Built for modern data science workflows with compile-time safety, known to prevent 15-38% of production bugs.

## Key Features

- **Type-Safe DataFrames**: Full TypeScript support with automatic column typing and compile-time safety
- **Data Analytics**: Group, aggregate, join, reshape, and analyze data with a fluent API
- **Statistics Toolkit**: 80+ functions for descriptive statistics, hypothesis testing, and probability distributions
- **High Performance**: Columnar storage with WASM-backed operations for critical paths
- **Multi-Format I/O**: Read/write CSV, XLSX, JSON, Parquet, and Arrow files with Zod schema validation
- **Data Visualization**: Create interactive charts with Vega-backed visualization (Jupyter notebook support)
- **Async Operations**: Built-in support for asynchronous data transformations with concurrency control
- **Time-Series Support**: Resampling, missing data handling, as-of joins, and rolling windows

## Installation

```bash
deno add jsr:@tidy-ts/dataframe // Deno
bunx jsr add @tidy-ts/dataframe // bun
pnpm add jsr:@tidy-ts/dataframe // pnpm
npx jsr add @tidy-ts/dataframe // npm
yarn add jsr:@tidy-ts/dataframe // yarn
```

### Browser Setup

For browser environments, call `setupTidyTS()` once before using any tidy-ts functions:

```typescript
import { setupTidyTS, createDataFrame, stats } from "@tidy-ts/dataframe";

// Required in browsers - call once at app startup
await setupTidyTS();
```

## Quick Start

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Create DataFrame from rows
const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
]);

// Complete data analysis workflow
const analysis = sales
  .mutate({ 
    revenue: (row) => row.quantity * row.price,
    moreThanAvg: (row, _index, df) => row.quantity > s.mean(df.quantity)
  })
  .groupBy("region")
  .summarize({
    total_revenue: (group) => s.sum(group.revenue),
    avg_quantity: (group) => s.mean(group.quantity),
    product_count: (group) => group.nrows()
  })
  .arrange("total_revenue", "desc");

analysis.print("Sales Analysis");
```

📖 **[Learn more →](https://jtmenchaca.github.io/tidy-ts/getting-started)**

## Core Operations

### DataFrame Creation & Manipulation
- `createDataFrame([...])` - Create from row objects with type inference
- `createDataFrame({ columns: {...} })` - Create from column arrays
- `select()`, `drop()` - Column selection
- `filter()`, `slice()` - Row filtering (sync & async)
- `mutate()` - Add/transform columns with functions, arrays, or scalars (sync & async)
- `arrange()` - Sort data
- `distinct()` - Unique rows
- `nrows()`, `ncols()` - Dimensions
- `df.columnName` - Direct readonly access to column arrays

### Aggregation & Grouping
- `groupBy()` - Group by columns
- `summarize()` - Aggregate groups (sync & async)
- `count()` - Count rows by grouping columns

### Joins & Reshaping
- `innerJoin()`, `leftJoin()`, `rightJoin()`, `outerJoin()` - Multi-key joins
- `asofJoin()` - Nearest key match for time-series data
- `pivotLonger()`, `pivotWider()` - Reshape data with type safety
- `transpose()` - Flip rows and columns with type safety
- `bindRows()` - Concatenate DataFrames

### Missing Data
- `replaceNA()`, `removeNA()` - Handle missing values
- `fillForward()`, `fillBackward()` - Forward/backward fill
- `interpolate()` - Linear or spline interpolation

## Features Overview

### Statistical Analysis

80+ statistical functions including descriptive stats, hypothesis testing, and probability distributions. Features both direct test APIs and an intent-driven comparison API to help choose the right test.

```typescript
import { stats as s } from "@tidy-ts/dataframe";

// Descriptive statistics
const mean = s.mean([1, 2, 3, 4, 5]);
const median = s.median([1, 2, 3, 4, 5]);

// Hypothesis testing - Direct API
const tTest = s.test.t.oneSample({
  data: [170, 165, 180, 175, 172, 168],
  mu: 170,
  alternative: "two-sided",
  alpha: 0.05
});

// Hypothesis testing - Compare API (intent-driven)
const comparison = s.compare.oneGroup.centralTendency.toValue({
  data: [170, 165, 180, 175, 172, 168],
  comparator: "not equal to",
  hypothesizedValue: 170,
  parametric: "auto",
  alpha: 0.05
});

// Probability distributions
const normalSample = s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 10 });
const quantile = s.dist.normal.quantile({ probability: 0.975, mean: 0, standardDeviation: 1 });
```

📖 **[Statistical Analysis Guide →](https://jtmenchaca.github.io/tidy-ts/stats-module)**

### Time-Series Operations

Comprehensive time-series functionality for handling temporal data with missing values, resampling, and advanced joins.

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Missing data handling
const timeSeries = createDataFrame([
  { timestamp: new Date("2023-01-01"), price: 100 },
  { timestamp: new Date("2023-01-02"), price: null },
  { timestamp: new Date("2023-01-04"), price: 110 },
]);

const filled = timeSeries.fillForward("price");
const interpolated = timeSeries.interpolate("price", "timestamp", "linear");

// Resampling
const daily = hourlyData.resample("timestamp", "1D", {
  price: s.last,
  volume: s.sum
});

// As-of joins
const joined = trades.asofJoin(quotes, "time", { 
  direction: "backward",
  tolerance: 1000,
  group_by: ["symbol"]
});

// Rolling windows
const rollingMean = s.rolling({ values: prices, windowSize: 7, fn: (window) => s.mean(window) });
```

📖 **[Time-Series Guide →](https://jtmenchaca.github.io/tidy-ts/)**

### Data Visualization

Create interactive charts directly from DataFrames with Vega-backed visualization.

```typescript
const chart = salesData
  .mutate({
    revenue: (r) => r.quantity * r.price,
    profit: (r) => r.quantity * r.price * 0.2,
  })
  .graph({
    type: "scatter",
    mappings: {
      x: "revenue",
      y: "quantity",
      color: "region",
      size: "profit",
    },
    config: {
      layout: { title: "Sales Analysis", width: 700, height: 400 },
      color: { scheme: "professional" },
    }
  });

await chart.savePNG({ filename: "sales-chart.png" });
```

📖 **[Visualization Guide →](https://jtmenchaca.github.io/tidy-ts/)**

### Data I/O

Read and write multiple formats with Zod schema validation for type safety.

```typescript
import { readCSV, readXLSX, readJSON, readParquet, readArrow, writeCSV, writeXLSX, writeParquet } from "@tidy-ts/dataframe";
import { z } from "zod";

const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
});

// Read with schema validation
const dataCSV = await readCSV(pathToCSV, PersonSchema);
const dataXLSX = await readXLSX(pathToXLSX, PersonSchema);
const dataParquet = await readParquet(pathToParquet, PersonSchema);

// Write
await writeCSV(dataframe, pathToSaveCSV);
await writeXLSX(dataframe, pathToSaveXLSX, { sheet: "Summary" });
await writeParquet(dataframe, pathToSaveParquet);
```

📖 **[Data I/O Guide →](https://jtmenchaca.github.io/tidy-ts/data-io)**

### Database Integration

Seamlessly integrate with SQLite, Drizzle ORM, and other database libraries.

```typescript
import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { DatabaseSync } from "node:sqlite";

// Raw SQLite
const db = new DatabaseSync("data.db");
const employees = db.prepare("SELECT * FROM employees").all();
const employeesDF = createDataFrame(employees, EmployeeSchema);

// Drizzle ORM
import { drizzle } from "npm:drizzle-orm/libsql";
const employees = await db.select().from(employeesTable).all();
const employeesDF = createDataFrame(employees); // Auto-inferred types
```

📖 **[Database Integration →](https://jtmenchaca.github.io/tidy-ts/)**

### Async Operations

Mix sync and async operations seamlessly with built-in concurrency control.

```typescript
const asyncData = await sales
  .mutate({
    revenue: r => r.quantity * r.price, // sync
    market_data: async r => await fetchMarketData(r.region), // async
  }, { concurrency: 3 })
  .filter(async r => await validateRegion(r.region));
```

📖 **[Full Documentation →](https://jtmenchaca.github.io/tidy-ts/)**

## Documentation

Visit the [documentation website](https://jtmenchaca.github.io/tidy-ts/) for:
- Complete API reference
- Detailed tutorials and examples
- Time-series operations guide
- Statistical analysis guide
- Data visualization guide
- And much more!

## Architecture

Tidy-TS is built on a modern, performance-focused architecture:

- **Columnar Storage**: Memory-efficient column-major storage for cache-friendly operations
- **Lazy Evaluation**: Views use BitSet masks for copy-free filtering and sorting
- **Copy-on-Write**: Share unmodified columns between DataFrames to minimize memory usage
- **WASM Integration**: Performance-critical operations (joins, sorting, grouping) compiled to WebAssembly
- **Type Safety**: Full TypeScript type inference and checking throughout the API

## Issues

If you encounter any problems or have feature requests, please open an issue on [GitHub](https://github.com/jtmenchaca/tidy-ts/issues).

## License

MIT
