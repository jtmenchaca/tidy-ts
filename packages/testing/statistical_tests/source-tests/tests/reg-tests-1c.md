# reg-tests-1c.R -- Comprehensive Test Summary

**File**: `reg-tests-1c.R`
**Description**: Regression tests for R 3.0+ plus later modifications
**Total lines**: 1651
**Total test blocks**: ~130 distinct test blocks (each containing one or more assertions via `stopifnot`, `all.equal`, `tools::assertError`, `tools::assertWarning`, or `try`)

---

## R Functions / Features Tested (with line references)

| Function/Feature | Lines |
|---|---|
| `mapply` | 6-15 |
| `split` | 17-24 |
| `as.POSIXct` / date handling | 27-37, 1330-1354, 1602-1627 |
| `count.fields` / `read.table` / `scan` | 39-49 |
| `is.unsorted` | 52 |
| `str` (large factors) | 54-63 |
| `ftable` | 67-70 |
| `kmeans` | 72-78, 1177-1184 |
| `stem` | 81-83 |
| `lm` / `predict` / `drop1` / `vcov` | 86-92, 256-259, 448-453, 802-810, 893-900, 1141-1148, 1266-1327 |
| `rcond` (complex matrix) | 94-103 |
| `formatC` | 106-110 |
| `integrate` | 113-130 |
| Unary operators (`+`, `-`, `!`) on logical/ts | 133-148, 813-823 |
| `colorRampPalette` | 151-154 |
| `...` argument handling / NAMED | 157-160 |
| Array/matrix attribute copying | 163-168 |
| `lgamma` | 172-174 |
| `subset` (0-row data frame) | 177-180 |
| `dbeta` (extreme parameters) | 183-187 |
| `provideDimnames` / `as.data.frame(table(...))` | 189-193 |
| `aggregate` / `aggregate.data.frame` | 195-207, 316-318 |
| `contour` | 209-213 |
| Zero-length vector handling | 215-224 |
| Parser error handling | 226-229 |
| `unique` (nmax) | 232-234 |
| `besselI` / `sinpi` / `tanpi` / `lgamma` | 237-247, 297-299, 723-732 |
| `c()` with raw vectors | 250-253 |
| `predict.lm` (interval) | 256-259 |
| `deparse` / `assert.reparsable` (complex vectors) | 262-286 |
| Backtick escaping | 289-294 |
| `tanpi` NaN at half-integers | 297-299 |
| Parsing overflowing reals | 302-303 |
| `all.equal` for lists/matrices | 306-313 |
| `merge` with duplicated colnames | 321-328 |
| Recursive structure / segfault | 331-340 |
| `dendrogram` / `as.dendrogram` / `reorder` / `order.dendrogram` | 343-351, 467-491, 500-509, 883-890, 1380-1387, 1638-1644 |
| `hclust` (named method) | 353-355 |
| `save` with envir | 358-361 |
| `type.convert` (hex/numeric boundary) | 364-381 |
| Integer overflow detection | 383-392 |
| `update.formula` (32 variables) | 395-403 |
| Hex literal parsing | 406-409 |
| `numericDeriv` | 412-419 |
| `prettyNum` (zero.print with NA) | 422-427, 1157-1174 |
| `all.equal` with externalptr | 430-435 |
| `as.hexmode` / `as.octmode` | 438-445 |
| `drop1` (intercept-only model) | 448-453 |
| `getAnywhere` | 455-459 |
| `options` (0-length) | 462-464 |
| `merge.dendrogram` | 467-491 |
| `bw.SJ` / `bw.bcv` / `bw.ucv` with NA/Inf | 494-498 |
| `abs` with named args | 512-514 |
| Big exponents (0E4933) | 517-521 |
| `drop.terms` | 524-533 |
| `prompt` / `parse_Rd` (Rd macros) | 536-575 |
| `power.t.test` / `power.prop.test` (large n) | 577-582 |
| `save` (ascii=TRUE, NaN) | 585-590 |
| `glob2rx` (0-length) | 593-595 |
| Pairlist manipulation / `[[<-` | 600-612 |
| `crossprod` / `tcrossprod` conformability | 615-621 |
| `as.environment` / `as.list` | 626-628 |
| `missing()` through `...` | 634-639 |
| `hist` (extreme breaks) | 659-669 |
| `eigen` (asymmetric dimnames) | 672-677 |
| `match.call` with `...` | 680-684 |
| `callGeneric` forwarding dots | 687-695 |
| `::` / `:::` access errors | 698-712 |
| `mode<-` evaluation | 715-720 |
| `besselJ` / `besselY` (large order, half-integer) | 723-732 |
| `BIC` / `AIC` / `nobs` for arima | 735-752 |
| `as.integer` boundary | 756-761 |
| `sort` with object class | 764-767 |
| NA in data frame names | 770-775 |
| `R -e` command line | 778-788 |
| Parsing large float exponents | 792-799 |
| `vcov` on manova | 802-810 |
| Unary/binary logic ops | 813-823 |
| `cummax` / `cummin` with NA | 826-831 |
| `summaryRprof` | 834-842 |
| `options(OutDec=)` | 847-866 |
| `model.frame` ts attributes | 869-873 |
| `matrix` with expression, byrow | 877-880 |
| `labels.dendrogram` / `dendrapply` | 883-890 |
| `poly` / `polym` prediction | 893-900 |
| `read.table` colClasses by name | 903-916 |
| `regexpr` with NA and perl | 919-922 |
| `close(pipe(...))` return value | 925-933 |
| `topenv(baseenv())` | 936-939 |
| `nchar` Unicode zero-width | 942-944 |
| `abbreviate` with names | 947-953 |
| `match` / `%in%` with NA types | 956-969 |
| `within.data.frame` | 973-977 |
| `system` long output lines | 980-991 |
| `tail.matrix` / `head.matrix` | 994-1050 |
| `format.data.frame` / `as.data.frame.list` | 1052-1093 |
| `var` / `sd` / `cov` with factor | 1095-1099 |
| `loess` with weights / predict | 1102-1125 |
| `aperm` named dims | 1128-1138 |
| `poly` / predict with NAs | 1141-1148 |
| `data(package=*)` duplication | 1151-1154 |
| `kmeans` single center | 1177-1184 |
| `array` invalid dimnames | 1187-1189 |
| `addmargins` dimnames | 1192-1199 |
| `dim` subsetting name preservation | 1202-1224 |
| `NextMethod` for `$` / `$<-` | 1227-1238 |
| `as.data.frame` row.names check | 1241-1246 |
| `rbind.data.frame` row names | 1249-1256 |
| `sort` with NA (radix) | 1258-1263 |
| `dummy.coef` (non-trivial terms, manova) | 1266-1327 |
| `format.POSIXlt` (zone, length-2 format) | 1330-1354 |
| `saveRDS` compress options | 1357-1377 |
| Recursive dendrogram reorder | 1380-1387 |
| `cor.test` small p-values | 1390-1399 |
| `smooth` (do.ends) | 1402-1416 |
| `pretty` / `prettyDate` subsecond | 1419-1558 |
| `methods(round)` visibility | 1562-1563 |
| `approxfun` / `ecdf` with NaN/NA | 1566-1570 |
| `tar` default files | 1573-1599 |
| `format.POSIXlt` Jan 1 / timezone | 1602-1627 |
| `tsp<-` removing mts class | 1630-1635 |
| `as.hclust` / `str` deep dendrograms | 1638-1644 |

---

## Detailed Test Catalog

### 1. `mapply` with classed objects (lines 6-15)
- **Function**: `mapply`
- **What**: Tests that `mapply` works on S4 objects with custom `length` and `[[` methods
- **Data**: S4 class "A" wrapping integer vector 101:106, mapped with `rep(1:3, 2)`
- **Assertion**: `stopifnot(z == c(101, 204, 309, 104, 210, 318))`
- **Reference**: Not a bug; reported by H. Pages (R-devel, Nov 2012)

### 2. Recycling in `split()` (lines 17-24)
- **Function**: `split`
- **What**: Checks that `split()` handles classed vectors the same as unclassed
- **Data**: `x <- 1:6`, split by `1:2`, then with `class(x) <- "ABC"`
- **Assertion**: `stopifnot(identical(y, yy))`
- **Bug**: Results differed in R < 3.0.0

### 3. Dates with fractional seconds after 2038 (lines 27-32)
- **Function**: `as.POSIXct`, `format`
- **What**: PR#15200 -- fractional seconds after Unix epoch overflow (2^31)
- **Data**: `2^31 + c(0.4, 0.8)` as origin-based POSIXct
- **Assertion**: `stopifnot(zz[1] == zz[2])` (printed form should round, not truncate)
- **Bug**: Printed form rounded not truncated in R < 3.0.0

### 4. Origin coercion in `as.POSIXct.numeric()` (lines 34-37)
- **Function**: `as.POSIXct`
- **What**: Checks origin is coerced in tz, not GMT
- **Data**: epoch 1262304000, origin "1970-01-01", tz "EST"
- **Assertion**: `stopifnot(identical(x, y))`

### 5. Handling records with quotes in names (lines 39-49)
- **Functions**: `count.fields`, `read.table`, `scan`
- **What**: Parsing text with embedded single quotes
- **Data**: 4 lines with various quote positions
- **Assertions**: `count.fields` returns `c(3L, 3L, NA_integer_, 3L)`; `read.table` and `scan` produce expected output

### 6. Single-element `is.unsorted` (line 52)
- **Function**: `is.unsorted`
- **What**: Length 1 is always sorted (even NA)
- **Assertion**: `stopifnot(!is.unsorted(NA))`

### 7. `str()` performance for large factors (lines 54-63)
- **Function**: `str`
- **What**: Performance regression check -- `str(factor)` should not be >30x slower than `str(character)`
- **Data**: 1e5 random strings converted to factor
- **Assertion**: `stopifnot(t2/t1 < 30)` (was ~600-850 for R <= 3.0.1)
- **Conditional**: Only runs if `_R_CHECK_DO_R_TIMING_` is set

### 8. `ftable` with NULL dimnames (lines 67-70)
- **Function**: `ftable`
- **What**: Formatting a matrix with NULL column dimnames
- **Data**: 3x4 matrix with ROWS dimnames but COLS=NULL
- **Bug**: Failed to format/print in R <= 3.0.1

### 9. `kmeans` infinite loop (lines 72-78)
- **Function**: `kmeans`
- **What**: PR#15364 -- artificial example that caused infinite loop on x86_64
- **Data**: `c(rep(-0.4, 5), rep(-0.4 - 1.11e-16, 14), -.5)`
- **Assertion**: `kmeans(rr, 3)` completes with warning; `kmeans(r., 2)` works after rounding

### 10. `stem` with Inf (lines 81-83)
- **Function**: `stem`
- **What**: PR#15376 -- `stem(c(1, Inf))` hung in R 3.0.1
- **Data**: `c(1, Inf)`

### 11. Very long variable names in `lm` (lines 86-92)
- **Function**: `lm`
- **What**: PR#15377 -- variable names ~500 chars long
- **Data**: 500+ character variable name in `lm(cbind(...) ~ x)`
- **Bug**: Gave spurious error in R 3.0.1

### 12. Singular complex matrix `rcond()` (lines 94-103)
- **Function**: `rcond`
- **What**: PR#15341 -- `rcond()` on singular complex matrix
- **Data**: 5x5 random matrix with last row as average of two others, converted to complex
- **Bug**: Gave error in R 3.0.1; now returns 0

### 13. `formatC` class copying (lines 106-110)
- **Function**: `formatC`
- **What**: PR#15303 -- `formatC` on Date objects should not copy class
- **Data**: Three Date values
- **Assertion**: `stopifnot(!is.object(z), is.null(oldClass(z)))`
- **Bug**: Copied class in R < 3.0.2

### 14. `integrate` accuracy (lines 113-130)
- **Function**: `integrate`
- **What**: PR#15219 -- integration accuracy for singular functions
- **Data**: `(-log(x))^(-1/2)` on [0,1] and `x^(-1/2)*exp(-x)` on [0,Inf], both equal sqrt(pi)
- **Assertions**: 6 checks that `abs(res$value - val) < res$abs.error` at tolerances 1e-4, 1e-6, 1e-8
- **Bug**: Sometimes exceeded reported error in R 2.12.0-3.0.1

### 15. Unary `+` coercion (lines 133-136)
- **Function**: Unary `+`
- **What**: `+x` on logical should coerce to integer
- **Data**: `c(TRUE, FALSE, NA, TRUE)`
- **Assertion**: `stopifnot(is.integer(+x))`
- **Bug**: `+x` was logical in R <= 3.0.1

### 16. Attributes of unary operators on ts (lines 139-148)
- **Functions**: `+`, `-`, `!` on `ts` objects
- **What**: Correct ts attribute preservation for unary operators
- **Data**: Two ts objects (logical and numeric)
- **Assertions**: For logical ts: `!x` is ts, `+x` and `-x` are not. For numeric ts: `!x` is not ts, `+x` and `-x` are ts.
- **Bug**: `+x`, `-x` were ts, `!x` was not in R 3.0.2

### 17. `colorRampPalette` special case (lines 151-154)
- **Function**: `colorRampPalette`
- **What**: Single-color ramp palette generating 4 values
- **Data**: `colorRampPalette(2)(4)`
- **Assertion**: `stopifnot(bb[1] == bb)` -- all values equal
- **Bug**: Invalid in R <= 2.15.0

### 18. NAMED on `...` arguments (lines 157-160)
- **Function**: `...` argument handling
- **What**: Setting NAMED on `...` arguments should not modify the original
- **Data**: `f(1+2)` where `f` modifies local copy
- **Assertion**: `stopifnot(f(1+2) == 3)` (was 7 in R 3.0.1)

### 19. Binary operator attribute copying (lines 163-168)
- **Function**: Array division (`/`)
- **What**: Copying attributes from only one arg of binary operator
- **Data**: 1x1 named array divided by named vector
- **Assertion**: `stopifnot(is.null(names(B)))` -- result should not have names
- **Bug**: Wrong in R-devel Aug 2013

### 20. `lgamma` for very small negative x (lines 172-174)
- **Function**: `lgamma`
- **What**: `lgamma(-X)` for X = 3e-308 should equal `lgamma(X)`
- **Assertion**: `stopifnot(identical(lgamma(-X), lgamma(X)))`
- **Bug**: `lgamma(-X)` was NaN in R <= 3.0.1

### 21. `subset` on empty data frame (lines 177-180)
- **Function**: `subset`
- **What**: PR#15413 -- subsetting empty data frame should keep 0 rows
- **Data**: `data.frame(one = numeric())`
- **Assertion**: `stopifnot(nrow(z) == 0L)`
- **Bug**: Created a row prior to R 3.0.2

### 22. `dbeta` with extreme parameters (lines 183-187)
- **Function**: `dbeta`
- **What**: `dbeta` with very large shape parameter (9.9e307)
- **Data**: Three calls with extreme parameters
- **Bug**: First two hung in R <= 3.0.2

### 23. 0-extent matrix/data frame (lines 189-193)
- **Functions**: `provideDimnames`, `table`, `as.data.frame`
- **What**: PR#15465 -- handling 0-extent matrices
- **Data**: `matrix(nrow=0, ncol=1)`, `table(character())`
- **Bug**: All failed in R 3.0.2

### 24. `aggregate.data.frame` rounding (lines 195-207)
- **Function**: `aggregate.data.frame`
- **What**: PR#15004 -- rounding caused groups to be falsely merged
- **Data**: Data frame with 10 rows, 20+ factor columns (10000 levels each)
- **Assertion**: `stopifnot(nrow(unique(by)) == nrow(agg))`

### 25. `contour` rounding inconsistency (lines 209-213)
- **Function**: `contour`
- **What**: PR#15454 -- contour failed when rounding made crossing tests inconsistent
- **Data**: 10-row matrix with tiny values (~1e-190) alongside normal values

### 26. Zero-length vector handling (lines 215-224)
- **Functions**: `format`, `gl`, `relist`, `summary`
- **What**: PR#15499 and others -- various zero-length vector issues
- **Data**: Empty data frame, `integer()`, `list(numeric(0), 1)`
- **Bug**: All failed in R 3.0.2

### 27. Parser segfault on invalid input (lines 226-229)
- **Function**: `parse`
- **What**: PR#15518 -- parsing `_` should give error, not segfault
- **Data**: `parse(text = "_")`
- **Assertion**: `stopifnot(inherits(ee, "error"))`
- **Bug**: Segfault in R 3.0.2

### 28. `unique` with nonsense nmax (lines 232-234)
- **Function**: `unique`
- **What**: `unique(1:3, nmax = 1)` should not infinite-loop
- **Bug**: Infinite-looped in R 3.0.2

### 29. `besselI` / `sinpi` / `tanpi` / `lgamma` precision (lines 237-247)
- **Functions**: `besselI`, `lgamma`, `sinpi`, `tanpi`
- **What**: Improved precision using `sinpi()` etc internally
- **Data**: `besselI(2.125, -5+1/1024)`, `lgamma(-12+1/1024)`, `sinpi`/`tanpi` at specific points
- **Assertions**: Multiple `all.equal` with tol=8e-16; exact equality for sinpi/tanpi
- **Bug**: rel.error was 1.5e-13 / 7.5e-14 in R <= 3.0.x

### 30. `c()` promoting raw to bad logical (lines 250-253)
- **Function**: `c`
- **What**: PR#15535 -- `c(as.raw(11), TRUE)` created bad logical
- **Assertion**: `stopifnot(c(as.raw(11), TRUE) == TRUE)`
- **Bug**: `as.raw(11)` became logical coded as 11

### 31. `predict.lm` with scale argument (lines 256-259)
- **Function**: `predict.lm`
- **What**: PR#15564 -- prediction with `interval="confidence"` and explicit `scale`
- **Data**: `lm(rnorm(10) ~ I(1:10))`
- **Bug**: Failed with "object 'w' not found" in R <= 3.0.2

### 32. `deparse` reparsable complex vectors (lines 262-286)
- **Function**: `deparse`
- **What**: PR#15534 -- deparse of complex vectors should produce reparsable output
- **Data**: 14 test cases including NA, Inf, NaN in real/imaginary parts
- **Assertions**: Each `assert.reparsable` call verifies `eval(parse(deparse(x))) == x`
- **Bug**: Last 7 cases failed in R <= 3.0.2

### 33. Backtick escaping (lines 289-294)
- **Function**: `deparse`, `as.name`, `parse`
- **What**: PR#15621 -- backticks could not be escaped
- **Assertions**: `deparse(as.name("\`"), backtick=TRUE) == "\`\\`\`"`; assign and retrieve works; `parse("```")` errors

### 34. `tanpi` at half-integers is NaN (lines 297-299)
- **Function**: `tanpi`
- **What**: Documented behavior that `tanpi(0.5)` etc is NaN
- **Assertion**: `stopifnot(is.nan(tanpi(c(0.5, 1.5, -0.5, -1.5))))`

### 35. Parsing overflowing reals (line 302-303)
- **Function**: `as.double`
- **What**: PR#15642 -- `as.double("1e1000")` should not segfault

### 36. `all.equal` for lists (lines 306-313)
- **Function**: `all.equal`
- **What**: Comparing lists to non-lists, and matrices with/without dim
- **Data**: `list()` vs `identity`, `list(1)` vs `identity`, list with dim
- **Assertions**: Correct character messages returned; `all.equal(ml, ml)` works
- **Bug**: Failed in R-devel and R < 3.1.0

### 37. `aggregate` with no grouping variables (lines 316-318)
- **Function**: `aggregate`
- **What**: PR#15699 -- `aggregate(Y ~ 1, ...)` should work
- **Data**: Random data frame with Y and X columns

### 38. `merge` with duplicated column names (lines 321-328)
- **Function**: `merge`
- **What**: PR#15618 variant -- merge with duplicated column names
- **Data**: Two data frames with "Settle" columns (X has Settle.x, Settle.y, Settle)
- **Bug**: Failed in R < 3.1.0; now warns correctly

### 39. Recursive structure depth (lines 331-340)
- **Function**: Recursive list construction
- **What**: PR#15679 -- deeply nested structure should not segfault
- **Data**: `badstructure(20, "children")` -- 20-level deep nested list

### 40. Dendrogram single-leaf operations (lines 343-351)
- **Functions**: `as.dendrogram`, `reorder`, `order.dendrogram`, `is.leaf`
- **What**: PR#15702, PR#15703 -- operations on single-leaf dendrograms
- **Data**: Dendrogram from `hclust(dist(sin(1:7)))`, extract single leaf
- **Assertions**: Leaf inherits "dendrogram", `is.leaf`, `reorder` preserves attributes, `order.dendrogram` works

### 41. `hclust` with named method (lines 353-355)
- **Function**: `hclust`
- **What**: Using named method argument `c(M = "ward")`
- **Bug**: Failed for 2 days in R-devel/R-alpha

### 42. `save` with envir (lines 358-361)
- **Function**: `save`
- **What**: PR#15758 -- `save()` with custom envir
- **Data**: New environment with `one <- 1L`
- **Bug**: Failed in R < 3.1.1

### 43. `type.convert` boundary cases (lines 364-381)
- **Function**: `type.convert`
- **What**: Hex float and large integer conversion with `numerals` argument
- **Data**: "0x1.ffa0000000001p-1" and "1234567890123456789"
- **Assertions**: Multiple checks for correct numeric/factor conversion with "allow.loss", "no.loss", "warn.loss"
- **Bug**: `type.convert(hex)` was not numeric in R 3.1.0

### 44. Integer overflow warnings (lines 383-392)
- **Function**: Integer arithmetic
- **What**: PR#15764 -- integer overflow must warn and give NA
- **Data**: Large integer additions/subtractions near .Machine$integer.max
- **Assertions**: 4 cases each with `assertWarning` + `stopifnot(is.na(ii))`
- **Bug**: First two failed with some clang versions in R < 3.1.1

### 45. `update.formula` with 32 variables (lines 395-403)
- **Function**: `update.formula`
- **What**: PR#15735 -- formulae with exactly 32 variables
- **Data**: Formula with y ~ x0 + x1 + ... + x30
- **Assertions**: `update(., . ~ . - w1)` is identity; `update(., . ~ . - w1 - ... - w30)` is identity

### 46. Hex literal parsing (lines 406-409)
- **Function**: Parsing hex literals
- **What**: PR#15753 -- `0x110p-5L` should be 8.5
- **Assertion**: `stopifnot(.Last.value == 8.5)`
- **Bug**: Was 272 with garbled message in R 3.0.0-3.1.0

### 47. `numericDeriv` variable duplication (lines 412-419)
- **Function**: `numericDeriv`
- **What**: PR#15849 -- failed to duplicate variables before modifying
- **Data**: `x <- 10; y <- 10` vs `x <- y <- 10` (same vs shared binding)
- **Assertion**: `stopifnot(identical(d1, d2))`

### 48. `prettyNum` with NAs and zero.print (lines 422-427)
- **Function**: `prettyNum`
- **What**: `prettyNum(c(0:1, NA), zero.print = .)` should not error
- **Data**: 4 different `zero.print` values
- **Assertions**: Correct substitution for 0, pass-through for 1 and NA

### 49. `all.equal` with externalptr (lines 430-435)
- **Function**: `all.equal`
- **What**: Comparing S4 classes containing external pointers
- **Data**: `getClass("ANY")` compared to itself and `getClass("S4")`
- **Bug**: Both `all.equal()` calls failed in R <= 3.1.1

### 50. `as.hexmode` / `as.octmode` with double (lines 438-445)
- **Functions**: `as.hexmode`, `as.octmode`
- **What**: NA handling and rejection of non-integer doubles
- **Data**: `c(NA, 1)` and `c(1, pi)`
- **Assertions**: NA comparison works; `pi` raises error
- **Bug**: All "wrong" in R <= 3.1.1

### 51. `drop1` on intercept-only models (lines 448-453)
- **Functions**: `drop1`, `drop1.default`
- **What**: PR#15935 -- `drop1` on intercept-only lm/glm
- **Data**: `y <- 1:3; drop1(lm(y ~ 1))`
- **Bug**: Gave error in R < 3.1.2

### 52. `getAnywhere` namespace lookup (lines 455-459)
- **Function**: `getAnywhere`
- **What**: Wrongly dealt with namespace hidden list objects
- **Data**: `deparse(body(pbinom)[[2]])` -> "C_pbinom"
- **Assertion**: `stopifnot(length(gg$objs) == 1)` (was 4 in R <= 3.1.1)

### 53. `options()` with 0-length input (lines 462-464)
- **Function**: `options`
- **What**: PR#15979 -- `options(list())` should equal `options(NULL)`
- **Assertion**: `stopifnot(identical(options(list()), options(NULL)))`
- **Bug**: `options(list())` failed in R <= 3.1.1

### 54. `merge.dendrogram` (lines 467-491)
- **Functions**: `merge.dendrogram`, `as.hclust`, `as.dendrogram`
- **What**: PR#15648 -- merging dendrograms, especially with ties
- **Data**: Two dendrograms (4 and 3 elements); three single-method dendrograms with seeds 1, 5, 42
- **Assertions**: Correct order and labels after merge; round-trip `as.hclust(as.dendrogram(hclust(...)))` matches original
- **Bug**: Wrong in R <= 3.1.1; ties failed differently in R <= 3.2.3

### 55. `bw.SJ` / `bw.bcv` / `bw.ucv` with NA/Inf (lines 494-498)
- **Functions**: `bw.SJ`, `bw.bcv`, `bw.ucv`
- **What**: PR#16024 -- bandwidth selectors segfaulted on NA/Inf
- **Data**: `c(NA,2,3)`, `c(-Inf,2,3)`, `c(1,NaN,3,4)`
- **Bug**: Segfaulted in R 3.0.0 through 3.1.1

### 56. `as.dendrogram` with wrong input (lines 500-509)
- **Function**: `as.dendrogram`
- **What**: Invalid hclust merge matrix should error, not explode memory
- **Data**: Modified `hx$merge` to create invalid structure
- **Assertion**: `tools::assertError(as.dendrogram(hx))`
- **Bug**: 8-member dendrogram and memory explosion in R <= 3.1.2

### 57. `abs` with named args (lines 512-514)
- **Function**: `abs`
- **What**: PR#16047 -- `abs(x=1i)` should work
- **Bug**: Complained argument should be named `z`

### 58. Big exponent parsing (lines 517-521)
- **Function**: Numeric parsing
- **What**: PR#15976 -- `0E4933` and `0x0p100000` should be 0
- **Assertion**: `stopifnot(x == 0, y == 0)`

### 59. `drop.terms` attribute preservation (lines 524-533)
- **Function**: `drop.terms`
- **What**: PR#16029 -- dropped `predvars` and `dataClasses` attributes
- **Data**: `terms(model.frame(Employed ~ Year + poly(GNP,3) + Population, longley))`
- **Assertions**: `predvars` is language, lengths match, names match rownames of factors

### 60. `prompt` percent sign escaping (lines 536-542)
- **Function**: `prompt`
- **What**: `%s` in default arguments was not escaped in .Rd output
- **Data**: `function(fmt = "%s") {}`
- **Assertion**: `tools::parse_Rd(f)` succeeds without syntax errors

### 61. Rd macro parsing (lines 544-575)
- **Function**: `tools::parse_Rd` (Rd macros)
- **What**: Various edge cases in Rd macro argument handling
- **Tests**:
  - Line 545-547: 0-parameter macro with no args
  - Line 549-552: 1-parameter macro with empty arg (failed in 3.5.0 and earlier)
  - Line 554-557: 2-parameter macro with empty first arg (failed in 3.5.0 and earlier)
  - Line 559-561: 2-parameter macro with empty second arg
  - Line 563-566: Multi-line argument (failed in 3.5.0 and earlier)
  - Line 568-571: Comments removed from macro arguments (not in 3.5.0 and earlier)
  - Line 573-575: Comment within macro argument with continuation

### 62. `power.t.test` / `power.prop.test` for large n (lines 577-582)
- **Functions**: `power.t.test`, `power.prop.test`
- **What**: PR#15792 -- failure for very large n
- **Data**: `delta=1e-4, sd=.35, power=.8` and `p1=.5, p2=.501, sig.level=.001, power=0.90`
- **Assertions**: `all.equal(ptt$n, 192297000, tol=1e-5)`, `all.equal(ppt$n, 10451937, tol=1e-7)`
- **Bug**: `uniroot()` call did not allow n > 1e7

### 63. `save` ascii with NaN (lines 585-590)
- **Function**: `save`
- **What**: PR#16137 -- `save(*, ascii=TRUE)` lost NaN distinction
- **Data**: `c(1, NA, NaN)` saved and reloaded
- **Assertion**: `stopifnot(identical(x0, x))` -- NaN preserved
- **Bug**: `x` had NA instead of NaN

### 64. `glob2rx` on empty input (lines 593-595)
- **Function**: `glob2rx`
- **What**: PR#16205 -- `glob2rx(character())` should have length 0
- **Assertion**: `stopifnot(length(glob2rx(character())) == 0L)`
- **Bug**: Was "^$" in R < 3.1.3

### 65. Pairlist `[[<-` to NULL (lines 600-612)
- **Function**: Pairlist subsetting
- **What**: Bugs reported by Radford Neal -- pairlist element deletion and dim-based access
- **Data**: `pairlist(list(1, 2))` with `x[[c(1,2)]] <- NULL`; 2x3 pairlist with dimnames
- **Assertions**: Deletion works; dim-based `[["a","x"]]` access works
- **Bug**: First gave spurious error; second caused segfault

### 66. `crossprod` / `tcrossprod` conformability (lines 615-621)
- **Functions**: `crossprod`, `%*%`, `tcrossprod`
- **What**: Radford Neal report -- non-conformable arguments error was wrong
- **Data**: `matrix(1:2, 1, 2)` with `1:3`; `5 %*% v`
- **Assertions**: 4 identity checks matching manual matrix multiplication
- **Bug**: "non-conformable arguments" error in R <= 3.2.0

### 67. List <-> environment conversion (lines 626-628)
- **Function**: `as.environment`, `as.list`
- **What**: Round-trip conversion of empty list
- **Assertion**: `stopifnot(identical(L0, as.list(as.environment(L0))))`
- **Bug**: `as.environment` didn't work; `as.list` gave non-NULL names in R 3.1.x

### 68. `missing()` through `...` (lines 634-639)
- **Function**: `missing`
- **What**: PR#15707 -- `missing()` did not propagate through `...`
- **Data**: `check2(one, , three)` -- middle argument missing
- **Assertion**: `stopifnot(identical(check2(one, , three), c(FALSE, TRUE, FALSE)))`
- **Bug**: `missing()` unable to handle recursive promises

### 69. `hist` with extreme breaks (lines 659-669)
- **Function**: `hist`
- **What**: PR#15988 -- breaks with too large bins (1000, 1e9, Inf)
- **Data**: `runif(99)` with breaks including `-10`/`-1e9`/`-Inf` to `10`/`1e9`/`Inf`
- **Assertions**: Results match regardless of extreme break values
- **Bug**: Wrong results for k in {2,3,4} in R 3.1.x

### 70. `eigen` with asymmetric dimnames (lines 672-677)
- **Function**: `eigen`
- **What**: PR#16151 -- asymmetric dimnames caused wrong symmetric detection
- **Data**: 4x4 matrix with row dimnames R1-R4, col dimnames C1-C4
- **Assertion**: Eigenvalues equal `c(251, 87, 3, 3)` with tol=1e-14
- **Bug**: Used `symmetric=FALSE` and complex due to asymmetric dimnames

### 71. `match.call` re-matching `...` (lines 680-684)
- **Function**: `match.call`
- **What**: `match.call` with `...` forwarding
- **Data**: `test(1, 3)` through `test -> test2`
- **Assertion**: Result is `quote(test2(x=x, 2, 3))` not `test2(x=x, 2, 2, 3)`
- **Bug**: Wrongly gave `test2(x=x, 2, 2, 3)` in R <= 3.1.2

### 72. `callGeneric` forwarding dots (lines 687-695)
- **Function**: `callGeneric`
- **What**: PR#16141 -- callGeneric not forwarding dots in call
- **Data**: S4 generic `foo` with character and factor methods; `capitalize=TRUE`
- **Assertion**: `stopifnot(identical(toto1(factor("a"), capitalize = TRUE), "A"))`
- **Bug**: Did not capitalize in R <= 3.1.2

### 73. `::` / `:::` access errors (lines 698-712)
- **Functions**: `::`, `:::`
- **What**: Accessing non-existing objects must error; lazy data only via `::`
- **Assertions**: `assertError` for `base::foobar`, `base:::foobar`, `stats:::foobar`, `stats::foobar`; `datasets::swiss` works; `datasets:::swiss` errors; `stats4::show` is not NULL
- **Bug**: `:::` versions gave NULL in certain R-devel versions

### 74. `mode<-` over-evaluation (lines 715-720)
- **Function**: `mode<-`
- **What**: PR#16215 -- `mode(y) <- "list"` should not evaluate the expression
- **Data**: `quote(-2^2)` -- should remain unevaluated
- **Assertion**: `stopifnot(identical(x, y))` where x was manually converted with `as.list`
- **Bug**: `y` ended up containing -4, not `-2^2`

### 75. `besselJ` / `besselY` with too large order (lines 723-726)
- **Functions**: `besselJ`, `besselY`
- **What**: Orders too large for algorithm should give NaN with warning, not segfault
- **Data**: `besselJ(1, 2^64)`, `besselY(1, c(2^(60:70), Inf))`
- **Bug**: Segfaulted in R <= 3.1.2

### 76. `besselJ` / `besselY` with half-integer nu (lines 729-732)
- **Functions**: `besselJ`, `besselY`
- **What**: nu = k + 1/2 for negative k
- **Data**: `besselJ(1, -1750.5)`, `besselY(1, .5 - (1500 + 0:10))`
- **Assertion**: `stopifnot(is.finite(besselY(...)))`
- **Bug**: Gave NaNs and extra warnings in R <= 3.1.x

### 77. `BIC` / `AIC` / `nobs` for arima (lines 735-752)
- **Functions**: `BIC`, `AIC`, `nobs`, `logLik`
- **What**: BIC for arima models, including with NAs
- **Data**: `lh` time series with 4 NAs, fitted with arima(3,0,0), arima(3,1,1), etc.
- **Assertions**: `nobs()` returns correct values (48, 47, 44, 44); manual BIC via generalized AIC matches
- **Bug**: `BIC()` was NA unnecessarily, `nobs()` not available in R < 3.2.0

### 78. `as.integer` boundary (lines 756-761)
- **Function**: `as.integer`
- **What**: Close to and beyond `.Machine$integer.max`
- **Assertions**: `MI + 0.99` -> MI, `-MI - 0.99` -> -MI, `100*MI` as string -> NA
- **Bug**: Positive cases failed in R <= 3.2.0

### 79. `sort` with object class (lines 764-767)
- **Function**: `sort`, `order`
- **What**: `sort()` on numeric vector that `is.object`
- **Data**: `freeny$y`
- **Assertion**: `stopifnot(diff(sort(y)) > 0)` -- sorted in increasing order
- **Bug**: `order()` and `sort()` failed badly around 2015-04-16

### 80. NAs in data frame names (lines 770-775)
- **Function**: `as.data.frame`
- **What**: NA in column names (not row.names) should be preserved
- **Data**: Matrix with dimnames `list(c("r1","r2"), c("V", NA))`
- **Assertions**: Names and row.names preserved
- **Bug**: `as.data.frame()` failed in R-devel briefly

### 81. `R -e` command line (lines 778-788)
- **Function**: System command `R -e`
- **What**: Ensure `R -q --vanilla -e 1:3` works on Unix
- **Conditional**: Unix only, R executable exists and is executable
- **Assertion**: Output contains `"> 1:3"` and `"[1] 1 2 3"`

### 82. Parsing large float exponents (lines 792-799)
- **Function**: `as.numeric`
- **What**: PR#16358 -- parsing extremely large exponents
- **Data**: 1024 random huge exponents like `1e<huge>`
- **Assertions**: `as.numeric(huge) == Inf`, `as.numeric(micro) == 0`
- **Bug**: Both failed in R <= 3.2.0

### 83. `vcov` on manova (lines 802-810)
- **Function**: `vcov`
- **What**: PR#16380 -- `vcov()` failed on `manova()` results
- **Data**: 20 observations of tear/gloss/opacity with rate factor
- **Bug**: `coef.aov()` turned matrix of coefficients into vector

### 84. Unary/binary logic operations (lines 813-823)
- **Functions**: `&`, `|`, `!`
- **What**: PR#16385 -- unary use of `&`/`|` should error; `!` should work on matrices
- **Assertions**: `assertError` for `&(FALSE)` and `|(TRUE)`; `!()` gives specific error message; `!matrix(TRUE)` works
- **Bug**: No errors in R <= 3.2.0; `!matrix()` was wrong briefly in R 3.2.0 patched

### 85. `cummax` / `cummin` with initial NA (lines 826-831)
- **Functions**: `cummin`, `cummax`
- **What**: Initial NA_integer_ should propagate
- **Data**: `c(NA_integer_, 1L)`
- **Assertion**: Both cummin and cummax return `c(NA, NA)`
- **Bug**: Initial NA not propagated in R <= 3.2.0

### 86. `summaryRprof` short profile (lines 834-842)
- **Function**: `summaryRprof`
- **What**: PR#16395 -- failed for very short profile
- **Data**: 3-line memory profiling output written to temp file
- **Bug**: Failed when matrix was downgraded to vector

### 87. `options(OutDec = *)` warnings (lines 847-859)
- **Function**: `options`, `format`
- **What**: OutDec not 1 character should warn
- **Data**: OutDec set to ".", ",", ".1.", ""
- **Assertions**: Format produces expected output; warnings for invalid OutDec values
- **Bug**: No warnings in R <= 3.2.1

### 88. `format` with decimal.mark when OutDec differs (lines 862-866)
- **Function**: `format`
- **What**: PR#16411 -- `format(pi, decimal.mark=".")` when `OutDec=","`
- **Assertion**: Result matches format with default OutDec="."
- **Bug**: Failed in R <= 3.2.1

### 89. `model.frame` preserving ts class (lines 869-873)
- **Function**: `model.frame`
- **What**: PR#16436 -- `model.frame()` removed ts attributes on original data
- **Data**: `EuStockMarkets`
- **Assertion**: `stopifnot(identical(orig, class(EuStockMarkets)))` after model.frame call
- **Bug**: ts class lost in R <= 3.2.1

### 90. `matrix` with expression and byrow (lines 877-880)
- **Function**: `matrix`
- **What**: `matrix(expression, byrow=TRUE)` should work
- **Data**: `as.expression(1:3)` in 3x3 matrix
- **Bug**: Failed in R <= 3.1.2

### 91. `labels.dendrogram` / `dendrapply` (lines 883-890)
- **Functions**: `labels`, `dendrapply`
- **What**: Comment #15 of PR#15215
- **Data**: Dendrogram from 3-point distance matrix
- **Assertions**: `labels(D)` returns `c("C","A","B")`; `dendrapply(D, labels)` returns nested list
- **Bug**: `dendrapply(D, labels)` failed in R-devel briefly

### 92. `poly` / `polym` prediction (lines 893-900)
- **Function**: `predict` with `poly`/`polym`
- **What**: Prediction with `poly(Air.Flow, Water.Temp, degree=3)`
- **Data**: `stackloss` dataset
- **Assertions**: Fitted values match predictions on same data and subset
- **Bug**: Second prediction went off in R <= 3.2.1

### 93. `read.table` colClasses by name (lines 903-916)
- **Function**: `read.table`
- **What**: PR#16478 -- named `colClasses` matching by name not position
- **Data**: Tab-separated "a\tb" / "3.14\tx"
- **Assertions**: 4 different colClasses specifications all produce identical results
- **Bug**: z2 and z4 used positional matching in R < 3.3.0

### 94. `regexpr` with NA and perl (lines 919-922)
- **Function**: `regexpr`
- **What**: PR#16484 -- capture attributes should be NA for NA input
- **Data**: `regexpr("(.)", NA_character_, perl = TRUE)`
- **Assertion**: `capture.start` and `capture.length` are NA
- **Bug**: Random integers in R <= 3.2.2

### 95. `close(pipe(...))` return value (lines 925-933)
- **Function**: `close` on pipe connection
- **What**: PR#14861 -- `close()` should return exit status 0L
- **Conditional**: Unix only
- **Assertion**: `stopifnot(identical(z, 0L))`
- **Bug**: Was NULL in R <= 3.2.2

### 96. `topenv(baseenv())` (lines 936-939)
- **Function**: `topenv`
- **What**: `topenv(baseenv())` should return `baseenv()`
- **Assertion**: `stopifnot(identical(topenv(baseenv()), baseenv()))`
- **Bug**: Accidentally returned `globalenv()` in R 3.2.1-3.2.2

### 97. Unicode zero-width char `nchar` (lines 942-944)
- **Function**: `nchar`
- **What**: `nchar("\u200b", "w")` (zero-width space) should be 0
- **Assertion**: `stopifnot(nchar("\u200b", "w") == 0)`
- **Bug**: Was -1 in R 3.2.2

### 98. `abbreviate` with names (lines 947-953)
- **Function**: `abbreviate`
- **What**: Names should be preserved even at minlength 0
- **Data**: `c("AA", "AB", "AA", "CBA")` with minlength 2, 1, 0
- **Assertion**: `stopifnot(identical(names(y), x))` for all minlengths
- **Bug**: Dropped names for minlength 0 in R <= 3.2.2

### 99. `match` / `%in%` with NA types (lines 956-969)
- **Function**: `match`, `%in%`
- **What**: Various NA types matching against various target types
- **Data**: 12 test cases with `NA`, `NA_integer_`, `NA_real_`, `NaN` against logical/integer/double targets
- **Assertions**: All 12 `isTRUE` checks (NaN never matches NA)
- **Bug**: Cases marked with `#!` gave FALSE around Sep 2015

### 100. `within.data.frame` with `.id` column (lines 973-977)
- **Function**: `within`
- **What**: Column named `.id` should be preserved
- **Data**: `data.frame(.id = 1:3 %% 3 == 2, a = 1:3)`
- **Assertion**: `stopifnot(identical(names(d2), c(".id", "a", "d")))`
- **Bug**: Lost `.id` column in R <= 3.2.2

### 101. `system` long output lines (lines 980-991)
- **Function**: `system`
- **What**: PR#16544 -- truncating and splitting long lines
- **Conditional**: POSIX_2008 platforms (not Solaris)
- **Data**: `echo` of 2222 numbers joined by spaces
- **Assertion**: `stopifnot(identical(rs, cn))` -- full line preserved

### 102. `tail.matrix` / `head.matrix` comprehensive (lines 994-1050)
- **Functions**: `tail`, `head` for matrices
- **What**: Comprehensive test of tail/head on various matrices including 0-row and large
- **Data**: 7 matrices: 0x2, 0x2 named, 2x1, 2x3 named, 9x1 named, 12x1, 100001x1
- **Assertions**: Correct ncol/nrow for all n in -3:3; row names formatted correctly; output matches indexing equivalent
- **Bug**: `tail()` failed for 0-row matrices

### 103. `format.data.frame` / `as.data.frame.list` (lines 1052-1093)
- **Functions**: `format.data.frame`, `as.data.frame.list`, `rbind.data.frame`
- **What**: PR#16580 -- long column names, empty column names, data frame within data frame, AsIs columns
- **Data**: Data frame with 300-char names; data frame with empty data frame column; data frame with AsIs column containing NA
- **Assertions**: Multiple dimension, name, and formatting checks
- **Bug**: Various failures in R <= 3.2.2 and R-devel Nov 2015

### 104. `var` / `sd` / `cov` with factor (lines 1095-1099)
- **Functions**: `var`, `sd`, `cov`
- **What**: PR#16564 -- should error on factor input (not use integer codes)
- **Data**: `gl(2,3)` factor
- **Assertions**: `assertError` for all three
- **Bug**: `var()` "worked" in R <= 3.2.2 using underlying integer codes

### 105. `loess` with weights / predict (lines 1102-1125)
- **Functions**: `loess`, `predict.loess`
- **What**: PR#16587 -- weighted loess predictions wrong for newdata
- **Data**: `cars` dataset with random weights; all combinations of `loess.control` parameters
- **Assertions**: `predict(fit)` equals `predict(fit, newdata=cars)` within 1e-14
- **Bug**: Gave slightly wrong predictions in R <= 3.2.2

### 106. `aperm` named dims (lines 1128-1138)
- **Function**: `aperm`
- **What**: `dim(aperm(...))` should preserve `names(dim(...))`
- **Data**: 4D array (2x3x5x7) with named dimensions
- **Assertions**: `dim` and `dimnames` correctly permuted including names
- **Bug**: `dim(aperm(..))` lost names in R <= 3.2.2

### 107. `poly` / predict with NAs (lines 1141-1148)
- **Functions**: `poly`, `predict` with polynomial
- **What**: PR#16597 -- poly and predict should handle NAs
- **Data**: `lm(y ~ poly(x,3))` with `x=1:7, y=sin(1:7)`; prediction with NAs
- **Assertions**: Prediction with NA in newdata works; `poly(x, degree=2, raw=TRUE)` with NA works
- **Bug**: Both gave error about NA in R <= 3.2.2

### 108. `data(package=*)` duplication (lines 1151-1154)
- **Function**: `data`
- **What**: `data(package="datasets")` should not have duplicated items
- **Assertion**: `if(anyDuplicated(...)) stop(...)`
- **Bug**: Sometimes returned datasets twice in R <= 3.2.2

### 109. `prettyNum` big.mark/decimal.mark combinations (lines 1157-1174)
- **Function**: `prettyNum`
- **What**: All combinations of big.mark (".", ",", "'", "") and decimal.mark (".", ",", ".,", "..")
- **Data**: Three numbers (1005.24, 100.22, 1000000.33) with 48 format combinations
- **Assertions**: Big mark appears correctly at position 2 for large numbers; decimal mark at correct position
- **Bug**: Several cases wrong in R 3.2.2

### 110. `kmeans` with single center (lines 1177-1184)
- **Function**: `kmeans`
- **What**: PR#16623 -- `kmeans(x, centers=matrix)` with 1 center
- **Data**: 100-point bimodal 2D data
- **Assertions**: `all.equal(k1, k2)`, all clusters are 1
- **Bug**: `kmeans(*, centers=.)` failed in R <= 3.2.3

### 111. `array` invalid dimnames (lines 1187-1189)
- **Function**: `array`
- **What**: `array(1, 2:3, dimnames="foo")` should error
- **Assertion**: `tools::assertError(...)`
- **Bug**: Silently disregarded in R <= 3.2.3

### 112. `addmargins` dimnames (lines 1192-1199)
- **Function**: `addmargins`
- **What**: Should add "Sum" to dimnames
- **Data**: 2x2 matrix `rbind(1, 2:3)`
- **Assertions**: Correct dimnames including "Sum" label
- **Bug**: Hidden by array dimnames bug above

### 113. `dim` subsetting preserves `names(dim())` (lines 1202-1224)
- **Function**: Array subsetting `[`
- **What**: `names(dim(.))` should be preserved through subsetting
- **Data**: 1D, 2D, 3D, 4D named-dimension arrays
- **Assertions**: Multiple identity checks on `dim` and `names(dim)` after various subsetting operations
- **Bug**: All subsetting of arrays lost `names(dim(.))` in R < 3.3.0

### 114. `NextMethod` for `$` and `$<-` (lines 1227-1238)
- **Functions**: `$`, `$<-`, `NextMethod`
- **What**: `NextMethod()` dispatch for `$` and `$<-`
- **Data**: Class "foo" list with custom `$.foo` and `$<-.foo`
- **Assertions**: `x$b` returns "foo: 2"; `x$y <- 10` sets attribute
- **Bug**: Both failed prior to R 3.3.0

### 115. `as.data.frame` row.names check (lines 1241-1246)
- **Function**: `as.data.frame`
- **What**: Illegal row.names length should error (was just warning before R 4.3.0)
- **Data**: `as.data.frame(1:3, row.names = letters[1:2])`
- **Assertion**: `tools::assertError(...)`
- **Bug**: Produced corrupted data frame in R <= 3.2.3

### 116. `rbind.data.frame` row names (lines 1249-1256)
- **Function**: `rbind.data.frame`
- **What**: Smart row names construction when combining data frames
- **Data**: Subset data frame rbind with fresh data frame
- **Assertions**: Row names are "3","4","1","2" (not "3","4","31","41"); row.names 1:9 for another case
- **Bug**: Row names were wrong in R <= 3.3.0

### 117. `sort` with NA (various types, radix) (lines 1258-1263)
- **Function**: `sort`
- **What**: `sort` should drop NAs by default, including for method="radix"
- **Data**: `c(NA, 1L)`, `c(NA, "a")`, `c(NA, NA_character_)`, `c(NA, 1)`
- **Assertions**: NAs dropped in all cases

### 118. `dummy.coef` for non-trivial terms (lines 1266-1327)
- **Function**: `dummy.coef`
- **What**: PR#16665 -- `dummy.coef` failed for `cut()`, `I()`, and manova models
- **Data**: `swiss` dataset with `cut(Agriculture, breaks=4)`; simulated data with `I(x^2)`; manova with `rate*additive`
- **Assertions**: Coefficients match between `coef()` and `dummy.coef()`; correct dimensions for manova; `use.na=TRUE` handling
- **Bug**: Failed in R <= 3.3.0 (multiple sub-bugs fixed through R 3.2.3)

### 119. `format.POSIXlt` with modified zone / length-2 format (lines 1330-1354)
- **Function**: `format.POSIXlt`
- **What**: PR#16685 -- wrong-length zone or short x caused segfault; recycling of format vector
- **Data**: POSIXlt with shortened `$zone`; vector of times with 3-element format vector
- **Assertions**: Format matches `format(as.POSIXct(...))`, correct nchar patterns for recycled formats
- **Bug**: Segfault for wrong-length zone; format recycling wrong

### 120. `saveRDS` compress options (lines 1357-1377)
- **Function**: `saveRDS`
- **What**: PR#16653 -- `compress="gzip"` failed; named compress vector failed
- **Data**: `1:11` saved with default, "bzip2", "xz", "gzip", FALSE, TRUE
- **Assertions**: All 6 files round-trip correctly; error message for "Gzip"; default matches "gzip" and TRUE
- **Bug**: `compress="gzip"` failed, `compress=c(a="xz")` failed

### 121. Recursive dendrogram reorder (lines 1380-1387)
- **Function**: `reorder.dendrogram`, `nobs`
- **What**: Deeply nested dendrograms should not hit recursion limit
- **Data**: 1500-element single-linkage dendrogram
- **Assertions**: Reorder completes; specific leaf labels correct
- **Bug**: "evaluation nested too deeply" in R <= 3.2.3

### 122. `cor.test` with extremely small p-values (lines 1390-1399)
- **Function**: `cor.test`
- **What**: PR#16704 -- p-values for `cor.test(a, b)` vs `cor.test(a, -b)` should match
- **Data**: 256 iterations of jittered `1:10`
- **Assertion**: `stopifnot(abs(p1 - p2) < 8e-16 * (p1+p2))`
- **Bug**: Slightly off in R <= 3.2.3

### 123. `smooth` with do.ends (lines 1402-1416)
- **Function**: `smooth`
- **What**: `do.ends=TRUE` was not obeyed for "3RS*" kinds
- **Data**: `c(4,2,2,3,10,5:7,7:6)` with methods "3RSR", "3RSS", "3RS3R"
- **Assertions**: 6 identity checks for do.ends=TRUE and do.ends=FALSE results
- **Bug**: `do.ends=TRUE` not obeyed for R 3.0.0 through 3.2.3

### 124. `pretty` / `prettyDate` subsecond ranges (lines 1419-1558)
- **Functions**: `pretty`, `prettyDate` (internal), `chkPretty` (test helper)
- **What**: Comprehensive testing of `pretty()` for POSIXct/Date with many n values and time steps
- **Data**: `structure(1455056860.75, class=c("POSIXct","POSIXt"))`, various Date and POSIXct values
- **Tests**:
  - Lines 1451-1452: `chkPretty(sTime, n=n)` for n in {1:16, 30:32, 41, 50, 60}
  - Lines 1453-1454: 32 replicates of subsecond-range pretty for n in {1:7, 12}
  - Lines 1456-1468: Date pretty for single date and small ranges
  - Lines 1470-1475: Subsecond POSIXct with timezone
  - Lines 1476-1477: Typical `Sys.time()` value
  - Lines 1479-1518: All 14 time steps x multiple n values; label verification
  - Lines 1520-1541: Error tracking -- ensure deviations from target n are bounded
  - Lines 1543-1557: DST + halfmonth combo (PR#16923), pretty with many n values
- **Bugs**: Failed in R <= 3.2.3; length >= 5 with duplicates; wrong in R 3.2.4

### 125. `methods(round)` visibility (lines 1562-1563)
- **Function**: `methods`
- **What**: `round.Date` and `round.POSIXt` should appear in `methods(round)`
- **Assertion**: `stopifnot(c("round.Date", "round.POSIXt") %in% as.character(methods(round)))`
- **Bug**: `round.POSIXt` suppressed in R <= 3.2.x

### 126. `approxfun` / `ecdf` with NaN/NA (lines 1566-1570)
- **Functions**: `ecdf`, `approxfun` (method="constant")
- **What**: NaN and NA should produce correct results
- **Data**: `ecdf(1:5)` evaluated at `c(NaN, NA, 1:5)`
- **Assertion**: `stopifnot(all.equal(Fn(t), t/5))`
- **Bug**: NaN values gave `(n-1)/n` in R <= 3.2.3

### 127. `tar` default files behavior (lines 1573-1599)
- **Function**: `tar`, `untar`
- **What**: PR#16716 -- `tar()` with default (all) files; `tar()` with specified regular files
- **Data**: Copy of DESCRIPTION file to temp dir
- **Assertions**: tar/untar round-trip preserves files; internal tar warns for non-existent files
- **Bug**: Empty in R < 3.3.0 for default; empty in R <= 4.0.2 for specified files

### 128. `format.POSIXlt` Jan 1 timezone (lines 1602-1627)
- **Function**: `format.POSIXlt`
- **What**: Jan 1 formatting for years 1801-2300 / 1901-2300 with CET timezone
- **Data**: `strptime(paste0(n:m,"/01/01"), "%Y/%m/%d", tz="CET")`
- **Assertions**: Only 1941-1942 should show CEST on Jan 1 (platform-dependent; may show no CEST with newer tzdata)
- **Bug**: R-devel Jan-Mar 2016 and R 3.2.4 gave wrong results

### 129. `tsp<-` removing mts class (lines 1630-1635)
- **Function**: `tsp<-`
- **What**: PR#16769 -- setting `tsp(z) <- NULL` should remove "mts" class
- **Data**: `ts(cbind(1:5, 1:5))`
- **Assertions**: "mts" removed, "matrix" retained
- **Bug**: Kept "mts" in R 3.2.4

### 130. `as.hclust` / `str` for deep dendrograms (lines 1638-1644)
- **Functions**: `as.hclust`, `str`
- **What**: Deeply nested dendrograms should not cause stack overflow
- **Data**: 500-element single-linkage dendrogram
- **Assertions**: `str()` and `as.hclust()` complete without error
- **Bug**: Node stack overflow / "C stack usage" in R <= 3.3.z
