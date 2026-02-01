# T Distribution

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.t.density](#sdisttdensity)
- [s.dist.t.probability](#sdisttprobability)
- [s.dist.t.quantile](#sdisttquantile)
- [s.dist.t.random](#sdisttrandom)
- [s.dist.t.data](#sdisttdata)

---

## s.dist.t.density

Student's t-distribution density function (PDF). Used for small sample inference.

### Signature

```typescript
s.dist.t.density({ at, degreesOfFreedom, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated
- `degreesOfFreedom: number` - Degrees of freedom (> 0)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.t.density({ at: 0, degreesOfFreedom: 10 });
const logPdf = s.dist.t.density({ at: 2.5, degreesOfFreedom: 5, returnLog: true });
```

### Best Practices

- Use for t-test calculations
- Degrees of freedom typically = n - 1 for sample size n

### Related

`s.dist.t.probability`, `s.dist.t.quantile`, `s.dist.t.random`, `s.test.t.oneSample`

---

## s.dist.t.probability

Student's t-distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.t.probability({ at, degreesOfFreedom, direction?, returnLog? }): number
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
const cdf = s.dist.t.probability({ at: 2.0, degreesOfFreedom: 10 });
const pValue = s.dist.t.probability({ at: 2.5, degreesOfFreedom: 15, direction: 'above' });
```

### Best Practices

- Use for calculating p-values in t-tests
- As degrees of freedom → ∞, t-distribution approaches normal

### Related

`s.dist.t.density`, `s.dist.t.quantile`, `s.dist.t.random`, `s.test.t.oneSample`

---

## s.dist.t.quantile

Student's t-distribution quantile function (inverse CDF). Returns critical values for t-tests.

### Signature

```typescript
s.dist.t.quantile({ probability, degreesOfFreedom, direction?, probabilityIsLog? }): number
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
const t95 = s.dist.t.quantile({ probability: 0.95, degreesOfFreedom: 10 });
// Critical value for 95% confidence, df=10
const t975 = s.dist.t.quantile({ probability: 0.975, degreesOfFreedom: 20 });
// Critical value for two-tailed test, α=0.05
```

### Best Practices

- Use for finding critical values in hypothesis testing
- Use for calculating confidence intervals

### Related

`s.dist.t.density`, `s.dist.t.probability`, `s.dist.t.random`, `s.test.t.oneSample`

---

## s.dist.t.random

Generate random samples from Student's t-distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.t.random({ degreesOfFreedom, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `degreesOfFreedom: number` - Degrees of freedom (> 0)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the t-distribution

### Examples

```typescript
const single = s.dist.t.random({ degreesOfFreedom: 10 });
const sample = s.dist.t.random({ degreesOfFreedom: 15, sampleSize: 100 });
```

### Best Practices

- Use for Monte Carlo simulations
- Use for bootstrap resampling

### Related

`s.dist.t.density`, `s.dist.t.probability`, `s.dist.t.quantile`

---

## s.dist.t.data

Generate data for t-distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.t.data({ degreesOfFreedom, type, range?, points? }): DataFrame
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `degreesOfFreedom: number` - Degrees of freedom
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [-4, 4] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.t.data({ degreesOfFreedom: 10, type: 'pdf' });
const cdfData = s.dist.t.data({ degreesOfFreedom: 5, type: 'cdf', range: [-3, 3] });
```

### Best Practices

- Use for plotting t-distribution curves
- Compare different degrees of freedom to see convergence to normal

### Related

`s.dist.t.density`, `s.dist.t.probability`, `s.dist.t.quantile`

---
