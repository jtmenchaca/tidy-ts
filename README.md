# Tidy-TS

[![JSR](https://jsr.io/badges/@tidy-ts/dataframe)](https://jsr.io/@tidy-ts/dataframe)
[![JSR Score](https://jsr.io/badges/@tidy-ts/dataframe/score)](https://jsr.io/@tidy-ts/dataframe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe data analytics and statistics framework for TypeScript. Built for modern data science workflows with compile-time safety, known to prevent 15-38% of production bugs.

## Key Features

- **Type-Safe DataFrames**: Full TypeScript support with automatic column typing
- **Async Operations**: Built-in support for asynchronous data transformations with concurrency control
- **Multi-Format Data Import**: Read CSV, Parquet, and Arrow files with Zod schema validation
- **Data Analytics**: Group, aggregate, join, reshape, and analyze data
- **Statistics Toolkit**: 80+ functions across descriptive statistics, hypothesis testing, and standard distributions functions
- **Data Visualization**: Create charts with an integrated API backed by Vega
- **Interactive Charts**: Jupyter notebook integration with hover tooltips
- **Data Reshaping**: Pivot wider, pivot longer, and transpose with type safety
- **High Performance**: Columnar storage with WASM-backed operations for critical paths
- **Method Chaining**: Fluent API for data transformations

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

// Then use normally
const df = createDataFrame([{a: 1, b: 2}, {a: 3, b: 4}]);
const sum = stats.sum(df.a); // 4
```

> **Note**: `setupTidyTS()` is only needed in browsers. Node.js and Deno work without any setup.

## Quick Start
```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";  
// import { createDataFrame, s } from "@tidy-ts/dataframe" works as well

// Create DataFrame from rows
const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
]);

// Or create DataFrame from columns
const salesFromColumns = createDataFrame({
  columns: {
    region: ["North", "South", "East"],
    product: ["Widget", "Widget", "Widget"], 
    quantity: [10, 20, 8],
    price: [100, 100, 100]
  }
});

// Complete data analysis workflow
const analysis = sales
  .mutate({ 
    // Use 'row' to access a neatly typed row while defining new columns - no type casting needed
    revenue: (row) => row.quantity * row.price,

    // Use standard function syntax for more complicated calculations.  The DataFrame will keep track of the types. 
    totalTax: (row) => {
      const taxRate = 0.08;
      const taxPerItem = taxRate * row.price;
      const totalTax = taxPerItem * row.quantity;
      return totalTax
    },

    // Use 'index' to get the current row number, sometimes helpful for indexing into external arrays
    row_number: (_row, index) => index,
    
    // Use 'df' to access the entire DataFrame when needed for a calculation
    moreQuantityThanAvg: (row, _index, df) => row.quantity > s.mean(df.quantity)
  })
  .groupBy("region")
  .summarize({
    total_revenue: (group) => s.sum(group.revenue),
    avg_quantity: (group) => s.mean(group.quantity),
    product_count: (group) => group.nrows() // We have some helpers to calculate commonly needed values
  })
  .arrange("total_revenue", "desc");

// Pretty print the table with the .print() method
analysis.print("Sales Analysis");
```

## Statistical Analysis
Tidy-TS provides a statistical toolkit with 80+ functions across descriptive stats, hypothesis testing, and probability distributions.

### Descriptive stats
- **Descriptive**: `s.mean()`, `s.median()`, `s.mode()`, `s.stdev()`, `s.variance()`, `s.min()`, `s.max()`, `s.range()`
- **Quantiles**: `s.quantile()`, `s.percentileRank()`, `s.iqr()`, `s.quartiles()`
- **Ranking**: `s.rank()`, `s.denseRank()`, `s.percentileRank()`
- **Cumulative**: `s.cumsum()`, `s.cummean()`, `s.cummin()`, `s.cummax()`, `s.cumprod()`
- **Window**: `s.lag()`, `s.lead()`

### Hypothesis testing
The library provides many of the commonly needed statistical tests for routine analytics.  These can at times be challenging to navigate for those who are new to statistics, so the library also provides a custom-designed comparison API designed to help you perform the analysis best suited to your needs.  In either approach, you'll receive a neatly typed test result at the end.

All tests available are rigorously vetted against results in R using testing against randomly generated data.  You can find the comparison suites on [GitHub](https://github.com/jtmenchaca/tidy-ts). 

```typescript
// Compare API
const heights = [170, 165, 180, 175, 172, 168];
const testResult = s.compare.oneGroup.centralTendency.toValue({
  data: heights,
  hypothesizedValue: 170,
  parametric: "parametric" // Use "auto" for help deciding if parametric or non-parametric is best
}); 
console.log(testResult);

// {
//   test_name: "One-sample t-test",
//   p_value: 0.47...,
//   effect_size: { value: 0.31..., name: "Cohen's D" },
//   test_statistic: { value: 0.76..., name: "T-Statistic" },
//   confidence_interval: {
//     lower: 166.08...,
//     upper: 177.24...,
//     confidence_level: 0.95
//   },
//   degrees_of_freedom: 5,
//   alpha: 0.05
// } 

  const group1 = [23, 45, 67, 34, 56, 78, 29, 41, 52, 38]; // Hours spent studying per week
  const group2 = [78, 85, 92, 73, 88, 95, 69, 81, 89, 76]; // Final exam scores
  const groupComparison = s.compare.twoGroups.association.toEachOther({
    x: group1,
    y: group2,
    method: "pearson", // Use "auto" for help choosing the right correlation test
  });
  console.log(groupComparison);

// Two-group comparison result: {
//   test_name: "Pearson correlation test",
//   p_value: 0.0003...,
//   effect_size: { value: 0.90..., name: "Pearson's R" },
//   test_statistic: { value: 5.95..., name: "T-Statistic" },
//   confidence_interval: {
//     lower: 0.63...,
//     upper: 0.97...,
//     confidence_level: 0.95
//   },
//   degrees_of_freedom: 8,
//   alpha: 0.05
// }

// Here are the various functions that the compare API exposes for use.  
// Each has various options to help both beginner and experienced users feel confident in what they're getting.
s.compare.oneGroup.centralTendency.toValue(...)
s.compare.oneGroup.proportions.toValue(...)
s.compare.oneGroup.distribution.toNormal(...)
s.compare.twoGroups.centralTendency.toEachOther(...)
s.compare.twoGroups.association.toEachOther(...)
s.compare.twoGroups.proportions.toEachOther(...)
s.compare.twoGroups.distributions.toEachOther(...)
s.compare.multiGroups.centralTendency.toEachOther(...)
s.compare.multiGroups.proportions.toEachOther(...)


// If you'd prefer to have the specific test instead, we provide that via the test API as well. 
const oneSampleT = s.test.t.oneSample({ data, mu: 100, alternative: "two-sided", alpha: 0.05 });
const independentT = s.test.t.independent({ x: group1, y: group2, alpha: 0.05 });
const pairedT = s.test.t.paired({ x: before, y: after, alpha: 0.05 });
const anovaResult = s.test.anova.oneWay([group1, group2, group3], 0.05);
const mannWhitney = s.test.nonparametric.mannWhitney(group1, group2, 0.05);
const kruskalWallis = s.test.nonparametric.kruskalWallis([group1, group2], 0.05);
const pearsonTest = s.test.correlation.pearson(x, y, "two-sided", 0.05);
const shapiroWilk = s.test.normality.shapiroWilk(data, 0.05);
```

### Probability Distributions
The library also provides 16 probability distributions, each with functions for random values, density, probability, quantile, and data generation. 

**Continuous distributions:** normal, beta, gamma, exponential, chi-square, t, F, uniform, Weibull, log-normal, and Wilcoxon
**Discrete distributions:** binomial, Poisson, geometric, negative binomial, and hypergeometric.

```typescript
import { s } from "@tidy-ts/dataframe";

// Individual distribution functions
const randomValue = s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 10 });        // Random sample
const density = s.dist.normal.density({ at: 0, mean: 0, standardDeviation: 1});        // PDF at x=0
const probability = s.dist.normal.probability({ at: 1.96, mean: 0, standardDeviation: 1 });  // CDF (P-value)
const quantile = s.dist.normal.quantile({ probability: 0.975, mean: 0, standardDeviation: 1 });  // Critical value

// Generate distribution data for visualization
const normalPDFData = s.dist.normal.data({
  mean: 0,
  standardDeviation: 2,
  type: "pdf",
  range: [-4, 4],
  points: 100,
});

// Other distributions: beta, gamma, exponential, chi-square, t, f, uniform,
// weibull, binomial, poisson, geometric, hypergeometric, and more
const betaSample = s.dist.beta.random({ alpha: 2, beta: 5 });
const chiSquareQuantile = s.dist.chiSquare.quantile({ probability: 0.95, degreesOfFreedom: 1 });
```

## Data Visualization
'@tidy-ts/dataframe' also provides data visualization tools directly from DataFrames backed by [Vega](https://vega.github.io):

```typescript
// Interactive scatter plot with configuration
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
      layout: {
        title: "Sales Analysis",
        description: "Revenue vs quantity by region, sized by profit",
        width: 700,
        height: 400,
      },
      xAxis: {
        label: "Revenue ($)",
        domain: [0, 2200],
      },
      yAxis: {
        label: "Quantity",
        domain: [0, 25],
      },
      scatter: {
        pointSize: 100,
        pointOpacity: 0.8,
      },
      color: { scheme: "professional" },
      legend: {
        show: true,
        position: "right",
      },
      grid: {
        show: true,
      },
    }
  });

// Export charts as PNG or SVG
await chart.savePNG({ filename: "sales-chart.png" });
await chart.saveSVG({ filename: "sales-chart.svg" });
```

**Chart Types**: scatter, line, bar, area  
**Aesthetics**: color, size, series, tooltips, legends  
**Styling**: 9 color schemes, custom themes, interactive features

### Interactive Charts in Jupyter + Deno
When using Deno and Jupyter notebooks, charts become interactive with hover tooltips:

```typescript
// Interactive chart with tooltips (Jupyter only)
const interactiveChart = salesData.graph({
  type: "scatter",
  mappings: { x: "revenue", y: "quantity", color: "region" },
  config: {
    layout: {
      tooltip: {
        show: true, // default true
      },
    },
    tooltip: {
      fields: ["region", "revenue", "quantity", "profit", "product"],
    },
  },
});

interactiveChart // Chart displays interactively in Jupyter cell
```

## Other Features

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

### CSV, Parquet, and Arrow Reading with Zod Validation
```typescript
import {readCSV, readParquet, readArrow } from "@tidy-ts/dataframe"
// Read CSV with schema validation and error handling
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
  score: z.number().nullable(),
});

const dataCSV = await readCSV(pathToCSV, PersonSchema); // uses @std/csv
const dataParquet = await readParquet(pathToParquet, PersonSchema); // uses hyparquet, only available server-side
const dataArrow = await readArrow(pathToArrow, PersonSchema); // uses @uwdata/flechette

// You can also write to CSV and Parquet
import {writeCSV, writeParquet} from "@tidy-ts/dataframe"

const dataframe = createDataFrame([
  { name: "Alice", age: 30, city: "New York", score: 95 },
  { name: "Bob", age: 25, city: "San Francisco", score: 87 },
])

await writeCSV(dataframe, pathToSaveCSV);
await writeParquet(dataframe, pathToSaveParquet); // uses hyparquet-writer, only available server-side
// No support for writing Arrow
```

### Data Reshaping Operations
```typescript
// Spread data from long to wide format
const wideData = salesLong.pivotWider({
  names_from: "product",
  values_from: "sales",
  expected_columns: ["Widget A", "Widget B"] // Needed to maintain typing, can be used without it though if necessary
});

// Transpose data with type safety
const transposed = quarterlyData.transpose({ number_of_rows: 4 }); // Number of rows argument needed to help keep type safety

// Convert data from wide to long format
const longData = wideData.pivotLonger({
  cols: ["math", "science", "english"],
  names_to: "subject",
  values_to: "score"
});
```
## Core Operations

### DataFrame Creation & Basics
- `createDataFrame([...])` - Create from row objects with type inference
- `createDataFrame({ columns: {...} })` - Create from column arrays
- `readCSV(), readParquet(), and readArrow()` - Read CSV, parquet, and arrow all with Zod schema validation for strong typing
- `nrows()`, `ncols()` - Dimensions
- `columns()` - Schema info
- `df.columnName` - Direct readonly access to column arrays (faster)
- `extract()`, `extractHead()`, `extractTail()`, `extractNth()`, `extractSample()` - Extract mutable copies of column values

### Data Manipulation
- `select()`, `drop()` - Column selection
- `filter()`, `slice()` - Row filtering (sync & async)
- `mutate()` - Add/transform columns with functions, arrays, or scalars (sync & async)
- `arrange()` - Sort data
- `distinct()` - Unique rows
- `replaceNA()` - Handle missing data with smart imputation

### Aggregation & Grouping
- `groupBy()` - Group by columns
- `summarize()` - Aggregate groups (sync & async)

### Joins & Reshaping
- `innerJoin()`, `leftJoin()`, `rightJoin()`, `outerJoin()` - Multi-key joins
- `pivotLonger()`, `pivotWider()` - Reshape data with type safety
- `transpose()` - Flip rows and columns with type safety
- `bindRows()` - Concatenate DataFrames


## Documentation
Visit our [documentation website](https://jtmenchaca.github.io/tidy-ts/) for tutorials and API reference.

## Architecture
- **Columnar Storage**: Memory-efficient column-major storage
- **Lazy Evaluation**: Views use BitSet masks for copy-free operations
- **WASM Integration**: Performance-critical operations in Rust/WASM
- **Type Safety**: Full TypeScript type inference and checking

## Issues
If you encounter any problems or have feature requests, please open an issue on [GitHub](https://github.com/jtmenchaca/tidy-ts/issues).

## License
MIT