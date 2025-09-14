# Tidy-TS

Type-safe data analytics and statistics framework for TypeScript. Built for modern data science workflows with compile-time safety that prevents 15-38% of production bugs.

## Key Features

- **Type-Safe DataFrames**: Full TypeScript support with automatic column typing
- **Comprehensive Analytics**: Group, aggregate, join, reshape, and analyze data
- **Statistical Functions**: Built-in statistical operations with R/Python compatibility
- **High Performance**: Columnar storage with WASM-backed operations for critical paths
- **Method Chaining**: Intuitive fluent API for complex data transformations
- **Missing Data Handling**: Robust handling of null/undefined values

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
import { createDataFrame, stats } from "@tidy-ts/dataframe";

// Create a DataFrame
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
## Core Operations

### DataFrame Creation & Basics
- `createDataFrame()` - Create from objects
- `nrows()`, `ncols()` - Dimensions
- `columns()` - Schema info
- Direct column access via `df.columnName`

### Data Manipulation
- `select()`, `drop()` - Column selection
- `filter()`, `slice()` - Row filtering
- `mutate()` - Add/transform columns
- `arrange()` - Sort data
- `distinct()` - Unique rows

### Aggregation & Grouping
- `groupBy()` - Group by columns
- `summarize()` - Aggregate groups

### Joins & Reshaping
- `innerJoin()`, `leftJoin()`, `rightJoin()`, `outerJoin()`
- `pivotLonger()`, `pivotWider()` - Reshape data
- `bindRows()` - Concatenate DataFrames

## Documentation

Visit our [documentation website](https://jtmenchaca.github.io/tidy-ts/) for comprehensive tutorials and API reference.

## Examples

See the [documentation](https://jtmenchaca.github.io/tidy-ts/) for comprehensive tutorials:

- Basic operations and DataFrame creation
- Column selection and filtering
- Data transformation and text processing
- Grouping and aggregation
- Joining and reshaping data
- Statistical analysis
- Advanced features


## Architecture

- **Columnar Storage**: Memory-efficient column-major storage
- **Lazy Evaluation**: Views use BitSet masks for copy-free operations
- **WASM Integration**: Performance-critical operations in Rust/WASM
- **Type Safety**: Full TypeScript type inference and checking

## Issues

If you encounter any problems or have feature requests, please open an issue on [GitHub](https://github.com/jtmenchaca/tidy-ts/issues).

## License

MIT