# reg-tests-1b.R -- Comprehensive Summary

**Source**: R regression tests for PRs #10000+ (R versions < 3.0.0)
**Total lines**: 2121
**Total assertion points**: ~285 (stopifnot, assertError, assertWarning, try-error checks)
**Total distinct test blocks**: ~150 (separated by blank lines, each testing a specific bug fix or feature)

## R Functions/Features Tested (with line references)

| Function/Feature | Lines |
|---|---|
| `wilcox.test` | 94-98, 1033-1046 |
| `cor` / `cor.test` | 101-112, 810-814 |
| `fisher.test` | 137-142, 1138-1143 |
| `shapiro.test` | 364-365 |
| `ks.test` | 1074-1076 |
| `chisq.test` | 971-977 |
| `mood.test` | 685-692 |
| `t.test` (via quantile) | 1021-1030, 1349-1354 |
| `lm` / `glm` / `anova` | 274-288, 434-438, 517-520, 839-845, 1407-1418, 1520-1527, 1674-1680, 1741-1745, 1856-1864, 1867-1874, 1892-1900, 1979-1986 |
| `nls` | 396-416 |
| `predict.loess` | 247-256, 1313-1326 |
| `predict.lm` | 1407-1418, 1741-1745 |
| `hclust` | 1821-1836 |
| `splinefun` / `splines` | 507-514, 1184-1190, 1357-1371, 1867-1874 |
| `smooth.spline` | 1625-1631 |
| `cut` / `cut.Date` / `cut.POSIXt` | 88-91, 146-182, 523-528, 1200-1206, 1285-1288 |
| `factor` / `levels` | 329-342, 718-747, 1063-1071, 1269-1275, 1303-1310, 1374-1378 |
| `data.frame` | 222-227, 344-353, 356-361, 382-392, 440-445, 550-560, 980-987, 1217-1221, 1291-1300, 1597-1602 |
| `merge` | 266-271, 1781-1800, 1918-1929 |
| `seq` / `seq.Date` | 534-537, 854-858, 1498-1503, 1803-1805 |
| `format` / `formatC` / `prettyNum` | 317-321, 592-598, 1131-1135, 1576-1581 |
| `deparse` / `parse` | 570-572, 607-609, 815-818, 1937-1941 |
| `sprintf` | 703-706, 750-769 |
| `serialize` / `unserialize` | 1714-1732 |
| `quantile` | 1021-1030, 1349-1354 |
| `save` / `load` | 908-921 |
| `read.table` | 924-940, 1049-1054 |
| `barplot` | 419-423 |
| `heatmap` | 695-700 |
| `hist.Date` / `hist.POSIXt` | 146-182 |
| `deriv` / `D` | 36-44 |
| `choose` | 70-72 |
| `by` | 75-79, 1843-1853 |
| `tapply` | 185-187 |
| `gregexpr` | 190-196 |
| `round` / `signif` | 199-201, 1652-1656 |
| `kappa` | 204-208 |
| `glob2rx` | 297-309 |
| `weighted.mean` | 943-951, 997-1002 |
| `str` | 13-17, 540-547, 1705-1712 |
| `switch` | 1057-1060, 1146-1148 |
| `rbeta` / `rnorm` / `rexp` / `rt` | 230-244, 1224-1229 |
| `besselI` | 677-682 |
| `qchisq` / `qgeom` / `qt` | 622-624, 1670-1672, 1932-1934 |
| `pbinom` | 1695-1697 |
| `beta` | 2028-2030 |
| `det` / `determinant` | 1097-1103 |
| `solve` / `backsolve` / `chol2inv` / `qr` | 367-369, 447-449, 652-655, 1944-1961, 1470-1477 |
| `dist` / `cmdscale` | 1443-1446, 1618-1622 |
| `arima` / `ar` | 1771-1778, 2015-2019 |
| `TukeyHSD` | 2079-2088 |
| `aov` | 839-845, 2079-2088 |
| `drop1` | 434-438 |
| `influence.measures` | 274-288 |
| `reshape` | 1461-1468 |
| `aggregate` | 1480-1484 |
| `model.frame` / `model.matrix` | 860-866, 1063-1071, 1374-1378, 1381-1389, 1856-1874 |
| `uniroot` | 1605-1615 |
| `bw.SJ` | 773-776 |
| `rWishart` | 1908-1910 |
| `rowsum` | 1964-1976 |
| `Map` / `mapply` / `sapply` / `lapply` | 371-379, 1452-1458, 1571-1573 |
| `match` / `duplicated` / `anyDuplicated` | 426-431, 779-786, 1120-1123, 1683-1692, 1700-1703 |
| `complete.cases` | 959-961 |
| `unsplit` | 980-987 |
| `stack` / `unstack` | 1659-1667 |
| `memCompress` / `memDecompress` | 1209-1214 |
| `connections` (gzfile, bzfile, xzfile, seek) | 452-461, 1171-1181, 1253-1261, 1538-1562 |
| `identical` | 1339-1341 |
| `aperm` | 2105-2112 |
| `enc2utf8` | 2114-2116 |

---

## Test Blocks (All, by order of appearance)

### 1. str() infinite recursion on list-alikes (Lines 13-17)
- **Function**: `str()`
- **Check**: Calling `str()` on an object with custom `[[` method caused infinite recursion in R < 2.6.0
- **Data**: `structure(list(2), class="foo")` with custom `[[.foo`

### 2. curve() with add=NA (Lines 20-23)
- **Function**: `curve()`
- **Check**: `add = NA` (new in 2.14.0) preserves user coordinates
- **Assertion**: `par("usr")[1:2]` unchanged after `curve(cos, add=NA)`
- **Bug**: Failed in R <= 2.6.0

### 3. CHARSXP caching side-effects with Encoding (Lines 26-32)
- **Function**: `Encoding()`, `serialize`/`unserialize`
- **Check**: Setting encoding on one copy of a string should not affect another
- **Assertion**: `Encoding(y)` remains `"unknown"` after modifying `x`
- **Bug**: Was "UTF-8" in R 2.6.0

### 4. deriv3/D for gamma-related functions (Lines 35-44)
- **Function**: `deriv3()`, `D()`
- **Check**: Symbolic differentiation of `gamma`, `lgamma`, `digamma`, `trigamma`, `psigamma`
- **Bug**: `deriv3(~ gamma(y))` and `deriv3(~ lgamma(y))` failed in R < 2.7.0; `D(psigamma(...))` is new

### 5. .subset2 quirk with iris (Lines 47-50)
- **Function**: `.subset2`, `[` on data frames
- **Check**: Single-column logical indexing on iris
- **Bug**: Failed in R 2.6.0

### 6. Indexing by "" (empty string) and NA_character_ (Lines 53-67)
- **Function**: `[`, `[[`, `[<-`, `[[<-`
- **Check**: Empty string and NA character indexing should not match; `x[[""]]` should error, `x[""]` returns NA; assignment with `""` should add elements
- **Assertions**: Multiple `stopifnot` on lengths and values
- **Bug**: `x[[""]]` returned element 4 in R < 2.7.0

### 7. choose() with negative n (Lines 70-72)
- **Function**: `choose()`
- **Check**: `choose(-1, 3)` should return -1, not 0
- **Bug**: Gave 0 previously

### 8. by() on 1-column data frame (Lines 75-79)
- **Function**: `by()`
- **Check**: PR#10506 -- `by()` on a single-column data frame
- **Data**: `data.frame(a=1:10)`, grouped by `gl(2,5)`
- **Bug**: Failed in R 2.6.1

### 9. range.default with na.rm on non-numeric (Lines 82-85)
- **Function**: `range()`
- **Check**: `na.rm` should work for Date objects
- **Data**: `as.Date(c("2007-11-06", NA))`
- **Bug**: Returned NAs in R 2.6.1

### 10. cut() on constant negative values (Lines 88-91)
- **Function**: `cut()`
- **Check**: `cut(rep(-1, 5), 2)` should not produce NAs
- **Bug**: Used `min` instead of `abs(min)` for constant values

### 11. Extreme two-sample wilcox.test (Lines 94-98)
- **Function**: `wilcox.test()`
- **Check**: `wilcox.test(1, 2:60, conf.int=TRUE, exact=FALSE)` -- extreme sample sizes with confidence interval
- **Bug**: Failed in R < 2.7.0 (normal approximation was way off)

### 12. Corner cases for cor() with kendall (Lines 101-112)
- **Function**: `cor()`
- **Check**: (1) Result should not be a 1x1 matrix, (2) zero-column matrix should error, (3) zero-length vectors should error
- **Method**: Kendall with pairwise complete obs
- **Bug**: Various wrong results in R < 2.7.0

### 13. Infinite loop in format.AsIs (Lines 115-119)
- **Function**: `format.AsIs`, `data.frame(I(z))`
- **Check**: `I()` wrapping POSIXct should not cause infinite loop
- **Bug**: Reported on R-help 2008-01

### 14. drop with length-one result preserving names (Lines 122-134)
- **Function**: `drop()`, matrix subsetting
- **Check**: Names should be preserved when dropping dimensions of a matrix
- **Assertions**: Multiple `stopifnot(identical(names(...)))` checks
- **Bug**: Names were dropped in R < 2.7.0

### 15. fisher.test with extreme degeneracy (Lines 137-142)
- **Function**: `fisher.test()`
- **Check**: PR#10558 -- diagonal matrix `diag(1:3)` with simulated p-value
- **Assertion**: `p > 0.001` (true value ~1/60)
- **Bug**: Was ~0.0005 in R 2.6.1 patched

### 16. cut/hist for Dates and POSIXt -- Marc Schwartz patch (Lines 146-182)
- **Functions**: `hist.Date()`, `cut.Date()`, `hist.POSIXt()`, `cut.POSIXt()`
- **Check**: Correct counts for month/year/3-month/3-year breaks on a 4-year date sequence
- **Data**: `seq(as.Date("2005/01/01"), as.Date("2009/01/01"), "day")`
- **Assertions**: 12 separate `stopifnot(identical(...))` checks for Date and POSIXlt
- **Bug**: Changed in R 2.6.2

### 17. tapply with zero-length args (Lines 185-187)
- **Function**: `tapply()`
- **Check**: PR#10644 -- `tapply(character(0), factor(letters)[FALSE], length)`
- **Bug**: Failed in R < 2.6.2

### 18. Zero-length patterns in gregexpr (Lines 190-196)
- **Function**: `gregexpr()`
- **Check**: Empty pattern `""` on `"abc"` should return positions 1:3 with match.length 0
- **Assertions**: Three modes: default, `fixed=TRUE`, `perl=TRUE`
- **Bug**: Segfaulted in R < 2.6.2

### 19. Internal argument matching for round() (Lines 199-201)
- **Function**: `round()`
- **Check**: `round(d=2, x=pi)` should use named matching, not positional
- **Assertion**: `all.equal(round(d=2, x=pi), 3.14)`
- **Bug**: Used positional matching in R 2.6.x

### 20. kappa.tri exact mode (Lines 204-208)
- **Function**: `kappa()`
- **Check**: `kappa(fm1, exact=TRUE)` should actually use exact method
- **Data**: `longley` dataset, `lm(Employed ~ .)`
- **Assertion**: `all.equal(23845862, kappa(fm1, exact=TRUE))`
- **Bug**: Wrongly used `exact=FALSE`

### 21. names from pairlists (Lines 210-219)
- **Function**: `names<-`, `attr<-`
- **Check**: PR#10807 -- assigning pairlist as names should convert to character
- **Assertion**: `names(x)` equals `c("a", "b", "c")` not `rep("a", 3)`
- **Bug**: `attr(x, "names") <- pairlist` gave `rep("a", 3)` in R 2.6.x

### 22. Preserving attributes in [<-.data.frame (Lines 222-227)
- **Function**: `[<-.data.frame`
- **Check**: PR#10873 -- custom attributes on data frames should be preserved after column assignment
- **Assertion**: `attr(df, "foo")` is still 10 after `df[, "b"] <- 10:12`
- **Bug**: Dropped attributes in R < 2.7.0

### 23. rfoo NA warnings and rnorm with Inf mean (Lines 230-244)
- **Functions**: `rnorm()`, `rexp()`, `rt()`
- **Check**: `rnorm(2, mean=c(-Inf,Inf))` should return the means; `rexp(2, Inf)` should return 0; various NA-producing scenarios should warn
- **Bug**: Inconsistent in R < 2.7.0

### 24. predict.loess with transformed variables (Lines 247-256)
- **Function**: `predict.loess()`
- **Check**: `loess(y ~ log(x) + log(z), od)` with new data should match manual log transform
- **Assertion**: `all.equal(p1, p2)` between two equivalent approaches
- **Bug**: Failed in R 2.6.x

### 25. segments() with zero-length args (Lines 259-263)
- **Function**: `segments()`
- **Check**: PR#11192 -- `segments(numeric(0), ...)` should not error
- **Bug**: Was error in R < 2.8.0

### 26. merge with zero-row data frame (Lines 266-271)
- **Function**: `merge()`
- **Check**: `merge(NULL, women)` and `merge(women, NULL)` should work; also `merge(women[FALSE,], women)`
- **Bug**: First two failed in R 2.7.0

### 27. influence.measures for lm and glm (Lines 274-288)
- **Function**: `influence.measures()`, `dfbetas()`, `dffits()`, `covratio()`, `cooks.distance()`, `hatvalues()`
- **Check**: lm and glm should give identical influence measures; individual components should match
- **Data**: MASS::Cars93
- **Bug**: `cook.d` part of `influence.measures(<glm>)` differed in R <= 2.7.0

### 28. Short list value for dimnames (Lines 291-294)
- **Function**: `dimnames<-`
- **Check**: Assigning only `dimnames(n)[[1]]` (short list) was correctly an error in R < 2.8.0

### 29. glob2rx with special characters (Lines 297-309)
- **Function**: `glob2rx()`
- **Check**: Patterns containing `(`, `[`, `{` should be handled
- **Data**: `"my(ugly[file{name"`
- **Bug**: "Invalid regular expression" in R <= 2.7.0

### 30. showDefault for unregistered S3 classes (Lines 312-314)
- **Function**: `show()`
- **Check**: `show(structure(1:3, class = "myClass"))` should not fail
- **Bug**: Failed in R <= 2.7.0

### 31. formatC with format="fg" and flag="#" (Lines 317-321)
- **Function**: `formatC()`
- **Check**: Trailing "0" should be preserved with `flag="#"` for small values
- **Data**: `0.599 * c(.1, .01, .001, 1e-4, 1e-5, 1e-6)`
- **Bug**: Dropped trailing "0" in last 3 cases, R <= 2.7.0

### 32. c.noquote bug (Lines 324-327)
- **Function**: `c.noquote()`
- **Check**: `c(noquote('z'), 'y', 'x', 'w')` should give `c('z','y','x','w')`
- **Bug**: Repeated third and later args in R < 2.7.1

### 33. Factor equality with NA levels (Lines 329-342)
- **Function**: `factor`, `==`, `!=`
- **Check**: `f == f` should not contain NA when factor has NA levels (but no missing values); various edge cases with `exclude=NULL`
- **Bug**: `f == f` was wrong in R 1.5.0 -- 2.7.1

### 34. data.frame exact column matching (Lines 344-353)
- **Function**: `[.data.frame`
- **Check**: `dd[,"x"]` should not partial-match (should error); `$` does partial match
- **Bug**: Gave NULL instead of error in R 2.5.0 to 2.7.1

### 35. data.frame NA row indexing with "NA" row name (Lines 356-361)
- **Function**: `[.data.frame`
- **Check**: Indexing with NA when row.names has "NA" should produce unique row names
- **Bug**: Had duplicate "NA" row name in R 2.5.0 to 2.7.1

### 36. shapiro.test rounding error (Line 364-365)
- **Function**: `shapiro.test()`
- **Check**: `shapiro.test(c(0,0,1))$p.value >= 0`
- **Bug**: Wrong (negative) p-value up to R 2.7.1 due to single-precision rounding

### 37. rcond for singular matrix (Lines 367-369)
- **Function**: `rcond()`
- **Check**: `rcond(cbind(1, c(3,3)))` should return 0, not error
- **Bug**: Gave error from Lapack LU detection

### 38. Dispatch from lapply on primitives (Lines 371-379)
- **Function**: `sapply()`, `lapply()`
- **Check**: `sapply(x, is.numeric)` on data frame with Date column; `lapply(list(d=ds), round)` should not fail
- **Bug**: Tried to dispatch on "FUN" in R 2.7.1

### 39. Subsetting data frames with NA column names (Lines 382-392)
- **Function**: `[.data.frame`
- **Check**: Negative and logical column indexing should work even with NA column names
- **Bug**: "undefined columns selected" in R 2.6.1 to 2.7.x

### 40. nls with weights and length-1 variables (Lines 396-416)
- **Function**: `nls()`
- **Check**: nls model with length-1 and length-52 variables, with and without weights
- **Data**: Growth curve model with 52 observations
- **Bug**: Failed to find weights in R <= 2.7.1

### 41. barplot with log="y" and NAs (Lines 419-423)
- **Function**: `barplot()`
- **Check**: PR#11585 -- `barplot(dat, beside=TRUE, log="y")` with NA in data
- **Bug**: Failed in R 2.7.1

### 42. unique/duplicated with extra args (Lines 426-431)
- **Function**: `unique()`, `duplicated()`
- **Check**: Related to PR#12551 -- `unique("a", c("a","b"))` should not segfault; `duplicated(rep("a",3), "a")` was wrong
- **Bug**: Segfault/wrong answer in R 2.7.1

### 43. drop1.lm with NAs (Lines 434-438)
- **Function**: `drop1()`
- **Check**: `drop1()` on lm with NA and `na.action=na.exclude`
- **Data**: `stackloss` with one NA introduced
- **Bug**: Failed in R 2.7.x

### 44. Explicit row.names=NULL in data.frame (Lines 440-445)
- **Function**: `data.frame()`
- **Check**: `row.names=NULL` should suppress named row names; default should use names
- **Bug**: Same as default in R 2.5.0 to 2.7.2

### 45. chol2inv on non-matrices (Lines 447-449)
- **Function**: `chol2inv()`
- **Check**: `chol2inv(2)` should accept scalars (non-matrices)
- **Assertion**: `all.equal(chol2inv(2), matrix(0.25, 1))`
- **Bug**: Did not accept non-matrices up to R 2.7.*

### 46. seek should discard pushback (Lines 452-461)
- **Function**: `seek()`, `scan()`
- **Check**: PR#12640 -- after partial scan, `seek(..., where=0)` should reset properly
- **Assertion**: Second scan returns `c(1, 2)`
- **Bug**: Changed in R 2.7.2 patched

### 47. cov/cor/var with NAs (Lines 464-475)
- **Functions**: `var()`, `sd()`, `cor()`
- **Check**: `var(NULL)` should error; `var(c(1,NA))` should return NA; `sd(c(1,2,NA))` should return NA; `var(x, na.rm=TRUE)` should work
- **Bug**: Gave "missing observations" error for a long time

### 48. write.dcf indenting for "." lines (Lines 478-485)
- **Function**: `write.dcf()`
- **Check**: PR#12816 -- lines starting with "." should have proper DCF indentation (2 spaces, not 1)
- **Bug**: Was " .haha" instead of "  .haha"

### 49. pdf/postscript with CIDfonts (Lines 488-504)
- **Functions**: `pdf()`, `text()`, `postscript()`
- **Check**: Mixing CIDfonts and Type1 fonts should not segfault
- **Bug**: `text()` segfaulted up to R 2.7.2

### 50. splinefun derivatives left of first knot (Lines 507-514)
- **Function**: `splinefun()`
- **Check**: Derivatives evaluated left of first knot should be constant (deriv=1) or zero (deriv=2,3) for natural splines
- **Data**: `x=1:10, y=sin(x)`, evaluated at `seq(0,1,0.1)`
- **Assertions**: `x1 == x1[1]`, `x2 == 0`, `x3 == 0`

### 51. glm(y=FALSE) and anova (Lines 517-520)
- **Function**: `glm()`, `anova()`
- **Check**: PR#1398 (partial) -- `glm(..., y=FALSE)` followed by `anova()` should work
- **Bug**: Obscure errors in R < 2.8.0

### 52. Boundary case in cut.Date (Lines 523-528)
- **Function**: `cut.Date()`, `cut.POSIXt()`
- **Check**: PR#13159 -- cutting a single date at "weeks" boundary
- **Data**: `as.Date("2008-07-07")`
- **Bug**: Failed in R < 2.8.0

### 53. seq() overshoot due to fuzz (Lines 534-537)
- **Function**: `seq()`, `seq.int()`
- **Check**: `seq(0, 1, 0.00025+5e-16)` should not exceed 1
- **Bug**: Overshot by ~2e-12 in R 2.8.x

### 54. str() on invalid object (Lines 540-547)
- **Function**: `str()`
- **Check**: Object that `is.object()` returns FALSE but has class attribute should not cause infinite recursion
- **Bug**: Infinite recursion in R <= 2.8.0

### 55. row.names with empty first row name (Lines 550-560)
- **Function**: `data.frame()`, `row.names()`
- **Check**: PR#13230 -- empty string as first row name should be preserved
- **Data**: Matrix with `dimnames=list(c("","Row 2","Row 3"), ...)`
- **Bug**: Was 1:3 in R 2.8.0

### 56. Time series windowing rounding error (Lines 563-567)
- **Function**: `window()` for time series
- **Check**: PR#13272 -- `window(x, start=c(2008,9), end=c(2008,9), extend=TRUE)` should work
- **Data**: `ts(1:290, start=c(1984,10), freq=12)`
- **Bug**: Second call failed in R 2.8.0

### 57. deparse(nlines=) should shrink (Lines 570-572)
- **Function**: `deparse()`
- **Check**: PR#13299 -- `deparse(..., nlines=7)` should return 1 line if possible
- **Bug**: Was 7 lines in R 2.8.0

### 58. legend xpd reset (Lines 575-580)
- **Function**: `legend()`
- **Check**: PR#12756 -- `legend()` with `xpd=NA` should reset `par("xpd")` to original value
- **Bug**: Left xpd as NA

### 59. lines.formula with subset and no data (Lines 583-589)
- **Function**: `lines.formula()`
- **Check**: `lines(y ~ x, subset=!is.na(y))` without `data` argument
- **Bug**: Error in R 2.8.0

### 60. prettyNum drop0trailing edge case (Lines 592-598)
- **Function**: `prettyNum()`
- **Check**: `drop0trailing=TRUE` should not drop "0" from exponent in values like "8.1e100"
- **Data**: Various numeric strings
- **Bug**: Failed for "8.1e100" etc.

### 61. transform with extra columns (Lines 602-604)
- **Function**: `transform()`
- **Check**: `transform(mtcars, t1=3, t2=4)` should add columns
- **Bug**: Extra columns were passed as a list in R 2.8.0

### 62. deparsing transform (Lines 607-609)
- **Function**: `deparse()`, `parse()`
- **Check**: `parse(text=deparse(transform))` should roundtrip
- **Bug**: Failed in R 2.8.0

### 63. matrix with empty dimnames list (Lines 612-614)
- **Function**: `matrix()`
- **Check**: PR#13361 -- `matrix(1:4, nrow=2, dimnames=list())` should not crash
- **Bug**: Crashed on some systems

### 64. col(as.factor=TRUE) (Lines 617-619)
- **Function**: `col()`
- **Check**: `col(matrix(0,5,5), as.factor=TRUE)` should work
- **Bug**: Failed in R 2.8.0

### 65. qt near zero df (Lines 622-624)
- **Function**: `qt()`
- **Check**: `qt(0.1, 0.1)` should not be NaN
- **Bug**: Was NaN in early Dec 2008 R-devel

### 66. formals<- with list body (Lines 627-631)
- **Function**: `formals<-()`
- **Check**: `formals(f) <- formals(f)` should preserve `body(f)` when body is a list call
- **Bug**: Had body 'pi' instead of `list(pi)` in R < 2.8.1

### 67. body<- on no-argument function (Lines 634-638)
- **Function**: `body<-()`
- **Check**: `body(function() {pi}) <- 2` should work
- **Bug**: Failed in R < 2.8.1

### 68. body<- with list value (Lines 641-649)
- **Function**: `body<-()`
- **Check**: Various edge cases: `body(f) <- list(pi)` should keep it as list; `body(f) <- list(a=1, b=2)` should not create arguments
- **Bug**: Erratic behavior pre-2.9.0

### 69. qr.solve for complex (Lines 652-655)
- **Function**: `qr.solve()`
- **Check**: PR#13305 -- complex matrix QR solve
- **Bug**: Failed in R 2.8.1

### 70. read.table with last-line detection (Lines 658-664)
- **Function**: `read.table()`
- **Check**: PR#13433 -- text ending without final newline should have correct row count
- **Assertion**: `nrow(res) == 3` (not 4)
- **Bug**: Was 4 in R 2.8.1

### 71. cbind segfault with environment in list matrix (Lines 667-674)
- **Function**: `cbind()`
- **Check**: cbind of list matrix containing environments with zero-column matrix
- **Bug**: Crashed in R 2.9.0

### 72. besselI with negative integer order (Lines 677-682)
- **Function**: `besselI()`
- **Check**: `besselI(x, -n)` should equal `besselI(x, +n)` for integer n
- **Bug**: `sin(n*pi)` imprecision in R <= 2.8.1

### 73. mood.test large samples (Lines 685-692)
- **Function**: `mood.test()`
- **Check**: Large sample mood test should not give NA p-value
- **Data**: `rnorm(50, 10, 5)` vs `rnorm(50, 2, 5)`
- **Bug**: Warning and incorrect result in R 2.8.x

### 74. heatmap without dendrogram (Lines 695-700)
- **Function**: `heatmap()`
- **Check**: PR#13512 -- `heatmap(XX, Rowv=NA, ...)` in two variants
- **Bug**: Both failed in R 2.8.1

### 75. sprintf with 0-length args (Lines 703-706)
- **Function**: `sprintf()`
- **Check**: `sprintf("%d", integer(0))` and `sprintf(character(0), pi)` should return `character(0)`
- **New feature**: In R 2.9.0

### 76. asLogical for raw vectors (Lines 709-716)
- **Function**: `as.raw`, `if()`, `c()`
- **Check**: `if(as.raw(1)) TRUE` should work; `c(raw, <other types>)` should work
- **Bug**: Failed before R 2.9.0

### 77. interaction() unique levels (Lines 718-747)
- **Function**: `interaction()`, `factor()`, `gl()`
- **Check**: `interaction()` should produce unique levels; non-unique levels should error
- **Assertions**: Multiple checks on factor construction edge cases
- **Bug**: Partly failed in R <= 2.9.0 and R-devel 2.10.0

### 78. sprintf misuses (segfault) (Lines 750-769)
- **Function**: `sprintf()`
- **Check**: Invalid format strings (`%S%`, `%n`, `%q`) should error, not segfault; error messages for language/symbol args
- **Bug**: Segfaulted in R <= 2.9.0

### 79. bw.SJ with extreme outlier (Lines 773-776)
- **Function**: `bw.SJ()`
- **Check**: `bw.SJ(c(1:99, 1e6))` should not fail (extreme outlier)
- **Assertion**: `all.equal(bw.SJ(...), 0.725, tolerance=1e-3)`
- **Bug**: Failed in two ways in R <= 2.9.0

### 80. anyDuplicated with incomparables (Lines 779-786)
- **Function**: `anyDuplicated()`
- **Check**: Various combinations with `incomp=NA`, `incomp=3`, `incomp=c(3,NA)`
- **Assertions**: 4 specific expected return values
- **Bug**: Missing UNPROTECT and partly wrong in dev versions

### 81. expand.grid stringsAsFactors (Lines 789-794)
- **Function**: `expand.grid()`
- **Check**: `stringsAsFactors=TRUE` should give factors; `FALSE` should give characters
- **Bug**: Did not work in R 2.9.0, fixed in 2.9.1 patched

### 82. print.srcref and bad encoding connections (Lines 797-807)
- **Function**: `parse()`, `print()`, `file()`
- **Check**: print.srcref should not fail; bad encoding should fail cleanly without leaking connections
- **Assertion**: No extra connections left open

### 83. cor.test spearman alternative symmetry (Lines 810-814)
- **Function**: `cor.test()`
- **Check**: PR#13574 -- Spearman `alternative="greater"` p-value should equal `alternative="less"` p-value on negated data
- **Bug**: Marginally different in R < 2.9.0 patched

### 84. median on POSIXt (Lines 817-819)
- **Function**: `median()`
- **Check**: `median(rep(Sys.time(), 2))` should work
- **Bug**: Failed in R 2.8.1, 2.9.0

### 85. Repeated NA in dim() (Lines 822-829)
- **Function**: `dim<-()`
- **Check**: PR#13729 -- `dim(L0) <- c(1,NA,NA)` should error but not set dim; `dim(L1) <- c(-1,-1)` likewise
- **Bug**: dim was set in R 2.9.0

### 86. as.character for numeric near 0.3 (Lines 832-836)
- **Function**: `as.character()`
- **Check**: `as.character(0.3 + 2e-16 * -2:2)` should give unique `"0.3"` for all; same for complex
- **Bug**: Gave `"0.300000000000000"` in R < 2.10.0

### 87. aov with subset evaluation scope (Lines 839-845)
- **Function**: `aov()`
- **Check**: PR#13733 -- `aov(y ~ x + Error(sub/x), data=DF, subset=(x!="C"))` should not error
- **Bug**: Safety check evaluated call in wrong environment in R 2.9.0

### 88. for-loop seq modification protection (Lines 848-851)
- **Function**: `for` loop
- **Check**: Modifying the sequence variable inside a for loop should not change iteration
- **Assertion**: `s == 3` (not 44.5)
- **Bug**: `s` was 44.5 in R <= 2.9.0

### 89. Colon operator at integer boundary (Lines 854-858)
- **Function**: `:`
- **Check**: `(M-2):(M+.1)` where M is `.Machine$integer.max` should be integer
- **Bug**: Was "double" in R <= 2.9.1

### 90. model.matrix with too many columns (Lines 860-866)
- **Function**: `model.matrix()`
- **Check**: 40-way interaction (2^40 columns) should error, not segfault
- **Bug**: Segfaulted in R <= 2.9.1

### 91. seq_along dispatching length (Lines 869-874)
- **Function**: `seq_along()`
- **Check**: `seq_along(x)` should dispatch on `length.FOO` method
- **Bug**: Used C-internal non-dispatching `length()` in R <= 2.9.1

### 92. factor(NULL) (Lines 877-879)
- **Function**: `factor()`
- **Check**: `factor(NULL)` should be identical to `factor()`
- **Bug**: Gave error from R ~1.3.0 to 2.9.1

### 93. methods() warnings with S4 (Lines 882-891)
- **Function**: `methods()`, `setMethod()`
- **Check**: `methods(na.omit)` should not warn when S3 generic becomes S4
- **Bug**: Gave two warnings

### 94. Raw vector assignment with NA index (Lines 894-899)
- **Function**: `[<-` on raw vectors
- **Check**: `x[c(1, NA, 3)] <- x[2]` should work without segfault
- **Bug**: Used to segfault

### 95. Logic operations with complex (Lines 902-905)
- **Function**: `&`, `|`, `&&`, `||` on complex
- **Check**: Complex values should work in logical operations
- **Bug**: Was explicitly error-caught despite contrary documentation

### 96. save/load with compression types (Lines 908-921)
- **Functions**: `save()`, `load()`
- **Check**: All combinations of `ascii` (TRUE/FALSE) and `compress` (FALSE, TRUE, "bzip2", "xz") should roundtrip
- **Assertions**: `identical(x, xx)` for each combination

### 97. read.table with compressed input (Lines 924-940)
- **Function**: `read.table()`
- **Check**: Reading gzip, bzip2, and xz compressed files should give identical results to `morley` dataset
- **Assertions**: 3 `stopifnot(identical(read.table(tf), morley))`

### 98. weighted.mean with NAs (Lines 943-951)
- **Function**: `weighted.mean()`
- **Check**: PR#14032 -- `weighted.mean(c(101,102,NA), na.rm=TRUE)` should match `mean(x, na.rm=TRUE)`; empty weighted mean should give NaN
- **Bug**: Divided by 3 in R 2.10.0; gave 0 for empty in R 2.10.x-2.11.x

### 99. unname on 0-length vector (Lines 954-956)
- **Function**: `unname()`
- **Check**: `unname(c(a=1)[FALSE])` should drop names
- **Bug**: Failed in R 2.10.0

### 100. complete.cases on 0-column data frame (Lines 959-961)
- **Function**: `complete.cases()`
- **Check**: `complete.cases(data.frame(1:10)[-1])` should work
- **Bug**: Failed in R 2.10.0

### 101. Converting unnamed lists to environments (Lines 964-968)
- **Function**: `with()`
- **Check**: PR#14035 -- `with(list(2), ls())` and `with(list(a=1, 2), ls())` should work
- **Bug**: Failed in R < 2.11.0

### 102. chisq.test with long x/y (Lines 971-977)
- **Function**: `chisq.test()`
- **Check**: Over-long x and y arguments (via substitute)
- **Data**: `x = y = rep(c(1000, 1001, 1002), each=5)`
- **Bug**: Failed in R 2.10.0

### 103. unsplit with drop=TRUE on data frame (Lines 980-987)
- **Function**: `unsplit()`
- **Check**: PR#14084 -- `unsplit(split(dff, ..., drop=TRUE), ..., drop=TRUE)` should roundtrip
- **Bug**: Failed in R 2.10.0

### 104. mean.difftime na.rm argument (Lines 990-994)
- **Function**: `mean.difftime()`
- **Check**: `mean(diff(z), na.rm=TRUE)` should be finite when z has NAs
- **Bug**: Was NA in R 2.10.0

### 105. weighted.mean with zero weights and Inf values (Lines 997-1002)
- **Function**: `weighted.mean()`
- **Check**: `weighted.mean(c(0,1,2,Inf), c(1,1,1,0))` should be finite (zero weight on Inf)
- **Bug**: Was NaN in R 2.10.x

### 106. Arithmetic with difftime (Lines 1005-1018)
- **Function**: `Ops.difftime`, `+`, `-`
- **Check**: `z[1] + (z[2]-z[1])` should equal `z[2]`; also `(z[2]-z[1]) + z[1]` and `z[2] - (z[2]-z[1])`; tested for both POSIXct and Date
- **Bug**: Failed/gave wrong answers when Ops.difftime was introduced

### 107. Quantile on ordered factors and Dates (Lines 1021-1030)
- **Function**: `quantile()`
- **Check**: `quantile()` on ordered factors (type 1,3) and Date sequences (type 1,3)
- **Bug**: Failed prior to R 2.11.0

### 108. wilcox.test estimate independence from alternative (Lines 1033-1046)
- **Function**: `wilcox.test()`
- **Check**: Point estimate (`$estimate`) should be the same regardless of `alternative` for both one-sample and two-sample asymptotic tests
- **Data**: One-sample `Z`, two-sample `X` vs `Y`
- **Assertions**: `E1[-1] == E1[1]`, `E2[-1] == E2[1]`
- **Bug**: Was continuity corrected and dependent on alternative prior to R 2.10.1

### 109. read.table with embedded newlines in header (Lines 1049-1054)
- **Function**: `read.table()`
- **Check**: PR#14103 -- header spanning multiple lines (quoted field)
- **Assertion**: Result is `data.frame("B1.B2"="B3")`
- **Bug**: Left part of header to be read as data in R < 2.11.0

### 110. switch with empty ... (Lines 1057-1060)
- **Function**: `switch()`
- **Check**: `switch("A")`, `switch(1)`, `switch(3L)` with no cases should return NULL
- **Bug**: First hung, second gave error in R <= 2.10.1

### 111. Factors with NA levels (Lines 1063-1071)
- **Function**: `addNA()`, `factor`, `model.frame()`
- **Check**: `addNA()` factor should preserve NA levels with `drop=TRUE`; `model.frame()` with xlev should work
- **Bug**: Dropped NA levels in two places in R 2.10.1

### 112. ks.test floating point issue (Lines 1074-1076)
- **Function**: `ks.test()`
- **Check**: `ks.test(1:5, c(2.5, 4.5))` should give p-value 20/21
- **Assertion**: `all.equal(20/21, ks5$p.value, tol=1e-15)`
- **Bug**: Gave p=1 because `abs(1/2 - 4/5) > 3/10` was TRUE (floating point)

### 113. utf8ToInt and intToUtf8 with NA (Lines 1079-1083)
- **Functions**: `utf8ToInt()`, `intToUtf8()`
- **Check**: NA inputs should return NA outputs
- **Bug**: No NA handling prior to R 2.11.0

### 114. tcrossprod with vector-matrix combinations (Lines 1086-1094)
- **Function**: `tcrossprod()`
- **Check**: `tcrossprod(u, v)` should work for vector-vector, matrix-vector, vector-matrix
- **Bug**: `tcrossprod(v, U)` and `(U, v)` wrongly failed in R <= 2.10.1

### 115. det() with NAs (Lines 1097-1103)
- **Function**: `det()`, `determinant()`
- **Check**: `det(m)` for matrix with NAs -- ideally should be NA; `det(m0)` with zero row/col should be 0
- **Note**: Marked as FIXME (still gives 0 for first case)

### 116. cbind/rbind with deparse.level=2 (Lines 1106-1117)
- **Function**: `cbind()` with `deparse.level`
- **Check**: Column names with `deparse.level=2` should show expressions like `"log(hp)"`
- **Data**: `mtcars` columns
- **Bug**: No column names for deparse.level=2 in R 2.10.1

### 117. match with incomparables (infinite loop) (Lines 1120-1123)
- **Function**: `match()`
- **Check**: `match(c("A","B","C"), "A", incomparables=NA)` should not infinite-loop
- **Bug**: Infinite loop in R 2.10.1

### 118. path.expand NA propagation (Lines 1126-1128)
- **Function**: `path.expand()`
- **Check**: `path.expand(c("foo", NA))` should preserve NA
- **Bug**: Gave "NA" (string) in R 2.10.1

### 119. prettyNum drop0trailing on complex (Lines 1131-1135)
- **Function**: `prettyNum()`, `format()`
- **Check**: PR#14201 -- complex values should not be mangled by `drop0trailing=TRUE`
- **Bug**: `str(c(1+2i, 1-3i))` showed wrong sign in R 2.10.1

### 120. fisher.test p-value exceeding 1 (Lines 1138-1143)
- **Function**: `fisher.test()`
- **Check**: `fisher.test(score, group)` should give 0 <= p <= 1
- **Data**: 59 observations, score 0/1/2, two groups
- **Bug**: P-value was 1 + 1.17e-13 in R < 2.11.0

### 121. switch inside lapply (Lines 1146-1148)
- **Function**: `switch()`, `lapply()`
- **Check**: `lapply("forward", switch, forward="posS", reverse="negS")` should work
- **Bug**: Failed when switch was first converted to primitive

### 122. log2 argument evaluation (Lines 1151-1153)
- **Function**: `log2()`
- **Check**: `log2(quote(1:10))` should error, not evaluate arg twice
- **Bug**: "Worked" in R 2.10.x by evaluating twice

### 123. mean with NAs and trim (Lines 1156-1160)
- **Function**: `mean()`
- **Check**: `mean(c(1,10,100,NA), trim=0.1)` and `trim=0.26` should be NA
- **Bug**: Gave error or real value in R <= 2.10.1

### 124. all.equal tolerance for attributes (Lines 1163-1168)
- **Function**: `all.equal()`
- **Check**: Tolerance should apply to numeric attributes too
- **Bug**: Gave "Attributes: relative difference: 1e-07" in R <= 2.10.x

### 125. gzcon misuse protection (Lines 1171-1181)
- **Function**: `gzcon()`
- **Check**: PR#14237 -- `gzcon(textConnection(...))` should error without damaging the connection
- **Bug**: `getConnection()` segfaulted in R <= 2.10.x

### 126. splinefun monoH.FC monotonicity (Lines 1184-1190)
- **Function**: `splinefun(method="monoH.FC")`
- **Check**: Monotone spline should have non-negative first derivative everywhere
- **Data**: `y = c(-12, -10, 3.5, 4.45, 4.5, 140, 142)`
- **Bug**: Slopes in [4.4, 4.66] were slightly negative in R <= 2.11.0

### 127. prettyDate for Date objects (Lines 1193-1197)
- **Function**: `pretty()` for Dates
- **Check**: `pretty(x, n=5)` should start at correct date, return 6 values
- **Bug**: Depended on local timezone at first

### 128. cut with numeric breaks for Date/POSIXt (Lines 1200-1206)
- **Function**: `cut()` for Date/POSIXt
- **Check**: `cut(x, breaks=3)` should produce 3 levels for POSIXct, POSIXlt, and Date
- **Bug**: Failed in R <= 2.11.0

### 129. memDecompress xz (Lines 1209-1214)
- **Function**: `memDecompress()`
- **Check**: Roundtrip compress/decompress of 2000-char string with xz should preserve length
- **Bug**: Short result in R <= 2.11.0

### 130. Right-to-left column removal in data frame (Lines 1217-1221)
- **Function**: `[<-.data.frame`
- **Check**: PR#14263 -- `X[3:2] <- list(NULL)` should remove columns 3 and 2
- **Bug**: R <= 2.11.0 removed columns 2 and 4

### 131. rbeta with mass near 1 (Lines 1224-1229)
- **Function**: `rbeta()`
- **Check**: PR#14291 -- `rbeta(5000, 100, 0.001)` should not produce NAs
- **Bug**: Gave NAs platform-dependently in R <= 2.11.0

### 132. print.ls_str with unusual objects (Lines 1232-1238)
- **Function**: `ls.str()`
- **Check**: Should not eval() names or expressions in environment
- **Data**: Environment with integer, name object, expression call
- **Bug**: 'o' (name object) failed in R <= 2.11.0

### 133. print named empty lists (Lines 1241-1244)
- **Function**: `print.default()`
- **Check**: `list(.=2)[0]` should print as "named list()" not "list()"
- **Bug**: Was just "list()" up to R <= 2.11.x

### 134. stripchart with empty first level (Lines 1247-1250)
- **Function**: `stripchart()`
- **Check**: PR#14317 -- subset excluding first level should still work
- **Bug**: Failed in R 2.11.1

### 135. gzfile seek with LFS (Lines 1253-1261)
- **Function**: `seek()` on gzfile
- **Check**: `seek(blah)` should return 0 after opening
- **Bug**: Gave random large multiple of 2^32 on Linux with LFS support

### 136. octmode with 0-length (Lines 1263-1266)
- **Function**: `as.octmode`, `&`
- **Check**: `as.octmode(integer(0)) & "400"` should return 0-length
- **Bug**: Segfault in pre-2.12.0

### 137. as.logical on factors (Lines 1269-1275)
- **Function**: `as.logical()`, `as.vector()`
- **Check**: `as.logical(factor(c("FALSE","TRUE")))` should give `c(FALSE, TRUE)`
- **Bug**: Lost documented behavior when taken primitive in R 2.6.0; reverted in 2.12.0

### 138. prompt() backquoting (Lines 1278-1282)
- **Function**: `prompt()`
- **Check**: Default arguments with backtick names should be properly escaped
- **Data**: `function(FUN = \`*\`) {}`
- **Assertion**: Usage line shows ``FUN = `*` ``

### 139. cut.POSIXt near boundaries (Lines 1285-1288)
- **Function**: `cut.POSIXt()`
- **Check**: PR#14351 -- `cut(as.POSIXlt("2010-08-10 00:00:01"), "5 hours")` should not be NA
- **Bug**: Was NA in R 2.11.x

### 140. summary on data frames with invalid names (Lines 1291-1300)
- **Function**: `summary()`
- **Check**: Data frame column names with high-byte characters should be preserved in summary
- **Bug**: Had NAs in R < 2.12.0

### 141. [[<- on factors preserving type (Lines 1303-1310)
- **Function**: `[[<-.factor`
- **Check**: `z[[2]] <- "One"` should keep typeof "integer"; roundtrip should be identical
- **Bug**: Failed in R < 2.12.0

### 142. predict.loess with NAs (Lines 1313-1326)
- **Function**: `predict.loess()`
- **Check**: NA in newdata should propagate to output (not be removed via na.omit); tested with and without `se=TRUE`, and with `surface="direct"`
- **Bug**: Used na.omit prior to R 2.12.0

### 143. ksmooth with NULL y (Lines 1329-1331)
- **Function**: `ksmooth()`
- **Check**: Typo `cars$dists` (should be `cars$dist`) gives NULL y; should error, not segfault
- **Bug**: Segfaulted in R <= 2.11.1

### 144. do.call NextMethod (Lines 1334-1336)
- **Function**: `do.call()`, `NextMethod()`
- **Check**: `do.call(function(x) NextMethod('foo'), list())` should error, not segfault
- **Bug**: Segfaulted in R <= 2.11.1

### 145. getNamespaceVersion (Lines 1344-1346)
- **Function**: `getNamespaceVersion()`
- **Check**: `getNamespaceVersion("stats")` should equal `getRversion()`
- **Bug**: Failed in R 2.11.x

### 146. quantile type 6 ordering (Lines 1349-1354)
- **Function**: `quantile()`
- **Check**: PR#14383 -- `quantile(x, type=6, probs=c(0,.5))` reversed should match
- **Bug**: Differed in R 2.11.x

### 147. backSpline with decreasing knots (Lines 1357-1371)
- **Function**: `backSpline()`, `interpSpline()`
- **Check**: `backSpline()` on decreasing function should not have bizarre jumps
- **Bug**: Failed in R <= 2.11.x

### 148. model.frame with drop.unused.levels and NA factor levels (Lines 1374-1378)
- **Function**: `model.frame()`
- **Check**: PR#14393 -- `drop.unused.levels=TRUE` should work with NA factor levels
- **Bug**: Failed to drop in R < 2.12.0

### 149. Long variable names in model.frame (Lines 1381-1389)
- **Function**: `model.frame()`, `as.formula()`
- **Check**: Variable names > 500 bytes should not cause invalid name
- **Data**: 50 column names in cbind formula

### 150. Expression subassignment preserving type (Lines 1392-1404)
- **Function**: `[<-`, `[[<-`, `$<-` on expressions
- **Check**: `x["b"] <- expression(...)`, `x[["a"]] <- NULL`, `x$a <- NULL` should keep expression class
- **Bug**: Coerced to lists

### 151. predict.lm type="terms" with terms argument (Lines 1407-1418)
- **Function**: `predict.lm()`
- **Check**: `predict(..., type="terms", terms=c("x","fac"), interval="confidence")` should subset correctly
- **Bug**: pfit2 failed; without interval gave se's for all terms

### 152. TRE assert on invalid regexp (Lines 1421-1423)
- **Function**: `regexpr()`
- **Check**: PR#14398 -- `regexpr("a{2-}", "")` should error, not terminate R
- **Bug**: Terminated R in R <= 2.12.0

### 153. ! on zero-length objects preserving attributes (Lines 1426-1431)
- **Function**: `!` (logical NOT)
- **Check**: PR#14244 -- `!matrix(FALSE, 0, 2)` should preserve dim/dimnames
- **Bug**: Dropped all attributes in R 2.12.0

### 154. drop.terms preserving intercepts (Lines 1434-1440)
- **Function**: `drop.terms()`, `[.terms`
- **Check**: `drop.terms(tt, 1)` should preserve `- 1` (no intercept)
- **Bug**: Reset intercept term in R < 2.13.0

### 155. cmdscale with negative eigenvalues (Lines 1443-1446)
- **Function**: `cmdscale()`
- **Check**: `cmdscale(eurodist, eig=TRUE, k=14)` should give fewer than 14 columns
- **Bug**: Used negative eigenvalues in R 2.12.0

### 156. mapply/sapply simplification for "call" (Lines 1452-1458)
- **Function**: `mapply()`, `sapply()`
- **Check**: Should not simplify lists of calls/mixed types
- **Bug**: Length was wrong (6 and 9 instead of 2 and 3) in R <= 2.12.0

### 157. reshape() sep argument (Lines 1461-1468)
- **Function**: `reshape()`
- **Check**: PR#14335 -- `sep=""` should produce names like "x1", "y1" not "x.1", "y.1"
- **Bug**: Ignored sep in R <= 2.12.0

### 158. qr.X column name pivoting (Lines 1470-1477)
- **Function**: `qr.X()`, `qr()`
- **Check**: PR#14438 -- column names should follow QR pivoting
- **Bug**: Failed to pivot colnames in R <= 2.12.0

### 159. aggregate preserving POSIXt class (Lines 1480-1484)
- **Function**: `aggregate.data.frame()`
- **Check**: Aggregating POSIXt column with `max` should preserve class
- **Bug**: Improvement in R 2.13.0

### 160. pretty on all-infinite (Lines 1487-1489)
- **Function**: `pretty()`
- **Check**: PR#14468 -- `pretty(-2:1 / 0)` should return length-0, not error
- **Bug**: Gave error in R <= 2.12.1

### 161. as.POSIXlt consistent formatting (Lines 1492-1495)
- **Function**: `as.POSIXlt()`
- **Check**: `as.POSIXlt(x)` should give same result regardless of element order
- **Bug**: Used different formats for different orders previously

### 162. seq.Date overshoot (Lines 1498-1503)
- **Function**: `seq.Date()`, `seq.POSIXt()`
- **Check**: `seq(as.Date("2011-01-07"), as.Date("2011-03-01"), by="month")` should have length 2
- **Bug**: Was 3 in R < 2.13.0

### 163. mostattributes<- for data frames (Lines 1506-1509)
- **Function**: `mostattributes<-()`
- **Check**: PR#14469 -- should set names for data frames
- **Bug**: Did not set names in R < 2.13.0

### 164. naresid.exclude with all omitted (Lines 1512-1518)
- **Function**: `naresid()`
- **Check**: When all cases omitted via `na.exclude`, `naresid()` should return NA vector
- **Bug**: Gave length-0 result

### 165. weighted.residuals for mlm (Lines 1520-1527)
- **Function**: `weighted.residuals()`
- **Check**: `weighted.residuals()` on multivariate lm should preserve dimensions
- **Bug**: Dropped dims in R 2.12.1

### 166. ccf with na.action=na.pass (Lines 1530-1535)
- **Function**: `ccf()`, `acf()`
- **Check**: `ccf(z[,1], z[,2], na.action=na.pass)` with NAs should work
- **Bug**: Failed in R 2.12.1

### 167. Compressed connection append mode (Lines 1538-1562)
- **Functions**: `gzfile()`, `bzfile()`, `xzfile()` with `"a"` mode
- **Check**: Appending to compressed files should work for all three types; 50 lines + 20 lines = 70 lines
- **Bug**: bzfile warned and did not work in R < 2.13.0

### 168. NA_complex_ in prettyNum (Lines 1565-1568)
- **Function**: `prettyNum()`, `format()`
- **Check**: `format(c(pi+0i, NA), drop0=TRUE)` and `prettyNum(NA_complex_, drop0=TRUE)` should not error
- **Bug**: Gave errors in R < 2.12.2

### 169. Map() calling match.fun (Lines 1571-1573)
- **Function**: `Map()`
- **Check**: PR#14495 -- `local({a <- sum; Map("a", list(1:5))})` should find `a` by name
- **Bug**: Failed in R < 2.13.0

### 170. format.info and format rounding (Lines 1576-1581)
- **Function**: `format.info()`, `format()`
- **Check**: PR#14491 -- `format.info(7.921, digits=2)` should give `c(3,1,0)`; `format(0.2204, digits=3)` should give `"0.22"`
- **Bug**: Wrong format info and extra trailing zero in R < 2.13.0

### 171. unzip on non-existing file (Lines 1584-1586)
- **Function**: `unzip()`
- **Check**: PR#14517 -- `unzip('non-existing_file.zip', ...)` should not crash
- **Bug**: Crashed on some platforms pre-2.13.0

### 172. plot.formula with matrix data (Lines 1589-1594)
- **Function**: `plot.formula()`, `points()`, `lines()`
- **Check**: `plot(y1 ~ x1, data=A)` where A is a matrix should work with extra args
- **Bug**: Failed with extra argument in R < 2.13.0

### 173. data.frame check.rows (Lines 1597-1602)
- **Function**: `data.frame()`
- **Check**: PR#14530 -- `data.frame(dfA, dfA[2:1,], check.rows=TRUE)` should error (mismatched rows)
- **Bug**: "Worked" in R 2.12.2

### 174. uniroot with -Inf function values (Lines 1605-1615)
- **Function**: `uniroot()`
- **Check**: `uniroot(function(x) log(g(x)), c(-90,100))` where g produces -Inf should warn but find root
- **Bug**: Failed badly in R < 2.13.0 (-Inf replaced by +1e308)

### 175. as.matrix.dist for empty dist (Lines 1618-1622)
- **Function**: `as.matrix.dist()`
- **Check**: `as.matrix(dist(matrix(,0,0)))` should work
- **Bug**: Threw error in R < 2.13.0

### 176. smooth.spline with small range data (Lines 1625-1631)
- **Function**: `smooth.spline()`
- **Check**: PR#14552 -- large x values (epoch seconds) with many points should not collapse
- **Assertion**: `length(s$x) == length(x)` (all points used)
- **Bug**: Chose only 5 distinct x values in R 2.13.0

### 177. readBin on raw connection (Lines 1634-1639)
- **Function**: `readBin()`, `rawConnection()`
- **Check**: `readBin(rawcon, what="integer", size=1, n=4)` should read consecutive bytes
- **Bug**: Read same value repeatedly in R 2.13.0

### 178. Closure body types (Lines 1642-1649)
- **Function**: `body()`
- **Check**: Closure bodies can be external pointers or other exotic types
- **Bug**: Not allowed in R < 2.14.0

### 179. signif/round corner cases with -Inf digits (Lines 1652-1656)
- **Function**: `signif()`, `round()`
- **Check**: `signif(x, -Inf)` should equal `signif(x, 1)` (not zero); `round(x, -Inf)` should give 0 (not NA)
- **Bug**: Zero and NAs respectively in R < 2.14.0

### 180. stack/unstack with character columns (Lines 1659-1667)
- **Function**: `stack()`, `unstack()`
- **Check**: Character columns should remain character, not be converted to factor
- **Bug**: Issues in R < 2.14.0

### 181. qchisq near-zero df (Lines 1670-1672)
- **Function**: `qchisq()`
- **Check**: PR#14710 (instance of PR#8528) -- `qchisq(p=0.025, df=0.00991)` should not be NaN
- **Bug**: NaN in R 2.13.2

### 182. nobs for zero-weight glm (Lines 1674-1680)
- **Function**: `nobs()`
- **Check**: `nobs(lm(..., weights=wt))` should equal `nobs(glm(..., weights=wt))` when some weights are zero
- **Bug**: Was 6 and 9 (disagreed) in R < 2.14.1

### 183. anyDuplicated with MARGIN=0 (Lines 1683-1692)
- **Function**: `anyDuplicated()`, `duplicated()`
- **Check**: `MARGIN=0` (element-wise) should work like on vector
- **Bug**: Gave error in R < 2.14.1

### 184. pbinom log.p with large n (Lines 1695-1697)
- **Function**: `pbinom()`
- **Check**: PR#14739 -- `pbinom(10, 1e6, 0.01, log.p=TRUE)` should not be NaN
- **Bug**: NaN due to misuse of toms708 in R 2.11.0

### 185. duplicated.data.frame fromLast (Lines 1700-1703)
- **Function**: `duplicated.data.frame()`
- **Check**: PR#14742 -- `fromLast=TRUE` should be respected for data frames
- **Bug**: Ignored fromLast in R 2.14.0

### 186. str with list.len and strict.width (Lines 1705-1712)
- **Function**: `str()`
- **Check**: `list.len` should work with `strict.width="cut"`
- **Assertion**: Output is 1 + 7 + 1 = 9 lines
- **Bug**: `list.len` was not used with `strict.width="cut"` in R <= 2.14.1

### 187. Serialization regression tests (Lines 1714-1732)
- **Functions**: `serialize()`, `unserialize()`
- **Check**: Roundtrip for: real vector, complex vector, large integer matrix, raw vector; both XDR and native; both memory and file connections
- **Note**: Regression test for new internal code in R 2.15.0

### 188. printarray PROTECT issue (Lines 1735-1738)
- **Function**: `print.data.frame()` (C-level printarray)
- **Check**: Large data frame (2080 rows) should not cause memory allocation failure
- **Bug**: "cannot allocate memory block of size 17179869183.6 Gb" in R <= 2.14.1

### 189. predict.lm type="terms" with subset of terms (Lines 1741-1745)
- **Function**: `predict.lm()`
- **Check**: `predict(fit, type="terms", terms=2, se.fit=TRUE)` should return matrix with correct dims
- **Bug**: Failed in R <= 2.14.1

### 190. format.POSIXlt on invalid objects (Lines 1748-1752)
- **Function**: `format.POSIXlt()`
- **Check**: Invalid POSIXlt (modified mday on empty) should not crash
- **Bug**: Arithmetic exception in R <= 2.14.1

### 191. options(max.print) validation (Lines 1755-1759)
- **Function**: `options()`
- **Check**: `max.print=Inf` should warn then error; `max.print=-2` should error; `max.print=1e100` should warn
- **Bug**: Gave only warnings (recurring) in R <= 2.14.2

### 192. units<- preserving names (Lines 1762-1768)
- **Function**: `units<-()`
- **Check**: PR#14839 -- changing units on named difftime should preserve names
- **Bug**: Changed name in R < 2.15.0

### 193. predict VAR(p>=2) (Lines 1771-1778)
- **Function**: `predict.ar()`
- **Check**: `predict(est, n.ahead=100)` on VAR(2) should give bounded predictions
- **Bug**: Values went to +/- 1e23 in R <= 2.14.2

### 194. merge regression tests (Lines 1781-1800)
- **Function**: `merge()`
- **Check**: Duplicate column names after merge should error; non-unique suffixes should error; ambiguous 'by' should error
- **Multiple bugs**: Various edge cases that "worked" incorrectly in R < 2.15.0/2.15.1

### 195. seq() misuse (Lines 1803-1805)
- **Function**: `seq()`
- **Check**: `seq(1:50, by=5)` should error (vector for `from`)
- **Bug**: Gave 1:50 in R < 2.15.1 with warnings

### 196. dim<- duplication (Lines 1808-1812)
- **Function**: `dim<-()`
- **Check**: PR#14850 -- `dim<-(b, c(2,1))` should not modify the original `a` that shares data
- **Bug**: Did not duplicate

### 197. deparse escape characters in names (Lines 1815-1818)
- **Function**: `deparse()`
- **Check**: PR#14846 -- switch case `"\\dbc"` should survive deparse/parse roundtrip
- **Bug**: Unrecognized escape error

### 198. hclust median method correctness (Lines 1821-1836)
- **Function**: `hclust()`
- **Check**: PR#4195 -- "median" (and "centroid") algorithm correctness; also performance test (should be fast)
- **Data**: 12x3 random matrix with manhattan distance
- **Assertions**: Specific height values to 9 decimal places; timing constraint
- **Bug**: Slow and incorrect from R 1.9.0 to R 2.15.0

### 199. "infinity" string parsing (Lines 1839-1841)
- **Function**: `as.numeric()`
- **Check**: `as.numeric("infinity")` should return Inf (not NA from partial match of "inf")
- **Bug**: Was NA in R < 2.15.1

### 200. by() on 0-row data frame (Lines 1843-1853)
- **Function**: `by()`
- **Check**: `by()` on a data frame with no matching rows should not fail
- **Bug**: Failed in R 2.15.0

### 201. model.frame.lm with re-ordered factor levels (Lines 1856-1864)
- **Function**: `model.frame.lm()`, `model.matrix()`
- **Check**: `model.frame()` and `model.matrix()` should be consistent even if factor levels are re-ordered in data
- **Bug**: Not true before R 2.15.2

### 202. model.frame.lm with predvars (Lines 1867-1874)
- **Function**: `model.frame.lm()`
- **Check**: `model.frame(fm)` should match `model.frame(fm, data=women[1:3,])` when using `ns()` (splines)
- **Bug**: Differed in R < 2.15.2

### 203. class<- with character(0) (Lines 1877-1889)
- **Function**: `class<-()`, `oldClass<-()`, `attr<-`
- **Check**: PR#14942 -- all three class-setting variants should work consistently; `class(f) <- character(0)` should remove class
- **Bug**: `class<-` version required NULL in R <= 2.15.1

### 204. anova.lmlist (Lines 1892-1900)
- **Function**: `anova()`
- **Check**: PR#14960 -- `anova(model1, model2, test="F")` comparing nested models
- **Bug**: Could fail previously

### 205. sunflowerplot formula method (Lines 1903-1905)
- **Function**: `sunflowerplot()`
- **Check**: `sunflowerplot(Sepal.Length ~ Sepal.Width, data=iris, xlab="A")` should work
- **Bug**: Failed in R 2.15.1

### 206. rWishart with large n (Lines 1908-1910)
- **Function**: `rWishart()`
- **Check**: `rWishart(1, n, diag(n))` for n in {200, 722, 1000} (misuse of alloca)
- **Bug**: Failed in various ways in R <= 2.15.1

### 207. rep(NULL) (Lines 1913-1915)
- **Function**: `rep()`
- **Check**: `rep(NULL, length.out=4)` should return NULL (now gives warning)

### 208. merge with matrix column in data frame (Lines 1918-1929)
- **Function**: `merge()`
- **Check**: PR#14974 -- merge with matrix column and `all.x=TRUE` should set all matrix NA columns
- **Bug**: Only set first column of matrix to NA

### 209. qgeom edge case (Lines 1932-1934)
- **Function**: `qgeom()`
- **Check**: PR#14967 -- `qgeom(1e-20, prob=0.1)` should be >= 0
- **Bug**: Was -1 in R 2.15.1

### 210. ** operator parsing (Lines 1937-1941)
- **Function**: `parse()`
- **Check**: `exp(-0.5*u**2)` should parse same as `exp(-0.5*u^2)` (regression test for r60116:7)
- **Bug**: `**` had wrong precedence: parsed as `(-0.5 * u)^2`

### 211. backsolve with k < nrows (Lines 1944-1949)
- **Function**: `backsolve()`
- **Check**: `backsolve(r, cbind(b,b))` where b has more elements than r has rows
- **Bug**: Used wrong elements for second column in R 2.15.1

### 212. solve preserving NULL dimnames (Lines 1952-1961)
- **Function**: `solve()`
- **Check**: `solve(A)` where A has `dimnames=list(NULL,NULL)` should keep NULL dimnames; `solve()` on logical matrix should work
- **Bug**: Failed in R-devel

### 213. rowsum with factor groups and names (Lines 1964-1976)
- **Function**: `rowsum()`
- **Check**: Row/column names should be character; factor groups should work; tested with and without colnames, as data.frame
- **Bug**: One version had factor row names

### 214. lm.wfit with all-zero weights (Lines 1979-1986)
- **Function**: `lm.wfit()`
- **Check**: PR#15044 -- all-zero weights should not segfault
- **Bug**: Segfaulted in R 2.15.1 only

### 215. as.data.frame with nm argument (Lines 1989-1995)
- **Function**: `as.data.frame()`
- **Check**: `as.data.frame(LETTERS[1:10], nm="FirstTenLetters")` should work
- **Bug**: Failed for character in R 2.15.1

### 216. Cstack_info stack direction (Lines 1998-2005)
- **Function**: `Cstack_info()`
- **Check**: Stack usage should decrease with recursion depth (stack grows downward)
- **Note**: Could be defeated by compiler optimization

### 217. options(max.print) integer overflow (Lines 2008-2012)
- **Function**: `options()`
- **Check**: `options(max.print = .Machine$integer.max)` followed by print should not segfault
- **Bug**: Integer overflow segfault

### 218. arima.sim corner cases (Lines 2015-2019)
- **Function**: `arima.sim()`
- **Check**: PR#15068 -- `arima.sim(list(order=c(0,0,0)), n=10)` should have length 10; `n=0` with AR should error
- **Bug**: One too long in R < 2.15.2

### 219. maintainer() (Lines 2022-2025)
- **Function**: `maintainer()`
- **Check**: `maintainer('stats')` should work; non-existing package should not error
- **Bug**: Gave error in R < 2.15.2

### 220. beta() overflow (Lines 2028-2030)
- **Function**: `beta()`
- **Check**: PR#15075 -- `beta(0.01, 171)`, `beta(171, 0.01)`, `beta(1e-200, 1e-200)` should all be finite
- **Bug**: Overflowed to +Inf in R <= 2.15.2

### 221. bquote in function default (Lines 2033-2037)
- **Function**: `bquote()`
- **Check**: PR#15077 -- `eval(bquote(function(y = .(default)) y))` should substitute the default
- **Bug**: Not substituted in R <= 2.15.2

### 222. List subassignment NAMED reference counting (Lines 2040-2059)
- **Function**: `[[<-`, `[<-`
- **Check**: PR#15098 -- modifying `x[[1]]` should not affect `x[[2]]` when they were created from the same source; three separate examples
- **Bug**: Wrong NAMED handling in R 2.4.0 through 2.15.2

### 223. call construction duplication (Lines 2062-2069)
- **Function**: `call()`, `eval()`
- **Check**: PR#15115 -- loop variable `i` in `call("==", a, i)` should be duplicated
- **Bug**: Was 0 in R 2.15.2 because i was not duplicated

### 224. Complex subassignment return value (Lines 2072-2076)
- **Function**: `[[<-`, `$<-`
- **Check**: `b <- (a[[1]] <- a)` should return the original list; same for `$<-`
- **Bug**: Both failed in R 2.15.2

### 225. TukeyHSD with na.exclude (Lines 2079-2088)
- **Function**: `TukeyHSD()`
- **Check**: `TukeyHSD(fit, "tension", ordered=TRUE)` with `na.action=na.exclude` should not give NAs
- **Data**: warpbreaks with one level set to NA
- **Bug**: Results were NA in R <= 2.15.2

### 226. Recursive directory listing (Lines 2091-2097)
- **Function**: `list.files()`
- **Check**: `list.files(p, recursive=TRUE, include.dirs=TRUE)` should include subdirectory names
- **Bug**: Failed for a few days unnoticed in dev version

### 227. sQuote/dQuote on 0-length input (Lines 2100-2103)
- **Function**: `sQuote()`, `dQuote()`
- **Check**: `sQuote(character(0))` should return `character(0)`, not length-1
- **Bug**: Was length one in R 2.15.2

### 228. aperm with character perm and missing dimension (Lines 2105-2112)
- **Function**: `aperm()`
- **Check**: `aperm(a, c("B","A"))` should work; `aperm(a, "A")` (missing one dim) should error not segfault; `aperm(a, c("C","A"))` (wrong name) should error
- **Bug**: Segfaulted in R 2.15.2 and earlier

### 229. enc2utf8 with NA (Lines 2114-2116)
- **Function**: `enc2utf8()`
- **Check**: PR#15201 -- `enc2utf8(NA_character_)` should return `NA_character_`, not `"NA"`
- **Bug**: Gave "NA" string instead of NA

---

## Summary Statistics

- **R versions covered**: R 2.6.0 through R 2.15.2 (all bugs fixed before R 3.0.0)
- **PR (bug report) numbers referenced**: PR#1398, PR#4195, PR#8528, PR#10506, PR#10558, PR#10644, PR#10807, PR#10873, PR#11192, PR#11585, PR#12551, PR#12640, PR#12756, PR#12816, PR#13159, PR#13230, PR#13272, PR#13299, PR#13305, PR#13361, PR#13433, PR#13512, PR#13574, PR#13729, PR#13733, PR#14032, PR#14035, PR#14084, PR#14103, PR#14201, PR#14237, PR#14244, PR#14263, PR#14291, PR#14317, PR#14335, PR#14351, PR#14383, PR#14393, PR#14398, PR#14438, PR#14468, PR#14469, PR#14491, PR#14495, PR#14517, PR#14530, PR#14552, PR#14710, PR#14739, PR#14742, PR#14839, PR#14846, PR#14850, PR#14942, PR#14960, PR#14967, PR#14974, PR#15011, PR#15044, PR#15068, PR#15075, PR#15077, PR#15098, PR#15115, PR#15201
- **Segfault fixes**: ~20 tests specifically prevent segfaults
- **Statistical test functions covered**: `wilcox.test`, `fisher.test`, `shapiro.test`, `ks.test`, `chisq.test`, `mood.test`, `cor.test`, `TukeyHSD`
- **Distribution functions covered**: `qchisq`, `qgeom`, `qt`, `pbinom`, `rbeta`, `rnorm`, `rexp`, `rt`, `beta`, `besselI`, `rWishart`
