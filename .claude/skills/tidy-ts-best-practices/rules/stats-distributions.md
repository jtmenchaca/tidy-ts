---
name: stats-distributions
description: 17 probability distributions under s.dist.* — each exposes density, probability (CDF), quantile (inverse CDF), random, and data (for plotting).
metadata:
  tags: stats, distributions, pdf, cdf, quantile, random, monte-carlo
---

# Probability distributions (`s.dist.*`)

All 17 distributions follow the same shape. Each exposes five functions:

- **`.density({ at, ..., returnLog? })`** — PDF (continuous) or PMF (discrete) at a point.
- **`.probability({ at, ..., direction?, returnLog? })`** — CDF: `P(X ≤ at)` (default `direction: 'below'`) or `P(X > at)` (`'above'`).
- **`.quantile({ probability, ..., direction?, probabilityIsLog? })`** — inverse CDF / critical value.
- **`.random({ ..., sampleSize? })`** — one draw or an array of `sampleSize` draws.
- **`.data({ ..., type: 'pdf' | 'cdf' | 'inverse_cdf', range?, points? })`** — DataFrame for plotting.

## The 17 distributions

| Distribution              | Required params for density/CDF                                                  |
|---------------------------|----------------------------------------------------------------------------------|
| `s.dist.normal`           | `at, mean?, standardDeviation?` (default standard normal)                        |
| `s.dist.t`                | `at, degreesOfFreedom`                                                           |
| `s.dist.chiSquare`        | `at, degreesOfFreedom`                                                           |
| `s.dist.f`                | `at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom`                     |
| `s.dist.beta`             | `at, alpha, beta`                                                                |
| `s.dist.gamma`            | `at, shape, rate?` (or `scale?`)                                                 |
| `s.dist.exponential`      | `at, rate`                                                                       |
| `s.dist.logNormal`        | `at, meanLog?, standardDeviationLog?`                                            |
| `s.dist.uniform`          | `at, minimum?, maximum?`                                                         |
| `s.dist.pareto`           | `at, scale, shape`                                                               |
| `s.dist.weibull`          | `at, shape, scale?`                                                              |
| `s.dist.binomial`         | `at, trials, probabilityOfSuccess`                                               |
| `s.dist.poisson`          | `at, rateLambda`                                                                 |
| `s.dist.geometric`        | `at, probabilityOfSuccess`                                                       |
| `s.dist.negativeBinomial` | `at, numberOfSuccesses, probabilityOfSuccess`                                    |
| `s.dist.hypergeometric`   | `at, populationSuccesses, populationFailures, drawSize`                          |
| `s.dist.wilcoxon`         | `at, sizeFirstSample, sizeSecondSample` (rank-sum distribution)                  |

## Canonical use cases

### PDF / PMF

```typescript
s.dist.normal.density({ at: 0 })                            // ≈ 0.3989
s.dist.normal.density({ at: 1.96, returnLog: true })        // log density (numerical stability)
s.dist.t.density({ at: 0, degreesOfFreedom: 10 })
s.dist.binomial.density({ at: 3, trials: 10, probabilityOfSuccess: 0.5 })  // P(X=3)
```

### CDF / right-tail p-values

```typescript
s.dist.normal.probability({ at: 0 })                        // 0.5
s.dist.normal.probability({ at: 1.96, direction: "above" }) // ≈ 0.025  (right-tail)
s.dist.t.probability({ at: 2.5, degreesOfFreedom: 15, direction: "above" })
```

Use `direction: 'above'` for right-tailed p-values, `'below'` for left-tailed.

### Critical values (inverse CDF)

```typescript
s.dist.normal.quantile({ probability: 0.95 })               // ≈ 1.645
s.dist.normal.quantile({ probability: 0.975 })              // ≈ 1.96
s.dist.t.quantile({ probability: 0.975, degreesOfFreedom: 20 })
```

### Random samples

```typescript
// Single draw
s.dist.normal.random()                                      // number
s.dist.normal.random({ mean: 5, standardDeviation: 2 })     // number

// Bulk draws — return type narrows to number[] when sampleSize is set
s.dist.normal.random({ sampleSize: 100 })                   // number[]
s.dist.normal.random({ mean: 5, standardDeviation: 2, sampleSize: 100 })
s.dist.binomial.random({ trials: 10, probabilityOfSuccess: 0.5, sampleSize: 1000 })

// Reproducible — pass `seed` (u32). Same seed → same sequence.
s.dist.normal.random({ sampleSize: 100, seed: 42 })
s.dist.poisson.random({ rateLambda: 3.2, sampleSize: 1000, seed: 7 })
```

For Monte Carlo simulations, bootstrap resampling, or synthetic data generation.

**Seeding**: every `.random(...)` accepts an optional `seed: number` (u32). With a seed, one RNG state advances across all draws within the call — same contract as R's `set.seed(s); rnorm(n)` and numpy's `default_rng(s).normal(size=n)`. Omit `seed` for non-deterministic draws via `thread_rng()`.

### Plotting data

```typescript
const pdfData = s.dist.normal.data({ mean: 0, standardDeviation: 1, type: "pdf" });
// DataFrame with x, density columns

const cdfData = s.dist.normal.data({
  mean: 0, standardDeviation: 1, type: "cdf", range: [-3, 3], points: 200,
});
// DataFrame with x, probability

const inv = s.dist.normal.data({ mean: 0, standardDeviation: 1, type: "inverse_cdf" });
// DataFrame with probability, quantile
```

Default range: `[-4, 4]` for pdf/cdf, `[0.01, 0.99]` for inverse_cdf, 100 points.

## Notes

- `returnLog: true` (on density/probability) and `probabilityIsLog: true` (on quantile) work in log-space for numerical stability.
- Discrete distributions (`binomial`, `poisson`, `geometric`, `negativeBinomial`, `hypergeometric`) return integer quantiles.
- The `.data({ type: "pdf" })` output uses `density` column for both PDFs and PMFs.

## Anti-patterns

- ❌ Using `s.dist.normal.probability` for the right-tail without `direction: 'above'` — you'll get `1 - p` numerical issues at extreme values.
- ❌ Building a DataFrame by hand to plot a distribution — use `s.dist.<name>.data(...)`.
- ❌ Calling `.random()` in a tight loop with `sampleSize: 1` — pass `sampleSize: N` once.
