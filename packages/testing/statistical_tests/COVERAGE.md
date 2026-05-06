# Statistical Tests Coverage

## Coverage by Suite

| Suite | Tests | Pass | Fail | Notes |
|---|---|---|---|---|
| Mann-Whitney (Wilcoxon rank-sum) | 8 | 8 | 0 | Including continuity correction |
| ANOVA (one-way, Welch) | 4 | 4 | 0 | All scenarios at TOL=1e-6 |
| KS Test (one/two-sample) | 7 | 7 | 0 | All scenarios at TOL=1e-6 |
| Correlation (Pearson, Spearman, Kendall) | 10 | 10 | 0 | All alternatives (two-sided, less, greater) |
| Normality (Shapiro-Wilk, Anderson-Darling, D'Agostino) | 8 | 8 | 0 | Including uniform data for D'Agostino |
| T-tests (one-sample, two-sample, paired, Welch) | 10 | 10 | 0 | Including independent less + custom alpha |
| Proportion (one-sample, two-sample) | 8 | 8 | 0 | All alternatives (two-sided, less, greater) |
| Chi-square / Fisher's exact / GOF | 8 | 8 | 0 | GOF + Fisher's less/greater alternatives |
| Nonparametric (Wilcoxon signed-rank, Kruskal-Wallis) | 7 | 7 | 0 | Correct tie correction and continuity |
| Post-hoc (Tukey HSD, Games-Howell, Dunn) | 3 | 3 | 0 | Studentized range quantile, Simpson's rule |
| Z-tests (one-sample, two-sample) | 7 | 7 | 0 | Including custom alpha (0.01) |
| Levene (Brown-Forsythe) | 3 | 3 | 0 | Median-based, matches R car::leveneTest |

**Total: 83 tests, 83 pass, 0 fail**

## Test Pattern

Each suite follows the GLM test pattern:
1. R reference script (`*-ref.R`) emits JSON via shared `r-json-emit.R` helper
2. TypeScript test file compares implementation output against R reference
3. Strict tolerance: TOL = 1e-6 everywhere — no loose tolerances
4. R scripts use `exact=FALSE, correct=TRUE` where needed to match our normal approximation

## Fixes Applied (from 14 failures to 0)

### Wilcoxon signed-rank (4 failures fixed)

- **Root cause**: Tie correction formula used integer division `t*(t+1)*(t-1)/12` which truncates for small tie groups. R uses `sum(t^3 - t) / 48`.
- **Fix**: Store raw `t^3 - t` in rank(), divide by 48 in sigma formula.

### Dunn test (1 failure fixed)

- **Root cause**: R's `dunn.test` package uses one-sided p-values by default; our Bonferroni adjustment was 2x off.
- **Fix**: Updated R reference to compute two-sided p-values manually with `2 * pnorm(-abs(Z))`.

### Tukey HSD (1 failure fixed)

- **Root cause**: CI used t-distribution critical value instead of studentized range quantile.
- **Fix**: Implemented `qtukey()` bisection on `ptukey_exact` CDF; CI uses `q_crit / sqrt(2) * se`.

### Games-Howell (1 failure fixed)

- **Root cause**: Simpson's rule integration with 100/50 steps insufficient for ptukey precision.
- **Fix**: Increased integration steps to 200/100 for sub-1e-6 accuracy.

### Fisher's exact (3 failures fixed)

- **Root cause**: (a) MLE solver used Newton's method with different convergence than R's `uniroot`; (b) CI always computed two-sided; (c) CI search range too narrow; (d) WASM serializes Infinity as null.
- **Fix**: Pure bisection with relative convergence 1e-12; added `alternative` parameter for one-sided CIs; extended search to [1e-10, 1e8]; null→Infinity post-processing in TS wrapper.

### T-test one-sided CIs (3 failures fixed)

- **Root cause**: `calculate_confidence_interval()` always computed two-sided CI regardless of tail type.
- **Fix**: Added `TailType` parameter; Left→(-Inf, mean+t*se), Right→(mean-t*se, Inf), Two→symmetric. Added null→Infinity restoration in TS wrapper.

### Proportion two_sample_equal (1 failure fixed)

- **Root cause**: (a) Yates' correction applied `(|O-E| - 0.5)^2` without `max(..., 0)`, yielding 0.02 when O=E; (b) CI Yates correction used fixed 0.5 instead of R's `min(0.5, |delta| / sum(1/n))`.
- **Fix**: Added `.max(0.0)` to chi-square terms; CI correction now uses R's adaptive formula.

## Coverage by Feature

| Feature | Status | File |
|---|---|---|
| Pearson correlation + CI | Pass | correlation/correlation.test.ts |
| Spearman rank correlation (all alternatives) | Pass | correlation/correlation.test.ts |
| Kendall tau correlation (all alternatives) | Pass | correlation/correlation.test.ts |
| One-sided alternatives (greater/less) | Pass | correlation, mann-whitney, t-tests, proportion, fisher, z-tests |
| Shapiro-Wilk normality test | Pass | normality/normality.test.ts |
| Anderson-Darling normality test | Pass | normality/normality.test.ts |
| D'Agostino-Pearson omnibus test (normal, skewed, uniform) | Pass | normality/normality.test.ts |
| One-way ANOVA (F-test) | Pass | anova/anova.test.ts |
| Welch's ANOVA | Pass | anova/anova.test.ts |
| KS test (one-sample, various distributions) | Pass | ks-test/ks-test.test.ts |
| KS test (two-sample) | Pass | ks-test/ks-test.test.ts |
| Mann-Whitney U / Wilcoxon rank-sum | Pass | mann-whitney/mann-whitney.test.ts |
| Mann-Whitney with continuity correction | Pass | mann-whitney/mann-whitney.test.ts |
| Chi-square independence test | Pass | chi-square/chi-square.test.ts |
| Chi-square goodness-of-fit test | Pass | chi-square/chi-square.test.ts |
| Fisher's exact test (two-sided, greater, less) | Pass | chi-square/chi-square.test.ts |
| Proportion test (one-sample, two-sample, all alternatives) | Pass | proportion/proportion.test.ts |
| Wilcoxon signed-rank test | Pass | nonparametric/nonparametric.test.ts |
| Kruskal-Wallis test | Pass | nonparametric/nonparametric.test.ts |
| Tukey HSD post-hoc | Pass | post-hoc/post-hoc.test.ts |
| Games-Howell post-hoc | Pass | post-hoc/post-hoc.test.ts |
| Dunn test post-hoc | Pass | post-hoc/post-hoc.test.ts |
| Z-test one-sample (two-sided, less, greater) | Pass | z-tests/z-tests.test.ts |
| Z-test two-sample (two-sided, greater, less) | Pass | z-tests/z-tests.test.ts |
| Z-test / T-test custom alpha (0.01) | Pass | z-tests/z-tests.test.ts, t-tests/t-tests.test.ts |
| Levene (Brown-Forsythe) equal/unequal/two-group | Pass | levene/levene.test.ts |

## Not Yet Implemented/Tested

- McNemar's test
- Friedman test
- Mood's median test
