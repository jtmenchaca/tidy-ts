# Gamma

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.gamma.density](#sdistgammadensity)
- [s.dist.gamma.probability](#sdistgammaprobability)
- [s.dist.gamma.quantile](#sdistgammaquantile)
- [s.dist.gamma.random](#sdistgammarandom)
- [s.dist.gamma.data](#sdistgammadata)

---

## s.dist.gamma.density

Gamma distribution density function (PDF). Used for modeling waiting times and positive continuous data.

### Signature

```typescript
s.dist.gamma.density({ at, shape, rate?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (must be > 0)
- `shape: number` - Shape parameter (α > 0)
- `rate?: number` - Rate parameter (β > 0, default: 1)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.gamma.density({ at: 2.0, shape: 2, rate: 1 });
const logPdf = s.dist.gamma.density({ at: 5.0, shape: 3, rate: 0.5, returnLog: true });
// Exponential when shape=1
```

### Best Practices

- Use for modeling waiting times and durations
- shape=1 gives exponential distribution
- Mean = shape/rate, Variance = shape/rate²

### Related

`s.dist.gamma.probability`, `s.dist.gamma.quantile`, `s.dist.gamma.random`, `s.dist.exponential.density`

---

## s.dist.gamma.probability

Gamma distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.gamma.probability({ at, shape, rate?, direction?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `shape: number` - Shape parameter (α > 0)
- `rate?: number` - Rate parameter (β > 0, default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.gamma.probability({ at: 2.0, shape: 2, rate: 1 });
const pValue = s.dist.gamma.probability({ at: 5.0, shape: 3, rate: 0.5, direction: 'above' });
```

### Best Practices

- Use for survival analysis
- Use for reliability modeling

### Related

`s.dist.gamma.density`, `s.dist.gamma.quantile`, `s.dist.gamma.random`

---

## s.dist.gamma.quantile

Gamma distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.

### Signature

```typescript
s.dist.gamma.quantile({ probability, shape, rate?, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `shape: number` - Shape parameter (α > 0)
- `rate?: number` - Rate parameter (β > 0, default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (x > 0)

### Examples

```typescript
const median = s.dist.gamma.quantile({ probability: 0.5, shape: 2, rate: 1 });
const q95 = s.dist.gamma.quantile({ probability: 0.95, shape: 3, rate: 0.5 });
```

### Best Practices

- Use for finding percentiles of waiting times
- Use for generating random positive values

### Related

`s.dist.gamma.density`, `s.dist.gamma.probability`, `s.dist.gamma.random`

---

## s.dist.gamma.random

Generate random samples from gamma distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.gamma.random({ shape, rate?, sampleSize? }): number | number[]
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `shape: number` - Shape parameter (α > 0)
- `rate?: number` - Rate parameter (β > 0, default: 1)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the gamma distribution (values > 0)

### Examples

```typescript
const single = s.dist.gamma.random({ shape: 2, rate: 1 });
const sample = s.dist.gamma.random({ shape: 3, rate: 0.5, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic waiting time data
- Use for Monte Carlo simulations

### Related

`s.dist.gamma.density`, `s.dist.gamma.probability`, `s.dist.gamma.quantile`

---

## s.dist.gamma.data

Generate data for gamma distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.gamma.data({ shape, rate, type, range?, points? }): DataFrame
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `shape: number` - Shape parameter
- `rate: number` - Rate parameter
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 10] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.gamma.data({ shape: 2, rate: 1, type: 'pdf' });
const cdfData = s.dist.gamma.data({ shape: 3, rate: 0.5, type: 'cdf', range: [0, 20] });
```

### Best Practices

- Use for plotting gamma distribution curves
- Note: distribution is only defined for x > 0

### Related

`s.dist.gamma.density`, `s.dist.gamma.probability`, `s.dist.gamma.quantile`

---
