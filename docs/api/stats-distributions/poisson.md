# Poisson

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.poisson.density](#sdistpoissondensity)
- [s.dist.poisson.probability](#sdistpoissonprobability)
- [s.dist.poisson.quantile](#sdistpoissonquantile)
- [s.dist.poisson.random](#sdistpoissonrandom)
- [s.dist.poisson.data](#sdistpoissondata)

---

## s.dist.poisson.density

Poisson distribution probability mass function (PMF). Used for modeling counts of rare events in fixed intervals.

### Signature

```typescript
s.dist.poisson.density({ at, rateLambda, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where PMF is evaluated (count k, must be non-negative integer)
- `rateLambda: number` - Rate parameter (λ > 0), mean number of events
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Probability value or log probability

### Examples

```typescript
const pmf = s.dist.poisson.density({ at: 3, rateLambda: 2 });
// P(X=3) when λ=2
const logPmf = s.dist.poisson.density({ at: 5, rateLambda: 3, returnLog: true });
```

### Best Practices

- Use for modeling rare event counts
- Mean = Variance = λ
- Approximates binomial when n is large and p is small

### Related

`s.dist.poisson.probability`, `s.dist.poisson.quantile`, `s.dist.poisson.random`, `s.dist.binomial.density`

---

## s.dist.poisson.probability

Poisson distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.poisson.probability({ at, rateLambda, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated (count k)
- `rateLambda: number` - Rate parameter (λ > 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.poisson.probability({ at: 3, rateLambda: 2 });
// P(X ≤ 3) when λ=2
const pValue = s.dist.poisson.probability({ at: 5, rateLambda: 3, direction: 'above' });
```

### Best Practices

- Use for calculating p-values in Poisson tests
- Use for finding probabilities of observing at most/least k events

### Related

`s.dist.poisson.density`, `s.dist.poisson.quantile`, `s.dist.poisson.random`

---

## s.dist.poisson.quantile

Poisson distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.

### Signature

```typescript
s.dist.poisson.quantile({ probability, rateLambda, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `rateLambda: number` - Rate parameter (λ > 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (non-negative integer)

### Examples

```typescript
const median = s.dist.poisson.quantile({ probability: 0.5, rateLambda: 3 });
const q95 = s.dist.poisson.quantile({ probability: 0.95, rateLambda: 5 });
```

### Best Practices

- Use for finding percentiles of event counts
- Returns integer values (discrete distribution)

### Related

`s.dist.poisson.density`, `s.dist.poisson.probability`, `s.dist.poisson.random`

---

## s.dist.poisson.random

Generate random samples from Poisson distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.poisson.random({ rateLambda, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `rateLambda: number` - Rate parameter (λ > 0)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the Poisson distribution (non-negative integers)

### Examples

```typescript
const single = s.dist.poisson.random({ rateLambda: 2 });
const sample = s.dist.poisson.random({ rateLambda: 5, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic count data
- Use for simulating rare events

### Related

`s.dist.poisson.density`, `s.dist.poisson.probability`, `s.dist.poisson.quantile`

---

## s.dist.poisson.data

Generate data for Poisson distribution visualization. Returns a DataFrame with PMF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.poisson.data({ rateLambda, type, range?, points? }): DataFrame
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `rateLambda: number` - Rate parameter
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 20] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.poisson.data({ rateLambda: 3, type: 'pdf' });
const cdfData = s.dist.poisson.data({ rateLambda: 5, type: 'cdf', range: [0, 15] });
```

### Best Practices

- Use for plotting Poisson distribution curves
- Note: discrete distribution, values are integers

### Related

`s.dist.poisson.density`, `s.dist.poisson.probability`, `s.dist.poisson.quantile`

---
