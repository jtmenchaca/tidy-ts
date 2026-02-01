# Weibull

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.weibull.density](#sdistweibulldensity)
- [s.dist.weibull.probability](#sdistweibullprobability)
- [s.dist.weibull.quantile](#sdistweibullquantile)
- [s.dist.weibull.random](#sdistweibullrandom)
- [s.dist.weibull.data](#sdistweibulldata)

---

## s.dist.weibull.density

Weibull distribution density function (PDF). Used for modeling failure times and reliability analysis.

### Signature

```typescript
s.dist.weibull.density({ at, shape, scale?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (must be ≥ 0)
- `shape: number` - Shape parameter (k > 0). Controls the distribution shape
- `scale?: number` - Scale parameter (λ > 0, default: 1). Characteristic scale
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.weibull.density({ at: 2.0, shape: 2, scale: 1 });
const logPdf = s.dist.weibull.density({ at: 5.0, shape: 1.5, scale: 3, returnLog: true });
// Exponential when shape=1
```

### Best Practices

- Use for reliability and survival analysis
- shape=1 gives exponential distribution
- shape<1: decreasing hazard, shape>1: increasing hazard
- Mean = scale × Γ(1 + 1/shape)

### Related

`s.dist.weibull.probability`, `s.dist.weibull.quantile`, `s.dist.weibull.random`, `s.dist.exponential.density`

---

## s.dist.weibull.probability

Weibull distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.weibull.probability({ at, shape, scale?, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `shape: number` - Shape parameter (k > 0)
- `scale?: number` - Scale parameter (λ > 0, default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.weibull.probability({ at: 2.0, shape: 2, scale: 1 });
const survival = s.dist.weibull.probability({ at: 5.0, shape: 1.5, scale: 3, direction: 'above' });
// P(X > 5) = survival function
```

### Best Practices

- Use for survival analysis
- Use for reliability modeling
- P(X > t) = exp(-(t/scale)^shape)

### Related

`s.dist.weibull.density`, `s.dist.weibull.quantile`, `s.dist.weibull.random`

---

## s.dist.weibull.quantile

Weibull distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.

### Signature

```typescript
s.dist.weibull.quantile({ probability, shape, scale?, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `shape: number` - Shape parameter (k > 0)
- `scale?: number` - Scale parameter (λ > 0, default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (x ≥ 0)

### Examples

```typescript
const median = s.dist.weibull.quantile({ probability: 0.5, shape: 2, scale: 1 });
const q95 = s.dist.weibull.quantile({ probability: 0.95, shape: 1.5, scale: 3 });
```

### Best Practices

- Use for finding percentiles of failure times
- Use for reliability calculations

### Related

`s.dist.weibull.density`, `s.dist.weibull.probability`, `s.dist.weibull.random`

---

## s.dist.weibull.random

Generate random samples from Weibull distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.weibull.random({ shape, scale?, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `shape: number` - Shape parameter (k > 0)
- `scale?: number` - Scale parameter (λ > 0, default: 1)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the Weibull distribution (values ≥ 0)

### Examples

```typescript
const single = s.dist.weibull.random({ shape: 2, scale: 1 });
const sample = s.dist.weibull.random({ shape: 1.5, scale: 3, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic failure time data
- Use for Monte Carlo reliability simulations

### Related

`s.dist.weibull.density`, `s.dist.weibull.probability`, `s.dist.weibull.quantile`

---

## s.dist.weibull.data

Generate data for Weibull distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.weibull.data({ shape, scale, type, range?, points? }): DataFrame
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `shape: number` - Shape parameter
- `scale: number` - Scale parameter
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 10] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.weibull.data({ shape: 2, scale: 1, type: 'pdf' });
const cdfData = s.dist.weibull.data({ shape: 1.5, scale: 3, type: 'cdf', range: [0, 20] });
```

### Best Practices

- Use for plotting Weibull distribution curves
- Note: distribution is only defined for x ≥ 0

### Related

`s.dist.weibull.density`, `s.dist.weibull.probability`, `s.dist.weibull.quantile`

---
