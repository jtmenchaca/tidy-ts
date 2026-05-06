# reg-tests-2.R -- Comprehensive Summary

**File:** `reg-tests-2.R` (3406 lines)
**Purpose:** Regression tests for R where the printed output is the primary concern. Tests must work without Recommended packages.

**Total test blocks:** ~185 distinct test blocks (identified by section comments, `stopifnot` blocks, `try()` calls, `assertError`/`assertWarning` calls, `tryCatch` blocks, and output-comparison checks).

**Assertion counts:**
- `stopifnot`: 55 occurrences
- `all.equal`: ~20 occurrences
- `try()`: ~45 occurrences
- `assertError` / `assertErrorV`: ~12 occurrences
- `assertWarning`: 2 occurrences
- `tryCatch`: 5 occurrences
- `identical`: ~20 occurrences

---

## R Functions/Features Appearing (with first line reference)

| Function/Feature | First Line | Notes |
|---|---|---|
| `abbreviate` | 12 | String abbreviation |
| `apply` | 18 | Array apply |
| `besselY`, `besselI` | 40 | Bessel functions |
| `data.frame` (construction, `cbind`, `rbind`) | 63 | Core data frame ops |
| `diag` | 79 | Diagonal matrix |
| `format`, `format.pval` | 89 | Formatting |
| `is.finite`, `is.na`, `is.nan`, `is.infinite` | 106 | Finite/NA checks |
| `kronecker` | 148 | Kronecker product |
| `merge` | 175 | Data frame merge |
| `NA`, `is.na` on lists | 203 | NA handling |
| `scale` | 217 | Centering/scaling |
| `tabulate` | 224 | Tabulation |
| `ts`, `cbind.ts`, `print.ts` | 228 | Time series |
| `print` (lists, attributes) | 242 | Print formatting |
| `summary.data.frame` | 300 | Summary precision |
| `glm`, `step` (binomial) | 314 | GLM stepwise |
| `all.vars` | 330 | Formula variable extraction |
| `manova` | 339 | MANOVA |
| `dist` | 381 | Distance with NAs |
| `kernel` | 389 | Kernel printing |
| `cor`, `cov` | 400 | Correlation |
| `svd` | 414 | SVD |
| `on.exit` | 420 | Exit handlers |
| `lm`, `model.matrix` | 454 | Linear models, formulas |
| `diffinv` | 473 | Differencing inverse |
| `rowsum` | 484 | Row sums |
| `sink`, `connections` | 498 | Output capture |
| `mean` | 529 | Mean on logical/factor |
| `table` | 536 | Table arithmetic |
| `predict.mlm` | 543 | MLM prediction |
| `glm` (drop1, `.` expansion) | 554 | GLM model updating |
| `factor`, `levels<-` | 629 | Factor manipulation |
| `print.ts` | 654 | Time series printing |
| `glm` (boundary/identity link) | 662 | GLM edge cases |
| `terms.formula` | 763 | Formula terms |
| `lm` (0-rank, rank-deficient) | 941 | Degenerate models |
| `lm.influence` | 988 | Influence diagnostics |
| `ARMAacf` | 1004 | ARMA autocorrelation |
| `.S3methods` | 1023 | S3 method dispatch |
| `array` (1D subsetting) | 1031 | 1D array dims |
| `dist` (printing NAs) | 1046 | Distance printing |
| `terms` (offsets) | 1053 | Offset in model terms |
| `model.matrix` (0-level factors) | 1061 | Zero-level factors |
| `data.frame` (arrays) | 1070 | Arrays in data frames |
| `setHook`, `packageEvent` | 1098 | User hooks |
| `rep` (0-length) | 1120 | Rep with empty input |
| `array`, `matrix` (0-length data) | 1141 | Empty arrays |
| `aov` (with Error) | 1159 | AOV error strata |
| `binom.test` | 1167 | Binomial test |
| `aov` (singular error) | 1171 | Singular error model |
| `stem` | 1192 | Stem-and-leaf |
| `mle` (stats4) | 1226 | Maximum likelihood |
| `terms.formula` (offsets) | 1232 | Offset terms |
| `splinefun` | 1373 | Spline interpolation |
| `read.fwf` | 1380 | Fixed-width reading |
| `split` (lists, raws) | 1390 | Split on types |
| `UseMethod` (implicit classes) | 1398 | S3 dispatch |
| `str` | 1412 | Structure display |
| `print.factor` | 1427 | Factor printing |
| `write.table` | 1436 | Table writing |
| `grep` (regexp) | 1469 | Regex |
| `add1`, `drop1` | 1482 | Model comparison |
| `read.table` (escaped quotes) | 1496 | CSV reading |
| `printCoefmat` | 1514 | Coefficient matrix printing |
| `array` (matrix subscripting) | 1528 | Matrix indexing |
| `model.matrix` (`.`) | 1565 | Dot in model matrix |
| `add1.lm`, `drop1.lm` (offsets) | 1571 | Offsets in model comparison |
| `as.raw` | 1586 | Raw conversion |
| `pmin`, `pmax` | 2176 | Parallel min/max |
| `cor` (corner cases) | 2284 | Correlation edge cases |
| `confint` | 2304 | Confidence intervals |
| `aggregate` | 2336 | Aggregation |
| `lowess` | 2029 | Lowess smoothing |
| `mantelhaen.test` | 2544 | Mantel-Haenszel test |
| `cor.test` (Kendall, Spearman) | 2417 | Rank correlation tests |
| `bartlett.test`, `fligner.test` | 2905 | Variance tests |
| `smooth.spline` | 2641 | Smoothing splines |
| `arima` | 2798 | ARIMA fitting |
| `aov`, `model.tables`, `TukeyHSD` | 3014 | ANOVA post-hoc |
| `t.test` | 3198 | t-test printing |
| `stopifnot(exprs=...)` | 3156 | Multi-expression stopifnot |
| `deparse` | 2049 | Deparsing |
| `withAutoprint` | 3391 | Autoprint |

---

## Detailed Test Blocks

### Section 1: Base Function Tests (Moved from .Rd files) -- Lines 10-238

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 1 | 12-15 | `abbreviate` | Abbreviation of `state.name` at varying `minl` (1-5) | `state.name` dataset |
| 2 | 18-37 | `apply` | `apply` on matrices and arrays: dimension preservation, sum consistency, quantile with `names=FALSE` | `cbind(x1=3, x2=c(4:1,2:5))`, `array(1:20, c(2,2,5))`, `array(1:prod(2:5), 2:5)` |
| 3 | 28-33 | `apply` (stopifnot) | Transpose symmetry `apply(arr,1:2,sum) == t(apply(arr,2:1,sum))`, identity `aa == apply(aa,2:3,f)`, tolerance check | Same arrays |
| 4 | 40-60 | `besselY`, `besselI` | Bessel function computation near 0, plotting, summary of computed values | `x0=2^(-20:10)`, various `nu` values |
| 5 | 63-77 | `data.frame` | NULL dataframe with rows, 0-row dataframe, `cbind`/`rbind` identity with empty frames | `data.frame(cbind(x=1,y=1:10), fac=...)` |
| 6 | 71-76 | `data.frame` (stopifnot) | `cbind(d, d0)` and `rbind(d, d.0)` identity | Empty/null data frames. Bug fix: failed before R 1.4.0 |
| 7 | 79-87 | `diag` | Diagonal of array, 0-row/0-col matrix diag, assignment to diag | `array(1:4, dim=5)`, `matrix(0, 0, 4)` |
| 8 | 89-102 | `format`, `format.pval` | Quote handling in data frame format, `format(pi, digits=i)` for i=1..16, p-value formatting | `data.frame(a=I("abc"), b=I("def\"gh"))`, `p=c(47,13,...)/1000` |
| 9 | 106-144 | `is.finite`, `is.na`, `is.nan`, `is.infinite` | Comprehensive checks on vector with `Inf`, `-Inf`, `NaN`, `NA`, `pi`; integer storage mode; outer product storage modes | `c(100, -1e-13, Inf, -Inf, NaN, pi, NA)` |
| 10 | 148-172 | `kronecker` | Dimnames construction with named vectors, 3D arrays, mixed NULL/named dimnames | `matrix(1:12, 3, 4)` with `LETTERS` dimnames, various bill structures |
| 11 | 175-201 | `merge` | Merge with `all.x`, `all.y`, empty merge result, single-row merge | `authors` and `books` data frames |
| 12 | 203-215 | `NA`, `is.na` | `is.na` on vectors, pasted strings, empty lists, nested lists; `is.nan` no longer works on lists | `c(1,NA)`, `list(pi,"C",NaN,...)`, `list(list(1))` |
| 13 | 217-221 | `scale` | NA handling in `scale` with and without centering | `matrix(c(2,1,0,1,0,NA,NA,NA,0), nrow=3)` |
| 14 | 224-225 | `tabulate` | `tabulate` on `numeric(0)` | Empty numeric vector |
| 15 | 228-237 | `ts` | Time series arithmetic identity, truncation, repetition | `ts(matrix(1:300,100,3), start=c(1961,1), freq=12)` |
| 16 | 230-231 | `ts` (stopifnot) | `z == z` and `z - z == 0` for ts objects | Same ts |

### Section 2: Print Formatting Tests -- Lines 242-311

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 17 | 242-253 | PR#715: print list with attributes | Printing list elements that have attributes | `list(a=10)` with `attr(l$a, "xx") <- 23` |
| 18 | 255-264 | `na.omit` printing | Print format of `na.omit` result with attributes | `matrix(c(1,2,3,0,10,NA), 3, 2)` |
| 19 | 267-274 | attribute printing | Printing of object with list attribute | `x <- 1; attr(x, "foo") <- list(a="a")` |
| 20 | 277-298 | PR#746: list printing | Nested list with formula and subset prints correctly | `list(A=list(formula=Y~X, subset=TRUE), B=...)` |
| 21 | 300-311 | `summary.data.frame` precision | Marc Feldesman report: summary digits parameter | `attenu` dataset, `data.frame(x)` with mixed magnitudes |

### Section 3: GLM and Model Tests -- Lines 314-378

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 22 | 314-328 | `glm`, `step` | Stepwise selection on binomial GLM | `detg1` data with Temp, M.user, Soft factors; `cbind(X,M)~1` binomial |
| 23 | 330-335 | PR#829: `all.vars` | `all.vars` on formula with matrix subscript | `temp[1, ] ~ 3` vs `temp ~ 3` |
| 24 | 339-378 | `manova` | Rank-deficient residuals in manova; should fail with error about rank | `gofX.df` with groups factor, `cbind(A,B,C,D) ~ groups` |
| 25 | 381-388 | `dist` with NAs | Distance computation with missing values across all methods | `t(trees)` with 4 NAs injected; euclidean, maximum, manhattan, canberra |

### Section 4: Printing and Formatting -- Lines 389-411

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 26 | 389-393 | `kernel` printing | Printing daniell and modified.daniell kernels | `kernel("daniell", m=5)`, `kernel("daniell", m=c(3,5,7))` |
| 27 | 396-398 | `ts` printing | New year line start at Jan in `cbind(ts)` | `ts(1:10, start=c(1920,7), freq=12)` |
| 28 | 400-403 | PR#883: `cor`/`cov` with NULL | `cov(rnorm(10), NULL)` and `cor(rnorm(10), NULL)` should error | `rnorm(10)` |
| 29 | 406-411 | PR#960: `format` matrix | `format` of character matrix should preserve dimensions | `matrix(c("axx","b",...), nrow=2)` |
| 30 | 414-417 | PR#963: `svd` | SVD of single-row matrix should preserve `$v` dimensions | `rbind(1:7)` |

### Section 5: Scoping, Environment, Dispatch -- Lines 420-471

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 31 | 420-441 | `on.exit` | `on.exit(remove(fitted))` evaluated in proper environment; consistency with/without explicit `return()` | `g1`, `g2` functions with `on.exit`; `UseMethod` dispatch |
| 32 | 443-451 | `on.exit` consistency | `on.exit(e <<- g())` gives correct environment for foo/bar dispatch | `f.foo`, `f.bar` with `on.exit`; stopifnot `"x" == ls(env=e)` |
| 33 | 454-471 | logical in formulae | Logical variables in model formulas behave like 2-level factors (S compatibility) | `rep(c(TRUE,FALSE),5)` in `lm(y ~ x)`, helmert contrasts |

### Section 6: Time Series and Numeric Edge Cases -- Lines 473-496

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 34 | 473-477 | `diffinv` | `diffinv(diff(x))` recovers original; lag/differences=2 case had wrong start/end | `ts(1:10)` |
| 35 | 479-482 | PR#1072: `as.numeric` | Reading `Inf` and `NaN` from character | `as.numeric(as.character(NaN))`, `as.numeric(as.character(Inf))` |
| 36 | 484-486 | PR#1092: `rowsum` | Rownames in `rowsum` output | `matrix(1:12, 3, 4)` grouped by `c("Y","X","Y")` |
| 37 | 488-495 | PR#1115: `save` ASCII | Saving strings with `ascii=TRUE`, especially backslash handling | All 255 octal escape characters |

### Section 7: Connections and I/O -- Lines 498-526

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 38 | 498-526 | `sink`, `connections` | Capturing output/messages to file, `closeAllConnections`, `showConnections` | `file("all.Rout")`, `sink(zz, type="message")` |
| 39 | 522 | `closeAllConnections` (stopifnot) | After closeAllConnections, `nrow(showConnections()) == 0` | Post-close state |

### Section 8: Type Coercion and Arithmetic -- Lines 529-620

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 40 | 529-533 | `mean` | `mean` works on logical but gives error on factor | `c(TRUE, FALSE, TRUE, TRUE)` |
| 41 | 536-540 | `table` arithmetic | `z - 1` preserves table class (object bit) | `table(x=1:2, y=1:2)` |
| 42 | 543-551 | PR#1226: `predict.mlm` | `predict.mlm` with `newdata` gave wrong row count | `lm(cbind(w,w2) ~ group)`, `predict(fit, newdata=data[1:2,])` |
| 43 | 554-561 | `drop1` with `.` | Dot not expanded properly in `drop1` | `glm(Fr ~ .^2, poisson, HairEye)` |
| 44 | 564-580 | PR#1329: matrix lists | Subscripting matrix-shaped lists, `matrix(list(...))`, list subset assignment | `list(a1=1:3, ...)` with `dim(m) <- c(2,2)` |
| 45 | 583-588 | matrix list printing | Printing of matrix lists shows proper type labels | `list(as.integer(1), pi, 3+5i, "testit", TRUE, factor("foo"))` |
| 46 | 592-620 | RNG consistency | All RNG types produce consistent output across set.seed calls; normal kind variants | Wichmann-Hill, Marsaglia-Multicarry, Super-Duper, Mersenne-Twister, Knuth-TAOCP, Knuth-TAOCP-2002 |

### Section 9: Merge, Factors, Printing -- Lines 623-708

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 47 | 623-626 | `merge` | Merge with inconsistencies in `as.character` | `data.frame(x=1:3, y=c("A","D","E"), z=c(6,9,10))` |
| 48 | 629-633 | PR#1394: `levels<-` | Assigning levels via list to a factor | `factor(c("a","b"))` with `levels(f) <- list(C="C", A="a", B="b")` |
| 49 | 636-641 | NA levels in factors | Factor with `exclude=NULL`, level ordering, `<NA>` printing | `factor(c("a","NA","b"), exclude=NULL)` |
| 50 | 644-651 | NA string printing | `print`, `paste`, `format` of character vectors containing NA | `c("a", "NA", NA, "b")` |
| 51 | 654-660 | `print.ts` | `cbind(ts)` month label alignment (Jan vs NA) | `ts(x, start=c(1960,2), freq=12)` |
| 52 | 662-686 | GLM boundary (PR#1331) | Poisson identity link: no start values, step reduction, start values | 100-element x/y data; `glm(y~x, family=poisson(identity))` |
| 53 | 689-695 | char array extension | Extending character arrays fills with NA not "" | `LETTERS[1:2]` extended to length 5 |
| 54 | 698-709 | formula no intercept | First factor coding in no-intercept formulas | `gl(3,6,18)`, `gl(3,2,18)`, helmert contrasts, `lm(y ~ A:U + A:V - 1)` |

### Section 10: Quantile, Dimnames, AOV -- Lines 712-745

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 55 | 712-721 | `quantile`, `median` | Extreme values with `Inf`/`-Inf`; all 9 quantile types; `median(c(-Inf,-Inf,Inf,Inf))` should be NaN | Vectors with Inf endpoints |
| 56 | 724-728 | dimnames with NA | NA in matrix dimnames alignment during printing | `matrix(1:9, 3, 3)` with NA in row/col names |
| 57 | 731-737 | PR#1930: weighted `aov` | Weighted AOV gave unweighted RSS | `r/n ~ trt` with weights `n` |
| 58 | 740-745 | PR#2266: `rbind` | `rbind` of data frame and matrix treated matrix as vector | `data.frame(5x5)` with `matrix(-(1:10), 2, 5)` |

### Section 11: Printing, Terms, Attributes -- Lines 748-832

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 59 | 748-753 | unquoted print | Backslash handling in non-quoted printing | `"\\abc\\"` |
| 60 | 756-760 | PR#1891: summary with nested df | Summary of data frame containing data frames | `data.frame(1:10)` with `$z <- data.frame(x=1:10, yyy=11:20)` |
| 61 | 763-776 | PR#2206: `terms.formula` | Terms re-ordering, `delete.response`, dot expansion, `simplify=TRUE` | `y ~ a + b:c + d + e + e:d`, `breaks ~ .` on warpbreaks |
| 62 | 779-781 | PR#2506: print attributes | Printing factor attribute shows codes vs labels | `structure(1:4, other=as.factor(LETTERS[1:3]))` |
| 63 | 784-788 | logical matrix replacement | Logical matrix replacement indexing for data frames | `TEMP[,c(1,3)][TEMP[,c(1,3)]==1 & !is.na(...)]` |
| 64 | 791-832 | PR#390: axis small ranges | Plotting with very small relative ranges; infinite loop avoidance | `x` values differing by ~1e-16, `y` near 1 |

### Section 12: Scoping, Step, Printing -- Lines 835-903

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 65 | 835-852 | `step` inside function | Scoping rules: `step` must find data when called inside a function | `cement` dataset, `teststep(formula(y~.), cement)` |
| 66 | 854 | `str(array(1))` | `array(1)` is not a scalar | Single-element array |
| 67 | 857-861 | `na.print` with factor levels | `table(factor(..., exclude=NULL))` dimnames with NA | `factor(c(1:2, NA, 2), exclude=NULL)` |
| 68 | 864-871 | PR#3058: `na.print` alignment | Printing matrix with `right=TRUE` and various `na.print` values | Character matrix with NAs |
| 69 | 874-882 | factor dimnames | Assigning factor to dimnames converts to character | `matrix(1:4,2)` with `dimnames(A) <- list(factor(...), NULL)` |
| 70 | 885-894 | PR#2776: aliased coefs | `summary.lm`/`summary.glm` with aliased (collinear) coefficients | `x1 == x2`, `lm(y ~ x1 + x2 + x3)`, `cor=TRUE` |
| 71 | 897-903 | list-like df indexing | `women["height"]` vs `women["height", drop=...]` interpretation | `women` dataset |

### Section 13: Names, Factors, Models -- Lines 905-1001

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 72 | 907-914 | `make.names` | `make.names("")`, `make.names(".aa")`, `make.names(NA)` | Edge case strings |
| 73 | 917-926 | data frame `row.names` | Strange column names including "row.names" | `data.frame(aa=1:3)` with `aa[["row.names"]]` |
| 74 | 928-938 | NULL assignment | Assigning to `NULL` via `[[` behaves like assigning to `list()` | `a <- NULL; a[["a"]] <- 1:3` |
| 75 | 941-985 | 0-rank models | Empty and rank-deficient `lm`/`glm` models: summary, anova, predict, variable.names, model.matrix | `lm(y ~ 0)`, `lm(y ~ x + 0)` with `x=rep(0,10)`, `glm` equivalents |
| 76 | 988-1001 | `lm.influence` | Influence on deficient models with NAs, zero weights, `na.exclude` | `dat` with NAs, zero weight, collinear `x1==x2`, zero `x3` |

### Section 14: ARMA, Indexing, Methods -- Lines 1004-1043

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 77 | 1004-1012 | `ARMAacf` | `lag.max` respected: result length correct | `ar=c(1.3,-0.6,-0.2,0.1)`, lag.max 1-10 |
| 78 | 1015-1020 | data frame column indexing | Indexing non-existent columns gives proper error | `x[c("a","c")]`, `x[,c("a","c")]`, `x[1,c("a","c")]` |
| 79 | 1023-1028 | `.S3methods` | Methods discovery with namespaces, primitives | `class="data.frame"`, `class="dendrogram"` |
| 80 | 1031-1043 | 1D array subsetting | Dimensions and dimnames preserved on 1D array subset | `array(1:5, dim=c(5))` with dimnames |

### Section 15: Distance, Terms, Model Matrix -- Lines 1046-1096

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 81 | 1046-1050 | `print.dist` with NAs | `dist()` printing shows NA entries | `cbind(c(1,NA,2,3), c(NA,2,NA,1))` |
| 82 | 1053-1058 | `terms` offsets | Offset in model terms not deleted when response present/absent, leading/trailing position | `~ a + b + a:b + offset(c)` variants |
| 83 | 1061-1066 | 0-level factors in `model.matrix` | `model.frame` with all-NA factor; `predict` with all-NA | `data.frame(x=NA)` |
| 84 | 1070-1096 | arrays in data frames | Printing data frames containing 1D, 2D, 3D arrays; `sapply(X, dim)` | `array(1:10, dim=10)`, `array(1:30, dim=c(10,3))`, `array(1:40, dim=c(10,2,2))` |

### Section 16: Hooks, Rep, Array Construction -- Lines 1098-1166

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 85 | 1098-1117 | `setHook`, `packageEvent` | User hooks for onLoad, attach, detach, onUnload of stats4 | stats4 package lifecycle |
| 86 | 1120-1138 | `rep` 0-length | `rep(integer(0), length.out=10)` etc. for all types | integer, logical, numeric, character, complex, list -- all empty |
| 87 | 1141-1151 | `array`/`matrix` 0-length | `array(numeric(0), c(2,2))` and `matrix(type(0), 1, 2)` for all types | Empty vectors of each type |
| 88 | 1154-1156 | `rep` with `each` + `length` | `rep(1:2, each=3, length=12)` recycles instead of padding NAs | S compatibility |
| 89 | 1159-1164 | PR#6510: `aov` with Error and -1 | `aov(y ~ a + b - 1 + Error(c))` strata label assignment | Unbalanced design with `gl(2,...)` factors |
| 90 | 1167 | `binom.test` | p-value < machine epsilon | `c(800, 10)` |
| 91 | 1171-1189 | singular error `aov` | AOV with singular error model: `Error(subject/(f1+f2))` | `sample.df` with 6 subjects, 2 factors, repeated measures |

### Section 17: Stem, Warnings, MLE -- Lines 1192-1241

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 92 | 1192-1206 | PR#6645, PR#8934: `stem` | Stem with near-constant values (integer overflow), correct width, length-1 input | `rep(1,100)`, `rep(0.1,10)`, `c(rep(1,10), 1+1e-8)`, `c(8.48,9.58,9.96)`, `stem(123)` |
| 93 | 1209-1221 | PR#6633: vector-matrix warnings | `x1 * y1`, `x1 * as.matrix(y1)` recycling warnings | `rnorm(3)` op `rnorm(4)` and matrix form |
| 94 | 1226-1229 | `mle` summary | `summary(mle(...))` prints "Coefficients" correctly | Poisson sample, `mle(function(Lam=1) ...)` |
| 95 | 1232-1241 | PR#6656: terms offsets | `update(fit, ". ~.")` loses offset; successive offsets; model with only offsets | `glm(y ~ offset(x) + z)`, `terms(y ~ offset(x) + offset(log(x)) + z)` |

### Section 18: I/O, Split, Dispatch -- Lines 1244-1424

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 96 | 1244-1251 | integer-double multiplication | `3:4 * 1e-100` etc. integer * large/small double | Boundary of integer * double |
| 97 | 1254-1257 | negative subscripts with NA | `x[-c(1, NA)]` should error | `1:3` |
| 98 | 1260-1262 | `boxplot` border | Vector `border` argument without `pch`/`cex`/`bg` | `InsectSprays`, `border=2:7` |
| 99 | 1264-1267 | `summary.Date`, `as.matrix(POSIXct df)` | Date summary formatting, POSIXct in data frame matrix coercion | `as.Date("2002-12-26:31")`, `as.POSIXct("2004-07-20")` |
| 100 | 1270-1273 | PR#6857: `dump` | `dump` should quote symbol names | `x <- quote(b); dump("x", "")` |
| 101 | 1276-1286 | character indexing | Hashing code test: named vector indexing and assignment | `1:26` named with `letters`, overwrite with character indices |
| 102 | 1289-1319 | raw type | Logic ops on raw, binary read/write, ASCII read/write of raw | `charToRaw("A test string")`, file I/O |
| 103 | 1322-1329 | `predict` from matrix `x` | Prediction from `lm` with matrix predictor warns when newdata is data.frame | `y ~ x` where `x` is a matrix |
| 104 | 1332-1338 | `eval` side effects | `eval(quote({Girth[1]<-NA;Girth}), trees)` should not alter `trees` | `trees` dataset |
| 105 | 1341-1345 | PR#7171: `write.table` qmethod | `qmethod` not applied to column names | `data.frame` with quote in column name |
| 106 | 1348-1364 | `read.table` colClasses | `colClasses` with NA, NULL, character, Date, POSIXct, factor, named | 3x6 matrix written to tempfile |
| 107 | 1367-1371 | `write.table` complex | Complex column formatting, decimal separator | `data.frame(x=0.5+1:4, y=1:4+1.5i)` |
| 108 | 1373-1378 | `splinefun` | Value test for fmm, nat, per methods | `splinefun(1:5, c(1,2,4,3,1))` evaluated at 25 points |
| 109 | 1380-1387 | PR#7350: `read.fwf` | Infinite loop with comments; off-by-one in row count | Fixed-width file with `# comment` lines |
| 110 | 1390-1395 | `split` on lists/raws | Split works on list and raw types | `as.list(1:3)`, `charToRaw("A test string")` |
| 111 | 1398-1409 | S3 implicit classes | `UseMethod` dispatch: integer vs double vs numeric class | `foo.numeric`, `foo.integer`, `foo.double` on `1:10`, `pi`, `matrix(1:10)` |
| 112 | 1412-1424 | `str` escape sequences | `str` does not interpret `\b`, `\n`; `str(factor(x))` with NA | `"ab\bc\ndef"`, `c("a", NA, "b")` |
| 113 | 1427-1433 | `print.factor(quote=TRUE)` | Quoting of factor levels matches values | `c("a", NA, "b", 'a " test')` |

### Section 19: write.table, grep, Model Comparison -- Lines 1436-1554

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 114 | 1436-1466 | `write.table` marginal | 0-column matrix, matrix list, I() matrix column, list column, Date matrix/data.frame | Various edge case data structures |
| 115 | 1469-1473 | `grep` regex | `(.*s){2}` and `(.*s){3}` on "Arkansas" | `state.name`, "Arkansas" |
| 116 | 1476-1479 | data frame partial column | Replacing part of non-existent column | `xx[2:3, "c"] <- 2:3` |
| 117 | 1482-1493 | `add1`/`drop1` with NAs | Missing values cause misleading results; should error | `lm(y ~ x)` with `x[10] <- NA` |
| 118 | 1496-1511 | PR#7789: `read.table` escaped quotes | Escaped quotes in first 5 lines for type detection | `'I don\'t watch TV'` and double-quote variants |
| 119 | 1514-1525 | PR#7802: `printCoefmat` | `signif.legend=FALSE` failed; various star/legend combos | Random coefficient matrix with p-values |
| 120 | 1528-1554 | PR#7824: matrix subscripting | Array subscripted by 2-col matrix: 0-indices, NA indices, negative indices, range checks | `matrix(1:6, ncol=2)` with `rbind(c(i,j))` index matrices |
| 121 | 1557-1562 | RAW matrix printing | Printing raw matrices/arrays was unimplemented | `sapply(0:7, function(i) rawShift(...))` reshaped to 7x4x2 |
| 122 | 1565-1568 | `model.matrix` with `.^2` | `.^2` in model.matrix formula | `data.frame(a=gl(3,4), b=gl(4,1,12))` |

### Section 20: Offsets, Raw, Logical Indexing -- Lines 1571-1672

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 123 | 1571-1583 | PR#8049: offsets in `add1`/`drop1` | `add1.lm` and `drop1.lm` ignored offsets | `lm(y ~ 1, offset=1:10)`, scope `~ z` |
| 124 | 1586-1589 | `as.raw` conversion | Warning/error messages for out-of-range raw conversion | `as.raw(1234)`, `as.raw(list(a=1234))` |
| 125 | 1595-1614 | logical matrix indexing with NAs | Replacement and extraction with logical matrix containing NAs; data frame vs matrix | `df[df==0] <- 2` with NA in first row |
| 126 | 1617-1637 | vector indexing of matrices | Rownames behavior with `which(arr.ind=TRUE)` vs plain logical indexing | 1D array, 2D array with 2 cols, 2D with 1 col |
| 127 | 1640-1650 | `NULL` assignment indexing | `x$foo <- 2`, `x[[2]] <- pi`, `x[[1]] <- 1:3` when `x <- NULL` | NULL |
| 128 | 1653-1655 | `kernel(1)` printing | Printing kernel with scalar argument | `kernel(1)` |
| 129 | 1658-1661 | NULL replacement in df | `DF[2, 1:3] <- NULL` error message | `data.frame(A=1:2, B=3:4)` |
| 130 | 1664-1670 | `signif` | Rounding error in `signif(ob, 3)` for multiples of 2000; subnormal numbers | `0:9 * 2000`, `1.2347e-305` to `1.2347e-307` |

### Section 21: Lists, Subscripting, Factors -- Lines 1675-1997

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 131 | 1675-1679 | NA names in lists | `"NA"` vs `NA` names print differently | `list(1,2)` named `c("NA", NA)` |
| 132 | 1682-1690 | subscripting with NA/"NA" names | `x[names(x)]` and `lx[[as.character(NA)]]` matching | `1:4` named `c(NA, "NA", "a", "")` |
| 133 | 1693-1706 | data frame replacement | Adding column to subset, matrix replacement in column | `a.frame[2:5, "y"] <- letters[2:5]` |
| 134 | 1712-1714 | PR#8252: `pairs` warning | Trivial warning from `oma` argument | `pairs(iris[1:4], oma=rep(3,4))` |
| 135 | 1717-1721 | `str(dendrogram)` | Dendrogram str spacing | `hclust(dist(USArrests), "ave")` |
| 136 | 1724-1729 | PR#8337: `formatC` | Extra space on Windows | `pi * 10^(-5:4)` with various flags |
| 137 | 1732-1738 | impossible GLM | `glm(cbind(success,failure) ~ 0+predictor, binomial(log))` where mu=1 is forced | 9 observations, first predictor=0 |
| 138 | 1741-1750 | `solve` error messages | Non-square, complex, non-conformant systems | `diag(1,5)[,1:4]` |
| 139 | 1753-1755 | PR#8462: `update.formula` | `simplify=TRUE` needs parentheses for `(Days|Subject)` | `Reaction ~ Days + (Days|Subject)` |
| 140 | 1758-1763 | PR#8528: `pgamma` | Extreme shape parameter `pgamma`; log scale; lower.tail=FALSE | `shape=1e100`, `shape=1e25` |
| 141 | 1766-1769 | POSIXt addition | `+` for POSIXt was non-commutative, timezone issue | SPSS-style dates + `ISOdate(1582,10,14)` |
| 142 | 1772-1802 | `deparse.max.lines`, `browser`, `traceback` | Limiting deparse output; debugger on single-call body; non-interactive browser trap | `do.call(f, mtcars)` with `options(deparse.max.lines=3)` |
| 143 | 1805-1807 | PR#8652: `as.table` row names | Row names past 26 had NA | `matrix(1:60, ncol=2)` |
| 144 | 1810-1816 | PR#8720: GLM zero-weight dispersion | `summary(glm)` with zero weights and estimated dispersion | `w <- c(rep(1,9), 0)`, `glm(y ~ x, weights=w)` |
| 145 | 1819-1824 | `substitute` with `...` | `substitute(list(...))` preserves dots; substitution after `...` | `yaa(foo(...))`, `substitute(list(..., x), list(x=1))` |
| 146 | 1827-1830 | PR#8750: `uniroot` warning | `uniroot` should warn when not converged | `ff <- function(x) (x-pi)^3`, `maxiter=10` |
| 147 | 1836-1849 | `min`/`max`/`sum`/`prod` on empty | Empty lists and raw vectors | `list()`, `raw()` |
| 148 | 1853-1862 | PR#8868: `rbind.data.frame` | Permuted columns, duplicate column names | `d1(x,y,z)` + `d2(y,z,x)`, `d1(x,y,x)` + `d2(x,x,y)` |
| 149 | 1865-1869 | `sort.list` complex | Sorting complex vectors (unimplemented before 2.4.0) | `rep(2:1, c(2,2)) + 1i*c(4,1,2,3)` |
| 150 | 1873-1890 | PR#9044: `write.table` quoting | `quote=TRUE, row.names=FALSE` should quote column names | `matrix(11:14, ...)` and `as.data.frame` |
| 151 | 1893-1896 | `remove` from base | Removing from `baseenv`/namespace gives error | `remove("ls", envir=baseenv())` |
| 152 | 1899-1910 | factor behavior | `x[2]` vs `x[[2]]`, `as.list`, `unlist(as.list)`, `sapply` on factors | `factor(LETTERS[1:5])[2:4]` |
| 153 | 1913-1917 | `as.character` factor with "NA" | `as.character(factor(c("NA","CD",NA)))` keeps "NA" vs `<NA>` | Factor with literal "NA" level |
| 154 | 1920-1923 | 0-column data frame | `data.frame()[FALSE]`, `names(data.frame())` | Empty data frame |
| 155 | 1926-1948 | zero-weight GLM residuals, `apply` on zero-extent | Working residuals NA for zero-weight; `apply` on `array(0, c(3,0,4))` | Poisson GLM with `weights=c(0, rep(1,8))`, zero-extent array |
| 156 | 1951-1953 | named factor printing | Factor with names attribute | `structure(factor(1:4), names=letters[1:4])` |
| 157 | 1956-1965 | factor matrices | Factor with dim, subsetting, replacement | `factor(7:12)` with `dim <- c(2,3)` |
| 158 | 1968-1977 | `[dpqr]t` vector ncp | Non-centrality parameter as vector; negative ncp | `nc <- c(0, 0.0001, 1)`, `dt/pt/qt(1.8, 10, nc)` |
| 159 | 1980-1986 | `merge` row names | Row names inserted as factor caused bad sort | Date-like row names in two data frames |
| 160 | 1989-1997 | PR#9216: list loop index | Assigning to loop index inside `for(ll in LL)` should not alter original | `list(a=list(txt="original value"))` |

### Section 22: Summary, Format, Deparse -- Lines 2000-2066

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 161 | 2000-2009 | `summary.mlm` with `na.exclude` | `summary(lm(cbind(y1,y2) ~ 1, na.action="na.exclude"))` | 50 obs, y2 has 5 NAs |
| 162 | 2013-2015 | PR#8695: `prettyNum` attributes | `format(matrix, big.mark=",")` preserves dims | `matrix(1:16, 4)` |
| 163 | 2018-2023 | complex number printing | Very different magnitudes: `1e100 + 1e44i` | Mixed-magnitude complex vectors |
| 164 | 2029-2035 | `lowess` | Platform-specific behavior when MAD of residuals is zero | `x=c(0,7,8,14,15,120,242)`, `y=c(122,128,130,158,110,110,92)` |
| 165 | 2038-2043 | PR#9263: `R_Visible` | `a[[(t<-'b')]]` and `x[2, invisible(3)]` should be visible | List and matrix indexing with side-effect expressions |
| 166 | 2049-2066 | `dput` controls | `dput` with various control options: keepInteger, keepNA, S_compatible, all | List with NA types, integers, characters |

### Section 23: NLS, Cut, Data Frames -- Lines 2069-2127

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 167 | 2069-2073 | `nls` error message | `nls` with no parameters gives better error | `nls(y ~ 1/(1+x), start=list(x=0.5, y=0.5))` |
| 168 | 2076-2079 | `cut` breaks="years" | Date and POSIXct cut at year boundaries | `c("2000-01-17","2001-01-13","2001-01-20")` |
| 169 | 2082-2089 | data frame row names | Setting row.names on empty df, setting row.names on invalid df | `data.frame(a=character(0))`, `list(a=1:3)` with class "data.frame" |
| 170 | 2092-2102 | data frame subsetting extremes | `w[]`, `w[,drop=TRUE]`, `w[1,,drop=TRUE]` etc. on 1-row df | `women[1,]` |
| 171 | 2105-2110 | `data.frame` with zero cols | `data.frame(row.names=1:4)` should have 4 rows | Empty data frame with specified row.names |
| 172 | 2113-2127 | `identical` on data frames | `identical(d0, d1)` with automatic vs character row.names; `attrib.as.set` | `data.frame(1:4, row.names=1:4)` |
| 173 | 2130-2141 | `all.equal` | `check.attributes` ignored; logicals treated as numeric; raw support | Various types |

### Section 24: Deparse, Substr, Pmin/Pmax -- Lines 2144-2261

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 174 | 2144-2165 | deparsing functions | Source attribute handling; `dump`, `dput` with/without source; `1L` preservation | Function with srcref, expression with `1L` |
| 175 | 2165-2173 | `substr` with NA | `substr(x, NA, 1)`, `substr(x, 1, NA)`, `substr<-` with NA positions/value | `"abcde"` |
| 176 | 2176-2237 | `pmin`/`pmax` | Comprehensive: NULL, NA, na.rm, integer, character, POSIXct, POSIXlt; symmetry checks | Vectors with NAs, `.leap.seconds`, all types |
| 177 | 2240-2251 | 1D array names | `names(x)` and `dimnames(x)` interaction for 1D arrays | `as.array(1:3)` |
| 178 | 2254-2261 | NA attribute names | `attr(x, "NA")` vs `attr(x, NA_character_)` | `1:3` with `attr(x, "NA") <- 4` |

### Section 25: QR, ReadChar, Cor, Confint -- Lines 2264-2327

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 179 | 2264-2272 | PR#9623: `qr` pivoting | `qr.coef`/`qr.fitted` dimnames after pivoting | `matrix(c(0,0,0,1,1,1), 3, 2)` |
| 180 | 2274-2281 | `readChar` | Extra items, zero nchar, termination | `as.raw(65:74)`, file I/O |
| 181 | 2284-2301 | `cor` corner cases | All-NA column with `use="complete"` (should error) and `use="pair"`; all 3 methods | `cbind(NA, 1:3, rnorm(3))` |
| 182 | 2304-2311 | PR#10494: `confint` rank-deficient | `confint` on `lm` with collinear predictors | `x=rep(1,10)`, `u=factor(Y/N)`, `lm(ans ~ x + u)` |
| 183 | 2314-2318 | PR#10574: corrupt df from subsetting | `x[,3] <- x` where x is a data frame | `data.frame(a=1:3, b=2:4)` |
| 184 | 2321-2325 | PR#11512: `format.factor` | `format.factor` loses dim/dimnames | `factor` with `dim <- c(13,2)` |
| 185 | 2328-2333 | PR#1131: `within` | Removing column in `within` corrupts data frame | `data.frame(a=1:5, b=2:6, c=3:7)`, `within(abc, {d<-a+7; b<-NULL})` |

### Section 26: Aggregate, Duplicates, TS, Calls -- Lines 2336-2414

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 186 | 2336-2341 | PR#13167: `aggregate` empty | `aggregate` on empty data frame | `data.frame(a=integer(0), b=numeric(0))` |
| 187 | 2344-2348 | duplicate column subsetting | Data frame with duplicate column names | `data.frame(a=1, a=2, b=3, check.names=FALSE)` |
| 188 | 2351-2354 | `window` rounding | `window(TS, start(TS), end(TS))` should not warn | `ts(co2[1:192], freq=24)` |
| 189 | 2356-2360 | `call` tag | `Call[["bar"]] <- 2` adds named tag | `call("foo", 1)` |
| 190 | 2363-2377 | `$<-` on pairlists | `callObj$given <- given` should not alter function body | `quote(callFunc())` modified in multiple calls to `foo()` |
| 191 | 2379-2384 | `sprintf` `#` flag | `sprintf` with `#` flag for g, f, x, d, e formats | `-3.145`, `-31`, `0xabc`, `-123L`, `123456` |
| 192 | 2386-2412 | function printing | Auto-printing vs `print()` for primitives and user functions; source attribute handling | `c` (primitive), `foo` (user function with/without srcref) |
| 193 | 2413-2414 | `printCoefmat` | `printCoefmat(cbind(0,1))` should not print NaN | 1x2 matrix |

### Section 27: cor.test, Data Frame Corruption, Complex -- Lines 2417-2495

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 194 | 2417-2431 | `cor.test` Kendall/Spearman | Exact and asymptotic; continuity correction for Kendall's tau and Spearman's rho (PR#13691 wish) | `c(1,2,3,4,5)` vs `c(8,6,7,5,3)` |
| 195 | 2434-2446 | PR#13724: corrupt df | `bar$NewCol <- integer(0)` and `bar[["NewCol"]]`, `bar["NewCol"]` | `matrix(1:12, nrow=3)` as data frame |
| 196 | 2449-2453 | `NA_complex_` printing | Printing complex NA in matrix list | `matrix(list(NA_complex_, 3, "A string", NA_complex_), 2, 2)` |
| 197 | 2456-2460 | non-standard formula names | `update(\`a: b\` ~ x, ~ . + y)` backtick preservation | Formula with backtick-quoted name |
| 198 | 2463-2466 | `ls.str` | `ls.str(E)` should not evaluate call objects | `E$cl <- call("print", "Boo!")` |
| 199 | 2469-2472 | `complete.cases` | Empty input gives error | `complete.cases()`, `complete.cases(list(), list())` |
| 200 | 2475-2479 | `stopifnot` error message | `tst()` without argument, `c(1,,2)` error clarity | Missing arg in `stopifnot(is.numeric(y))` |
| 201 | 2482-2486 | PR#14162: `cut.Date` | Empty final level removed | `as.Date(c("2009-03-21","2009-03-31"))`, breaks="quarter" |
| 202 | 2489-2495 | `switch` | Fall-through, empty final case, visibility of `invisible(4)` | `switch("a", a=, b=, c=, 4)` variants |

### Section 28: Aggregate.ts, Formatting, Dates -- Lines 2498-2572

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 203 | 2498-2504 | `aggregate.ts` | Rounding error with `ndeltat` and `nfrequency` | `rep(6:10, 1:5)` as ts |
| 204 | 2507-2511 | PR#9574: `format.pval` | `eps` and `nsmall` arguments | `c(0.1, 0.3, 0.4, 0.5, 0.3, 0.0001)` |
| 205 | 2514-2516 | `as.Date` fractional | `as.Date(0.5, origin=...)` rounds down | Fractional day |
| 206 | 2519-2522 | df with empty colnames | Printing data frame with `""` column name | `colnames(dfr)[2] <- ""` |
| 207 | 2525-2529 | `format(zero.print)` | `prettyNum` with `zero.print="."` | Random matrix with zeros |
| 208 | 2532-2541 | `min`/`max` NA vs NaN | NA has precedence over NaN in all orderings | `min(c(NaN,NA))`, `max(c(NA,NaN))`, all 8 combinations |
| 209 | 2544-2555 | PR#14514: `mantelhaen.test` | Exact and asymptotic one-sided tests; wrong tail for `exact=FALSE` | 2x2x3 array (nitrous oxide exposure data from Conover) |
| 210 | 2558-2572 | `scan` `strip.white` | Stripping space inside quoted strings; `sep=";"` vs newline-separated | Quoted strings with leading/trailing spaces |

### Section 29: Rank Correlations, Rowsum, Dispatch -- Lines 2575-2646

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 211 | 2575-2587 | PR#14488: `cor` Spearman with NAs | `complete.obs` vs `pairwise.complete.obs` consistency for Spearman | `runif(10)` with injected NAs |
| 212 | 2590-2595 | `rowsum` integer overflow | Integer overflow detection in `rowsum` | `2e9L` summed twice |
| 213 | 2598-2605 | `[[.data.frame` dispatch | Method dispatch for factor, Date, package_version columns | `data.frame(num, fac, date, pv)` |
| 214 | 2608-2615 | 24:00 as midnight | `as.POSIXlt("... 24:00:00")` for regular, month-end, leap year | Various boundary dates |
| 215 | 2618-2622 | logical coercion | `double(FALSE)` and `length(x) <- TRUE` should error | Unwarranted logical-to-integer coercion |
| 216 | 2625-2631 | `filter` recursive with NAs | NAs placed correctly in recursive filter output | `c(1:4, NA, 6:9)` with various filter lengths |
| 217 | 2634-2638 | PR#14679: `trunc.POSIXlt` | `trunc(x, units="days")` gave NAs after first | 3-element POSIXlt |
| 218 | 2641-2646 | `smooth.spline` tol=0 | Explicit error for silly input (tied x values) | `c(1,2,3,8,8,8,8,8,8,8,8,8,12,13,14)` |

### Section 30: Weighted LM, is.unsorted, Methods -- Lines 2649-2729

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 219 | 2649-2656 | PR#14840: weighted `lm` | 5-number summary labelling of weighted residuals | `lm(y ~ x, weights=w)` with one extreme weight |
| 220 | 2659-2664 | `is.unsorted` data frame | Multi-column data frame unsorted detection | `data.frame(x=2:1)`, `data.frame(x=1:2, y=3:4)`, `data.frame(x=3:4, y=1:2)` |
| 221 | 2667-2673 | `getMethod` error | Error message for non-existent method | `getMethod(ls, "bar")`, `getMethod(show, "bar")` |
| 222 | 2676-2681 | `array` corner cases | `array(1, integer())` and `array(1, integer(), list(1,2))` | Zero-dim array |
| 223 | 2684-2688 | PR#14059: `is.na` empty df | `is.na(data.frame(row.names=1:3))` | Empty data frame with rows |
| 224 | 2692-2697 | `split` with dots in levels | `sep="."` default vs `sep=":"` with dotted level names | `data.frame(x=c("a","a.b"), y=c("b.c","c"))` |
| 225 | 2700-2707 | `sort.list` vs `order` | NA handling differences between `order` and `sort.list` with various methods | `c(4L, NA, 2L, 3L, NA, 1L)` |
| 226 | 2710-2718 | PR#15028: long names | Names longer than 1000 chars truncated values when printing | `setNames(c(255,1000,30000), paste(rep("a",1002), ...))` |
| 227 | 2721-2729 | `deparse.cutoff` option | Formula deparse respects `options(deparse.cutoff=...)` | Long formula with `reallylongname` variables |

### Section 31: Deparse, str, Formatting -- Lines 2732-2833

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 228 | 2732-2735 | PR#15179: binary op deparse | User-defined binary ops deparsed properly | `` quote(`%^%`(x, `%^%`(y,z))) `` |
| 229 | 2738-2745 | anonymous function deparse | `substitute(f(x), list(f=function(x)x+1))` needs parens | Various substitute patterns |
| 230 | 2748-2752 | PR#15247: `str` invalid names | `str` on data frame with non-ASCII names | Names with `\xba`, `\xabcd` |
| 231 | 2755-2757 | PR#15299: vector + table | `1:2 + table(1:2)` class attribute printing | Adding vector to classed object |
| 232 | 2760-2765 | PR#15311: `regmatches<-` | `regmatches(x, m) <- c('A','C')` with regexpr result | `c('1','B','3')` with `\\d` match |
| 233 | 2768-2773 | `warnPartialMatchDollar` | Warning message names pairlist member correctly | `pairlist(abc=1, def=2)$ab` |
| 234 | 2776-2783 | `seq` with NaN | `seq(NaN)`, `seq.int(NaN)` explicit error messages | NaN inputs |
| 235 | 2786-2795 | PR#15301: 1D array dimnames | Dimnames preserved on subsetting | `array(0:2, dim=3, dimnames=list(d1=LETTERS[1:3]))` |
| 236 | 2798-2810 | PR#15396: `arima` + `all.equal` names | ARIMA with xreg gives consistent coefficients; `all.equal` with `check.names=FALSE` | External `arima.rda` data |
| 237 | 2813-2832 | PR#15411/PR#18098: `format` digits | `format(9996, digits=3)` spacing; `digits=0` error; rounding detection | Various numeric edge cases |

### Section 32: rbind, min/max, str, dpois -- Lines 2835-2901

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 238 | 2835-2843 | PR#15468: `rbind`/`cbind` matrix+list | `rbind(M, L)` and `cbind(M, L)` preserve matrix dim | `matrix(11:14, ncol=2)`, `list(elem1=1, elem2=2)` |
| 239 | 2846-2854 | `min`/`max` with `NA_character_` | `NA_character_` not treated as literal "NA" | `min(NA_character_, "bla")`, all 6 combos |
| 240 | 2857-2867 | `str` with cut values | Two entries needing width truncation mixed up | `data.frame(A=1:n*M, B=factor(long.string))`, `strict.width="cut"` |
| 241 | 2870-2873 | PR#15624: `dpois` rounding | `dpois(2^52+1, 1, log=TRUE)` warned in R 3.0.2 | Extreme Poisson parameter |
| 242 | 2876-2882 | PR#15625: embedded NULs | `read.csv` with UTF-8 BOM and NUL fields; `skipNul=TRUE` | External `EmbeddedNuls.csv` |
| 243 | 2885-2901 | `all.equal` datetime | POSIXt method: POSIXct vs POSIXlt, vs numeric, timezone check, tolerance | `Sys.time()` |

### Section 33: bartlett/fligner, ts printing, difftime -- Lines 2905-2931

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 244 | 2905-2908 | PR#15633: `bartlett.test`/`fligner.test` | Multi-factor formula `yield ~ block*N` should error | `npk` dataset |
| 245 | 2911-2917 | PR#15687: ts `digits` | `cbind(ts)` with `options(digits=2)` applied to time labels | `window(AirPassengers, start=1960)` |
| 246 | 2920-2925 | PR#15190: `difftime` tzone | `difftime` kept tzone from first arg | EST5EDT vs UTC |
| 247 | 2928-2931 | PR#15706: `cophenetic` | `attr(cophenetic(x1), "Labels")` gave matrix | `hclust(dist(c(i=1,ii=2,...)))` |
| 248 | 2934-2940 | PR#15708: `anova` printing | "Signif. codes" line wrapping at narrow widths | `anova(lm(sr ~ ., LifeCycleSavings))`, width=40/50 |
| 249 | 2943-2946 | PR#15718: df integer-row assign | `d[integer(), "a"] <- 2` should not warn | `data.frame(a=1)` |
| 250 | 2949-2952 | PR#15781: `options` print | `print(options(foo=NULL))` printed wrong value | Options manipulation |

### Section 34: Parse, OutDec, Printing -- Lines 2955-3011

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 251 | 2955-2962 | `getParseData` | Parent assignment correctness for function with commented parameters | Multi-line function definition |
| 252 | 2965-2971 | PR#15819: `OutDec` | `summary(lm)` uses `OutDec=","` in formatC parts | `lm(y ~ x)` with `options(OutDec=",")` |
| 253 | 2974-2984 | bad component names | Printing list/S4 with backslash and backspace in names | `list(\`a\\b\`=1, \`a\\c\`=2, \`a\bc\`="backspace")` |
| 254 | 2987-3000 | 0-extent array printing | Arrays where last dim is 0: printing, transpose, aperm, format | `matrix(,0,4)`, `array(dim=3:0)` |
| 255 | 3003-3011 | PR#15999: long name values | Very long names (1000+ chars) cut off literal values | `setNames(TRUE, paste(rep("a",1003), ...))` |

### Section 35: AOV/TukeyHSD, Deparse Precedence -- Lines 3014-3325

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 256 | 3014-3025 | PR#16437: `model.tables`/`TukeyHSD` | No-intercept model `aov(num ~ 0+F)` with `contr.sum` | `data.frame(F=factor(rep(c("A","B","C"),each=3)), num=1:9)` |
| 257 | 3028-3069 | `deparse` precedence | Parenthesization of `[`, `$`, `^`, `-` (unary), `:`, `%in%`, `*`, `+`, `<`, `!`, `&`, `\|`, `~`, `->`, `<-`, `=`, `?` -- all precedence levels; `dput` empty symbol | Extensive quoted expressions at every operator precedence level |
| 258 | 3070-3073 | PR#16686: `dput` empty symbol | `dput(alist(one=1, two=))` should not quote empty symbol | `alist` with missing argument |
| 259 | 3075-3086 | repeated unary deparse | `!!x`, `~~x`, `++x`, `--x`, `??x`, `~+-!?x` | Nested unary operators |
| 260 | 3088-3099 | PR#16709: `summary.data.frame` Date NAs | NA count missing in summary of Date columns | `as.Date(as.character(x), format="%Y%m%d")` with NA |
| 261 | 3102-3104 | complex matrix spacing | `matrix(1i, 2, 13)` spacing | Wide complex matrix |
| 262 | 3107-3109 | `str(expression)` | `str(expression(poly = x^3 - 3*x^2))` output | Named expression |
| 263 | 3112-3121 | `summary(logical)` | `summary` via `table()` for logical; NA count shown only when present | `c(NA, logical(3), NA, !logical(2), NA)` |
| 264 | 3124-3126 | `str` AsIs arrays | `str(I(matrix(pi*1:4, 2)))` formatting | AsIs matrix |
| 265 | 3129-3143 | `sprintf("%d", double)` | Auto-coercion from double to integer for `%d`; errors for non-integer doubles and NaN | `sprintf("%d", 1)`, `sprintf("%d", 1.1)`, `sprintf("%d", NaN)` |
| 266 | 3146-3148 | named raw formatting | `setNames(as.raw(1:3), c("a","bbbb","c"))` alignment | Named raw vector |
| 267 | 3151-3153 | `str` non-vector | `str(structure(c(a=1, b=2:7), color="blue"))` | Named numeric with extra attribute |
| 268 | 3156-3195 | `stopifnot(exprs=...)` | Multi-expression blocks, `exprObject=expression(...)`, error messages, sequential evaluation | Various boolean expressions with `cat` side effects |
| 269 | 3198-3200 | `print.htest` digits | `print(t.test(1:28), digits=3)` df and CI formatting | `t.test(1:28)` |
| 270 | 3203-3207 | `str(data.frame)` with attributes | `str` shows length of extra attributes | `trees` with `attr(treeA, "someA") <- 1:77` |
| 271 | 3210-3222 | PR#15886/PR#17836: `summaryRprof` | `summaryRprof` with various chunksizes; no warnings | Profiling output from `lapply(1:10000, rnorm, n=512)` |
| 272 | 3225-3227 | PR#17868/PR#18019: named complex printing | Named complex vector printing | `1:12 + (1:12)*1i` with letter names |
| 273 | 3230-3236 | `identical` on `...` | `identical` on dotdotdot objects should not print to console | `(function(...) environment())(1)$...` |
| 274 | 3238-3241 | PR#17336: `printCoefmat` NaN | NaN values preserved (not replaced by NA) | `cbind(Estimate=0, SE=0, t=NaN, "Pr(>|t|)"=NaN)` |
| 275 | 3244-3312 | PR#18232: `deparse` cflow LHS | `if`/`repeat` bodies wrapped in parens when on LHS of binary operators; prefix form for unparseable `$` | Extensive `quote()` and `bquote()` expressions with control flow on operator LHS/RHS |
| 276 | 3315-3325 | PR#18284: `!` deparse | `!` precedence in deparse: `1 + !2 + 3` needs parens; eval-parse roundtrip | `quote(1 + \`!\`(2) + 3)` |

### Section 36: Final Tests -- Lines 3328-3403

| # | Lines | Function | What is Tested | Data/Scenario |
|---|---|---|---|---|
| 277 | 3328-3330 | `packageDate` | `packageDate("foo")` on non-existent package, no excessive warnings | Non-existent package |
| 278 | 3333-3354 | error message: object not found | `identity(foo)` error mentions lexical call context; compiled vs interpreted; `do.call` with `envir` | `identity(foo)` at top level vs inside `f()` |
| 279 | 3357-3388 | error message: missing argument | `identity()` error mentions correct call; promise vs direct evaluation; `eval(quote(expr=))` | Various call stacks with missing arguments |
| 280 | 3391-3402 | PR#18572: `withAutoprint` srcrefs | `withAutoprint({ show.srcref() })` preserves source references | `sys.call()` inside withAutoprint |

---

## Summary of Version Milestones Referenced

The file contains regression tests spanning R versions from **pre-1.0.0** through **R 4.4.x**, with explicit version annotations including:
- R 1.2.1 - 1.4.0: Early fixes (data.frame cbind/rbind, cor(x,NULL), format matrix dims)
- R 1.4.0 - 1.9.0: Factor handling, model terms, rep/array with 0-length, on.exit scoping
- R 2.0.0 - 2.5.0: read.table extensions, write.table fixes, pmin/pmax rewrite, deparse controls
- R 2.6.0 - 2.15.x: cor corner cases, confint, aggregate, sort.list, deparse improvements
- R 3.0.0 - 3.6.x: str improvements, regmatches, deparse precedence, stopifnot(exprs=)
- R 4.0.0 - 4.4.x: identical on ..., printCoefmat NaN, deparse cflow/LHS, withAutoprint srcrefs

## PR (Bug Report) Index

| PR# | Line | Summary |
|---|---|---|
| PR#390 | 791 | Axis for small ranges |
| PR#715 | 242 | Print list elements with attributes |
| PR#746 | 277 | Printing of lists |
| PR#829 | 330 | Empty values in all.vars |
| PR#883 | 400 | cor(x,y) when is.null(y) |
| PR#960 | 406 | format() of character matrix |
| PR#963 | 414 | svd lost dimensions |
| PR#1072 | 479 | Reading Inf and NaN values |
| PR#1092 | 484 | rowsum dimnames |
| PR#1115 | 488 | Saving strings with ascii=TRUE |
| PR#1131 | 2328 | Removing columns in within |
| PR#1226 | 543 | predict.mlm ignored newdata |
| PR#1329 | 564 | Subscripting matrix lists |
| PR#1331 | 662 | GLM boundary bugs |
| PR#1394 | 629 | levels<-.factor |
| PR#1852 | 712 | quantile extremes |
| PR#1891 | 756 | Summary of nested data frames |
| PR#1930 | 731 | Weighted aov |
| PR#2206 | 763 | terms.formula re-ordering |
| PR#2266 | 740 | rbind matrix as vector |
| PR#2506 | 779 | Printing factor attribute codes |
| PR#2776 | 885 | Aliased coefficients in lm/glm |
| PR#3058 | 864 | na.print and right=TRUE |
| PR#6510 | 1159 | aov with error and -1 |
| PR#6633 | 1209 | Warnings with vector op matrix |
| PR#6645 | 1192 | stem() near-constant values |
| PR#6656 | 1232 | terms.formula losing offsets |
| PR#6857 | 1270 | Dump should quote |
| PR#7171 | 1341 | write.table qmethod on col.names |
| PR#7260 | 1367 | write.table complex columns |
| PR#7350 | 1380 | Infinite loop in read.fwf |
| PR#7789 | 1496 | Escaped quotes in read.table |
| PR#7802 | 1514 | printCoefmat signif.legend |
| PR#7824 | 1528 | Array subscripted by matrix |
| PR#8049 | 1571 | Offsets in add1/drop1 |
| PR#8252 | 1712 | Trivial warning in pairs |
| PR#8337 | 1724 | formatC on Windows |
| PR#8462 | 1753 | update.formula simplify parens |
| PR#8494 | 1741 | solve error message |
| PR#8528 | 1758 | pgamma errors |
| PR#8638 | 1772 | deparse.max.lines |
| PR#8652 | 1805 | as.table row names |
| PR#8695 | 2013 | prettyNum lost attributes |
| PR#8720 | 1810 | GLM zero-weight dispersion |
| PR#8750 | 1827 | uniroot no warning |
| PR#8868 | 1853 | rbind.data.frame permuted cols |
| PR#8934 | 1200 | stem() width |
| PR#9044 | 1873 | write.table quoting col names |
| PR#9216 | 1989 | List loop index mutation |
| PR#9263 | 2038 | R_Visible problems |
| PR#9433 | 2076 | cut(breaks="years") |
| PR#9574 | 2507 | format.pval eps/nsmall |
| PR#9623 | 2264 | qr pivoting dimnames |
| PR#10494 | 2304 | confint rank-deficient |
| PR#10574 | 2314 | Corrupt df from subsetting |
| PR#11512 | 2321 | format.factor dim loss |
| PR#13167 | 2336 | aggregate empty df |
| PR#13691 | 2417 | cor.test continuity correction (wish) |
| PR#13724 | 2434 | Corrupt data frame |
| PR#14059 | 2684 | is.na empty data frame |
| PR#14162 | 2482 | cut.Date empty levels |
| PR#14488 | 2575 | Rank correlation NAs |
| PR#14514 | 2544 | mantelhaen.test tail |
| PR#14522 | 2558 | scan strip.white (investigation) |
| PR#14679 | 2634 | trunc.POSIXlt |
| PR#14840 | 2649 | Weighted lm summary labels |
| PR#15028 | 2710 | Long names cutoff |
| PR#15179 | 2732 | Binary op deparse |
| PR#15190 | 2920 | difftime tzone |
| PR#15247 | 2748 | str invalid df names |
| PR#15299 | 2755 | Vector + table class |
| PR#15301 | 2786 | 1D array dimnames |
| PR#15311 | 2760 | regmatches<- mishandled |
| PR#15396 | 2798 | arima local optimum |
| PR#15411 | 2813 | format digits spacing |
| PR#15468 | 2835 | rbind/cbind matrix+list |
| PR#15583 | 2829 | Rounding detection |
| PR#15624 | 2870 | dpois rounding |
| PR#15625 | 2876 | Embedded NULs in CSV |
| PR#15633 | 2905 | bartlett/fligner multi-factor |
| PR#15687 | 2911 | ts digits on time labels |
| PR#15706 | 2928 | cophenetic Labels |
| PR#15708 | 2934 | anova line wrapping |
| PR#15718 | 2943 | df integer-row assignment |
| PR#15781 | 2949 | options print |
| PR#15819 | 2965 | OutDec in formatC |
| PR#15886 | 3210 | summaryRprof chunksize |
| PR#15999 | 3003 | Long name value cutoff |
| PR#16437 | 3014 | model.tables/TukeyHSD no-intercept |
| PR#16686 | 3070 | dput empty symbol |
| PR#16709 | 3088 | summary.data.frame Date NAs |
| PR#17336 | 3238 | printCoefmat NaN preservation |
| PR#17836 | 3210 | Rprof not enabled |
| PR#17868 | 3225 | Named complex vector printing |
| PR#18019 | 3225 | Named complex vector printing |
| PR#18098 | 2813 | digits=0 not ok |
| PR#18232 | 3244 | deparse cflow bodies on LHS |
| PR#18284 | 3315 | Deparsing of ! precedence |
| PR#18572 | 3391 | withAutoprint srcrefs |
