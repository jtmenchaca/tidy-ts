# Chi Square

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.chiSquare.density](#sdistchisquaredensity)
- [s.dist.chiSquare.probability](#sdistchisquareprobability)
- [s.dist.chiSquare.quantile](#sdistchisquarequantile)
- [s.dist.chiSquare.random](#sdistchisquarerandom)
- [s.dist.chiSquare.data](#sdistchisquaredata)

---

## s.dist.chiSquare.density

Chi-squared distribution density function (PDF). Used for goodness-of-fit tests and variance tests.

### Signature

```typescript
s.dist.chiSquare.density({ at, degreesOfFreedom, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (must be ≥ 0)
- `degreesOfFreedom: number` - Degrees of freedom (> 0)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.chiSquare.density({ at: 3.84, degreesOfFreedom: 1 });
const logPdf = s.dist.chiSquare.density({ at: 5.0, degreesOfFreedom: 3, returnLog: true });
```

### Best Practices

- Use for chi-square test calculations
- Degrees of freedom = (rows - 1) × (cols - 1) for contingency tables

### Related

`s.dist.chiSquare.probability`, `s.dist.chiSquare.quantile`, `s.dist.chiSquare.random`, `s.test.categorical.chiSquare`

---

## s.dist.chiSquare.probability

Chi-squared distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.chiSquare.probability({ at, degreesOfFreedom, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated
- `degreesOfFreedom: number` - Degrees of freedom (> 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.chiSquare.probability({ at: 3.84, degreesOfFreedom: 1 });
const pValue = s.dist.chiSquare.probability({ at: 5.99, degreesOfFreedom: 2, direction: 'above' });
```

### Best Practices

- Use for calculating p-values in chi-square tests
- Use direction: 'above' for right-tailed tests

### Related

`s.dist.chiSquare.density`, `s.dist.chiSquare.quantile`, `s.dist.chiSquare.random`, `s.test.categorical.chiSquare`

---

## s.dist.chiSquare.quantile

Chi-squared distribution quantile function (inverse CDF). Returns critical values for chi-square tests.

### Signature

```typescript
s.dist.chiSquare.quantile({ probability, degreesOfFreedom, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `degreesOfFreedom: number` - Degrees of freedom (> 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (critical value)

### Examples

```typescript
const chi95 = s.dist.chiSquare.quantile({ probability: 0.95, degreesOfFreedom: 1 });
// Critical value for 95% confidence, df=1 (≈ 3.84)
const chi99 = s.dist.chiSquare.quantile({ probability: 0.99, degreesOfFreedom: 5 });
```

### Best Practices

- Use for finding critical values in chi-square tests
- Common values: df=1, α=0.05 → 3.84; df=1, α=0.01 → 6.63

### Related

`s.dist.chiSquare.density`, `s.dist.chiSquare.probability`, `s.dist.chiSquare.random`, `s.test.categorical.chiSquare`

---

## s.dist.chiSquare.random

Generate random samples from chi-squared distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.chiSquare.random({ degreesOfFreedom, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `degreesOfFreedom: number` - Degrees of freedom (> 0)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the chi-squared distribution

### Examples

```typescript
const single = s.dist.chiSquare.random({ degreesOfFreedom: 5 });
const sample = s.dist.chiSquare.random({ degreesOfFreedom: 10, sampleSize: 100 });
```

### Best Practices

- Use for Monte Carlo simulations
- Use for bootstrap resampling

### Related

`s.dist.chiSquare.density`, `s.dist.chiSquare.probability`, `s.dist.chiSquare.quantile`

---

## s.dist.chiSquare.data

Generate data for chi-squared distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.chiSquare.data({ degreesOfFreedom, type, range?, points? }): DataFrame
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `degreesOfFreedom: number` - Degrees of freedom
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 20] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.chiSquare.data({ degreesOfFreedom: 5, type: 'pdf' });
const cdfData = s.dist.chiSquare.data({ degreesOfFreedom: 10, type: 'cdf', range: [0, 30] });
```

### Best Practices

- Use for plotting chi-squared distribution curves
- Note: distribution is only defined for x ≥ 0

### Related

`s.dist.chiSquare.density`, `s.dist.chiSquare.probability`, `s.dist.chiSquare.quantile`

---
