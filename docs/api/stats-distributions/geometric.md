# Geometric

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.geometric.density](#sdistgeometricdensity)
- [s.dist.geometric.probability](#sdistgeometricprobability)
- [s.dist.geometric.quantile](#sdistgeometricquantile)
- [s.dist.geometric.random](#sdistgeometricrandom)

---

## s.dist.geometric.density

Geometric distribution probability mass function (PMF). Models the number of failures before the first success in independent Bernoulli trials.

### Signature

```typescript
s.dist.geometric.density({ at, probabilityOfSuccess, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where PMF is evaluated (number of failures, must be non-negative integer)
- `probabilityOfSuccess: number` - Probability of success on each trial (0 < p ≤ 1)
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Probability value or log probability

### Examples

```typescript
const pmf = s.dist.geometric.density({ at: 3, probabilityOfSuccess: 0.5 });
// P(X=3) = (1-0.5)³ × 0.5 = 0.0625
const logPmf = s.dist.geometric.density({ at: 5, probabilityOfSuccess: 0.3, returnLog: true });
```

### Best Practices

- Use for modeling waiting times until first success
- Mean = (1-p)/p, Variance = (1-p)/p²
- Memoryless property: P(X > s+t | X > s) = P(X > t)

### Related

`s.dist.geometric.probability`, `s.dist.geometric.quantile`, `s.dist.geometric.random`, `s.dist.exponential.density`

---

## s.dist.geometric.probability

Geometric distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.geometric.probability({ at, probabilityOfSuccess, direction?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated (number of failures)
- `probabilityOfSuccess: number` - Probability of success on each trial
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.geometric.probability({ at: 3, probabilityOfSuccess: 0.5 });
// P(X ≤ 3) = 1 - (1-0.5)⁴ = 0.9375
const pValue = s.dist.geometric.probability({ at: 5, probabilityOfSuccess: 0.3, direction: 'above' });
```

### Best Practices

- Use for calculating probabilities of waiting times
- P(X ≤ k) = 1 - (1-p)^(k+1)

### Related

`s.dist.geometric.density`, `s.dist.geometric.quantile`, `s.dist.geometric.random`

---

## s.dist.geometric.quantile

Geometric distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.

### Signature

```typescript
s.dist.geometric.quantile({ probability, probabilityOfSuccess, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `probabilityOfSuccess: number` - Probability of success on each trial
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (non-negative integer)

### Examples

```typescript
const median = s.dist.geometric.quantile({ probability: 0.5, probabilityOfSuccess: 0.5 });
const q95 = s.dist.geometric.quantile({ probability: 0.95, probabilityOfSuccess: 0.3 });
```

### Best Practices

- Use for finding percentiles of waiting times
- Returns integer values (discrete distribution)

### Related

`s.dist.geometric.density`, `s.dist.geometric.probability`, `s.dist.geometric.random`

---

## s.dist.geometric.random

Generate random samples from geometric distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.geometric.random({ probabilityOfSuccess, sampleSize? }): number | number[]
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `probabilityOfSuccess: number` - Probability of success on each trial
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the geometric distribution (non-negative integers)

### Examples

```typescript
const single = s.dist.geometric.random({ probabilityOfSuccess: 0.5 });
const sample = s.dist.geometric.random({ probabilityOfSuccess: 0.3, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic waiting time data
- Use for simulating number of failures before first success

### Related

`s.dist.geometric.density`, `s.dist.geometric.probability`, `s.dist.geometric.quantile`

---
