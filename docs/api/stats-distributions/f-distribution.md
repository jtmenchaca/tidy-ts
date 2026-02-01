# F Distribution

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.f.density](#sdistfdensity)
- [s.dist.f.probability](#sdistfprobability)
- [s.dist.f.quantile](#sdistfquantile)
- [s.dist.f.random](#sdistfrandom)

---

## s.dist.f.density

F-distribution density function (PDF). Used for ANOVA and comparing variances.

### Signature

```typescript
s.dist.f.density({ at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (must be ≥ 0)
- `numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)
- `denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.f.density({ at: 2.5, numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });
const logPdf = s.dist.f.density({ at: 1.0, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20, returnLog: true });
```

### Best Practices

- Use for F-test calculations
- Numerator df = groups - 1, Denominator df = total - groups for ANOVA

### Related

`s.dist.f.probability`, `s.dist.f.quantile`, `s.dist.f.random`, `s.test.anova.oneWay`

---

## s.dist.f.probability

F-distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.f.probability({ at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)
- `denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.f.probability({ at: 2.5, numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });
const pValue = s.dist.f.probability({ at: 4.0, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20, direction: 'above' });
```

### Best Practices

- Use for calculating p-values in F-tests and ANOVA
- Use direction: 'above' for right-tailed tests

### Related

`s.dist.f.density`, `s.dist.f.quantile`, `s.dist.f.random`, `s.test.anova.oneWay`

---

## s.dist.f.quantile

F-distribution quantile function (inverse CDF). Returns critical values for F-tests.

### Signature

```typescript
s.dist.f.quantile({ probability, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)
- `denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (critical value)

### Examples

```typescript
const f95 = s.dist.f.quantile({ probability: 0.95, numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });
// Critical value for 95% confidence
const f99 = s.dist.f.quantile({ probability: 0.99, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20 });
```

### Best Practices

- Use for finding critical values in F-tests
- Use for ANOVA critical values

### Related

`s.dist.f.density`, `s.dist.f.probability`, `s.dist.f.random`, `s.test.anova.oneWay`

---

## s.dist.f.random

Generate random samples from F-distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.f.random({ numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `numeratorDegreesOfFreedom: number` - Numerator degrees of freedom (> 0)
- `denominatorDegreesOfFreedom: number` - Denominator degrees of freedom (> 0)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the F-distribution

### Examples

```typescript
const single = s.dist.f.random({ numeratorDegreesOfFreedom: 3, denominatorDegreesOfFreedom: 10 });
const sample = s.dist.f.random({ numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 20, sampleSize: 100 });
```

### Best Practices

- Use for Monte Carlo simulations
- Use for bootstrap resampling

### Related

`s.dist.f.density`, `s.dist.f.probability`, `s.dist.f.quantile`

---
