# Tidy-TS

[![JSR](https://jsr.io/badges/@tidy-ts/dataframe)](https://jsr.io/@tidy-ts/dataframe)
[![JSR Score](https://jsr.io/badges/@tidy-ts/dataframe/score)](https://jsr.io/@tidy-ts/dataframe)

Type-safe data analytics and statistics framework for TypeScript. Built for modern data science workflows with compile-time safety, known to prevent 15-38% of production bugs.

## Key Features

- **Type-Safe DataFrames**: Full TypeScript support with automatic column typing
- **Async Operations**: Built-in support for asynchronous data transformations with concurrency control
- **CSV & Data Import**: Read CSV files with Zod schema validation and error handling
- **Comprehensive Analytics**: Group, aggregate, join, reshape, and analyze data
- **Statistical Functions**: 25+ statistical operations with R/Python compatibility
- **Data Reshaping**: Pivot, transpose, and melt operations with type safety
- **High Performance**: Columnar storage with WASM-backed operations for critical paths
- **Method Chaining**: Intuitive fluent API for complex data transformations
- **Missing Data Handling**: Robust handling of null/undefined values with smart imputation
- **Extract Methods**: Flexible ways to get specific values from columns

## Installation

Choose your package manager:

```bash
# Deno
deno add jsr:@tidy-ts/dataframe

# npm
npx jsr add @tidy-ts/dataframe

# pnpm
pnpm add jsr:@tidy-ts/dataframe

# yarn
yarn add jsr:@tidy-ts/dataframe

# bun
bunx jsr add @tidy-ts/dataframe
```

## Quick Start

```typescript
import { createDataFrame, stats, read_csv } from "@tidy-ts/dataframe";
import { z } from "zod";

// Create a DataFrame with type safety
const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "North", product: "Gadget", quantity: 5, price: 200 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "South", product: "Gadget", quantity: 15, price: 200 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
]);

// Complete data analysis workflow
const analysis = sales
  .mutate({ 
    revenue: r => r.quantity * r.price,
    category: r => r.quantity > 10 ? "High Volume" : "Standard"
  })
  .groupBy("region")
  .summarize({
    total_revenue: (group) => stats.sum(group.revenue),
    avg_quantity: (group) => stats.mean(group.quantity),
    product_count: (group) => group.nrows()
  })
  .arrange("total_revenue", "desc");

analysis.print();
```

## Advanced Features

### Async Operations with Concurrency Control
```typescript
// Async data transformations with built-in concurrency control
const enrichedData = await sales
  .mutate({
    // Mix sync and async operations
    revenue: r => r.quantity * r.price, // sync
    market_data: async r => await fetchMarketData(r.region), // async
  }, { concurrency: 3 }) // Limit concurrent operations
  .filter(async r => await validateRegion(r.region)); // async filtering
```

### CSV Reading with Zod Validation
```typescript
// Read CSV with schema validation and error handling
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
  score: z.number().nullable(),
});

const data = await read_csv(csvString, PersonSchema, {
  naValues: ["", "N/A"] // Handle missing values
});
```

### Data Reshaping Operations
```typescript
// Pivot data from long to wide format
const wideData = salesLong.pivotWider({
  names_from: "product",
  values_from: "sales",
  expected_columns: ["Widget A", "Widget B"]
});

// Transpose data with type safety
const transposed = quarterlyData.transpose({ number_of_rows: 4 });

// Melt data from wide to long format
const longData = wideData.pivotLonger({
  cols: ["math", "science", "english"],
  names_to: "subject",
  values_to: "score"
});
```
## Core Operations

### DataFrame Creation & Basics
- `createDataFrame()` - Create from objects with type inference
- `read_csv()` - Read CSV with Zod schema validation
- `nrows()`, `ncols()` - Dimensions
- `columns()` - Schema info
- Direct column access via `df.columnName`

### Data Manipulation
- `select()`, `drop()` - Column selection
- `filter()`, `slice()` - Row filtering (sync & async)
- `mutate()` - Add/transform columns (sync & async)
- `arrange()` - Sort data
- `distinct()` - Unique rows
- `replaceNA()` - Handle missing data with smart imputation

### Aggregation & Grouping
- `groupBy()` - Group by columns
- `summarize()` - Aggregate groups (sync & async)

### Joins & Reshaping
- `innerJoin()`, `leftJoin()`, `rightJoin()`, `outerJoin()` - Multi-key joins
- `pivotLonger()`, `pivotWider()` - Reshape data with type safety
- `transpose()` - Flip rows and columns with metadata preservation
- `bindRows()` - Concatenate DataFrames

### Statistical Functions
- **Descriptive**: `mean()`, `median()`, `mode()`, `stdev()`, `variance()`
- **Quantiles**: `quantile()`, `percentileRank()`, `iqr()`
- **Ranking**: `rank()`, `denseRank()`
- **Cumulative**: `cumsum()`, `cummean()`, `cummin()`, `cummax()`
- **Window**: `lag()`, `lead()`
- **Correlation**: `corr()`, `covariance()`

### Extract Methods
- `extract()` - Get all values from a column
- `extractHead()`, `extractTail()` - Get first/last n values
- `extractNth()` - Get value at specific index
- `extractSample()` - Get random sample

## Documentation

Visit our [documentation website](https://jtmenchaca.github.io/tidy-ts/) for comprehensive tutorials and API reference.

## Examples

See the [documentation](https://jtmenchaca.github.io/tidy-ts/) for comprehensive tutorials:

- **Getting Started**: Basic operations and DataFrame creation
- **Data Manipulation**: Column selection, filtering, and transformation
- **Async Operations**: Asynchronous data processing with concurrency control
- **CSV & Validation**: Reading CSV files with Zod schema validation
- **Grouping & Aggregation**: Advanced grouping and statistical summaries
- **Joining Data**: Multi-key joins with type safety
- **Reshaping Data**: Pivot, transpose, and melt operations
- **Statistical Analysis**: 25+ statistical functions
- **Missing Data**: Smart handling and imputation strategies
- **Performance**: Benchmarks and optimization techniques


## Architecture

- **Columnar Storage**: Memory-efficient column-major storage
- **Lazy Evaluation**: Views use BitSet masks for copy-free operations
- **WASM Integration**: Performance-critical operations in Rust/WASM
- **Type Safety**: Full TypeScript type inference and checking

## Issues

If you encounter any problems or have feature requests, please open an issue on [GitHub](https://github.com/jtmenchaca/tidy-ts/issues).

## License

MIT