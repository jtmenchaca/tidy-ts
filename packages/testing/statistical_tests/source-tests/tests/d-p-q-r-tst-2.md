# d-p-q-r-tst-2.R -- Comprehensive Test Summary

**Source file**: `d-p-q-r-tst-2.R` (992 lines)

## Overview

This is the continuation/regression test file for d/p/q/r distribution functions. The first file (`d-p-q-r-tests.R`) explicitly directs new tests here. This file focuses on bug fixes (PR references), extreme tail behavior, edge cases with Inf/0/NaN parameters, and numerical accuracy in difficult regimes. Many tests verify fixes for specific R bug reports.

**Total test blocks (stopifnot / all.equal / assertWarning assertions)**: ~85 distinct assertion blocks

## Distribution Functions Referenced

| Distribution | Functions | Line References |
|---|---|---|
| Exponential | pexp, qexp | 49 |
| Gamma | pgamma, dgamma, qgamma | 50, 78-88, 111-128, 338-353, 770-778, 946-957 |
| Cauchy | pcauchy, qcauchy | 51-68 |
| Binomial | dbinom, pbinom, qbinom, rbinom | 71-72, 137-139, 236-253, 310-326, 427-434, 578-579, 645-681, 960-972 |
| Geometric | dgeom, pgeom, qgeom | 75-76, 687-689, 920-933 |
| Poisson | dpois, ppois, qpois | 89-92, 355-356, 683-686, 899-917 |
| Student t | dt, pt, qt | 54-55, 95-99, 169-211, 221-225, 232-233, 531-534 |
| F | df, pf, qf, rf | 101-108, 131-134, 161-167, 256-260, 748 |
| Beta | dbeta, pbeta, qbeta, rbeta | 142-167, 214-231, 329-336, 384-414, 416-424, 436-498, 502-529, 729-741, 936-943 |
| Chi-squared | dchisq, pchisq, qchisq, rchisq | 277-281, 306-308, 358-371, 552-561, 783-788 |
| Normal | dnorm, pnorm, qnorm | 397-399, 791-828 |
| Lognormal | dlnorm, plnorm, qlnorm | 271-274, 449-453 |
| Logistic | plogis, qlogis | 373-382 |
| Hypergeometric | dhyper, phyper, qhyper, rhyper | 267-269, 427-434, 536-550 |
| Negative Binomial | dnbinom, pnbinom, qnbinom, rnbinom | 283-296, 563-631, 634-672, 831-896, 975-987 |
| Signed Rank | (not directly tested in this file) | -- |
| Wilcoxon | (not directly tested in this file) | -- |
| Uniform | (not directly tested in this file) | -- |
| Weibull | (not directly tested in this file) | -- |
| Tukey | (not directly tested in this file) | -- |

---

## Test Cases by Section

### 1. Setup and Utilities (Lines 1-46)

| Lines | What | Details |
|---|---|---|
| 8-9 | Warning config | `options(warn=2, warnPartialMatchArgs=FALSE)` |
| 10 | `assertWarning` | Loaded from tools package |
| 12 | `as.nan()` helper | Same as first file |
| 15-23 | Platform detection | Detects Linux, Mac, Windows, 64-bit, MKL, x86_64 |
| 24-35 | `rErr()`, `All.eq()` | Same numerical utilities as first file |
| 36-37 | `set.seed(123)` | Reproducible seed |
| 41-45 | Distribution prefix lists | Same `PDQRinteg`, `PDQR`, `PQonly` |

### 2. Extreme Tail Tests (Lines 48-92)

| Lines | Assertion | What is tested | Details |
|---|---|---|---|
| 49 | `All.eq(1, -1e-17/pexp(qexp(-1e-17,log=TRUE),log=TRUE))` | pexp/qexp log-scale inversion | Extreme small probability tail |
| 50 | `abs(pgamma(30,100,lower=FALSE,log=TRUE) + 7.338...e-24) < 1e-36` | pgamma upper tail log | shape=100, x=30 |
| 51 | `All.eq(1, pcauchy(-1e20) / 3.183...e-21)` | pcauchy extreme left tail | x = -1e20 |
| 52 | `All.eq(1, pcauchy(+1e15,log=TRUE) / -3.183...e-16)` | pcauchy log right tail | **PR #6756** |
| 53-55 | `stopifnot(all.equal(pt(-a,df=1), pcauchy(-a), tol=1e-15))` | pt vs pcauchy for df=1 | For a = 10^(50,100,200,300,Inf). Improving pt() |
| 56-61 | Cauchy q-p inversion | **PR #7902** | Tests qcauchy(pcauchy(-x)) == -x, qcauchy(pcauchy(+x, log=TRUE), log=TRUE) == +x, pcauchy(qcauchy(1/x)) == 1/x, pcauchy(qcauchy(ex, log=TRUE), log=TRUE) == ex. x = 10^(1..Inf). |
| 62-65 | `stopifnot(pcauchy(II)==0:1, qcauchy(0:1)==II, ...)` | Cauchy at +/-Inf | Boundary values and log.p variants |
| 66-68 | `stopifnot(all.equal(qcauchy(p), 1303.797...))` | **PR #15521** | p = 1 - 1/4096 |
| 70-72 | `stopifnot(all.equal(pr^12, pbinom(11,12,prob=pr,lower=FALSE)))` | **PR #6757** | pr = 1e-23; pbinom gave 0 in R 1.9.0 |
| 74-76 | `stopifnot(all.equal(2*pp, pgeom(1,pp)))` | **PR #6792** | pp = 1e-17; pgeom gave 0 in R 1.9.0 |
| 78-87 | `All.eq(-x, pgamma(x,...,lower=FALSE,log=TRUE))` | pgamma log upper tail | x = 10^(100:295), 7 shapes from 1e-250 to 1e100. Also x = 2^(-1022:-900) with shapes 10 and 0.1. Completely off in R 2.0.1. |
| 89-92 | `All.eq(dpois(10*1:2, 3e-308, log=TRUE), c(-7096..., -14204...))` and `All.eq(dpois(1e20, 1e-290, log=TRUE), -7.128...e22)` | dpois log with extreme lambda | lambda=3e-308 and 1e-290; all gave -Inf in R 2.0.1 |

### 3. dt() with Large x and Log Scale (Lines 95-99)

| Lines | Assertion | Details |
|---|---|---|
| 95-99 | `stopifnot(is.finite(lfx), All.eq(exp(lfx), dt(x, df=nu)))` | For x = outer(1:12, 10^(-3..300)) and nu in {0.75, 1.2, 4.5, 999, 1e50}: dt(x, df, log=TRUE) must be finite and exp(log) must round-trip. dt(1e160, 1.2, log=TRUE) was -Inf up to R 2.15.2. |

### 4. pf() with Large df (Lines 101-108)

| Lines | Assertion | Details |
|---|---|---|
| 101-108 | `stopifnot(All.eq(pf(1,1,Inf), target), diff(c(y,target))>0, ...)` | **PR #7099 related**. nu = 2^(25..34 by 0.5), target = pchisq(1,1). pf(1,1,nu) must be monotone increasing toward target. Non-monotone in R <= 2.1.0. |

### 5. pgamma / qgamma Edge Cases (Lines 111-128)

| Lines | Assertion | Details |
|---|---|---|
| 111 | `stopifnot(pgamma(Inf, 1.1)==1)` | Did not terminate in R 2.1.x |
| 114-118 | `stopifnot(Inf==qgamma(1,sh), 0==qgamma(0,sh))` | qgamma boundary at q=0,1 for sh in {1.1, 0.5, 0.2, 0.15, 1e-2, 1e-10}. First gave NaN in R <= 2.1.1. |
| 120-129 | `stopifnot(diff(qg,diff=2) < -6e-6, ...)` | **PR #11030**: qgamma in extreme left tail. p = 10:123*1e-12, shape=19 and 1:100*1e-9, shape=11. Checks convexity and p-q round-trip. Non-continuous in R <= 2.6.2. |

### 6. df() at x=0 (Lines 131-134)

| Lines | Assertion | Details |
|---|---|---|
| 131-134 | `stopifnot(df(0,1,f2)==Inf, df(0,2,f2)==1, df(0,3,f2)==0)` | f2 = {0.5, 1, 2, 3, 4}. Only df(0,3,*)==0 was correct in R <= 2.2.1. |

### 7. dbinom / pbinom with Small Negative x (Lines 137-139)

| Lines | Assertion | Details |
|---|---|---|
| 137-139 | `assertWarning(fx0 <- dbinom(x0,...)); stopifnot(fx0==0, pbinom(x0,...)==0)` | x0 = -2*10^(-22,-10,-7,-5). Very small negatives were rounded to 0 in R <= 2.2.1. |

### 8. Non-central Beta Density (Lines 142-159)

| Lines | Assertion | Details |
|---|---|---|
| 144-151 | `stopifnot(All.eq(a, dbeta(0,1,a,ncp=0)), dbeta(0,0.9,2.2,ncp=c(0,a))==Inf, ...)` | dbeta(0,1,a,ncp=0) should equal a (gave 0 in R <= 2.3.0). dbeta(0,0.9,...) should be Inf (gave NaN). Also checks known values for dbeta(0:16/16, 5, 1). |
| 153-159 | `stopifnot(all.equal(dbeta(0.8,0.5,5,ncp=1000), 3.0018...e-35))` | Way too small in R <= 2.6.2. Also checks integrate(dbeta, 0,1,...) == 1 for three (a,b,ncp) combos. |

### 9. Non-central F Density (Lines 161-167)

| Lines | Assertion | Details |
|---|---|---|
| 162-167 | `stopifnot(all.equal(dx.h, df(x,7,5,ncp=2.5), tol=1e-6), All.eq(df(0,2,4,ncp=x), df(1e-300,2,4,ncp=x)))` | Numerical derivative of pf matches df for non-central F. Also checks continuity of df at x near 0. |

### 10. qt() Near Zero and Extreme Tails (Lines 169-211)

| Lines | Assertion | Details |
|---|---|---|
| 169-174 | `stopifnot(rerr < 1e-14)` | **PR #9804**: qt(p, df=1) for p = 10^(-10:-20). Checks pt(qt(p,1),1) recovers p. |
| 177-178 | `stopifnot(all.equal(qt(-740, df=2, log=TRUE), -exp(370)/sqrt(2)))` | df=2, P~0 extreme tail |
| 179-183 | `stopifnot(all.equal(qt(p.5, df=2), c(8.429...e-08, ...)))` | df=2, P~0.5: p.5 = 0.5 + 2^(-25,-30,-35,-40). 4 known values. |
| 184-186 | `stopifnot(all.equal(qt(-1000, df=4, log=TRUE), -4.930611e108, tol=1e-6))` | qt with large negative log.p, df=4. |
| 187-189 | `stopifnot(abs(5/6 - quantile(diff(log(qtp)), ...)) < 1e-11)` | qt(-(20:850), df=1.2, log=TRUE, lower=FALSE): log-spacing should be ~5/6. |
| 191-194 | `stopifnot(all.equal(-20, pt(qt(-20,df=1.02,log=TRUE),df=1.02,log=TRUE),tol=1e-12), ...)` | Close to df=1 (Taylor steps important). Also checks monotonicity of log(qt(...)) for df=1.1. |
| 195-198 | `stopifnot(mean(abs(diff(lq1)-log(2))) < 1e-8, mean(abs(diff(lq2)-log(sqrt(2)))) < 4e-8)` | Log-spacing of qt for df=1 should be log(2), for df=2 should be log(sqrt(2)). |
| 199-201 | `stopifnot(all.equal(lp, -pt(qt(exp(-lp),1.2),1.2,log=TRUE), tol=4e-16))` | log.p=FALSE case gave NaN when log.p=TRUE was fine. lp = 40:406. |
| 202-211 | `stopifnot(all.equal(q,qpq, tol=0.2))` | **PR #18360**: qt with log.p for df near 1. For df in {1.001, 1.01..1.1}: q = exp(200..500 by 0.5), checks pt(qt(log(p))) round-trip. Still inaccurate (tol=0.2) but no longer NaN. |

### 11. pbeta() Log Upper Tail (Lines 214-233)

| Lines | Assertion | Details |
|---|---|---|
| 214-219 | `stopifnot(all.equal(pbeta(x,...,lower=FALSE,log=TRUE), pbval), all.equal(pbeta(1-x,...,log=TRUE), pbval))` | toms708 improved tail. x = {.01,.10,.25,.40,.55,.71,.98}, a=0.8, b=2. 7 known pbval values. |
| 220-225 | `stopifnot(is.finite(pqq))` | **PR #14230**: pt(-qq, df=nu, log=TRUE) for qq = 2^(0:1022), nu in 12 values from 0.1 to 500. Must be finite. |
| 226-231 | `stopifnot(is.finite(P), P < -600, ...)` | **PR #14230** more extreme beta: pbeta(x, 3, 2200, lower=FALSE, log=TRUE) for x = (256:512)/1024. All but first 43 were -Inf in R <= 2.9.1. |
| 232-233 | `stopifnot(All.eq(pt(2^-30, df=10), 0.50000000036...))` | pt at very small x |

### 12. rbinom with Large Size (Lines 236-253)

| Lines | Assertion | Details |
|---|---|---|
| 237-241 | `stopifnot(0:6 %in% names(tt), sum(tt)==100, sum(t2)==100)` | rbinom(n, M, pr) where M = .Machine$integer.max, pr = 1e-9 and 1e-10. Gave NaN for large size in R <= 2.6.1. |
| 243-253 | `stopifnot(k[nDup][pn1] == qb[pn1])` | Related qbinom tests for n in {(M+1)/2, M, 2M, 10M}, pr in {1e-8, 1e-9, 1e-10}. qbinom gave NaN in R 4.0.2. |

### 13. qf() with Large df (Lines 256-260)

| Lines | Assertion | Details |
|---|---|---|
| 256-260 | `stopifnot(qf(1/4,Inf,Inf)==1, all.equal(1, 1e-18/pf(qf(1e-18,12,50),12,50), tol=1e-10), ...)` | qf with df1=1e60, df2=1e90. Also qf(1/4,Inf,Inf)==1 and log.p round-trip. |

### 14. qbeta() with log.p Border Cases (Lines 262-265)

| Lines | Assertion | Details |
|---|---|---|
| 262-265 | `stopifnot(is.finite(q0), 1==qbeta(-1e10,2,3,log.p=TRUE,lower=FALSE))` | Infinite loop or NaN in R <= 2.7.0. |

### 15. phyper Edge Case (Lines 267-269)

| Lines | Assertion | Details |
|---|---|---|
| 267-269 | `stopifnot(all(phyper(c(0:3, 1e67), 0,0,0)==1))` | **PR #11813**: phyper(x, 0,0,0) for huge x. Infinite loop and NaN in R <= 2.7.1. |

### 16. plnorm Boundary (Lines 271-274)

| Lines | Assertion | Details |
|---|---|---|
| 271-274 | `stopifnot(plnorm(-1:0,...,log.p=TRUE)==0, plnorm(-1:0,...,log.p=TRUE)==-Inf)` | **PR #11867**: plnorm(<= 0) with log.p. Was wrongly using log.p=FALSE result in R <= 2.7.1. |

### 17. pchisq(df=0) and Non-central (Lines 277-281)

| Lines | Assertion | Details |
|---|---|---|
| 277-281 | `stopifnot(pchisq(c(-1,0,1),df=0)==c(0,0,1), ..., pchisq(500:700,1.01,ncp=80)<=1)` | pchisq(df=0) was wrong in R 2.7.1; P*(0,0) gave 1 up to R 2.10.1. For ncp>=80, gave values >= 1 in R 2.10.0. |

### 18. dnbinom Extreme size/mu (Lines 283-296)

| Lines | Assertion | Details |
|---|---|---|
| 284-287 | `stopifnot(d < 0, diff(d) > 0, d[1] < 1e-10)` | dnbinom(17, mu=20, size=1e11*2^(1:10)) converges to dpois(17, 20). Wrong up to R 2.7.1. |
| 288-291 | `stopifnot(all.equal(1/(1+mu), dnbinom(0,size=1,mu=mu), tol=1e-13))` | Cancellation fix for x=0: mu = 1e12 * 2^(0:20). Wrong in R 2.7.2 only. |
| 292-296 | `stopifnot(abs(rErr(NB,P)) < 9*.Machine$double.eps)` | dnbinom(5, size=1e305, mu=mu, log=TRUE) vs dpois(5, mu, log=TRUE) for mu up to 10^300. Wrong in R <= 3.1.0. |

### 19. Non-central F Large x (Lines 299-303)

| Lines | Assertion | Details |
|---|---|---|
| 300-303 | `stopifnot(-0.047 < dP, dP < -0.0455)` | pf(x, df1=1, df2=1, ncp=20, lower=FALSE, log=TRUE) for x = 1e16 * 1.1^(0:20). Jumped to -Inf prematurely in R <= 2.8.0. |

### 20. Non-central Chi-squared Density Large x (Lines 306-308)

| Lines | Assertion | Details |
|---|---|---|
| 307-308 | `stopifnot(0 == dchisq(c(Inf,1e80,1e50,1e40), df=10, ncp=1))` | **PR #13309**: dchisq hung in R <= 2.8.0. |

### 21. qbinom with Large Size / Small Prob (Lines 310-326)

| Lines | Assertion | Details |
|---|---|---|
| 312-326 | `stopifnot(All.eq(qb, pb))` and `stopifnot(qq.x == q.xct)` | **PR #13711**: sizes = {5000279, 5006279, 5016279} * 1000, pr = (2:20)*1e-7. Compares qbinom with qpois for small prob. Also checks pbinom -> qbinom round-trip. Thinko in do_search() in R <= 2.9.0. |

### 22. pbeta Log-Linear in Small x (Lines 329-336)

| Lines | Assertion | Details |
|---|---|---|
| 329-336 | `stopifnot(sd(dp)/mean(dp) < 0.0007)` | For a in {1e-8, 1e-12, 16e-16, 4e-16}, b in {0.6, 1, 2, 10}: diff(pbeta(x, a, b, log=TRUE)) should be nearly constant for x = 2^-(200:10). Accidental cancellation '1 - w'. |

### 23. qgamma/pgamma for Small Shape (Lines 338-353)

| Lines | Assertion | Details |
|---|---|---|
| 340-353 | `stopifnot(qgamma(.99,.00001)==0, abs(pg[2]-1.189...e-20)<1e-33, ...)` | a = 2^-seq(10,1000,0.25). Tests qgamma(1e-100,a,lower=FALSE), qgamma(1e-300,...), and pgamma round-trips. Also pgamma(x, 2^-64, lower=FALSE) continuity at x=1. Wrong orders of magnitude in R <= 2.10.0. |

### 24. qpois Lambda=0 (Line 355)

| Lines | Assertion | Details |
|---|---|---|
| 355-356 | `stopifnot(all(qpois((0:8)/8, lambda=0)==0))` | Gave Inf because p==1 was checked before lambda==0. |

### 25. Non-central Chi-squared Extreme Tail (Lines 358-371)

| Lines | Assertion | Details |
|---|---|---|
| 359-360 | `stopifnot(all.equal(pchisq(200,4,ncp=.001,log.p=TRUE), -3.851e-42))` | **PR #14216**: jumped to zero too early in R <= 2.10.1. |
| 362-368 | `stopifnot(is.finite(lp), lp < -184, all.equal(lp[201], -7115.107...), ...)` | Left extreme tail: pchisq(2^-(0:200), 100, 1, log=TRUE). Underflowed to -Inf in R <= 3.1.0. |
| 369-371 | `stopifnot(all.equal(pchisq(1:2,1.01,ncp=80*(1-e),log=TRUE), c(-34.574...,-31.315...)))` | Continuity at ncp=80 branch point (for e in {0, 2e-16}). |

### 26. Logistic Extreme Tails (Lines 373-382)

| Lines | Assertion | Details |
|---|---|---|
| 374-377 | `stopifnot(All.eq(x, qlogis(plogis(x,log.p=TRUE),log.p=TRUE)))` | x = 10:80, 85..200, 220..700. qlogis gave Inf too early in R <= 2.12.1. |
| 378-382 | `stopifnot(All.eq(x, qlogis(plogis(x,lower=FALSE,log.p=TRUE),lower=FALSE,log.p=TRUE)))` | Extended x to 800. plogis underflowed to -Inf too early in R <= 2.15.0. |

### 27. pbeta Log Upper Tail (Lines 384-424)

| Lines | Assertion | Details |
|---|---|---|
| 385-395 | `stopifnot(-1094 < pbx, ..., all.equal(log(b), y+1.113, tol=.00002))` | **PR #15162**: pbeta(x, 1/2, 2200, lower=FALSE, log=TRUE) for x = (25:50)/128. Also pbeta(.28, 1/2, b) for b = 2200*2^(0:50). Had -Inf/Inf in R <= 2.15.3. |
| 397-399 | `stopifnot(abs(1-dnorm(35+3^-9)/3.933...e-267) < 1e-15)` | dnorm(x) for "large" |x|. Losing up to 8 bits in R <= 3.0.x. |
| 401-404 | `stopifnot(abs(ldp-log(1/2)) < 1e-9)` | **PR #15641**: pbeta(0.5, 2^-(90+1:25), 2^-60, log=TRUE). Lost all precision in R <= 3.0.x. |
| 406-414 | `stopifnot(all.equal(px[1], -746.099...), 0.0445741 < dpx, ...)` | "Stair function" effect from denormalized numbers. a=43779, b=0.06728, x = .9833+(0:100)*1e-6. Way off in R <= 3.1.0. |
| 416-424 | `stopifnot(all.equal(p0, -1.000050...e26), ..., c(c1,c2) < 1000*cB)` | pbeta(1-epsilon, 1e30, 1.001, log=TRUE) for epsilon near 0. (Almost) infinite loop in R <= 3.1.0. Also checks timing. |

### 28. Almost-Integer n for dbinom/pbinom/dpois/dhyper (Lines 427-434)

| Lines | Assertion | Details |
|---|---|---|
| 427-434 | try/lapply over 1000 random M values | **PR #15734**: R allows "almost integer" n. For each FUN in {dbinom, pbinom, dpois, dhyper}: test n = (M/100)*10^(2:20). Check too tight for large n in R <= 3.1.0. |

### 29. Beta with Inf Parameters (Lines 436-447)

| Lines | Assertion | Details |
|---|---|---|
| 437-443 | `stopifnot(pbeta(.1,Inf,40)==0, pbeta(.5,40,Inf)==1, pbeta(.4,Inf,Inf)==0, pbeta(.5,Inf,Inf)==1, qbeta(.9,Inf,100)==1, qbeta(.1,Inf,Inf)==1/2)` | Infinite loop or NaN in R <= 3.1.0. |
| 445-447 | `assertWarning(...); stopifnot(is.nan(qN), is.nan(qn))` | Range check: qbeta with out-of-range log.p and direct p values. |

### 30. Lognormal sdlog=0 Boundary (Lines 449-453)

| Lines | Assertion | Details |
|---|---|---|
| 449-453 | `stopifnot(all.equal(qlnorm(p,...,sdlog=0), qlnorm(p,...,sdlog=1e-200)), dlnorm(x,sdlog=0)==ifelse(x==1,Inf,0))` | sdlog=0 is a point mass at exp(meanlog). |

### 31. qbeta() Asymmetric / Small Parameters (Lines 455-529)

| Lines | Assertion | Details |
|---|---|---|
| 456-462 | `stopifnot(all.equal(2^-28, pbeta(q1,...), tol=2^-50), abs(1-pp/alpha)<4e-15)` | qbeta(2^-28, 0.125, 2^-26) gave 1000 Newton iterations. Also a=1/8, b=2^-(4:200), alpha=b/4. |
| 464-478 | `stopifnot(all.equal(pb, pbeta(x,a,b,log.p=TRUE), tol=8e-16), all.equal(x, qp, tol=1e-15))` | Known "truth" from Rmpfr: a=25, b=6, x=2^-c(3:15,100..1000). 24 high-precision pbeta values. Checks qbeta recovers x. |
| 480-501 | **PR #15755** | a1=0.0672788, b1=226390. qbeta(0.695, a1, b1) was 1 with warning in R <= 3.1.0. Also a=43779, b=0.06728: qbeta on log scale, checking pbeta round-trip. |
| 502-511 | `stopifnot(1-qq < 1e-15, is.nan(qN), is.nan(qn))` | .a=.2, .b=.03, lp=-(10^-(1:323)): qbeta(lp, .a, .b, log=TRUE) gave warnings in R <= 3.1.0. |
| 514-517 | `stopifnot(abs(pq-1/8) < 1/8)` | a=2^-8, b=2^(200:500): qbeta would underflow to 0 too early in R <= 3.1.0. |
| 519-529 | Very extreme tails | qbeta(x, 2^-12, 2^-10) for x near 0 should give 0. qbeta(0.95, a, 20) for a=10^-(8:323). Also qbeta(0.95, a, a) timing check. |

### 32. qt with df=Inf and ncp (Lines 531-534)

| Lines | Assertion | Details |
|---|---|---|
| 532-534 | `stopifnot(all.equal(qt(p,df=Inf,ncp=5), qnorm(p,m=5)))` | p = (0:32)/32. qt(*, df=Inf, ncp) should equal qnorm(*, m=ncp). Gave NaN in R <= 3.2.1. |

### 33. rhyper with Large Parameters (Lines 536-550)

| Lines | Assertion | Details |
|---|---|---|
| 537-546 | `stopifnot(identical(c(table(N)), ...), abs(mean(N)-8)<1.5)` | **PR #16489**: rhyper(100, 8000, 1e9-8000, 1e6). N were all 0 and very slow in R <= 3.2.1. Checks exact table and mean. |
| 547-550 | `stopifnot(rhyper(1,3024,27466,251)==25, rhyper(1,329,3059,225)==22)` | Post-fix regression test (thinko in bug fix). |

### 34. Chi-squared df=0, ncp=0 (Lines 552-561)

| Lines | Assertion | Details |
|---|---|---|
| 553-555 | `stopifnot(rchisq(32,df=0,ncp=0)==0, dchisq((0:16)/16,df=0,ncp=0)==c(Inf,0,...))` | Point mass at 0. Gave all NaN in R <= 3.2.2. |
| 557-561 | `stopifnot(all.equal(pp, -th/2, tol=1e-15))` | pchisq(0, df=0, ncp=th, log.p=TRUE) for th = 10*(1:9, 10, 100, 1000, 1e7). Underflowed at ~60 in R <= 3.2.2. |

### 35. pnbinom with Huge Arguments (Lines 563-566)

| Lines | Assertion | Details |
|---|---|---|
| 564-566 | `stopifnot(is.nan(p) || p==1)` | pnbinom(1e308, 1e308, mu=5). Infinite loop on some 64b platforms in R <= 3.2.3. |

### 36. dnbinom/pnbinom/qnbinom/rnbinom with size=Inf (Lines 568-631)

| Lines | Assertion | Details |
|---|---|---|
| 568-602 | **PR #16727** (extends PR #15628) | dnbinom(x, mu=5, size=Inf) should equal dpois(x, 5). Also tests pnbinom, qnbinom, rnbinom with size=Inf and size=1e308. x includes 0:3, 1e10, 1e100, 1e308, Inf. All gave NaN in R <= 3.2.3. |
| 579 | `stopifnot(dbinom(2^c(0:1023,1023.999), size=Inf, prob=.1)==0)` | dbinom with size=Inf: were all NaN. |
| 580-586 | dnbinom(xL, mu/prob, size=Inf/MxM) | Multiple combos of large x with Inf or MxM size. All should be 0. |
| 603-631 | More size=Large cases | dnbinom for x near MxM with various large sizes (MxM, MxM/2, MxM/4, MxM/8). Both prob and mu parameterizations. Mostly gave NaN in R <= 3.2.3. |

### 37. dnbinom/dbinom with Very Large Args -- Log Scale (Lines 633-681)

| Lines | Assertion | Details |
|---|---|---|
| 634-644 | `stopifnot(all.equal(tol=1e-12, -2^1015*c(...), dnb))` | xx=7e307, sz=1e308, prb=various. dnbinom(xx, sz, prob, log=TRUE). 11 known values from Rmpfr. |
| 645-657 | `stopifnot(all.equal(tol=1e-11, -2^1012*c(...), db))` | dbinom(1.2e308, 1.72e308, prob, log=TRUE) for 20 prob values. 20 known values from Rmpfr. |
| 658-672 | db0() tweak against overflow | **R <= 4.5.0**: 15 specific (x, size, prob) triples where dbinom(..., log=TRUE) gave -Inf due to overflow of 2*x*v in ebd0(). Known values to tol=1e-5. |
| 674-681 | dbinom for very small prob | x=12..5000, size=x+1, prob=2^-1024.1. 14 known log values. All but first two were -Inf in R <= 4.5.0. |

### 38. qpois/qgeom with Invalid p (Lines 683-689)

| Lines | Assertion | Details |
|---|---|---|
| 683-686 | `stopifnot(is.nan(suppressWarnings(c(qpois(c(-2,3,NaN),3), ...))))` | **PR #16972**: qpois with invalid p. qpois(1, 3, log.p=TRUE), qpois(.5, 0, log.p=TRUE), qpois(c(-1,pi), 0) gave 0 in R <= 3.3.1. |
| 687-689 | `stopifnot(qgeom((0:8)/8,prob=1)==0, is.nan(...))` | qgeom(*, prob=1) gave Inf in R <= 3.3.1. |

### 39. r-dist() with NA in Parameters (Lines 691-726)

| Lines | Assertion | Details |
|---|---|---|
| 691-726 | Loop over all PDQR distributions | For each distribution: call r-function with one NA argument at a time (cycling through all params). Must produce warning and return NA/NaN. Tests all 18 distributions. |

### 40. qbeta() Discontinuity in Asymmetric Cases (Lines 729-741)

| Lines | Assertion | Details |
|---|---|---|
| 730-741 | `stopifnot(all.equal(qbet[[1]], 0.04720690...), max(abs(rE))<1e-12, ...)` | sh2 = 2^(9..16 by 1/16), p=1e-10. Checks qbeta(p, 1.5, sh2, lower=FALSE) smoothness via diffs. Discontinuity from wrong Newton jump in R <= 3.3.2. |

### 41. rt/rf/rbeta with Non-scalar ncp (Lines 744-751)

| Lines | Assertion | Details |
|---|---|---|
| 744-751 | `assertWarning(T<-rt(3,4,ncp=nc)); stopifnot(identical(iN,is.na(T)), ...)` | **PR #17306, PR #17375**: nc = c(NA, 1). rt, rf, rbeta with non-scalar ncp containing NA. Not handled correctly in R <= 3.4.3. |

### 42. Walker Probability Sampling (Lines 754-767)

| Lines | Assertion | Details |
|---|---|---|
| 755-759 | `stopifnot(sum(x==1)==994)` | Old walker_ProbSample with RNGversion("3.5.0"), seed=12345, p=c(2, rep(1,200)), 100000 samples. |
| 761-767 | `stopifnot(sum(x<=201)==100000)` | New walker_ProbSample with RNGversion("3.6.0"), seed=12345. 999 categories with epsilon=1e-10 probabilities after position 201. All samples must be <= 201. |

### 43. dgamma for Small x and shape < 1 (Lines 770-778)

| Lines | Assertion | Details |
|---|---|---|
| 771-778 | `stopifnot(all.equal(dgamma(2^-1027, shape=.99, log=TRUE), 7.1127...), ...)` | **PR #17577**: 4 cases with x = 2^-1027..2^-1048, shape = 0.99..1e-7, including with scale=1e-315. All gave Inf in R <= 3.6.1. |

### 44. pchisq Near-Infinite Loop (Lines 782-788)

| Lines | Assertion | Details |
|---|---|---|
| 784-788 | `stopifnot(p==1)` | pchisq(1.00000012e200, df=1e200, ncp=100). Practically infinite loop on 64-bit in some R versions. |

### 45. qnorm Extreme Tails (Lines 791-828)

| Lines | Assertion | Details |
|---|---|---|
| 792-811 | `stopifnot(all.equal(qs, qpU, tol=1e-15), all.equal(-qs, qp., tol=1e-15), ...)` | qs = 2^(0..155 by 1/8). pnorm(qs, log=TRUE, lower=FALSE) -> qnorm round-trip. Both gave NaN in R <= 4.0.x. Max relative error was 5.68e-6 in R <= 4.2.1, now < 1e-15. |
| 813-821 | `stopifnot(all.equal(-1.797...e308, pnorm(-1.896...e154, log=TRUE)), is.finite(px), ...)` | pnorm(x, log=TRUE) now works for |x| up to 1.896e154 (was 1.34e154). All were -Inf in R <= 4.0.x. |
| 823-828 | `stopifnot(pL>0, all.equal(6.6016e-323, pL), ...)` | pnorm returns denormalized values: pnorm(-38.4) > 0, pnorm(-38.467...) == 2^-1074. Boundary was at -37.5193 in R <= 4.4.x. |

### 46. qnbinom with Large size / Small mu (Lines 831-869)

| Lines | Assertion | Details |
|---|---|---|
| 831-846 | `stopifnot(pbi==1 | qi==qnbinom(pbi,...), qiL==qnbinom(pbiU,...))` | **PR #18095**: For N from 1e-300 to 1e300 (24 values): qnbinom p-q inversion with mu=1. Gave all 0 in R <= 4.1.0. |
| 849-869 | `stopifnot(st < .5, qn==0, ...)` | Fix qnbinom with small size. size=2^-(10:59) was slow (30 sec). Also qnbinom(.9999, mu=3, size=1e-4) == 7942 (was 8044). Large size=1e13 with mu=size/4: off by 23 in R <= 4.0.2. Small size=1e-9 with mu=30: off by 1 in R <= 4.0.2. |

### 47. dnbinom Underflow (Lines 875-896)

| Lines | Assertion | Details |
|---|---|---|
| 876-877 | `stopifnot(dnbinom(1:40, size=2^58, prob=1)==0)` | **PR #18072**: gave mostly 1 in R <= 4.1.0. |
| 878-885 | `stopifnot(dn + dL > 0, 0.09 < dl.dn1, dl.dn1 < 0.93)` | sz=2^70, prb=.9999999. dnbinom(x, sz, prb, log=TRUE) accuracy. Lost 6+ digits in R <= 4.1.0. |
| 886-896 | `stopifnot(-39.1 < dS, dS < -34.53, ...)` | Reverse case: very small size (1e-15), mu=200. dnbinom(1:90, size=1e-15, mu=200, log=TRUE). Also dnbinom(16:20, size=1e-15, prob=1/2, log=TRUE) matches 5 known values. Failed in R 4.1.1 only. |

### 48. dpois via ebd0() (Lines 899-917)

| Lines | Assertion | Details |
|---|---|---|
| 900-903 | `stopifnot(abs(dpois(40,7.5)/6.817...e-17 -1) < 6e-16, abs(dpois(1400,1000)/1.467...e-33 -1) < 8e-16)` | **PR #15628**: dpois accuracy. Was 2.66e-15 and 1.71e-14 relative error in R <= 4.1.1. |
| 904-917 | `stopifnot(dpxx > 0, is.finite(ldpxx), ...)` | Very large x: x = trunc(2^(1000+1..24)). dpois(x,x) must be > 0 and finite on log scale. Approximates 1/sqrt(2*pi*x). Underflowed to 0 in R <= 4.1.1. |

### 49. dgeom Accuracy via dbinom_raw (Lines 920-933)

| Lines | Assertion | Details |
|---|---|---|
| 920-933 | `stopifnot(abs(1-dgeom(x,31/32)/tru1)*2^52 <= 4, ...)` | **PR #18642**: dgeom accuracy improved via dbinom_raw. x={159,171,183,201} with prob=31/32: 4 known values. xs=44400+offsets with prob=1/64: 6 known values. Relative error * 2^52 was ~240-250 in R <= 4.3.z, now <= 4. Platform-specific tolerance for Windows. |

### 50. pbeta with shape=0 (Lines 936-943)

| Lines | Assertion | Details |
|---|---|---|
| 936-943 | `stopifnot(pbeta(0,0,3)==1, pbeta(1,.1,0)==1, pbeta(1.1,3,0)==1, pbeta(0,0,0)==0.5, pbeta(1,0,0)==1)` | **PR #18672**: x=0 or 1 when one or both shape parameters are 0. Each had wrong values previously. |

### 51. stirlerr(x) for Non-Half-Integer x -- dgamma (Lines 946-957)

| Lines | Assertion | Details |
|---|---|---|
| 947-957 | `stopifnot(abs(relE) < 9e-16)` | **PR #18640**: dgamma(x0, sh=14.53125) for x0 = 1/4 + 8:20. 13 known values from Rmpfr. Relative error * 2^53 was in {-95:-91} in R <= 4.3.*, now in {-2:2}. |

### 52. qbinom Inversion of pbinom (Lines 960-972)

| Lines | Assertion | Details |
|---|---|---|
| 960-972 | `stopifnot(qb6==c(6001:6004,6004:6005), 1>pqb6 & pqb6>=0.05, 0.05>pqb6_1 & pqb6_1>=0.035)` | **PR #18711**: sz=6040:6045, prb=0.995, p=0.05. qbinom(0.05, sz, prb) must satisfy the quantile definition: pbinom(q) >= p AND pbinom(q-1) < p. Wrong in R versions 4.1.1 through 4.4.0. |

### 53. pnbinom -> pbeta for Very Large (a,b) (Lines 975-987)

| Lines | Assertion | Details |
|---|---|---|
| 975-987 | `stopifnot(pnbinom(L,L,mu=0.7)==1, pnbinom(L,L,prob=1/4)==0, pbeta(1/4,L,L)==0, ...)` | L = 2^(1023+offsets). Tests pnbinom and pbeta with arguments near double max. Also log.p variants. Last 6 values each were NaN in R <= 4.5.0. |
