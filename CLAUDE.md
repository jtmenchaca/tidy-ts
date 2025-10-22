# Tidy-TS Architecture


NOTE: MINIMIZE USE OF BASH FILES LIKE THIS when developing.  This requires custom approval every time. 
``` bash

cat > /Users/jtmenchaca/tidy-ts/tests/glm/realistic-demo.test.ts << 'EOF'
/**
 * GLM API Demonstration
 * 
 * Simple examples showing all GLM functionality.
 */

import { createDataFrame } from "../../mod.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";
import { expect } from "@std/expect";

Deno.test("GLM Demo 1: Logistic Regression", () => {
  console.log("\n=== Logistic Regression ===\n");

  const data = createDataFrame([
    { y: 0, x1: 1.2, x2: 3 },
    { y: 1, x1: 2.5, x2: 5 },
    { y: 0, x1: 1.8, x2: 2 },
    { y: 1, x1: 3.2, x2: 7 },
    { y: 1, x1: 2.9, x2: 6 },
    ...
```

Notes:
- When debugging an issue, use the root/tests/bugs directory and make a [issue].test.ts file using the style of our other tests. 
- FOR TESTS, use the -A flag for permissions 'deno test -A [test-name]' 
- Here's a demo of how the dataframe library works:
```typescript
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
      price: [100, 100, 100],
    },
  });

  console.log("Created DataFrames from both rows and columns ✓");
  console.log(`Columns DataFrame has ${salesFromColumns.nrows()} rows`);

  // Complete data analysis workflow
  // Note: When mixing functions with arrays/scalars, TypeScript may need explicit types
  const analysis = sales
    .mutate({
      revenue: (r) => r.quantity * r.price,
      status: ["Active", "Pending", "Active"], // Array values
      tax_rate: () => 0.08, // Scalar repeated for all rows (function for inference)
      category: (r) => r.quantity > 10 ? "High Volume" : "Standard",
    })
    .groupBy("region")
    .summarize({
      total_revenue: (group) => s.sum(group.revenue),
      avg_quantity: (group) => s.mean(group.quantity),
      product_count: (group) => group.nrows(),
    })
    .arrange("total_revenue", "desc");

  console.log("Data analysis workflow completed ✓");
  analysis.print();
  ```

## Code Style Guidelines
- **Function Parameters**: Use destructured named parameters instead of wrapper objects (e.g., `function({ path, width, height })` not `function(opts)`)
- **No Generic Names**: Avoid generic parameter names like `opts`, `params`, or `config` - use descriptive destructured parameters
- **File Length**: Try to keep files to less than 200 lines, maximum 300-400 lines. 


## Core Architecture
```
Rust (Core) → WASM → TypeScript (Interface) → Deno/Node.js
```

## Key Components
- **Rust**: Statistical algorithms (GLM, LM, tests)
- **WASM**: Rust compiled to WebAssembly (requires `deno task wasmbuild`)
- **TypeScript**: WASM bindings + DataFrame API
- **R**: Reference implementation for validation (in `R-stats/` directory)

## Build Commands
```bash
# Build Rust → WASM
deno task wasmbuild

# Run all CI tests
deno task ci

# Run regression tests
deno task test-regression

# Run statistical tests  
deno task test-stat-tests

# Run our compare-api for statistics (key api)

# Run all tests
deno task test-src

# Run benchmarks
deno task benchmark
```

## Project Structure

### 📁 `docs/` - Documentation Site
- **Vite + React** documentation site
- **Interactive examples** for each DataFrame operation
- **General docs**: Architecture, design philosophy, API design
- **Routes**: Getting started, data manipulation, stats, etc.

### 📁 `examples/` - Usage Examples
- **`dataframe/`**: 15+ comprehensive DataFrame examples
- **`benchmarksV2/`**: Performance comparisons (R, Python, TypeScript)
- **`docs-tests/`**: Documentation validation tests
- **`fixtures/`**: Sample CSV data files

### 📁 `src/dataframe/ts/` - TypeScript API
- **`dataframe/`**: Core DataFrame implementation
- **`verbs/`**: Data manipulation operations (filter, mutate, join, etc.)
- **`stats/`**: Statistical functions and tests
- **`wasm/`**: WASM bindings and helpers
- **`io/`**: Data input/output (CSV, JSON, Parquet, Arrow)
- **`utilities/`**: Helper functions and validation

### 📁 `src/dataframe/rust/` - Rust Core
- **`dataframe/`**: DataFrame operations (joins, pivots, aggregates)
- **`stats/`**: Statistical algorithms
  - **`distributions/`**: Probability distributions
  - **`regression/`**: GLM, LM, ANOVA models
    - **`family/`**: GLM family implementations (binomial, gaussian, etc.)
    - **`glm/`**: GLM fitting algorithms (IRLS, AIC, etc.)
    - **`lm/`**: Linear model implementations
    - **`tests/`**: R vs Rust comparison tests
  - **`statistical_tests/`**: Hypothesis testing
- **WASM bindings** for each module

## Test Structure
- **Rust Tests**: Unit tests in `src/dataframe/rust/`
- **Integration Tests**: R vs Rust comparison in `src/dataframe/rust/stats/regression/tests/`
- **WASM Tests**: TypeScript interface validation
- **Regression Tests**: GLM/LM model validation via `deno task test-regression`
- **Statistical Tests**: Hypothesis testing validation via `deno task test-stat-tests`
- **R Reference**: R code in `R-stats/` directory for validation
