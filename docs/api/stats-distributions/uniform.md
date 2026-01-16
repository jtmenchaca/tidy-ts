# Uniform

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.uniform.density](#sdistuniformdensity)
- [s.dist.uniform.probability](#sdistuniformprobability)
- [s.dist.uniform.quantile](#sdistuniformquantile)
- [s.dist.uniform.random](#sdistuniformrandom)
- [s.dist.uniform.data](#sdistuniformdata)

---

## s.dist.uniform.density

Uniform distribution density function (PDF). Constant probability over an interval.

### Signature

```typescript
s.dist.uniform.density({ at, minimum?, maximum?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated
- `minimum?: number` - Lower bound (default: 0)
- `maximum?: number` - Upper bound (default: 1)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density (1/(max-min) if min ≤ at ≤ max, else 0)

### Examples

```typescript
const pdf = s.dist.uniform.density({ at: 0.5, minimum: 0, maximum: 1 });
// = 1.0 (constant on [0,1])
const pdf2 = s.dist.uniform.density({ at: 2.5, minimum: 1, maximum: 3 });
// = 0.5 (constant on [1,3])
```

### Best Practices

- Use for modeling complete uncertainty over an interval
- Use as a non-informative prior in Bayesian analysis
- Density = 1/(maximum - minimum) on [minimum, maximum]

### Related

`s.dist.uniform.probability`, `s.dist.uniform.quantile`, `s.dist.uniform.random`

---

## s.dist.uniform.probability

Uniform distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.uniform.probability({ at, minimum?, maximum?, direction?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `minimum?: number` - Lower bound (default: 0)
- `maximum?: number` - Upper bound (default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.uniform.probability({ at: 0.5, minimum: 0, maximum: 1 });
// = 0.5 (linear CDF)
const pValue = s.dist.uniform.probability({ at: 0.3, minimum: 0, maximum: 1, direction: 'above' });
```

### Best Practices

- CDF is linear: P(X ≤ at) = (at - min)/(max - min) for min ≤ at ≤ max

### Related

`s.dist.uniform.density`, `s.dist.uniform.quantile`, `s.dist.uniform.random`

---

## s.dist.uniform.quantile

Uniform distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.

### Signature

```typescript
s.dist.uniform.quantile({ probability, minimum?, maximum?, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `minimum?: number` - Lower bound (default: 0)
- `maximum?: number` - Upper bound (default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (minimum ≤ x ≤ maximum)

### Examples

```typescript
const median = s.dist.uniform.quantile({ probability: 0.5, minimum: 0, maximum: 1 });
// = 0.5
const q95 = s.dist.uniform.quantile({ probability: 0.95, minimum: 10, maximum: 20 });
// = 19.5
```

### Best Practices

- Quantile = min + probability × (max - min)
- Use for generating random numbers in a range

### Related

`s.dist.uniform.density`, `s.dist.uniform.probability`, `s.dist.uniform.random`

---

## s.dist.uniform.random

Generate random samples from uniform distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.uniform.random({ minimum?, maximum?, sampleSize? }): number | number[]
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `minimum?: number` - Lower bound (default: 0)
- `maximum?: number` - Upper bound (default: 1)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the uniform distribution

### Examples

```typescript
const single = s.dist.uniform.random();
// Random number in [0, 1]
const sample = s.dist.uniform.random({ minimum: 10, maximum: 20, sampleSize: 100 });
// Array of 100 random numbers in [10, 20]
```

### Best Practices

- Use for generating random numbers in a specified range
- Use as a building block for other random number generators

### Related

`s.dist.uniform.density`, `s.dist.uniform.probability`, `s.dist.uniform.quantile`

---

## s.dist.uniform.data

Generate data for uniform distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.uniform.data({ minimum, maximum, type, range?, points? }): DataFrame
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `minimum: number` - Lower bound
- `maximum: number` - Upper bound
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [minimum, maximum] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.uniform.data({ minimum: 0, maximum: 1, type: 'pdf' });
const cdfData = s.dist.uniform.data({ minimum: 10, maximum: 20, type: 'cdf' });
```

### Best Practices

- Use for plotting uniform distribution curves
- PDF is constant (flat line), CDF is linear

### Related

`s.dist.uniform.density`, `s.dist.uniform.probability`, `s.dist.uniform.quantile`

---
