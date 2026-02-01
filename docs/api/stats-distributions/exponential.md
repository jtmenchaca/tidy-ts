# Exponential

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.exponential.density](#sdistexponentialdensity)
- [s.dist.exponential.probability](#sdistexponentialprobability)
- [s.dist.exponential.quantile](#sdistexponentialquantile)
- [s.dist.exponential.random](#sdistexponentialrandom)
- [s.dist.exponential.data](#sdistexponentialdata)

---

## s.dist.exponential.density

Exponential distribution density function (PDF). Used for modeling waiting times between events (memoryless property).

### Signature

```typescript
s.dist.exponential.density({ at, rate?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (must be ≥ 0)
- `rate?: number` - Rate parameter (λ > 0, default: 1). Mean = 1/rate
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.exponential.density({ at: 2.0, rate: 0.5 });
const logPdf = s.dist.exponential.density({ at: 1.0, rate: 1, returnLog: true });
// Mean waiting time = 1/rate
```

### Best Practices

- Use for modeling time between events in Poisson processes
- Memoryless property: P(X > s+t | X > s) = P(X > t)
- Mean = 1/rate, Variance = 1/rate²

### Related

`s.dist.exponential.probability`, `s.dist.exponential.quantile`, `s.dist.exponential.random`, `s.dist.poisson.density`

---

## s.dist.exponential.probability

Exponential distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.exponential.probability({ at, rate?, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `rate?: number` - Rate parameter (λ > 0, default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.exponential.probability({ at: 2.0, rate: 0.5 });
const survival = s.dist.exponential.probability({ at: 3.0, rate: 1, direction: 'above' });
// P(X > 3) = e^(-3) ≈ 0.05
```

### Best Practices

- Use for survival analysis
- Use for reliability modeling
- P(X > t) = e^(-rate × t)

### Related

`s.dist.exponential.density`, `s.dist.exponential.quantile`, `s.dist.exponential.random`

---

## s.dist.exponential.quantile

Exponential distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.

### Signature

```typescript
s.dist.exponential.quantile({ probability, rate?, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `rate?: number` - Rate parameter (λ > 0, default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (x ≥ 0)

### Examples

```typescript
const median = s.dist.exponential.quantile({ probability: 0.5, rate: 1 });
// Median = ln(2)/rate ≈ 0.693
const q95 = s.dist.exponential.quantile({ probability: 0.95, rate: 0.5 });
```

### Best Practices

- Use for finding percentiles of waiting times
- Use for generating random waiting times

### Related

`s.dist.exponential.density`, `s.dist.exponential.probability`, `s.dist.exponential.random`

---

## s.dist.exponential.random

Generate random samples from exponential distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.exponential.random({ rate?, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `rate?: number` - Rate parameter (λ > 0, default: 1)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the exponential distribution (values ≥ 0)

### Examples

```typescript
const single = s.dist.exponential.random();
const sample = s.dist.exponential.random({ rate: 0.5, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic waiting time data
- Use for simulating Poisson processes

### Related

`s.dist.exponential.density`, `s.dist.exponential.probability`, `s.dist.exponential.quantile`

---

## s.dist.exponential.data

Generate data for exponential distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.exponential.data({ rate, type, range?, points? }): DataFrame
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `rate: number` - Rate parameter
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 10] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.exponential.data({ rate: 1, type: 'pdf' });
const cdfData = s.dist.exponential.data({ rate: 0.5, type: 'cdf', range: [0, 20] });
```

### Best Practices

- Use for plotting exponential distribution curves
- Note: distribution is only defined for x ≥ 0

### Related

`s.dist.exponential.density`, `s.dist.exponential.probability`, `s.dist.exponential.quantile`

---
