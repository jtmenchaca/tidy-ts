---
name: stats-glm
description: Fit generalized linear models with s.glm({ formula, family, link, data }). Numeric columns only. Returns a GLM instance with summary(), predict(), residuals(), confint(), vcov().
metadata:
  tags: stats, glm, regression, formula, family, link
---

# Generalized linear models (`s.glm`)

WASM-backed GLM fitting. Use `s.glm` (not a top-level `glm` export — there is none on `@tidy-ts/dataframe`; only `stats` / `s`).

## Signature

```typescript
s.glm({
  formula: string,         // e.g. "y ~ x1 + x2"
  family: "gaussian" | "binomial" | "quasibinomial" | "poisson"
        | "gamma" | "inverse_gaussian" | "quasipoisson",
  link: "identity" | "logit" | "probit" | "cauchit"
      | "log" | "cloglog" | "inverse" | "sqrt" | "inverse_squared",
  data: DataFrame<Row>,    // Row must extend Record<string, number>
  options?: {
    weights?: number[],     // Weighted least-squares — matches R `lm(..., weights = w)`
                            //   and `glm(..., weights = w)`. Length must equal `data.nrows()`.
    naAction?: string,
    epsilon?: number,
    maxIter?: number,
    trace?: boolean,
  },
}): GLM<Row>
```

**Constraint:** every column used in the formula must be numeric. Cast / encode categoricals to numbers before fitting.

**Weighted regression (WLS)**: pass an array of non-negative weights via `options.weights`. tidy-ts produces R-`lm(..., weights = w)`-equivalent coefficients, standard errors, t-statistics, p-values, R², and residual SE within 1e-6.

### Encoding categorical predictors (treatment contrasts)

R's `lm()` / `glm()` builds the design matrix automatically when you pass a factor. tidy-ts does not — you have to add the indicator columns yourself. To match R's default treatment contrasts (drop the alphabetically-first level as the reference), use `mutate` to add one 0/1 column per non-reference level:

```typescript
// For a 3-level "species" factor (Adelie / Chinstrap / Gentoo, alphabetical),
// Adelie is the reference. Add indicators for the other two:
const encoded = df.mutate({
  speciesChinstrap: (r) => r.species === "Chinstrap" ? 1 : 0,
  speciesGentoo: (r) => r.species === "Gentoo" ? 1 : 0,
  // Same pattern for any 2-level factor — drop reference, encode the other:
  sexMale: (r) => r.sex === "male" ? 1 : 0,
});

const model = s.glm({
  formula: "bodyMassG ~ speciesChinstrap + speciesGentoo + sexMale + flipperLengthMm",
  family: "gaussian",
  link: "identity",
  data: encoded,
});
```

The intercept then represents the reference combination (Adelie, female). The coefficient on `speciesChinstrap` is the mean difference from Adelie holding everything else fixed — same interpretation as R `lm()` summary lines like `speciesChinstrap`.

## Common combinations

| Outcome             | Family           | Link        |
|---------------------|------------------|-------------|
| Continuous          | `gaussian`       | `identity`  |
| Binary (logistic)   | `binomial`       | `logit`     |
| Binary (probit)     | `binomial`       | `probit`    |
| Count               | `poisson`        | `log`       |
| Overdispersed count | `quasipoisson`   | `log`       |
| Proportion (count/N)| `quasibinomial`  | `logit`     |
| Positive continuous | `gamma`          | `log` or `inverse` |

## Fit + inspect

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame({
  columns: { vs: [...], mpg: [...], wt: [...] },
});

const model = s.glm({
  formula: "vs ~ mpg + wt",
  family: "binomial",
  link: "logit",
  data: df,
});

const summary = model.summary();
// {
//   coefficients: { estimate, std_error, statistic, p_value, names },
//   dispersion,
//   null_deviance, residual_deviance,
//   df_null, df_residual,
//   aic,
//   r_squared, adjusted_r_squared,
//   f_statistic, f_p_value,
//   residual_standard_error,
//   n_observations,
//   family, link,
// }
```

For non-gaussian families `r_squared` is the deviance-explained pseudo-R² (`1 − residual_deviance / null_deviance`), not the OLS R². Use `aic` and `null_deviance / residual_deviance` for cross-model comparison.

## Predict

```typescript
// In-sample fitted values on the response scale (probabilities for logistic, etc.)
const yhat = model.predict(undefined, { type: "response" });

// In-sample linear predictors
const eta = model.predict(undefined, { type: "link" });

// Out-of-sample — pass a DataFrame with the same numeric predictor columns
const yhatNew = model.predict(newDf, { type: "response" });
```

## Other instance methods

```typescript
model.summary()                        // coefficient table (see "Fit + inspect" above)
model.predict(df?, { type })           // number[] — see "Predict" above
model.residuals({ type })              // number[] — type: "deviance" (default) | "pearson" | "working" | "response"
model.vcov()                           // number[][] — variance-covariance matrix of coefficients;
                                       //   row/column order matches summary().coefficients[].name
model.confint({ level })               // { names: string[]; lower: number[]; upper: number[] }
                                       //   parallel arrays indexed by coefficient. To get the CI
                                       //   for one term, find its index in `names` and read
                                       //   `lower[i]` / `upper[i]`. Default level: 0.95.
                                       //
                                       //   Method: profile likelihood with a qnorm cutoff —
                                       //   matches R's `confint.glm` (the default `confint` for a
                                       //   glm-class object). Even for `family: "gaussian"` this
                                       //   uses qnorm, not qt. This intentionally differs from
                                       //   R's `confint.lm` (an `lm`-class object), which uses
                                       //   qt with df_residual; for n ≈ 30 the bounds disagree
                                       //   by ~3%. Compare to `confint(glm(..., family=gaussian))`,
                                       //   not `confint(lm(...))`.
                                       //
                                       //   Need Wald CIs? Compute manually:
                                       //     `estimate ± qnorm(0.975) * std_error` from `summary()`.
```

### Diagnostics & influence

```typescript
model.rstandard({ type })              // number[] — standardized residuals; type: "deviance" | "pearson"
model.rstudent()                       // number[] — studentized (leave-one-out) residuals; R's `rstudent()`
model.leverage                         // number[] — leverage (hat) values per observation
model.influence()                      // { dfbeta, dfbetas, dffits, covratio, cooksDistance, hat }
                                       //   per-observation influence measures (R's influence.measures())
```

```typescript
// Example: 95% CI for a single coefficient
const ci = model.confint({ level: 0.95 });
const i = ci.names.indexOf("wt");
console.log(`wt CI: [${ci.lower[i]}, ${ci.upper[i]}]`);

// Example: variance of each coefficient (diagonal of vcov)
const V = model.vcov();
const variances = V.map((row, i) => row[i]);

// Example: flag influential observations
const inf = model.influence();
const flagged = inf.cooksDistance
  .map((d, i) => ({ row: i, cooks: d }))
  .filter((r) => r.cooks > 4 / inf.cooksDistance.length);
```

## Anti-patterns

- ❌ Passing string columns in `data` — every column referenced by `formula` must be numeric. Encode/cast first.
- ❌ Using internal helpers like `glmFit()` directly — app code should use `s.glm({ formula, family, link, data, options? })`.
- ❌ Mismatched `family` × `link` — stick to the table above unless you specifically need a non-canonical link.
