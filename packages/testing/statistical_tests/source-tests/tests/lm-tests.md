# lm-tests.R -- Summary of All Test Cases

**Source file:** `lm-tests.R` (102 lines)

**Total test blocks:** 3 `stopifnot` blocks + 1 standalone `all.equal` assertion = **4 assertion blocks** containing **14 individual assertions**

**R functions tested (with line references):**

| Function | Lines |
|---|---|
| `lm()` | 8, 13, 14, 15, 90 |
| `lsfit()` | 9, 11, 12 |
| `glm()` | 16, 17 |
| `predict()` / `predict.lm()` | 19, 100-101 |
| `residuals()` / `weighted.residuals()` | 22-23, 26-27, 30-31 |
| `deviance()` | 24-25, 28-29 |
| `influence.measures()` | 34, 64, 91 |
| `dfbetas()` / `dfbeta()` | 38, 68, 71 |
| `dffits()` | 39 |
| `covratio()` | 40, 72 |
| `cooks.distance()` | 41, 50-51 |
| `lm.influence()` | 42 |
| `rstandard()` | 44-45 |
| `rstudent()` | 46-49 |
| `summary()` | 53-54 |
| `anova()` | 55-56 |

---

## Section 1: Weighted Linear Models -- lm/glm/lsfit equivalence (Lines 1-57)

**Data:** The `roller` dataset from John Maindonald (10 observations, 2 variables: `weight` and `depression`).

**Model setup (lines 4-18):**

| Variable | Description | Line |
|---|---|---|
| `roller.lmu` | Unweighted `lm(weight~depression)` | 8 |
| `roller.lsfu` | Unweighted `lsfit()` | 9 |
| `roller.lsf` | `lsfit()` with weights `1:10` | 11 |
| `roller.lsf0` | `lsfit()` with weights `0:9` (first obs has zero weight) | 12 |
| `roller.lm` | `lm()` with weights `1:10` | 13 |
| `roller.lm0` | `lm()` with weights `0:9` (first obs has zero weight) | 14 |
| `roller.lm9` | `lm()` on `roller[-1,]` with weights `1:9` (first obs removed) | 15 |
| `roller.glm` | `glm()` with weights `1:10` | 16 |
| `roller.glm0` | `glm()` with weights `0:9` | 17 |

### Assertion: predict with zero-weight glm (Line 19)

| # | Line | Assertion | What it checks |
|---|---|---|---|
| 1 | 19 | `predict(roller.glm0, type="terms")` | Correctness check: this call failed until 2003-03-31 (historical bug fix). Verifies it runs without error. |

### Block 1: stopifnot (Lines 21-32) -- lm/glm residual and deviance equivalence

| # | Line(s) | Assertion | What it checks | Tolerance |
|---|---|---|---|---|
| 1 | 22-23 | `all.equal(residuals(roller.glm0, type="partial"), residuals(roller.lm0, type="partial"))` | Partial residuals from `glm` with zero-weight obs match those from `lm` with zero-weight obs | 1e-14 |
| 2 | 24-25 | `all.equal(deviance(roller.lm), deviance(roller.glm))` | Deviance of weighted `lm` equals deviance of weighted `glm` (weights `1:10`) | 1e-14 |
| 3 | 26-27 | `all.equal(weighted.residuals(roller.lm), residuals(roller.glm))` | Weighted residuals from `lm` equal raw residuals from `glm` (weights `1:10`) | 2e-14 |
| 4 | 28-29 | `all.equal(deviance(roller.lm0), deviance(roller.glm0))` | Deviance equivalence between `lm` and `glm` when first obs has zero weight | 1e-14 |
| 5 | 30-31 | `all.equal(weighted.residuals(roller.lm0, drop=FALSE), residuals(roller.glm0))` | Weighted residuals (with `drop=FALSE` to retain zero-weight obs) from `lm` equal `glm` residuals | 2e-14 |

### Assertion: influence.measures on zero-weight model (Line 34)

| # | Line | Assertion | What it checks |
|---|---|---|---|
| 1 | 34 | `influence.measures(roller.lm0)` | Verifies `influence.measures()` runs without error on a model with a zero-weight observation |

### Block 2: stopifnot (Lines 36-57) -- Influence diagnostics and zero-weight equivalence

| # | Line(s) | Assertion | What it checks | Tolerance |
|---|---|---|---|---|
| 1 | 37-43 | `all.equal(im.lm0$infmat, cbind(dfbetas(), dffits(), covratio(), cooks.distance(), lm.influence()$hat))` | The influence matrix from `influence.measures()` equals the column-bound individual diagnostic functions (dfbetas, dffits, covratio, Cook's distance, hat values) | default |
| 2 | 44-45 | `all.equal(rstandard(roller.lm9), rstandard(roller.lm0))` | Standardized residuals: model with obs 1 removed (`lm9`) equals model with obs 1 having zero weight (`lm0`) | 1e-14 |
| 3 | 46-47 | `all.equal(rstudent(roller.lm9), rstudent(roller.lm0))` | Studentized residuals: same zero-weight vs. removed-obs equivalence | 1e-14 |
| 4 | 48-49 | `all.equal(rstudent(roller.lm), rstudent(roller.glm))` | Studentized residuals: `lm` and `glm` produce identical values (weights `1:10`) | default |
| 5 | 50-51 | `all.equal(cooks.distance(roller.lm), cooks.distance(roller.glm))` | Cook's distance: `lm` and `glm` equivalence (weights `1:10`) | default |
| 6 | 53-54 | `all.equal(summary(roller.lm0)$coefficients, summary(roller.lm9)$coefficients)` | Summary coefficient tables match between zero-weight model and removed-obs model | 1e-14 |
| 7 | 55-56 | `all.equal(anova(roller.lm0), anova(roller.lm9))` | ANOVA tables match between zero-weight model and removed-obs model | 1e-14 |

---

## Section 2: Influence Measures on LifeCycleSavings Data (Lines 60-72)

**Data:** Built-in `LifeCycleSavings` dataset (50 observations, 5 variables).

**Model:** `lm(sr ~ pop15 + pop75 + dpi + ddpi)` (line 63)

### Block 3: stopifnot (Lines 67-70)

| # | Line(s) | Assertion | What it checks | Tolerance |
|---|---|---|---|---|
| 1 | 68-69 | `all.equal(dfbetas(lm.SR), IM$infmat[, 1:5], check.attributes=FALSE)` | `dfbetas()` output matches the first 5 columns of the `influence.measures()` matrix (column names differ, so attributes are not checked) | 1e-12 |

Additional non-assertion calls (lines 71-72): `dfbeta(lm.SR)` and `covratio(lm.SR)` are called to verify they execute without error.

---

## Section 3: Multivariate lm ("mlm") -- influence.measures (Lines 74-94)

**Data:** `reacttime` matrix -- 10 subjects x 6 conditions (reaction times), defined inline (lines 75-89).

**Model:** `mlmfit <- lm(reacttime ~ 1)` -- intercept-only multivariate linear model (line 90).

| # | Line(s) | Assertion | What it checks |
|---|---|---|---|
| 1 | 91 | `influence.measures(mlmfit)` | Correctness check: `influence.measures()` on an mlm object failed in R <= 3.5.1. Verifies it runs without error. |
| 2 | 93 | `capture.output(ImMLM)` | Verifies the `print()` method works on mlm influence measures (also failed in R <= 3.5.1). |
| 3 | 94 | `summary(ImMLM)` | Verifies the `summary()` method works on mlm influence measures. |

---

## Section 4: predict.lm with newdata (Lines 98-101)

**Data:** Same `roller` dataset and `roller.lm` model from Section 1.

### Standalone all.equal (Lines 100-101)

| # | Line(s) | Assertion | What it checks | Tolerance |
|---|---|---|---|---|
| 1 | 100-101 | `all.equal(predict(roller.lm, se.fit=TRUE)$se.fit, predict(roller.lm, newdata=roller, se.fit=TRUE)$se.fit)` | Standard errors from `predict()` without explicit `newdata` equal those with explicit `newdata=roller` (i.e., predicting on the original data both ways gives identical SE) | 1e-14 |
