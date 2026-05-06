# R Source Test Porting Plan

## TOLERANCE POLICY — NON-NEGOTIABLE

**TOL = 1e-6. No exceptions. No compromises. No "documenting known inaccuracies."**

- Every numerical comparison uses `TOL = 1e-6`, consistent with both the statistical tests (`helpers.ts`) and GLM (`glm-test-helpers.ts`) suites.
- If a test fails because our implementation doesn't meet 1e-6, **that is a real bug in our implementation**. The correct response is to fix the implementation, not to:
  - Weaken the tolerance for that test
  - Skip the test with a comment like "known limitation"
  - Use a different tolerance constant
  - Document the discrepancy and move on
- The only acceptable reason to mark a test case as "not applicable" is if we genuinely don't expose the function being tested (e.g., `mood.test`, `power.t.test`). Numerical precision shortfalls are bugs, not exclusions.
- If a case legitimately cannot be ported because it tests R infrastructure (S3 dispatch, formula parsing, print methods), mark it `[ ] ... -- R infrastructure, not applicable`.

---

## Infrastructure

### Existing Pattern (GLM)

The GLM source tests follow this structure:

```
packages/testing/glm/
  source-tests/
    r-json-emit.R          # Shared JSON emit helper
    tests/
      glm.R                # Original R source file (verbatim copy)
      glm-etc.R            # ...
  r-source-tests/
    glm-source-test.R      # Companion: extracts test cases from glm.R, emits JSON
    glm.test.ts            # TS test: runs companion R script, validates our impl
    glm-etc-source-test.R
    glm-etc.test.ts
```

Each TS test file has a coverage header like:
```typescript
// Coverage of glm.R:
// [x] L1-7:   Poisson GLM with offset ...
// [ ] L9-48:  make.link() — no TS equivalent
```

### Proposed Pattern (Statistical Tests + Distributions)

```
packages/testing/statistical_tests/
  source-tests/
    r-json-emit.R              # Already exists
    tests/
      reg-tests-1a.R           # Already copied (verbatim R source)
      reg-tests-1a.md          # Already created (summary)
      ...
    r-source-tests/
      hypothesis/              # Hypothesis test edge cases
        reg-1a-source-test.R   # Companion R script (emits JSON)
        reg-1a.test.ts         # TS test file
        reg-1b-source-test.R
        reg-1b.test.ts
        ...
      distributions/           # Distribution d/p/q edge cases
        dpqr-source-test.R     # Companion R script
        dpqr.test.ts           # TS test file
        dpqr-2-source-test.R
        dpqr-2.test.ts
```

### Existing Assets

- `packages/testing/distributions/distributions.test.ts` -- basic "smoke test" level coverage for 11 distributions (d/p/q only, loose tolerances like `toBeCloseTo(x, 3)`)
- `packages/testing/statistical_tests/` -- 72 R-reference tests at TOL=1e-6 for all hypothesis tests
- We expose **17 distributions** with full DPQR: normal, beta, gamma, exponential, chi-square, t, F, uniform, weibull, log-normal, pareto, wilcoxon, binomial, poisson, geometric, negative-binomial, hypergeometric

### What "Porting" Means

For each R source test case:
1. Determine if we have the corresponding TS function
2. Create a companion R script that runs that specific test and emits reference values as JSON
3. Write a TS test that calls our function with the same inputs and compares at TOL=1e-6
4. Mark cases we can't port (R-only infrastructure, features we don't expose) with `[ ] ... -- not applicable`

---

## Rust Build Pipeline & Debugging

### Rust Source Layout

All statistical implementations live under `packages/dataframe/rust/stats/`:

```
packages/dataframe/rust/stats/
├── distributions/          # d/p/q functions for all 17 distributions
│   ├── beta.rs, gamma.rs, poisson.rs, weibull.rs, geometric.rs,
│   │   chi_squared.rs, exponential.rs, log_normal.rs, uniform.rs,
│   │   shapiro_wilk.rs, ...
│   └── helpers/            # Shared numerical routines (stirlerr, bd0, etc.)
├── statistical_tests/      # Hypothesis tests
│   ├── t/, z/, anova/, chi_square/, correlation/,
│   │   kruskal_wallis/, mann_whitney/, levene/, post_hoc/,
│   │   dagostino_pearson/, anderson_darling/, proportion/
│   └── ...
├── regression/             # GLM, GEE, GLMM
│   ├── glm/, gee/, glmm/, family/, shared/
│   └── ...
├── core/                   # errors.rs, effect_sizes.rs
└── extensions/             # statistics_ext.rs, ranks.rs, iter_statistics_ext.rs
```

The Rust code depends on `statrs-0.17.1` for some distribution internals (known to have panics in qpois/qhyper via `unwrap()` on `None`).

### Building: WASM and Native .node

Both targets can be built in parallel — this is the preferred approach after Rust changes:

```bash
# Build both (preferred — run in parallel)
pnpm wasmbuild & pnpm napibuild

# WASM only (uses @deno/wasmbuild, outputs to packages/dataframe/lib/)
pnpm wasmbuild

# Native .node only (uses cargo + napi-rs, copies .dylib → .node)
pnpm napibuild

# Debug build (no --release, faster compilation, includes debug symbols)
pnpm napibuild:debug
```

**WASM build**: `deno run -A jsr:@deno/wasmbuild@0.21.1 --features wasm --out packages/dataframe/lib`
- Compiles with `--features wasm` which enables `wasm-bindgen`, `js-sys`, `web-sys` (with `console` feature), `serde-wasm-bindgen`, `getrandom/js`
- Output: `packages/dataframe/lib/` (`.wasm` + JS glue)

**Native .node build**: `cargo build --features napi-rs --release` then copies `target/release/libtidy_ts_dataframe.dylib` → `packages/dataframe/lib/tidy_ts_dataframe.darwin-arm64.node`
- Compiles with `--features napi-rs` which enables `napi` and `napi-derive`
- Output: `packages/dataframe/lib/tidy_ts_dataframe.darwin-arm64.node`

### TypeScript Binding Layer

TS wrappers live in `packages/dataframe/ts/`:
- `ts/wasm/` — Raw WASM bindings
- `ts/stats/distributions/` — Public distribution API (`d*`, `p*`, `q*` functions with named parameters)
- `ts/stats/` — Public statistical test API

### Debugging: Instrument Rust with Logs

**Strong preference: when tests fail, instrument the Rust code with detailed logging to pinpoint the exact issue. Do NOT write standalone scripts to diagnose problems.**

Logging is underutilized by agents. Instead of writing a separate TS/Deno script to "explore" a failing value, add targeted logging directly to the Rust function under investigation.

**For WASM builds** — use `web_sys::console::log_1`:
```rust
#[cfg(feature = "wasm")]
use web_sys::console;

// Inside the function being debugged:
#[cfg(feature = "wasm")]
console::log_1(&format!("qbeta: p={}, a={}, b={}, result={}", p, a, b, result).into());
```

**For native .node builds** — use `eprintln!`:
```rust
eprintln!("qbeta: p={}, a={}, b={}, result={}", p, a, b, result);
```

**For both** (feature-gated helper pattern):
```rust
macro_rules! debug_log {
    ($($arg:tt)*) => {
        #[cfg(feature = "wasm")]
        web_sys::console::log_1(&format!($($arg)*).into());
        #[cfg(not(feature = "wasm"))]
        eprintln!($($arg)*);
    };
}
```

After adding logs, rebuild (`pnpm wasmbuild` or `pnpm napibuild`) and re-run the failing test to see the trace. Remove the logging once the bug is fixed.

---

## Phase 1: Hypothesis Test Edge Cases

These test `wilcox.test`, `fisher.test`, `cor.test`, `ks.test`, `chisq.test`, `shapiro.test`, `t.test`, `kruskal.test` with edge-case inputs from R's own regression test suite.

### reg-tests-1a.R (22 relevant cases)

- [ ] L793-794: `dwilcox` symmetry -- `dwilcox(x, 4, 6) == dwilcox(x, 6, 4)`
- [ ] L821-826: `fisher.test` crash on degenerate table (PR#644)
- [ ] L1149: `ks.test` two-sample with specific values
- [ ] L1162-1171: `wilcox.test` paired + unpaired with `conf.int=TRUE` (we may not support conf.int)
- [ ] L1531: `fisher.test` with total=1 (PR#1662)
- [ ] L2754-2757: `fisher.test` with huge table (error expected)
- [ ] L2762: `chisq.test` with simulate.p.value (we likely don't support simulation)
- [ ] L3651-3653: `cor.test` Spearman integer overflow (PR#8087) -- large n
- [ ] L3835: `chisq.test` with simulate.p.value
- [ ] L4527-4530: `t.test` with one group of size 1

### reg-tests-1b.R (18 relevant cases)

- [ ] L94-98: `wilcox.test(1, 2:60, conf.int=TRUE, exact=FALSE)` -- extreme rank-sum
- [ ] L137-142: `fisher.test` extreme degeneracy (PR#10558)
- [ ] L364-365: `shapiro.test(c(0,0,1))` -- p-value >= 0
- [ ] L685-692: `mood.test` -- not implemented, skip
- [ ] L810-814: `cor.test` Spearman symmetry -- `greater` on (x,y) == `less` on (x,-y)`
- [ ] L971-977: `chisq.test` with over-long x/y args
- [ ] L1033-1046: `wilcox.test` asymptotic point estimate with `conf.int=TRUE`
- [ ] L1074-1076: `ks.test` p=1 vs p=0.9524 (floating point edge case)
- [ ] L1138-1143: `fisher.test` with score/group data (exact test)

### reg-tests-1c.R (2 relevant cases)

- [ ] L577-579: `power.t.test` / `power.prop.test` -- skip unless we expose power functions
- [ ] L1390-1399: `cor.test` with extremely small p-values -- symmetry check

### reg-tests-1d.R (21 relevant cases)

- [ ] L332: `wilcox.test` with degenerate inputs: `c(0)`, `c(1)`, `c(0,1)`, `c(1,2)`, `c(1,1)`, `c(-1,1)`
- [ ] L1421: `power.prop.test` -- skip unless we expose power functions
- [ ] L1959-1962: `kruskal.test` with non-numeric grouping factor (PR#16719)
- [ ] L3518: `fisher.test` on 4x4 table
- [ ] L3525-3548: `wilcox.test` with +/- Inf in data (paired and unpaired, exact and approx)
- [ ] L4018-4022: `chisq.test` with `simulate.p.value=TRUE` for large numbers (PR#16814)

### reg-tests-1e.R (11 relevant cases)

- [ ] L100-112: `fisher.test` with "too full" table (PR#18336)
- [ ] L327-333: `cor.test.formula` scoping issue (PR#18439) -- tests formula interface, may not apply
- [ ] L1985-1997: `t.test` with Inf in data (PR#18901) -- errored in R <= 4.5.1

### reg-tests-2.R (9 relevant cases)

- [ ] L2418-2429: `cor.test` Kendall and Spearman with all three alternatives on `c(1,2,3,4,5)` vs `c(8,6,7,5,3)`
- [ ] L2906: `bartlett.test` -- not implemented, skip
- [ ] L3199: `t.test(1:28)` -- basic correctness check

---

## Phase 2: Distribution Function Edge Cases

These test the d/p/q functions we expose (17 distributions). The R source files contain hundreds of edge cases that caught real bugs.

### d-p-q-r-tests.R -- Consistency & Identity Tests

- [ ] L53-68: Binomial: `pbinom == cumsum(dbinom)` for random (n, p, k); also `pf` equivalence (Abramowitz & Stegun 26.5.24)
- [ ] L71-74: Geometric: `dgeom == p*(1-p)^x` and `cumsum(dgeom) == pgeom`
- [ ] L77-91: Hypergeometric: `phyper == cumsum(dhyper)` for 3 (m,n) pairs, including log.p variant
- [ ] L96-100: Negative binomial: `pnbinom == cumsum(dnbinom)` (PR#842)
- [ ] L104-116: Poisson: `dpois(0:5, 0)` edge case; Abramowitz pchisq equivalence
- [ ] L120-123: Signed rank: `psignrank == cumsum(dsignrank)` for 32 random n
- [ ] L127-135: Wilcoxon: `pwilcox == cumsum(dwilcox)` and symmetry `dwilcox(x,n,m) == dwilcox(x,m,n)`
- [ ] L141-166: Gamma/chi-sq density: `dgamma(x,sh,scale) == dgamma(x/scale,sh,1)/scale`; pgamma with Inf params
- [ ] L168-199: Chi-squared p-q inversion (non-central); PR#875 infinite loop; PR#6421 p near 1
- [ ] L201-215: Beta: `dbeta` log consistency with big a & b (PR#643)
- [ ] L220-268: Normal: boundary values `qnorm(0)==-Inf`, `qnorm(1)==Inf`; sd=0 and sd=Inf edge; Wichura known values; pnorm symmetry
- [ ] L346-458: **p-q inversion identity for all 20 distributions** (4 variants: lower, upper, log, log+upper) -- this is a massive block of ~80 checks

### d-p-q-r-tst-2.R -- Regression/Edge Cases (~85 blocks)

- [ ] L48-92: Extreme tail tests: pexp, pgamma, pcauchy, pt, pbinom, pgeom at magnitudes 1e-300 etc.
- [ ] L95-99: `dt` with large x and log scale (was -Inf in R <= 2.15.2)
- [ ] L101-108: `pf` with large df (monotonicity toward pchisq target)
- [ ] L111-128: `pgamma/qgamma` edge cases (Inf, boundary at 0/1, extreme left tail PR#11030)
- [ ] L131-134: `df(0, df1, df2)` for various df1 (0->Inf, 2->1, 3->0)
- [ ] L137-139: `dbinom/pbinom` with small negative x (were rounded to 0)
- [ ] L169-211: `qt` near zero and extreme tails (PR#9804, df=1/2/4/1.2 scenarios)
- [ ] L214-233: `pbeta` log upper tail (toms708); `pt` with large quantiles (PR#14230)
- [ ] L277-281: `pchisq(df=0)` was wrong; ncp>=80 gave values >= 1
- [ ] L283-296: `dnbinom` extreme size/mu convergence to dpois
- [ ] L310-326: `qbinom` with large size/small prob (PR#13711)
- [ ] L329-336: `pbeta` log-linear in small x (cancellation fix)
- [ ] L338-356: `qgamma/pgamma` for small shape; `qpois(lambda=0)`
- [ ] L358-371: Non-central chi-sq extreme tail (PR#14216)
- [ ] L373-382: Logistic extreme tails (qlogis gave Inf too early)
- [ ] L384-424: `pbeta` log upper tail with extreme params (multiple PRs)
- [ ] L436-447: Beta with Inf parameters (infinite loop fix)
- [ ] L449-453: Lognormal sdlog=0 boundary (point mass)
- [ ] L455-529: `qbeta` asymmetric/small parameters (multiple PRs including Newton iteration fixes)
- [ ] L531-534: `qt(df=Inf, ncp)` should equal `qnorm(m=ncp)`
- [ ] L552-561: Chi-squared df=0, ncp=0 (point mass at 0)
- [ ] L563-631: `dnbinom/pnbinom/qnbinom` with size=Inf (should equal dpois)
- [ ] L633-681: `dnbinom/dbinom` with very large args on log scale (known Rmpfr values)
- [ ] L683-689: `qpois/qgeom` with invalid p (NaN handling)
- [ ] L729-741: `qbeta` discontinuity from wrong Newton jump
- [ ] L770-778: `dgamma` for small x and shape < 1 (PR#17577)
- [ ] L791-828: `qnorm` extreme tails (now works to |x| = 1.896e154)
- [ ] L831-896: `qnbinom` with large size / small mu (PR#18095); `dnbinom` underflow (PR#18072)
- [ ] L899-917: `dpois` via ebd0() accuracy (PR#15628); very large x
- [ ] L920-933: `dgeom` accuracy via dbinom_raw (PR#18642)
- [ ] L936-943: `pbeta` with shape=0 (PR#18672)
- [ ] L946-957: `stirlerr(x)` for non-half-integer x -- dgamma (PR#18640)
- [ ] L960-972: `qbinom` inversion of pbinom (PR#18711)
- [ ] L975-987: `pnbinom -> pbeta` for very large (a,b) near double max

### p-r-random-tests.R -- Skip

These test R's random number generators (`r*` functions) using DKW inequality. We don't implement our own RNG (we delegate to the runtime), so these don't apply.

### lm-tests.R -- Gap Analysis

**Existing GLM coverage** (in `packages/testing/glm/`):
- Weighted GLM with zero weights: `weighted-glm.test.ts` Test 4, `weighted-glm-edge-cases.test.ts` Tests 4-6
- Deviance equivalence (lm vs glm): Implicitly covered — we only expose glm, not separate lm
- Leverage / hat values: `glm-diagnostics.test.ts` (Gaussian, weighted, binomial, Poisson, Gamma)
- Cook's distance: `glm-diagnostics.test.ts`, `comprehensive-fix-validation.test.ts`
- rstandard (deviance + pearson): `glm-methods.test.ts` Tests 3-4, `medium-gaps.test.ts`
- rstudent: `glm-methods.test.ts` Test 5
- dffits: `glm-methods.test.ts` Test 6, `comprehensive-fix-validation.test.ts`
- dfbetas: `comprehensive-fix-validation.test.ts`
- covratio: `glm-methods.test.ts` Test 6, `comprehensive-fix-validation.test.ts`
- predict with newdata: `medium-gaps.test.ts`, `glm-predict.test.ts`

**Gaps not covered by existing GLM tests:**

| lm-tests.R Case | Covered? | Notes |
|---|---|---|
| L8-17: roller dataset weighted lm/glm setup | Partial | We test zero-weight GLM but not this specific dataset |
| L22-31: Partial/weighted residuals lm==glm | No | We don't expose `residuals(type="partial")` or `weighted.residuals()` |
| L34: influence.measures on zero-weight model | Partial | We test diagnostics but not specifically on zero-weight models |
| L37-43: influence matrix == cbind(individual diagnostics) | No | Internal consistency check — we don't expose `influence.measures()` as a matrix |
| L44-47: rstandard/rstudent zero-weight == removed-obs | No | Interesting edge case but requires `lm` which we don't expose separately |
| L48-51: rstudent/cooks lm==glm equivalence | Implicit | We only have glm, so this is automatically satisfied |
| L53-56: summary/anova zero-weight == removed-obs | No | We don't expose anova on GLM results |
| L60-72: LifeCycleSavings influence diagnostics | No | Different dataset, but same functions already tested |
| L74-94: mlm influence.measures | No | We don't support multivariate lm |
| L100-101: predict SE with/without newdata | No | predict SE not implemented (listed as GLM COVERAGE.md gap #1) |

**Verdict**: The lm-tests.R file primarily tests `lm` vs `glm` equivalence (we only expose `glm`) and features we don't implement (`lsfit`, `mlm`, `predict SE`, `anova` on models, `partial residuals`). The diagnostics that ARE portable (leverage, Cook's, rstandard, rstudent, dffits, dfbetas, covratio) are already covered in the GLM suite with R-reference values at TOL=1e-6. **No new tests needed from lm-tests.R.**

---

## Prioritization

### Must Do (directly validates our public API)

1. **Phase 1 hypothesis test edge cases** -- ~25 portable test cases across wilcox.test, fisher.test, cor.test, ks.test, t.test, kruskal.test, shapiro.test, chisq.test
2. **Phase 2 distribution p-q inversion** -- the 80-check identity block from d-p-q-r-tests.R L346-458 validates all 17 of our distributions at once
3. **Phase 2 distribution consistency** -- `cumsum(d*) == p*` checks for discrete distributions (L53-135)

### Should Do (catches subtle numerical bugs)

4. **Phase 2 extreme tails** -- qt, qnorm, pbeta, pgamma extreme tail tests from d-p-q-r-tst-2.R
5. **Phase 2 boundary values** -- df=0, shape=0, Inf parameters, size=Inf convergence to simpler distributions
6. **Phase 2 known-value tests** -- Cases with Rmpfr-computed reference values (dbinom, dnbinom, pbeta at extreme params)

### Skip

- `mood.test`, `bartlett.test`, `mantelhaen.test` -- not implemented
- `power.t.test`, `power.prop.test` -- not implemented
- `chisq.test(simulate.p.value=TRUE)` -- simulation-based, not our approach
- `wilcox.test(conf.int=TRUE)` -- we may not support confidence intervals on rank tests
- `cor.test.formula` scoping -- R formula interface, not applicable
- `p-r-random-tests.R` -- RNG tests (tests R's `r*` functions, we delegate to runtime)
- `lm-tests.R` -- tests lm/glm equivalence (we only expose glm), `lsfit`, `mlm`, `predict SE`, `partial residuals`, `anova` on models -- all either already covered or not implemented. See gap analysis above.

---

## Execution Order

```
[x] 1. Create r-source-tests/ directory structure
[x] 2. Phase 1: Hypothesis test edge cases (8 tests, 8 pass)
    [x] a. reg-1a: ks.test two-sample (D=0.6, p=15/286)
    [x] b. reg-1b: shapiro.test(c(0,0,1)), spearman symmetry, ks.test(1:5,c(2.5,4.5))
    [x] c. reg-1c: pearson symmetry with small p-values
    [x] d. reg-2: kendall/spearman all alternatives, t.test(1:28)
[x] 3. Phase 2: Distribution consistency (24 tests, 18 pass, 4 fail, 2 ignored/panic)
    [x] a. Discrete d/p: geom, binom, poisson, nbinom, hyper (5 pass)
    [x] b. Normal boundaries: qnorm(0/1), Wichura, sd=0 (2 pass, 1 FAIL: dnorm sd=0)
    [x] c. p-q inversion: 15 distributions (9 pass, 2 FAIL: beta/F/Weibull, 2 IGNORED: pois/hyper panic)
[x] 4. Phase 2: Distribution edge cases (19 tests, 13 pass, 6 fail)
    [x] a. Extreme tails: pexp, pgamma, pt, pbinom, pgeom (5 pass)
    [x] b. dt large x log (FAIL: returns -Inf)
    [x] c. df(0, df1, df2) (FAIL: df(0,1,5) returns 0 not Inf)
    [x] d. qt(0.5) == 0 (pass), qt extreme tails (2 FAIL: df=1, df=4)
    [x] e. pbeta log upper tail (pass)
    [x] f. dnbinom large size -> dpois convergence (pass)
    [x] g. qgamma small shape, qpois lambda=0 (2 pass)
    [x] h. dlnorm sdlog=0 (FAIL: returns NaN), plnorm sdlog=0 (pass)
    [x] i. qnorm extreme tails (pass)
    [x] j. pchisq df=0 (pass), dchisq df=0 (FAIL: returns NaN)
[x] 5. Distribution: wilcoxon (2 tests, 1 pass, 1 FAIL: pwilcox off-by-one)
[ ] 6. Update COVERAGE.md with all new source test coverage
```

## Summary

**53 total tests** across 7 test files:
- **40 pass** at TOL=1e-6
- **11 fail** (real bugs in our implementations)
- **2 ignored** (WASM panics in qpois/qhyper that crash the runtime)

### Bugs Found

| Bug | Test | Description |
|---|---|---|
| pwilcox off-by-one | reg-1a-wilcoxon | pwilcox(-1,4,6) returns dwilcox(0) value instead of 0 |
| dnorm sd=0 | dpqr-consistency | dnorm(x,3,sd=0) wrong for some x values |
| qbeta inversion | dpqr-consistency | q(p(x)) != x for beta(0.8, 2) |
| qf inversion | dpqr-consistency | q(p(x)) != x for F(12, 6) |
| qweibull inversion | dpqr-consistency | q(p(x)) != x for weibull(3, 2) |
| qpois panic | dpqr-consistency | Rust unwrap panic in statrs when calling qpois |
| qhyper panic | dpqr-consistency | Rust unwrap panic in statrs when calling qhyper |
| dt large x log | dpqr-edge-cases | dt(1e155, df=5, log=TRUE) returns -Inf |
| df(0,1,5) | dpqr-edge-cases | df(0, df1=1, df2=5) returns 0 instead of Inf |
| qt extreme tail | dpqr-edge-cases | qt(1e-50, df=1) and qt(1e-100, df=4) wildly wrong |
| dlnorm sdlog=0 | dpqr-edge-cases | dlnorm(0.5, sdlog=0) returns NaN instead of 0 |
| dchisq df=0 | dpqr-edge-cases | dchisq(-1, df=0) returns NaN instead of 0 |
