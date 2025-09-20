# Tidy-TS Architecture

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

# Run regression tests
deno task test-regression

# Run statistical tests  
deno task test-stat-tests

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
