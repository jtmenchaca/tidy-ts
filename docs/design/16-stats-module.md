# Stats Module

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Comprehensive statistical functions** | Organized by category: descriptive, aggregate, distributions, tests, correlation, ranking, window, cumulative. |
| **Work with summarize()** | Functions integrate seamlessly with `summarize()` for group aggregations. |
| **Type-safe** | TypeScript inference works correctly. Functions preserve types. |
| **Validated against R** | Statistical functions validated against R reference implementations for correctness. |
| **Fast performance** | Pure TypeScript for most functions, WASM for compute-heavy operations (GLM, some tests). |

## Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Descriptive** | mean, median, quantiles, variance, std dev | Basic statistics |
| **Aggregate** | sum, product, min, max | Simple aggregations |
| **Distributions** | PDF, CDF, quantiles | Probability distributions |
| **Tests** | t-test, chi-square, ANOVA, normality tests | Statistical hypothesis tests |
| **Correlation** | Pearson, Spearman | Correlation measures |
| **Ranking** | rank, percentile | Ranking operations |
| **Window** | rolling mean, rolling sum | Rolling statistics |
| **Cumulative** | cumsum, cummean | Cumulative operations |

## Integration

| Goal | Implementation |
|------|----------------|
| **Work with summarize()** | Functions can be used directly in `summarize()`: `summarize({ avg: g => mean(g.value) })` |
| **Standalone functions** | Also available as standalone functions: `mean([1, 2, 3])` |
| **Type inference** | TypeScript infers types correctly through statistical operations. |

## Implementation

| Goal | Implementation |
|------|----------------|
| **Performance** | Pure TypeScript for most functions (fast enough). WASM for GLM and some tests (compute-heavy). |
| **Correctness** | Validated against R implementations. Ensures statistical accuracy. |
