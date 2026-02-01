# Log Normal

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.logNormal.density](#sdistlognormaldensity)
- [s.dist.logNormal.probability](#sdistlognormalprobability)
- [s.dist.logNormal.quantile](#sdistlognormalquantile)
- [s.dist.logNormal.random](#sdistlognormalrandom)

---

## s.dist.logNormal.density

Log-normal distribution density function (PDF). If X ~ Normal(μ, σ²), then e^X ~ LogNormal(μ, σ²). Used for modeling positive values with right skew.

### Signature

```typescript
s.dist.logNormal.density({ at, meanLog?, standardDeviationLog?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (must be > 0)
- `meanLog?: number` - Mean of the underlying normal distribution (default: 0)
- `standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.logNormal.density({ at: 1.0, meanLog: 0, standardDeviationLog: 1 });
const logPdf = s.dist.logNormal.density({ at: 2.0, meanLog: 1, standardDeviationLog: 0.5, returnLog: true });
```

### Best Practices

- Use for modeling positive values with right skew (e.g., income, sizes)
- Mean = exp(μ + σ²/2), Median = exp(μ)
- If log(X) ~ Normal(μ, σ²), then X ~ LogNormal(μ, σ²)

### Related

`s.dist.logNormal.probability`, `s.dist.logNormal.quantile`, `s.dist.logNormal.random`, `s.dist.normal.density`

---

## s.dist.logNormal.probability

Log-normal distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.logNormal.probability({ at, meanLog?, standardDeviationLog?, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `meanLog?: number` - Mean of the underlying normal distribution (default: 0)
- `standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.logNormal.probability({ at: 1.0, meanLog: 0, standardDeviationLog: 1 });
const pValue = s.dist.logNormal.probability({ at: 2.0, meanLog: 1, standardDeviationLog: 0.5, direction: 'above' });
```

### Best Practices

- Use for calculating probabilities of positive skewed data
- CDF uses normal distribution: P(X ≤ at) = P(log(X) ≤ log(at))

### Related

`s.dist.logNormal.density`, `s.dist.logNormal.quantile`, `s.dist.logNormal.random`

---

## s.dist.logNormal.quantile

Log-normal distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.

### Signature

```typescript
s.dist.logNormal.quantile({ probability, meanLog?, standardDeviationLog?, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `meanLog?: number` - Mean of the underlying normal distribution (default: 0)
- `standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (x > 0)

### Examples

```typescript
const median = s.dist.logNormal.quantile({ probability: 0.5, meanLog: 0, standardDeviationLog: 1 });
// = exp(0) = 1
const q95 = s.dist.logNormal.quantile({ probability: 0.95, meanLog: 1, standardDeviationLog: 0.5 });
```

### Best Practices

- Use for finding percentiles of positive skewed data
- Median = exp(meanLog)

### Related

`s.dist.logNormal.density`, `s.dist.logNormal.probability`, `s.dist.logNormal.random`

---

## s.dist.logNormal.random

Generate random samples from log-normal distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.logNormal.random({ meanLog?, standardDeviationLog?, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `meanLog?: number` - Mean of the underlying normal distribution (default: 0)
- `standardDeviationLog?: number` - Standard deviation of the underlying normal distribution (default: 1)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the log-normal distribution (values > 0)

### Examples

```typescript
const single = s.dist.logNormal.random();
const sample = s.dist.logNormal.random({ meanLog: 1, standardDeviationLog: 0.5, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic positive skewed data
- Use for modeling income, sizes, or other right-skewed positive values

### Related

`s.dist.logNormal.density`, `s.dist.logNormal.probability`, `s.dist.logNormal.quantile`

---
