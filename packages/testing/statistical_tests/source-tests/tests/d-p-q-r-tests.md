# d-p-q-r-tests.R -- Comprehensive Test Summary

**Source file**: `d-p-q-r-tests.R` (505 lines)

## Overview

This is the primary R test file for density (d), probability/CDF (p), quantile (q), and random number generation (r) functions across all built-in distributions. It validates consistency between d/p/q/r families, checks edge cases, and verifies p-q inversion identities.

**Total test blocks (stopifnot / all.equal assertions)**: 43 distinct assertion blocks (not counting the ~80 individual `All.eq()` identity checks in the inversion section)

## Distribution Functions Referenced

| Distribution | Functions | Line References |
|---|---|---|
| Binomial | dbinom, pbinom, qbinom, rbinom | 53-68, 280-281, 306, 327, 350, 373, 395, 417, 440 |
| Geometric | dgeom, pgeom | 71-74, 288, 334 |
| Hypergeometric | dhyper, phyper, qhyper | 77-91, 289-290, 313, 334, 357, 379, 402, 424, 447 |
| Negative Binomial | dnbinom, pnbinom, qnbinom, rnbinom | 93-100, 293, 337, 360, 383, 405, 427, 450 |
| Poisson | dpois, ppois, qpois, rpois | 102-116, 295-296, 318, 338-339, 362, 385, 407, 429, 452 |
| Signed Rank | dsignrank, psignrank, qsignrank, rsignrank | 119-123, 297, 319, 340, 363, 386, 408, 430, 453 |
| Wilcoxon | dwilcox, pwilcox, qwilcox, rwilcox | 125-135, 302, 324, 344, 368, 391, 413, 435, 458 |
| Beta | dbeta, pbeta, qbeta, rbeta | 201-215, 279, 305, 326, 349, 372, 394, 416, 439 |
| Cauchy | dcauchy, pcauchy, qcauchy, rcauchy | 282, 307, 328, 351, 374, 396, 418, 441 |
| Chi-squared | dchisq, pchisq, qchisq, rchisq | 140-198, 283, 308, 329, 352, 375, 397, 419, 442 |
| Exponential | dexp, pexp, qexp, rexp | 284, 309, 330, 353, 376, 398, 420, 443 |
| F | df, pf, qf, rf | 285, 310, 331, 354, 377, 399, 421, 444, 461-498 |
| Gamma | dgamma, pgamma, qgamma, rgamma | 140-166, 286, 311, 332, 355, 378, 400, 422, 445 |
| Lognormal | dlnorm, plnorm, qlnorm, rlnorm | 267, 291, 314, 335, 358, 381, 403, 425, 448 |
| Logistic | dlogis, plogis, qlogis, rlogis | 292, 315, 336, 359, 382, 404, 426, 449 |
| Normal | dnorm, pnorm, qnorm, rnorm | 218-268, 294, 317, 338, 361, 384, 406, 428, 451 |
| Student t | dt, pt, qt, rt | 249, 298-299, 303, 320-321, 341, 364-365, 387-388, 409-410, 431-432, 454-455, 487-498 |
| Uniform | dunif, punif, qunif, runif | 300, 322, 342, 366, 389, 411, 433, 456 |
| Weibull | dweibull, pweibull, qweibull, rweibull | 301, 323, 343, 367, 390, 412, 434, 457 |

---

## Test Cases by Section

### 1. Setup and Utilities (Lines 1-39)

| Lines | What | Details |
|---|---|---|
| 8-9 | Constants | `F <- FALSE`, `T <- TRUE` |
| 10-15 | `showSys.time()` | Utility to print timing with "Time" prefix for R CMD Rdiff |
| 17-19 | Warning strictness | `options(warn=2)` -- all warnings become errors; `assertWarning` loaded |
| 21 | `as.nan()` helper | Converts NA (but not NaN) to NaN |
| 23-26 | Numeric constants | `Meps` (machine epsilon), `xMax` (double max), `rErr.eps = 1e-30` |
| 27-32 | `rErr()` | Relative error function: uses `1 - approx/true` when `|true| >= eps`, else absolute error |
| 34-37 | `All.eq()` | Numerical equality with `tolerance = 64 * .Machine$double.eps` |
| 38-39 | `set.seed(123)` | Reproducible random seed for non-interactive mode |
| 44-47 | Distribution prefix lists | `PDQRinteg` (7 discrete), `PDQR` (18 total), `PQonly` (tukey) |

### 2. Discrete Distributions -- Consistency Checks (Lines 49-135)

#### 2.1 Binomial (Lines 53-68)

| Lines | Assertion | Details |
|---|---|---|
| 57-68 | `stopifnot(all.equal(pbinom(...), cumsum(dbinom(...))))` | For random (n, p, k): checks `P[X <= k]` computed three ways: (1) `pbinom`, (2) `cumsum(dbinom)`, (3) via `pf` using Abramowitz & Stegun 26.5.24/26.5.28. Uses n0=50, n1=16, n2=20, n3=8 random draws. Triple nested loop. |

#### 2.2 Geometric (Lines 70-74)

| Lines | Assertion | Details |
|---|---|---|
| 71-74 | `stopifnot(All.eq(dg, pr*(1-pr)^(0:10)), All.eq(cumsum(dg), pgeom(...)))` | For 15 probabilities from 1e-10 to 1: checks dgeom matches formula `p*(1-p)^x` and that cumsum(dgeom) == pgeom. |

#### 2.3 Hypergeometric (Lines 77-91)

| Lines | Assertion | Details |
|---|---|---|
| 79-91 | `stopifnot(All.eq(phyper(x,m,n,k), cumsum(dhyper(x,m,n,k))))` | For 3 (m,n) pairs: (10,7), (15,0), (999,0). For each, k=2..m, checks phyper == cumsum(dhyper) on support. Also checks log.p=TRUE variant: `phyper(..., log.p=TRUE) == log(cumsum(dhyper(...)))`. |

#### 2.4 Negative Binomial (Lines 93-100)

| Lines | Assertion | Details |
|---|---|---|
| 96-98 | `stopifnot(all.equal(cumsum(dnbinom(0:7,...)), pnbinom(0:7,...)))` | **PR #842**. For size in seq(0.8, 2, by=0.1), checks pnbinom == cumsum(dnbinom) at prob=0.5. |
| 99-100 | `stopifnot(All.eq(pnbinom(c(1,3), .9, .5), c(0.777..., 0.946...)))` | Known-value check for pnbinom with size=0.9, prob=0.5. |

#### 2.5 Poisson (Lines 102-116)

| Lines | Assertion | Details |
|---|---|---|
| 104-105 | `stopifnot(dpois(0:5,0) == c(1,0,0,0,0,0), dpois(0:5,0,log=TRUE) == c(0,-Inf,...))` | Edge case: lambda=0 (point mass at 0). |
| 107-116 | `stopifnot(all.equal(pchisq(2*lambda,...), cumsum(dpois(...))), ...)` | Abramowitz & Stegun 26.4.21: Cumulative Poisson == Cumulative Chi-squared. For n1=20 random lambdas and n2=16 random k's. Also checks `1 - pp == ppois(..., lower.tail=FALSE)`. |

#### 2.6 Signed Rank (Lines 119-123)

| Lines | Assertion | Details |
|---|---|---|
| 120-123 | `stopifnot(All.eq(psignrank(x,n), cumsum(dsignrank(x,n))))` | For 32 random n (Poisson lambda=8): checks psignrank == cumsum(dsignrank) over extended range `x = -1:(n+4)`. |

#### 2.7 Wilcoxon (Lines 125-135)

| Lines | Assertion | Details |
|---|---|---|
| 127-135 | `stopifnot(All.eq(Fx, cumsum(fx)))` and `stopifnot(is.sym)` | For 5 random n, 15 random m: checks (1) pwilcox == cumsum(dwilcox), (2) symmetry: dwilcox(x,n,m) == dwilcox(x,m,n). |

### 3. Continuous Distributions (Lines 138-198)

#### 3.1 Gamma / Chi-squared Density (Lines 140-166)

| Lines | Assertion | Details |
|---|---|---|
| 141-151 | `stopifnot(all.equal(d1, d2, tol=1e-14), All.eq(d1, d3))` | For 100 random x, 30 random shapes, 30 random scales: checks dgamma(x, shape, scale) == dgamma(x/scale, shape, 1)/scale, and matches manual formula `1/(Gamma(sh)*sig^sh) * x^(sh-1) * exp(-x/sig)`. |
| 153-157 | `stopifnot(pgamma(1,Inf,scale=Inf)==0)` + `assertWarning(...)` | Edge cases: pgamma with Inf parameters. pgamma(Inf, 1, scale=Inf) and pgamma(Inf, Inf, scale=Inf) should be NaN (with warning). |
| 158-166 | `stopifnot(pgamma(Inf,1,scale=xMax)==1, ...)` | Large scale pgamma: checks pgamma(1e300, 2, scale=scLrg, log=TRUE) matches 9 known values. Tests pgamma(xMax, 1, scale=Inf) == 0. |

#### 3.2 Chi-squared / Non-central Chi-squared (Lines 168-199)

| Lines | Assertion | Details |
|---|---|---|
| 168-176 | `stopifnot(abs(1 - c(pchisq(qchisq(p,df),df)/p, ...)) < 1e-14)` | p-q inversion for chi-squared with p=7e-4, df=0.9. Tests four combinations of log/lower.tail. Regression for R <= 1.8.1. |
| 179-181 | `stopifnot(pchisq(xB, df=df, ncp=ncp) == 1)` | Non-central chi-sq at extreme x (2000, 1e6, 1e50, Inf) for various df and ncp. |
| 182-183 | `stopifnot(all.equal(qchisq(0.025,31,ncp=1,lower.tail=FALSE), 49.7766...))` | **PR #875**: infinite loop fix. |
| 184-189 | `stopifnot(all.equal(xx, qchisq(pp, df=df, ncp=1), tolerance=dtol))` | q-p inversion for non-central chi-sq across 8 df values (0.1 to 100). |
| 191-199 | `stopifnot(all.equal(q0[iO], q1[iO], ...), all.equal(p0[iO], psml[iO]))` | **PR #6421**: p near 1 gave infinite loop in R <= 1.8.1. Tests qchisq with `psml = 2^-(10:54)`, df=1.2, ncp=10. |

#### 3.3 Beta (Lines 201-215)

| Lines | Assertion | Details |
|---|---|---|
| 203-215 | `stopifnot(all.equal(dbeta(p,a,b), exp(dbeta(p,a,b,log=TRUE))))` | **PR #643**: big a & b. 20 random a (lnorm(5.5)), 20 random b (lnorm(6.5)), grid of p in [0,1]. Checks dbeta log consistency. Also verifies specific sample indices and range for reproducibility (seed=123). |

#### 3.4 Normal and Lognormal (Lines 218-268)

| Lines | Assertion | Details |
|---|---|---|
| 220-222 | `stopifnot(qnorm(0)==-Inf, qnorm(1)==Inf, ...)` | Boundary values for qnorm at 0 and 1, including log.p variants. |
| 224-226 | `assertWarning(stopifnot(is.nan(qnorm(1.1)), is.nan(qnorm(-.1))))` | Out-of-range inputs produce NaN with warning. |
| 228-233 | `stopifnot(dnorm(x,3,s=0)==..., pnorm(x,3,s=0)==..., dnorm(x,3,s=Inf)==0, pnorm(x,3,s=Inf)==...)` | Edge cases: sd=0 (point mass) and sd=Inf (uniform-like). 10-element x vector including -Inf and Inf. |
| 235-244 | Wichura (1988) test data | `qnorm(c(0.25, .001, 1e-20))` matches 3 known values to 1e-15. Also tests extreme tail: `qnorm(-1e5, log=TRUE)` and its round-trip via pnorm. |
| 246-253 | Symmetry tests | `pnorm(z) == 1 - pnorm(-z)` for 1000 random normals. Same for pt with df=1:10. Also checks lower.tail=FALSE and log.p=TRUE consistency. |
| 254-258 | Log-scale pnorm tables | Computes log(pnorm(y)) vs pnorm(y, log=TRUE) for y in -70..0 and y=1..40 (display, no assertion). |
| 259-264 | Full symmetry test | For y spanning 1:50 and 10^(3..250): `pnorm(-y, log=L) == pnorm(+y, log=L, lower=FALSE)` for L in {FALSE, TRUE}. Uses `identical()`. |
| 267 | Lognormal | `stopifnot(All.eq(pz, plnorm(exp(z))))` -- plnorm(exp(z)) == pnorm(z). |

### 4. p-q Inversion Consistency (Lines 270-272)

| Lines | Assertion | Details |
|---|---|---|
| 271-272 | `all.equal(z[ok], qnorm(pz[ok]), tolerance=1e-12)` | qnorm(pnorm(z)) == z for z where 1e-5 < pnorm(z) < 1-1e-5. |

### 5. Random Number Generation Output (Lines 274-344)

| Lines | Assertion | Details |
|---|---|---|
| 276-303 | Random draws | Generates n=20 random values from each of the 19 distributions with specific parameters. Uses seed=123. |
| 305-324 | CDF computation | Computes p-values for each random draw via the corresponding p-function. |
| 326-344 | Density computation | Computes densities for each random draw via the corresponding d-function (display, no assertion). |

### 6. q(p(.)) = Identity Checks (Lines 346-368)

All 20 distributions. Each checks `All.eq(R_dist, q_dist(P_dist, params))`.

| Lines | Distribution | Notes |
|---|---|---|
| 349 | beta | shape1=0.8, shape2=2 |
| 350 | binomial | size=55, prob=pi/16, fuzz factor f1=1-1e-7 |
| 351 | cauchy | location=12, scale=2 |
| 352 | chi-squared | df=3 |
| 353 | exponential | rate=2 |
| 354 | F | df1=12, df2=6 |
| 355 | gamma | shape=2, scale=5 |
| 356 | geometric | prob=pi/16, fuzz factor |
| 357 | hypergeometric | m=40, n=30, k=20, fuzz factor |
| 358 | lognormal | meanlog=-1, sdlog=3 |
| 359 | logistic | location=12, scale=2 |
| 360 | neg. binomial | size=7, prob=0.01, fuzz factor |
| 361 | normal | mean=-1, sd=3 |
| 362 | Poisson | lambda=12, fuzz factor |
| 363 | signed rank | n=47, fuzz factor |
| 364 | t (df=11) | -- |
| 365 | t (df=1.01) | -- |
| 366 | uniform | min=0.2, max=2 |
| 367 | Weibull | shape=3, scale=2 |
| 368 | Wilcoxon | m=13, n=17, fuzz factor |

### 7. q(1-p, lower=FALSE) = Identity Checks (Lines 370-391)

Same 20 distributions with `lower.tail=FALSE`. Lines 372-391. Uses `p1 = 1 + ep` fuzz for discrete distributions.

### 8. q(log(p), log=TRUE) = Identity Checks (Lines 393-413)

Same 20 distributions with `log.p=TRUE`. Lines 394-413. Uses `log(P) - ep` fuzz for discrete distributions.

### 9. q(log1p(-p), lower=FALSE, log=TRUE) = Identity Checks (Lines 415-435)

Same 20 distributions with both `lower.tail=FALSE` and `log.p=TRUE`. Lines 416-435.

### 10. p(x, lower=FALSE, log=TRUE) == log1p(-p(x)) Checks (Lines 437-458)

Same 20 distributions. Checks that `log(upper tail)` via `log.p=TRUE, lower.tail=FALSE` matches `log1p(-p(x))`. Lines 439-458.

### 11. Inf df in pf/df and Non-central t (Lines 461-499)

| Lines | Assertion | Details |
|---|---|---|
| 463-476 | `df(x,3,Inf)`, `pf(x,3,Inf)`, etc. | x = (1/pi, 1, pi). Tests df and pf with Inf as df1, df2, or both. Displays results (mostly non-assertion). |
| 478-485 | Non-central pf with large df2 | `pf(x, 5, 1e6..1e8, ncp=1)` converging to `pf(x, 5, Inf, ncp=1)`. Three `all.equal` checks with tolerance 1e-6. |
| 487-494 | Non-central dt with Inf df | `dt(1, Inf)`, `dt(1, Inf, ncp=0)`, `dt(1, Inf, ncp=1)`, and dt with df=1e6..1e10 and ncp=1. Inf df valid as of R 2.1.1. |
| 496-498 | Small x in dt with ncp | `dt(sml.x, df=2, ncp=1)` for sml.x from 1e-2 to 0. Previously suffered from cancellation. |

### 12. End Note (Lines 501-504)

Line 501: Explicit comment directing new tests to `d-p-q-r-tst-2.R` instead of this file.
