# Negative Binomial

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.negativeBinomial.density](#sdistnegativebinomialdensity)
- [s.dist.negativeBinomial.probability](#sdistnegativebinomialprobability)
- [s.dist.negativeBinomial.quantile](#sdistnegativebinomialquantile)
- [s.dist.negativeBinomial.random](#sdistnegativebinomialrandom)

---

## s.dist.negativeBinomial.density

Negative binomial distribution probability mass function (PMF). Models the number of failures before achieving r successes in independent Bernoulli trials.

### Signature

```typescript
s.dist.negativeBinomial.density({ at, numberOfSuccesses, probabilityOfSuccess, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where PMF is evaluated (number of failures, must be non-negative integer)
- `numberOfSuccesses: number` - Number of successes required (r > 0)
- `probabilityOfSuccess: number` - Probability of success on each trial (0 < p < 1)
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Probability value or log probability

### Examples

```typescript
const pmf = s.dist.negativeBinomial.density({ at: 3, numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });
// P(X=3 failures before 2 successes)
const logPmf = s.dist.negativeBinomial.density({ at: 5, numberOfSuccesses: 3, probabilityOfSuccess: 0.4, returnLog: true });
```

### Best Practices

- Use for modeling overdispersed count data (variance > mean)
- Generalizes geometric distribution (r=1)
- Mean = r(1-p)/p, Variance = r(1-p)/p²

### Related

`s.dist.negativeBinomial.probability`, `s.dist.negativeBinomial.quantile`, `s.dist.negativeBinomial.random`, `s.dist.geometric.density`

---

## s.dist.negativeBinomial.probability

Negative binomial distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.negativeBinomial.probability({ at, numberOfSuccesses, probabilityOfSuccess, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated (number of failures)
- `numberOfSuccesses: number` - Number of successes required
- `probabilityOfSuccess: number` - Probability of success on each trial
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.negativeBinomial.probability({ at: 3, numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });
const pValue = s.dist.negativeBinomial.probability({ at: 5, numberOfSuccesses: 3, probabilityOfSuccess: 0.4, direction: 'above' });
```

### Best Practices

- Use for calculating probabilities of overdispersed counts
- Use for modeling count data with excess zeros

### Related

`s.dist.negativeBinomial.density`, `s.dist.negativeBinomial.quantile`, `s.dist.negativeBinomial.random`

---

## s.dist.negativeBinomial.quantile

Negative binomial distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.

### Signature

```typescript
s.dist.negativeBinomial.quantile({ probability, numberOfSuccesses, probabilityOfSuccess, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `numberOfSuccesses: number` - Number of successes required
- `probabilityOfSuccess: number` - Probability of success on each trial
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (non-negative integer)

### Examples

```typescript
const median = s.dist.negativeBinomial.quantile({ probability: 0.5, numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });
const q95 = s.dist.negativeBinomial.quantile({ probability: 0.95, numberOfSuccesses: 3, probabilityOfSuccess: 0.4 });
```

### Best Practices

- Use for finding percentiles of failure counts
- Returns integer values (discrete distribution)

### Related

`s.dist.negativeBinomial.density`, `s.dist.negativeBinomial.probability`, `s.dist.negativeBinomial.random`

---

## s.dist.negativeBinomial.random

Generate random samples from negative binomial distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.negativeBinomial.random({ numberOfSuccesses, probabilityOfSuccess, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `numberOfSuccesses: number` - Number of successes required
- `probabilityOfSuccess: number` - Probability of success on each trial
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the negative binomial distribution (non-negative integers)

### Examples

```typescript
const single = s.dist.negativeBinomial.random({ numberOfSuccesses: 2, probabilityOfSuccess: 0.5 });
const sample = s.dist.negativeBinomial.random({ numberOfSuccesses: 3, probabilityOfSuccess: 0.4, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic overdispersed count data
- Use for simulating count data with excess variance

### Related

`s.dist.negativeBinomial.density`, `s.dist.negativeBinomial.probability`, `s.dist.negativeBinomial.quantile`

---
