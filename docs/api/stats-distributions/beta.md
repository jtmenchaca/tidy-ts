# Beta

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.dist.beta.density](#sdistbetadensity)
- [s.dist.beta.probability](#sdistbetaprobability)
- [s.dist.beta.quantile](#sdistbetaquantile)
- [s.dist.beta.random](#sdistbetarandom)
- [s.dist.beta.data](#sdistbetadata)

---

## s.dist.beta.density

Beta distribution density function (PDF). Used for modeling probabilities and proportions.

### Signature

```typescript
s.dist.beta.density({ at, alpha, beta, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where density is evaluated (0 ≤ at ≤ 1)
- `alpha: number` - First shape parameter (α > 0)
- `beta: number` - Second shape parameter (β > 0)
- `returnLog?: boolean` - If true, return log density (default: false)

### Returns

Density value or log density

### Examples

```typescript
const pdf = s.dist.beta.density({ at: 0.5, alpha: 2, beta: 5 });
const logPdf = s.dist.beta.density({ at: 0.3, alpha: 1, beta: 1, returnLog: true });
// Uniform when α=1, β=1
```

### Best Practices

- Use for modeling probabilities and proportions
- α=β=1 gives uniform distribution on [0,1]
- α>β gives left-skewed, α<β gives right-skewed

### Related

`s.dist.beta.probability`, `s.dist.beta.quantile`, `s.dist.beta.random`

---

## s.dist.beta.probability

Beta distribution cumulative distribution function (CDF). Returns P(X ≤ at) or P(X > at).

### Signature

```typescript
s.dist.beta.probability({ at, alpha, beta, direction?, returnLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `at: number` - Point where CDF is evaluated (0 ≤ at ≤ 1)
- `alpha: number` - First shape parameter (α > 0)
- `beta: number` - Second shape parameter (β > 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ at), 'above' for P(X > at) (default: 'below')
- `returnLog?: boolean` - If true, return log probability (default: false)

### Returns

Cumulative probability or log cumulative probability

### Examples

```typescript
const cdf = s.dist.beta.probability({ at: 0.5, alpha: 2, beta: 5 });
const pValue = s.dist.beta.probability({ at: 0.3, alpha: 1, beta: 1, direction: 'above' });
```

### Best Practices

- Use for Bayesian inference with beta priors
- Use for modeling uncertainty in proportions

### Related

`s.dist.beta.density`, `s.dist.beta.quantile`, `s.dist.beta.random`

---

## s.dist.beta.quantile

Beta distribution quantile function (inverse CDF). Returns the value x such that P(X ≤ x) = probability.

### Signature

```typescript
s.dist.beta.quantile({ probability, alpha, beta, direction?, probabilityIsLog? }): number
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `probability: number` - Probability value (0..1)
- `alpha: number` - First shape parameter (α > 0)
- `beta: number` - Second shape parameter (β > 0)
- `direction?: 'below' | 'above'` - 'below' for P(X ≤ x), 'above' for P(X > x) (default: 'below')
- `probabilityIsLog?: boolean` - If true, probability is given as log-probability (default: false)

### Returns

Quantile value (0 ≤ x ≤ 1)

### Examples

```typescript
const median = s.dist.beta.quantile({ probability: 0.5, alpha: 2, beta: 5 });
const q95 = s.dist.beta.quantile({ probability: 0.95, alpha: 1, beta: 1 });
// 95th percentile of uniform distribution = 0.95
```

### Best Practices

- Use for finding credible intervals in Bayesian analysis
- Use for generating random proportions

### Related

`s.dist.beta.density`, `s.dist.beta.probability`, `s.dist.beta.random`

---

## s.dist.beta.random

Generate random samples from beta distribution. Returns a single number or array of numbers.

### Signature

```typescript
s.dist.beta.random({ alpha, beta, sampleSize? }): number | number[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `alpha: number` - First shape parameter (α > 0)
- `beta: number` - Second shape parameter (β > 0)
- `sampleSize?: number` - Number of random draws (default: 1). If 1, returns number; if > 1, returns number[]

### Returns

Random sample(s) from the beta distribution (values in [0, 1])

### Examples

```typescript
const single = s.dist.beta.random({ alpha: 2, beta: 5 });
const sample = s.dist.beta.random({ alpha: 1, beta: 1, sampleSize: 100 });
// Uniform random numbers when α=1, β=1
```

### Best Practices

- Use for generating random proportions
- Use for Bayesian posterior sampling

### Related

`s.dist.beta.density`, `s.dist.beta.probability`, `s.dist.beta.quantile`

---

## s.dist.beta.data

Generate data for beta distribution visualization. Returns a DataFrame with PDF, CDF, or inverse CDF data.

### Signature

```typescript
s.dist.beta.data({ alpha, beta, type, range?, points? }): DataFrame
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `alpha: number` - First shape parameter
- `beta: number` - Second shape parameter
- `type: 'pdf' | 'cdf' | 'inverse_cdf'` - Type of data to generate
- `range?: [number, number]` - Range for x values (pdf/cdf) or probabilities (inverse_cdf). Default: [0, 1] for pdf/cdf, [0.01, 0.99] for inverse_cdf
- `points?: number` - Number of points to generate (default: 100)

### Returns

DataFrame with columns: { x, density } for pdf, { x, probability } for cdf, or { probability, quantile } for inverse_cdf

### Examples

```typescript
const pdfData = s.dist.beta.data({ alpha: 2, beta: 5, type: 'pdf' });
const cdfData = s.dist.beta.data({ alpha: 1, beta: 1, type: 'cdf' });
```

### Best Practices

- Use for plotting beta distribution curves
- Note: distribution is only defined on [0, 1]

### Related

`s.dist.beta.density`, `s.dist.beta.probability`, `s.dist.beta.quantile`

---
