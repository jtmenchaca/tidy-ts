# p-r-random-tests.R -- Summary of All Test Cases

**Source file:** `p-r-random-tests.R` (181 lines)

**Total test cases:** **63 `dkwtest()` calls** (each is an individual pass/fail assertion that calls `stop()` on failure)

**Test methodology:** All tests use the Dvoretzky-Kiefer-Wolfowitz (DKW) inequality to verify that R's random number generators (`r*` functions) produce samples whose empirical CDF matches the theoretical CDF (`p*` functions). Each test draws 10,000 samples (default `sample.size`), computes the supremum error between empirical and theoretical CDFs, and rejects at a p-value threshold of 0.001.

**Key formulas (lines 64-66):**
- DKW bound: `P(sup|F_n - F| > t) < 2 * exp(-2 * n * t^2)` (Massart's tight constant)
- `pdkwbound(n, t) = 2 * exp(-2*n*t^2)` -- p-value from observed supremum error
- `qdkwbound(n, p) = sqrt(log(p/2) / (-2*n))` -- critical value for given p-threshold

**RNG version:** `RNGversion("3.5.0")` (line 12). Seeds that fail under this RNG are excluded (346 seeds listed in lines 13-48). A valid seed is randomly chosen from the remaining 9655 seeds (line 51) and saved to file `p-r-random-tests_seed` for reproducibility (line 52).

**R distribution functions tested (with line references):**

| Distribution | `r*`/`p*` stub | Lines |
|---|---|---|
| Binomial | `binom` | 95-101 |
| Poisson | `pois` | 103-106 |
| Negative Binomial | `nbinom` | 108-114 |
| Normal | `norm` | 116-117 |
| Gamma | `gamma` | 119-122 |
| Hypergeometric | `hyper` | 124-128, 170-172 |
| Signed Rank (Wilcoxon) | `signrank` | 131-134 |
| Wilcoxon Rank Sum | `wilcox` | 136-140 |
| Chi-squared | `chisq` | 142-143 |
| Logistic | `logis` | 145-146 |
| Student's t | `t` | 148-150, 175 |
| Beta | `beta` | 152-156 |
| Cauchy | `cauchy` | 158-159 |
| F | `f` | 161-164, 177 |
| Weibull | `weibull` | 166-167 |

---

## Helper Functions (Lines 55-90)

| Function | Line(s) | Purpose |
|---|---|---|
| `superror(rfoo, pfoo, sample.size, ...)` | 55-62 | Draws `sample.size` random values from `rfoo`, computes empirical CDF, returns supremum absolute difference from theoretical CDF `pfoo` |
| `pdkwbound(n, t)` | 64 | Computes DKW p-value bound: `2 * exp(-2*n*t^2)` |
| `qdkwbound(n, p)` | 66 | Computes DKW critical value: `sqrt(log(p/2) / (-2*n))` |
| `dkwtest(stub, ..., sample.size, pthreshold, ...)` | 68-90 | Main test harness: constructs `r<stub>` and `p<stub>`, calls `superror`, compares to critical value, calls `stop()` on failure |

---

## Test Cases by Distribution

### Binomial (`rbinom`/`pbinom`) -- Lines 95-101

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 1 | 95 | `size=1, prob=0.2` | Bernoulli trial, low probability |
| 2 | 96 | `size=2, prob=0.2` | Small number of trials, low probability |
| 3 | 97 | `size=100, prob=0.2` | Moderate trials, low probability |
| 4 | 98 | `size=1e4, prob=0.2` | Large number of trials (tests normal approx regime) |
| 5 | 99 | `size=1, prob=0.8` | Bernoulli trial, high probability |
| 6 | 100 | `size=100, prob=0.8` | Moderate trials, high probability |
| 7 | 101 | `size=100, prob=0.999` | Edge case: probability very close to 1 |

### Poisson (`rpois`/`ppois`) -- Lines 103-106

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 8 | 103 | `lambda=0.095` | Very small rate (mostly zeros) |
| 9 | 104 | `lambda=0.95` | Small rate |
| 10 | 105 | `lambda=9.5` | Moderate rate |
| 11 | 106 | `lambda=95` | Large rate (approaching normal approximation) |

### Negative Binomial (`rnbinom`/`pnbinom`) -- Lines 108-114

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 12 | 108 | `size=1, prob=0.2` | Geometric distribution (size=1), low prob |
| 13 | 109 | `size=2, prob=0.2` | Small size, low prob |
| 14 | 110 | `size=100, prob=0.2` | Large size, low prob |
| 15 | 111 | `size=1e4, prob=0.2` | Very large size |
| 16 | 112 | `size=1, prob=0.8` | Geometric, high prob |
| 17 | 113 | `size=100, prob=0.8` | Large size, high prob |
| 18 | 114 | `size=100, prob=0.999` | Edge case: prob very close to 1 |

### Normal (`rnorm`/`pnorm`) -- Lines 116-117

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 19 | 116 | (defaults: `mean=0, sd=1`) | Standard normal |
| 20 | 117 | `mean=5, sd=3` | Non-standard normal |

### Gamma (`rgamma`/`pgamma`) -- Lines 119-122

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 21 | 119 | `shape=0.1` | Very small shape (highly skewed, near-zero mode) |
| 22 | 120 | `shape=0.2` | Small shape |
| 23 | 121 | `shape=10` | Moderate shape (approaching symmetric) |
| 24 | 122 | `shape=20` | Large shape |

### Hypergeometric (`rhyper`/`phyper`) -- Lines 124-128

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 25 | 124 | `m=40, n=30, k=20` | Balanced urn, moderate draw |
| 26 | 125 | `m=40, n=3, k=20` | Highly unbalanced urn (many white, few black) |
| 27 | 126 | `m=6, n=3, k=2` | Small urn, small draw |
| 28 | 127 | `m=5, n=3, k=2` | Small urn variant |
| 29 | 128 | `m=4, n=3, k=2` | Small urn variant |

### Signed Rank / Wilcoxon Signed Rank (`rsignrank`/`psignrank`) -- Lines 131-134

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 30 | 131 | `n=1` | Minimal sample size |
| 31 | 132 | `n=2` | Small sample |
| 32 | 133 | `n=10` | Moderate sample |
| 33 | 134 | `n=30` | Larger sample |

### Wilcoxon Rank Sum (`rwilcox`/`pwilcox`) -- Lines 136-140

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 34 | 136 | `m=40, n=30` | Large balanced groups |
| 35 | 137 | `m=40, n=10` | Unbalanced groups |
| 36 | 138 | `m=6, n=3` | Small groups |
| 37 | 139 | `m=5, n=3` | Small groups variant |
| 38 | 140 | `m=4, n=3` | Small groups variant |

### Chi-squared (`rchisq`/`pchisq`) -- Lines 142-143

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 39 | 142 | `df=1` | 1 degree of freedom (highly skewed) |
| 40 | 143 | `df=10` | 10 degrees of freedom |

### Logistic (`rlogis`/`plogis`) -- Lines 145-146

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 41 | 145 | (defaults: `location=0, scale=1`) | Standard logistic |
| 42 | 146 | `location=4, scale=2` | Non-standard logistic |

### Student's t (`rt`/`pt`) -- Lines 148-150

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 43 | 148 | `df=1` | Cauchy-equivalent (heavy tails) |
| 44 | 149 | `df=10` | Moderate df |
| 45 | 150 | `df=40` | Large df (approaching normal) |

### Beta (`rbeta`/`pbeta`) -- Lines 152-156

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 46 | 152 | `shape1=1, shape2=1` | Uniform distribution |
| 47 | 153 | `shape1=2, shape2=1` | Right-skewed |
| 48 | 154 | `shape1=1, shape2=2` | Left-skewed |
| 49 | 155 | `shape1=2, shape2=2` | Symmetric, unimodal |
| 50 | 156 | `shape1=0.2, shape2=0.2` | U-shaped (both params < 1) |

### Cauchy (`rcauchy`/`pcauchy`) -- Lines 158-159

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 51 | 158 | (defaults: `location=0, scale=1`) | Standard Cauchy |
| 52 | 159 | `location=4, scale=2` | Non-standard Cauchy |

### F (`rf`/`pf`) -- Lines 161-164

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 53 | 161 | `df1=1, df2=1` | Both df minimal (very heavy tails) |
| 54 | 162 | `df1=1, df2=10` | Asymmetric df |
| 55 | 163 | `df1=10, df2=10` | Balanced moderate df |
| 56 | 164 | `df1=30, df2=3` | Large numerator df, small denominator df |

### Weibull (`rweibull`/`pweibull`) -- Lines 166-167

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 57 | 166 | `shape=1` | Exponential distribution (Weibull with shape=1) |
| 58 | 167 | `shape=4, scale=4` | Non-exponential Weibull |

---

## Regression Tests for Specific Bug Fixes (Lines 169-177)

### Hypergeometric -- PR#7314 (Lines 170-172)

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 59 | 170 | `m=60, n=100, k=50` | Regression test for PR#7314 (hypergeometric bug) -- large urn |
| 60 | 171 | `m=6, n=10, k=5` | PR#7314 -- small urn |
| 61 | 172 | `m=600, n=1000, k=500` | PR#7314 -- very large urn |

### Non-central t -- Bug Fix (Line 175)

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 62 | 175 | `df=20, ncp=3` | Regression test for non-central t distribution bug |

### Non-central F -- Bug Fix (Line 177)

| # | Line | Parameters | Scenario |
|---|---|---|---|
| 63 | 177 | `df1=10, df2=2, ncp=3` | Regression test for non-central F distribution bug |

---

## Timing (Line 180)

Line 92 captures `proc.time()` at the start; line 180 prints elapsed time for the entire test suite.

---

**Total:** 63 `dkwtest()` assertions across 15 distribution families (58 standard parameter variations + 5 regression tests for specific R bug fixes).
