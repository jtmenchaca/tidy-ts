# Hypergeometric

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.hypergeometric.density](#sdisthypergeometricdensity)
- [s.dist.hypergeometric.probability](#sdisthypergeometricprobability)
- [s.dist.hypergeometric.quantile](#sdisthypergeometricquantile)
- [s.dist.hypergeometric.random](#sdisthypergeometricrandom)

---

## s.dist.hypergeometric.density

Hypergeometric distribution probability mass function (PMF). Models the number of successes when drawing without replacement from a finite population.

### Signature

```typescript
s.dist.hypergeometric.density({ at, populationSuccesses, populationFailures, drawSize, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where PMF is evaluated (successes in sample, must be integer)
- `populationSuccesses: number` - Number of success items in population (m)
- `populationFailures: number` - Number of failure items in population (n)
- `drawSize: number` - Sample size (k)
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Probability value or log probability

### Examples

```typescript
const pmf = s.dist.hypergeometric.density({ at: 2, populationSuccesses: 5, populationFailures: 10, drawSize: 3 });
// P(X=2) when drawing 3 from 5 successes + 10 failures
const logPmf = s.dist.hypergeometric.density({ at: 1, populationSuccesses: 20, populationFailures: 80, drawSize: 10, returnLog: true });
```

### Best Practices

- Use for sampling without replacement
- Approximates binomial when population is large relative to sample
- Mean = k × m/(m+n), Variance = k × m/(m+n) × n/(m+n) × (m+n-k)/(m+n-1)

### Related

`s.dist.hypergeometric.probability`, `s.dist.hypergeometric.quantile`, `s.dist.hypergeometric.random`, `s.dist.binomial.density`

---

## s.dist.hypergeometric.probability

Hypergeometric distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.hypergeometric.probability({ at, populationSuccesses, populationFailures, drawSize, direction?, returnLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `populationSuccesses: number` - Number of success items in population
- `populationFailures: number` - Number of failure items in population
- `drawSize: number` - Sample size
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.hypergeometric.probability({ at: 2, populationSuccesses: 5, populationFailures: 10, drawSize: 3 });
const pValue = s.dist.hypergeometric.probability({ at: 3, populationSuccesses: 20, populationFailures: 80, drawSize: 10, direction: 'above' });
```

### Best Practices

- Use for calculating p-values in Fisher's exact test
- Use for quality control sampling

### Related

`s.dist.hypergeometric.density`, `s.dist.hypergeometric.quantile`, `s.dist.hypergeometric.random`, `s.test.categorical.fishersExact`

---

## s.dist.hypergeometric.quantile

Hypergeometric distribution quantile function (inverse CDF). Returns the smallest integer k such that P(X ≤ k) ≥ probability.

### Signature

```typescript
s.dist.hypergeometric.quantile({ probability, populationSuccesses, populationFailures, drawSize, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `populationSuccesses: number` - Number of success items in population
- `populationFailures: number` - Number of failure items in population
- `drawSize: number` - Sample size
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ k), 'above' for P(X > k) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (integer)

### Examples

```typescript
const median = s.dist.hypergeometric.quantile({ probability: 0.5, populationSuccesses: 5, populationFailures: 10, drawSize: 3 });
const q95 = s.dist.hypergeometric.quantile({ probability: 0.95, populationSuccesses: 20, populationFailures: 80, drawSize: 10 });
```

### Best Practices

- Use for finding percentiles of sample counts
- Returns integer values (discrete distribution)

### Related

`s.dist.hypergeometric.density`, `s.dist.hypergeometric.probability`, `s.dist.hypergeometric.random`

---

## s.dist.hypergeometric.random

Generate random samples from hypergeometric distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.hypergeometric.random({ populationSuccesses, populationFailures, drawSize, sampleSize? }): number | number[]
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `populationSuccesses: number` - Number of success items in population
- `populationFailures: number` - Number of failure items in population
- `drawSize: number` - Sample size
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the hypergeometric distribution (integers)

### Examples

```typescript
const single = s.dist.hypergeometric.random({ populationSuccesses: 5, populationFailures: 10, drawSize: 3 });
const sample = s.dist.hypergeometric.random({ populationSuccesses: 20, populationFailures: 80, drawSize: 10, sampleSize: 100 });
```

### Best Practices

- Use for generating synthetic sampling without replacement data
- Use for simulating quality control scenarios

### Related

`s.dist.hypergeometric.density`, `s.dist.hypergeometric.probability`, `s.dist.hypergeometric.quantile`

---
