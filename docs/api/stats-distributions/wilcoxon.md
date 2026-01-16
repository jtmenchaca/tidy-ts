# Wilcoxon

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.wilcoxon.density](#sdistwilcoxondensity)
- [s.dist.wilcoxon.probability](#sdistwilcoxonprobability)
- [s.dist.wilcoxon.quantile](#sdistwilcoxonquantile)
- [s.dist.wilcoxon.random](#sdistwilcoxonrandom)

---

## s.dist.wilcoxon.density

Wilcoxon rank-sum distribution density function (PMF). Used for the distribution of the Wilcoxon rank-sum test statistic.

### Signature

```typescript
s.dist.wilcoxon.density({ at, sizeFirstSample, sizeSecondSample, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where PMF is evaluated (Wilcoxon rank-sum statistic, must be integer)
- `sizeFirstSample: number` - Size of first sample (m)
- `sizeSecondSample: number` - Size of second sample (n)
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Probability value or log probability

### Examples

```typescript
const pmf = s.dist.wilcoxon.density({ at: 15, sizeFirstSample: 5, sizeSecondSample: 5 });
// P(W=15) for samples of size 5 and 5
const logPmf = s.dist.wilcoxon.density({ at: 20, sizeFirstSample: 6, sizeSecondSample: 4, returnLog: true });
```

### Best Practices

- Use for exact p-value calculations in Wilcoxon rank-sum test
- Distribution is symmetric when sample sizes are equal
- Mean = m(m+n+1)/2, Variance = mn(m+n+1)/12

### Related

`s.dist.wilcoxon.probability`, `s.dist.wilcoxon.quantile`, `s.dist.wilcoxon.random`, `s.test.nonparametric.mannWhitney`

---

## s.dist.wilcoxon.probability

Wilcoxon rank-sum distribution cumulative distribution function (CDF). Returns P(W ≤ at) or P(W > at).

### Signature

```typescript
s.dist.wilcoxon.probability({ at, sizeFirstSample, sizeSecondSample, direction?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated (Wilcoxon rank-sum statistic)
- `sizeFirstSample: number` - Size of first sample
- `sizeSecondSample: number` - Size of second sample
- `direction?: 'below' | 'above'` - 'below' for P(W ≤ at), 'above' for P(W > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.wilcoxon.probability({ at: 15, sizeFirstSample: 5, sizeSecondSample: 5 });
const pValue = s.dist.wilcoxon.probability({ at: 20, sizeFirstSample: 6, sizeSecondSample: 4, direction: 'above' });
```

### Best Practices

- Use for calculating exact p-values in Wilcoxon rank-sum test
- Use for small sample sizes where normal approximation is poor

### Related

`s.dist.wilcoxon.density`, `s.dist.wilcoxon.quantile`, `s.dist.wilcoxon.random`, `s.test.nonparametric.mannWhitney`

---

## s.dist.wilcoxon.quantile

Wilcoxon rank-sum distribution quantile function (inverse CDF). Returns the smallest integer k such that P(W ≤ k) ≥ probability.

### Signature

```typescript
s.dist.wilcoxon.quantile({ probability, sizeFirstSample, sizeSecondSample, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `sizeFirstSample: number` - Size of first sample
- `sizeSecondSample: number` - Size of second sample
- `direction?: 'below' | 'above'` - 'below' for P(W ≤ k), 'above' for P(W > k) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (integer)

### Examples

```typescript
const median = s.dist.wilcoxon.quantile({ probability: 0.5, sizeFirstSample: 5, sizeSecondSample: 5 });
const q95 = s.dist.wilcoxon.quantile({ probability: 0.95, sizeFirstSample: 6, sizeSecondSample: 4 });
```

### Best Practices

- Use for finding critical values in Wilcoxon rank-sum test
- Returns integer values (discrete distribution)

### Related

`s.dist.wilcoxon.density`, `s.dist.wilcoxon.probability`, `s.dist.wilcoxon.random`

---

## s.dist.wilcoxon.random

Generate random samples from Wilcoxon rank-sum distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.wilcoxon.random({ sizeFirstSample, sizeSecondSample, sampleSize? }): number | number[]
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `sizeFirstSample: number` - Size of first sample
- `sizeSecondSample: number` - Size of second sample
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the Wilcoxon rank-sum distribution (integers)

### Examples

```typescript
const single = s.dist.wilcoxon.random({ sizeFirstSample: 5, sizeSecondSample: 5 });
const sample = s.dist.wilcoxon.random({ sizeFirstSample: 6, sizeSecondSample: 4, sampleSize: 100 });
```

### Best Practices

- Use for Monte Carlo simulations of rank-sum tests
- Use for bootstrap resampling

### Related

`s.dist.wilcoxon.density`, `s.dist.wilcoxon.probability`, `s.dist.wilcoxon.quantile`

---
