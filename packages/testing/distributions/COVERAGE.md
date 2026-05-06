# Distribution Test Coverage

All tests compare against R reference values at TOL = 1e-6 (no exceptions).
Reference values generated via R scripts using `r-json-emit.R` helper.

## Results Summary

| Distribution | Tests | Pass | Fail | Status |
|---|---|---|---|---|
| normal | 14 | 14 | 0 | PASS |
| beta | 13 | 10 | 3 | FAIL — qbeta inaccuracy |
| gamma | 12 | 12 | 0 | PASS |
| exponential | 11 | 11 | 0 | PASS |
| chi-squared | 13 | 12 | 1 | FAIL — dchisq edge case |
| t | 12 | 10 | 2 | FAIL — qt extreme tail, dt overflow |
| F | 12 | 7 | 5 | FAIL — qf inaccuracy, df edge cases |
| uniform | 9 | 9 | 0 | PASS |
| weibull | 13 | 10 | 3 | FAIL — qweibull inaccuracy |
| log-normal | 13 | 13 | 0 | PASS |
| binomial | 11 | 11 | 0 | PASS |
| poisson | 11 | 5 | CRASH | CRASH — qpois panics in Rust |
| geometric | 10 | 10 | 0 | PASS |
| negative-binomial | 11 | 11 | 0 | PASS |
| hypergeometric | 9 | 9 | 0 | PASS |
| wilcoxon | 7 | 7 | 0 | PASS |
| pareto | 10 | 10 | 0 | PASS |

**Totals: 191 tests, 171 pass, 14 fail, 1 crash (6 remaining tests not reachable due to crash)**

## Bugs Found

### CRASH: qpois panics (process abort, exit 134)
- **File**: `poisson.test.ts`
- **Trigger**: `qpois({ probability: p, rateLambda: 0.5 })` for any p
- **Root cause**: statrs 0.17.1 `src/distribution/mod.rs:202` — `unwrap()` on `None`
- **Severity**: Critical — crashes the entire process, not catchable in JS
- **Note**: qpois at lambda=5 passes; the panic is specific to lambda < 1

### qbeta inaccuracy (~2-3e-5 off from R)
- **File**: `beta.test.ts`
- **Failing tests**: sym_quantile, asym_quantile, p-q round trip
- **Example**: expected 0.195800105659092, got 0.195770263671875 (diff=3e-5)
- **Root cause**: statrs quantile uses bisection search with insufficient precision

### qf inaccuracy (~5e-5 to 1.5e-4 off from R)
- **File**: `f.test.ts`
- **Failing tests**: qf at both (5,10) and (1,5), p-q round trip
- **Example**: expected 0.211190428782345, got 0.21114072674516704 (diff=5e-5)
- **Root cause**: Same bisection precision issue as qbeta

### qweibull inaccuracy (~1.5-3e-5 off from R)
- **File**: `weibull.test.ts`
- **Failing tests**: qweibull at (2,1) and (0.5,2), p-q round trip
- **Example**: expected 0.324592845974501, got 0.324615478515625 (diff=2.3e-5)
- **Root cause**: Same bisection precision issue

### qt extreme tail wrong (orders of magnitude off)
- **File**: `t.test.ts`
- **Failing test**: `qt(1e-10, df=1)` — expected -3.18e9, got -8.86e7
- **Root cause**: statrs qt breaks down at very small probabilities with df=1

### dt overflow at extreme x
- **File**: `t.test.ts`
- **Failing test**: `dt(1e155, df=5, log=TRUE)` returns -Inf instead of finite value
- **Root cause**: Intermediate computation overflows before log is applied

### dchisq(0, df=0) returns NaN instead of Inf
- **File**: `chi-squared.test.ts`
- **Root cause**: statrs doesn't handle the df=0 point-mass edge case for density at x=0

### df(0, df1=1, df2=5) returns 0 instead of Inf
- **File**: `f.test.ts`
- **Root cause**: statrs doesn't handle x=0 edge case when df1 < 2

### df(0, df1=2, df2=5) returns 0 instead of 1
- **File**: `f.test.ts`
- **Root cause**: statrs doesn't handle x=0 edge case when df1 = 2

## Common Root Cause

Most quantile (q*) failures stem from statrs using a bisection-based inverse CDF
that stops at ~2^-15 ≈ 3e-5 precision. R uses much more refined algorithms
(e.g., Newton-Raphson with analytical derivatives). The density/CDF functions
(d*, p*) are accurate; the issue is isolated to quantile functions.
