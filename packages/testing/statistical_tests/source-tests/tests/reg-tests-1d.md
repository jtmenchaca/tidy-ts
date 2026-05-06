# reg-tests-1d.R -- Comprehensive Summary

**File:** `reg-tests-1d.R` (5526 lines)
**Scope:** Regression tests for R versions 3.4.0 through ~4.2.x (continued in `reg-tests-1e.R` for R >= 4.3.0)

## Overview

**Total test blocks (stopifnot / assertError / assertWarning / explicit checks):** ~350+

### R Functions Tested (with line references)

| Function / Feature | Lines |
|---|---|
| `body()`, `formals()` replacement | 31-36 |
| `match()` (fast algorithm) | 58-112 |
| `deparse()` (complex, formals, symbols, control) | 115-132, 306-310, 758-770, 987-997, 3758-3770, 5198-5209 |
| `factor()`, `as.factor()`, `droplevels()` | 159-167, 176-186, 228-322, 381-400, 920-951 |
| `table()` / `xtabs()` | 228-322, 474-492, 680-741, 5160-5196 |
| `findInterval()` | 340-345, 495-510 |
| `diff()` (difftime) | 189-203 |
| `sample()` | 206-209 |
| `merge()` | 212-225, 1647-1667 |
| `contour()` | 325-327, 3221-3227 |
| `unique()` / `duplicated()` | 330-336, 1602-1622, 2130-2137, 4636-4750 |
| `strtrim()` | 170-173 |
| `unlist()` | 185-186, 1824-1865 |
| `summary.default()` | 363-368 |
| `quantile()` | 623-633, 790-798, 4068-4083, 4165-4191, 4481-4485 |
| `seq()` / `seq.int()` / `seq.default()` | 636-669, 2271-2300, 4753-4787 |
| `min()` / `max()` | 461-471 |
| `str()` | 757-770, 1893-1902, 2257-2268, 4451-4471, 3995-4002 |
| `rep()` / `rep.int()` | 780-787 |
| `terms()` | 800-806 |
| `by()` | 809-814 |
| `stopifnot()` | 773-777, 858-871, 2603-2628, 3718-3729 |
| `sort()` / `order()` / `sort.int()` / `rank()` | 152-157, 1703-1734, 1774-1778, 2003-2020, 4005-4015 |
| `pmin()` / `pmax()` | 568-619, 4612-4624 |
| `aggregate()` | 884-918, 1531-1550, 5438-5444 |
| `line()` (Tukey resistant) | 895-903 |
| `within()` | 953-967, 5126-5130 |
| `model.matrix()` | 982-987, 2516-2532 |
| `returnValue()` | 1129-1253 |
| `on.exit()` | 1262-1303 |
| `splineDesign()` | 1281-1286 |
| `sys.on.exit()` | 1313-1318 |
| `nclass.FD()` / `nclass.scott()` | 1026-1046 |
| `sigma()` | 1017-1023 |
| `dist()` | 1008-1014 |
| `xtabs()` | 474-492, 680-741 |
| `tapply()` | 744-754 |
| `pretty()` | 1117-1127, 4828-4956 |
| `power.prop.test()` | 1419-1423 |
| `removeSource()` | 1426-1450 |
| `ar()` / `ar.yw()` / `ar.ols()` | 1453-1491, 2446-2452 |
| `sum()` (integer overflow) | 1500-1528 |
| `is.na(NULL)` | 1553-1555 |
| `read.table()` / `scan()` | 1625-1644 |
| `scale()` | 1670-1685 |
| `as.data.frame()` | 1688-1700, 2765-2768, 4440-4448 |
| `head()` / `tail()` | 3276-3466 |
| `confint()` (mlm) | 1913-1940 |
| `cooks.distance()`, `rstandard()`, `rstudent()` | 1942-1956 |
| `kruskal.test()` | 1959-1963 |
| `lm()` (multivariate, offset) | 1904-1972, 5091-5099 |
| `print.data.frame()` | 1975-1993 |
| `hist()` | 1996-2000 |
| `as()` (S4 coercion) | 2029-2059 |
| `nextn()` | 2062-2068 |
| `polym()` | 2071-2076 |
| `sample.int()` | 2079-2082 |
| `lm.influence()` | 2085-2092 |
| `cut()` | 2095-2098 |
| `Rd2HTML()` / `parseRd()` | 2109-2118, 3193-3206 |
| `plot.data.frame()` | 2122-2127 |
| `data.frame` subassignment | 2140-2254, 2217-2254 |
| `seq.default()` (overflow) | 2271-2300 |
| `compiler` (argument mutation) | 2303-2401, 1764-1771 |
| `gamma()` / `lgamma()` | 2408-2415 |
| `sub()` / `gsub()` (encoding) | 2418-2424, 4488-4496, 4499-4610 |
| `formula()` | 2427-2434, 2479-2488, 2639-2659, 4215-4244 |
| `normalizePath()` | 2462-2471 |
| `strtoi()` | 2473-2476 |
| `format()` | 2491-2497, 2974-2990 |
| `writeLines(readLines())` | 2500-2507 |
| `max.col()` | 2510-2512 |
| `axTicks()` | 2535-2544 |
| `isSymmetric()` | 2547-2560 |
| `bxp()` | 2563-2568 |
| `reformulate()` | 2571-2601, 5318-5322 |
| `str2expression()` | 2662-2663 |
| `quasi()` | 2666-2694 |
| `rbind.data.frame()` | 2697-2762, 5447-5465 |
| `vcov()` | 2771-2791 |
| `runmed()` | 2795-2840 |
| `conformMethod()` (S4) | 2843-2909 |
| `apply()` | 2912-2919 |
| `cbind()` data frames | 2922-2927 |
| `adist()` | 2930-2944 |
| `list2env()` | 2946-2951 |
| `paste()` / `paste0()` (recycle0) | 3828-3861 |
| `mantelhaen.test()` | 1751-1761 |
| `wilcox.test()` | 3525-3551 |
| `fisher.test()` | 3514-3522 |
| `acf()` / `pacf()` | 3514-3522 |
| `glm()` | 4038-4046 |
| `c()` (generic dispatch) | 4049-4065 |
| `Vectorize()` | 4086-4090 |
| `as.Date()` | 4093-4098 |
| `..elt()` | 4101-4108 |
| `numToBits()` / `packBits()` | 4111-4162 |
| `capture.output()` | 4127-4155 |
| `isS3stdGeneric()` | 4194-4198 |
| `all.equal()` (factor, function, numeric, selfStart) | 4201-4212, 4331-4437, 4797-4802, 5303-5316 |
| `r2dtable()` / `chisq.test()` | 4018-4035 |
| `rpois()` / `rbinom()` / `rgeom()` / `rhyper()` | 3674-3696 |
| `smoothEnds()` | 3705-3715 |
| `p.adjust()` | 4339-4347 |
| `substr<-()` | 5146-5157 |
| `tanpi()` | 5499-5507 |
| `plot.lm()` | 5510-5520 |
| `match.arg()` | 1735-1741, 5468-5475 |
| `window()` (ts) | 5356-5378 |
| `smooth.spline()` | 5382-5435 |
| `globalCallingHandlers()` | 5325-5347 |
| `par()` | 5350-5353 |
| `mapply()` / `Map()` | 5133-5143 |
| `remove.packages()` | 5212-5216 |
| `optim()` | 1799-1804 |
| `power.t.test()` | 3209-3218 |
| `dnorm()` / `dlnorm()` | 3474-3478 |
| `ts()` / `window()` | 3481-3510 |
| `choose()` | 3661-3665 |
| `round()` / `signif()` | 3554-3634, 3945-3961 |
| `options(warn=)` | 3095-3097 |
| `data()` | 3783-3789 |
| `x[[Inf]]` / `x[[-i]]` | 3792-3824 |
| `suppressWarnings()` / `suppressMessages()` | 3063-3086, 3773-3780 |
| `grepl(NA, ...)` | 3089-3092 |
| `print.data.frame()` (object_size) | 3100-3104 |
| `barplot()` | 3106-3111 |
| `methods()` | 3113-3118 |
| `.traceback()` | 3121-3161, 4247-4254 |
| `get_all_vars()` | 3164-3240 |
| `colors` functions | 3262-3273 |
| `aov()` | 3864-3875 |
| `summary.warnings()` | 3884-3897 |
| `plot.formula()` | 3900-3904 |
| `...names()` | 3907-3917 |
| `parse()` data | 3920-3930, 2455-2459 |
| `x %% Inf` / `x %/% Inf` | 2993-3043 |
| `density()` | 5074-5088 |
| `qqline()` | 5102-5104 |
| `as.character()` (octmode, hexmode) | 5107-5123 |
| `dimnames()` / `table()` | 5160-5196 |
| `aggregate()` (formula) | 5438-5444 |
| `lapply()` index guarding | 5219-5228 |
| `is.vector()` / `as.vector()` | 5230-5253 |
| `x[<fractional>]` behavior | 5276-5300 |

---

## Detailed Test Cases by Section

### Lines 1-30: Setup and Environment Detection

| Lines | Description |
|---|---|
| 1-30 | Helper functions (`tryCid`, `tryCmsg`, `identCO`, `assertErrV`, `getVaW`), system info detection (OS, architecture, long doubles, 64-bit), `options(nwarnings=10000, width=99)` |

### Lines 31-36: `body()` / `formals()` Replacement on NULL

| Lines | What | Details |
|---|---|---|
| 32 | `body(x) <- body(mean)` when `x <- NULL` | Should warn (was silent coercion in R <= 3.2.x) |
| 33 | `formals(x) <- formals(mean)` when `x <- NULL` | Should warn |
| 34 | `body(NULL)` should warn and return NULL | |
| 35 | `formals(NULL)` should warn and return NULL | |

### Lines 58-112: `match()` Fast Algorithm for Length-1 x (PR#16885, PR#16909)

| Lines | What | Details |
|---|---|---|
| 58-73 | `match(x, t)` for length-1 string `x` with encoding differences | Tests "UTF-8", "latin1", "unknown" encodings; uses `%in%` operator |
| 76-106 | `match(x, t)` for complex `x` with different NaN types | Creates 17 complex values with various NA/NaN combinations; verifies `match(z, z)` consistency between vectorized and `sapply` approaches |
| 108-112 | PR#16909 data.frame column matching with latin1/unicode names | `dv[,"var\u00e92"] <- 2` should not create a 3rd column |

### Lines 115-132: `deparse()` for Complex Numbers and Formals

| Lines | What | Details |
|---|---|---|
| 115-127 | `deparse(<complex>, "digits17")` | Verifies compact deparsing and round-trip `deparse <-> parse` equivalence for complex vectors |
| 129-132 | `deparse(formals(fun))` round-trip | `eval(parse(text=deparse(formals(fun))))` must be identical to original |

### Lines 135-148: Environment Length and Closure Identity

| Lines | What | Details |
|---|---|---|
| 136-138 | `length(baseenv()) == length(names(baseenv()))` | Was 0 in R <= 3.3.0 |
| 142-148 | `identical(function(){}, function(){})` with `keep.source=TRUE` | Srcref should not break identity; was FALSE in 2.14.0 <= R <= 3.3.x |

### Lines 152-157: Radix Sorting INT_MAX (PR#16925)

| Lines | What | Details |
|---|---|---|
| 152-157 | `sort(data, decreasing=TRUE, method="radix")` with INT_MAX values | ASAN check failure / segfault fix |

### Lines 159-167: `as.factor(<named integer>)`

| Lines | What | Details |
|---|---|---|
| 159-167 | Names preservation for `as.factor()`, `factor()` on named integer/double | First case lost names in 3.1.0 <= R <= 3.3.0 |

### Lines 170-173: `strtrim(<empty>, *)`

| Lines | What | Details |
|---|---|---|
| 170-173 | `strtrim(character(0), integer(0))` should return `character(0)` | Failed in R <= 3.3.0 |

### Lines 176-186: Factors with Duplicated Levels

| Lines | What | Details |
|---|---|---|
| 176-182 | `print()` should warn for factors with duplicated levels | No warning in R <= 3.3.x |
| 185-186 | `unlist(list(factor(levels="a")))` should preserve "a" level | Returned `integer(0)` in R <= 3.3.0 |

### Lines 189-203: `diff(<difftime>)`

| Lines | What | Details |
|---|---|---|
| 189-203 | `diff()` of difftime preserves units and class through multiple differences | Lost time units in R <= 3.3.0 |

### Lines 206-209: `sample(NA_*)`

| Lines | What | Details |
|---|---|---|
| 206-209 | `sample(xx)` for all NA types and special values | Error in R <= 3.3.1 |

### Lines 212-225: `merge.data.frame` with `order()` Argument Names (PR#17119)

| Lines | What | Details |
|---|---|---|
| 212-225 | `merge()` when column names match `order()`'s formal args (`na.last`, `decreasing`, `method`) | Some were wrong, others errored in R <= 3.3.1 |

### Lines 228-322: `table()` NaN/NA/exclude Handling (PR#16936)

| Lines | What | Details |
|---|---|---|
| 228-243 | `table()` dropping "NaN" level; `exclude` sometimes failing | NaN missing from table; extraneous levels with exclude in R <= 3.3.1 |
| 245-303 | `table(x, exclude=NULL)` / `useNA` with "different" NAs in factors | Extensive tests of `exclude`/`useNA` interaction across NULL, "", NA, NaN |
| 305-322 | `table(x3N, exclude=NaN)` preserving NA; `table(1:2, exclude=1)` | Various exclude/useNA combinations |

### Lines 325-327: `contour()` Argument Checking

| Lines | What | Details |
|---|---|---|
| 325-327 | `contour()` with `labels=numeric()` | Caused segfault in R <= 3.3.1 |

### Lines 330-336: `unique(warnings())`

| Lines | What | Details |
|---|---|---|
| 330-336 | `unique.warnings()` with `wilcox.test()` warnings | `unique()` gave only one warning in R <= 3.3.1 |

### Lines 340-345: `findInterval()` with Zero-Length vec

| Lines | What | Details |
|---|---|---|
| 340-345 | `findInterval(x=8:9, vec=numeric(), ...)` for all `all.inside` combos | Returned -1s for `all.inside=TRUE` in R <= 3.3.1 |

### Lines 348-360: `droplevels(<factor with NA-level>)`

| Lines | What | Details |
|---|---|---|
| 348-360 | `droplevels(addNA(d))` should keep NA level, drop only unused "XX" | R <= 3.3.1 also dropped NA level |

### Lines 363-368: `summary.default()` No Longer Rounds

| Lines | What | Details |
|---|---|---|
| 363-368 | `summary(x)` values should be exact, not rounded | Was almost always wrong in R <= 3.3.x |

### Lines 371-378: NULL in Integer Arithmetic

| Lines | What | Details |
|---|---|---|
| 371-378 | `1L + NULL` should give `integer(0)` not `double()` | Gave `double()` in R <= 3.3.x |

### Lines 381-400: `factor()` with Character `exclude`

| Lines | What | Details |
|---|---|---|
| 381-400 | `factor(c(1:2, NA), exclude="")` vs `exclude=NULL`; `factor(x, exclude=NaN)` coercion | Various fixes for character exclude handling, R <= 3.3.x |

### Lines 402-451: Arithmetic/Logic/Comparison for 0-extent Arrays

| Lines | What | Details |
|---|---|---|
| 402-451 | 0-column matrices with `+`, `*`, `-`, `&`, `|`, `>`, `<=`, etc. mixed with scalars, NULL, vectors | relop returned `logical(0)`, `m + 2:3` returned `numeric(0)` in R <= 3.3.x; also 1x1 array inconsistencies |

### Lines 453-458: `strcapture()`

| Lines | What | Details |
|---|---|---|
| 453-458 | `strcapture()` regex extraction with non-matching lines producing NA | Basic correctness |

### Lines 461-471: `min()`/`max()` with Empty Character First (PR#17160)

| Lines | What | Details |
|---|---|---|
| 461-471 | `min(character(), TFT)`, `max(character(), 3:2, 5:7, 3:0)` | All gave NA in R <= 3.3.0 |

### Lines 474-492: `xtabs(~ exclude)` (PR#17147)

| Lines | What | Details |
|---|---|---|
| 474-492 | `xtabs(~ exclude)` when variable is named "exclude" | Name was special, failed in R <= 3.3.1; also `str(xtabs())` |

### Lines 495-510: `findInterval()` with `left.open=TRUE`

| Lines | What | Details |
|---|---|---|
| 495-510 | `findInterval(c(6,1,1), vec, left.open=TRUE)` with ties and random data | Failed in R <= 3.3.1 |

### Lines 513-517: `grepRaw(*, fixed=TRUE)` (PR#17132)

| Lines | What | Details |
|---|---|---|
| 513-517 | `grepRaw("abcd", "abcd", fixed=TRUE)` and empty result case | Segfaulted in R <= 3.3.2 |

### Lines 520-559: POSIXlt Formatting / `methods("(")`

| Lines | What | Details |
|---|---|---|
| 520-554 | `format()` of invalid POSIXlt objects; recycling in `dlt$sec <- 10000+1:10` | Segfault in R <= 3.3.2 |
| 557-559 | `methods("(")` and `methods("{")` | Failed in R <= 3.3.2 |

### Lines 562-619: removeSource / pmin/pmax of Ordered Factors (PR#17195, PR#17200)

| Lines | What | Details |
|---|---|---|
| 562-567 | `removeSource(f)` for function with for-loop | Attribute check |
| 568-619 | `pmin()`/`pmax()` for ordered factors, 0-length S3 classed, data frames | Broken in R 3.3.2; extensive tests |

### Lines 623-633: `quantile()` Monotonicity (PR#16672)

| Lines | What | Details |
|---|---|---|
| 623-633 | `quantile(x, prob)` should be non-decreasing in `prob` for all 9 types | Not fulfilled in R < 3.4.0 |

### Lines 636-669: `seq.int()` / `seq()` Anomalies

| Lines | What | Details |
|---|---|---|
| 636-669 | `seq.int(to=1, by=1)`, `seq(1+1i, 9+2i, ...)`, Date sequences, integer sequences | Various border cases; missing/double results in R < 3.4.0 |

### Lines 672-678: Hex Constant Parsing Underflow (PR#17199)

| Lines | What | Details |
|---|---|---|
| 672-678 | `as.double("0x1.00000000d0000p-987")` should be > 0 | Underflow to 0 in earlier R |

### Lines 680-741: `xtabs()` with NAs

| Lines | What | Details |
|---|---|---|
| 680-741 | Extensive `xtabs()` tests with `na.action`, `addNA`, sparse matrices | NA treatment partly wrong in R < 3.4.0; new `addNA` option |

### Lines 744-754: `tapply()` with raw/factor Return

| Lines | What | Details |
|---|---|---|
| 744-754 | `tapply(1:3, 1:3, as.raw)` and `tapply()` returning character matrix | Failed in R < 3.4.0; wrong dim in R 3.4.0-1 |

### Lines 757-770: `str(<list of list>, max.level=1)`

| Lines | What | Details |
|---|---|---|
| 757-770 | `str(xx, list.len=7, max.level=1)` for nested list | Wrongly showed "[list output truncated]" in R < 3.4.0 |

### Lines 773-777: `stopifnot(all.equal(.))` Message

| Lines | What | Details |
|---|---|---|
| 773-777 | Message abbreviation for `stopifnot(all.equal(...))` | Wrong for months in R-devel |

### Lines 780-787: `rep()`/`rep.int()` with List `times`

| Lines | What | Details |
|---|---|---|
| 780-787 | `rep(4, list(3))`, `rep.int(4:5, list(2,1))` | Partly failed in R 3.3.2-3 |

### Lines 790-798: `quantile(ordered(.))`

| Lines | What | Details |
|---|---|---|
| 790-798 | Better error message; `quantile(OL, type=1)` and `type=3` work for ordered | Gave "factors are not allowed" in R <= 3.3.x |

### Lines 800-806: `terms()` Ignoring Arg Names (PR#17235)

| Lines | What | Details |
|---|---|---|
| 800-806 | `terms(y ~ f(x, a=z) + f(x, b=z))` should have 2 term labels | Both gave length 1 |

### Lines 809-814: `by.data.frame()` with Different Arg Names

| Lines | What | Details |
|---|---|---|
| 809-814 | `by()` called from wrapper with different parameter names | Failed after r72531 |

### Lines 817-824: `R CMD Sweave` Status

| Lines | What | Details |
|---|---|---|
| 817-824 | Exit status of Sweave should be 0 | Gave status 1 in R 3.4.0 |

### Lines 827-833: `print.noquote()`

| Lines | What | Details |
|---|---|---|
| 827-833 | `print(nq, right=TRUE)` and `print.noquote(<table>)` | Failed for ~6 weeks after r72638 |

### Lines 835-855: Accessing `..1`, `..0`, `..2` with Empty `...`

| Lines | What | Details |
|---|---|---|
| 835-855 | `..1` when `...` empty; `..0` always error; `..2` with < 2 args | Different/no error in R < 3.5.0 |

### Lines 858-871: `stopifnot()` Sequential Evaluation

| Lines | What | Details |
|---|---|---|
| 858-871 | Expressions evaluated sequentially, stopping at first failure | All were evaluated in R <= 3.4.x |

### Lines 874-881: `path.expand()` Non-ASCII (PR#17120)

| Lines | What | Details |
|---|---|---|
| 874-881 | Chinese character in path should not be converted to hex | Windows-specific fix |

### Lines 884-918: `aggregate.data.frame(*, drop=FALSE)` (PR#16918, PR#17283)

| Lines | What | Details |
|---|---|---|
| 884-892 | Near-equal factor levels with `drop=FALSE` | Error in 3.4.0, deprecation warning in 3.3.x |
| 905-918 | Spurious names in aggregate result | `a2$Population` had spurious names in R <= 3.4.x |

### Lines 920-951: `factor()` with Duplicated Labels

| Lines | What | Details |
|---|---|---|
| 920-951 | Merging levels via `factor(x, labels=c("Male","Male","Male","Female"))` | Error before R 3.5.0; also tests NA-level preservation and factor behavior invariants |

### Lines 953-967: `within.list()` with `rm()`

| Lines | What | Details |
|---|---|---|
| 953-967 | `within(L, rm(x,y))` for lists, including NULL entries; `keepAttrs=FALSE` | Failed since Aug 2008 without noticeable effect |

### Lines 970-979: `write.csv()` Disk Full Error (PR#17243)

| Lines | What | Details |
|---|---|---|
| 970-979 | `write.table()` to `/dev/full` should signal error/warning | Silently failed up to 3.4.1 |

### Lines 982-987: `model.matrix()` Empty RHS (PR#14992)

| Lines | What | Details |
|---|---|---|
| 982-987 | `model.matrix(~ 1, mf)` and `model.matrix(~ 0, mf)` should preserve row names | Had `1:nrow()` up to 3.4.x |

### Lines 990-997: Backslash Duplication in Language Objects

| Lines | What | Details |
|---|---|---|
| 990-997 | `deparse(quote(-"\n"))` should give 5 characters | Backslashes duplicated in R 3.4.1 |

### Lines 1000-1005: `length(<pairlist>) <- N`

| Lines | What | Details |
|---|---|---|
| 1000-1005 | Truncating pairlist length | Both `length<-` failed in R <= 3.4.1 |

### Lines 1008-1014: `dist(*, "canberra")`

| Lines | What | Details |
|---|---|---|
| 1008-1014 | Canberra distance with mixed-sign entries | R's definition wrongly assumed same-sign entries |

### Lines 1017-1023: `sigma(<rank-deficient model>)` (PR#17313)

| Lines | What | Details |
|---|---|---|
| 1017-1023 | `sigma(fit)` when last coef is NA | Wrong denominator d.f. in R <= 3.4.1 |

### Lines 1026-1046: `nclass.FD()`/`nclass.scott()` for Extreme Data (PR#17274)

| Lines | What | Details |
|---|---|---|
| 1026-1046 | Near-constant data, extremely large `diff(range(.))` | nclass.FD() "exploded"; nclass.scott() gave 0 in R <= 3.4.1 |

### Lines 1049-1055: methods `rbind` Rownames

| Lines | What | Details |
|---|---|---|
| 1049-1055 | `rbind()` with `deparse.level=0` for S4 class containing matrix | Rownames wrongly NULL in R <= 3.4.1 |

### Lines 1058-1074: `qr.coef()` with LAPACK and Column Names

| Lines | What | Details |
|---|---|---|
| 1058-1074 | `qr.coef(qr(X, LAPACK=TRUE), y)` name preservation; error message consistency | No names in R <= 3.4.1 |

### Lines 1077-1087: Invalid Device Function (PR#15883)

| Lines | What | Details |
|---|---|---|
| 1077-1087 | `options(device = function(...){})` then `plot.new()` / `grid.newpage()` | Segfaults in R <= 3.4.1 |

### Lines 1090-1100: `readRDS(textConnection())`

| Lines | What | Details |
|---|---|---|
| 1090-1100 | Round-trip `saveRDS`/`readRDS` via text connection | Failed in R 3.4.1 only |

### Lines 1103-1114: Ops with 0-Column Data Frames

| Lines | What | Details |
|---|---|---|
| 1103-1114 | `sin(d0)`, `d0 + 1`, `2/d0`, `sqrt(USArrests)`, `d0 & d0` | All but first failed in R < 3.5.0 |

### Lines 1117-1127: `pretty()` for Large n / Large Range

| Lines | What | Details |
|---|---|---|
| 1117-1127 | `pretty(c(-f,f), n=100)` and `n=1000` for `f` up to `8e308` | Overflow in C code; values as low as 17 in R < 3.5.0 |

### Lines 1129-1253: `returnValue()` Fixes (r73111)

| Lines | What | Details |
|---|---|---|
| 1129-1148 | Corner case 1: return default on error | `on.exit(hret <<- returnValue(27))` with `stop()` |
| 1150-1168 | Corner case 2: return default on non-local return | `f(return(2))` scenario |
| 1170-1215 | Corner case 3: return default on restart | `withCallingHandlers`/`withRestarts` with custom error class |
| 1217-1252 | `callCC` and instrumented `callCC` | Non-local exits via continuation |

### Lines 1256-1259: `array(<empty>, *)` NA Behavior

| Lines | What | Details |
|---|---|---|
| 1256-1259 | `array(character(), 1:2)` should have NA not "" | Had "" in R < 3.5.0 |

### Lines 1262-1303: Chaining `on.exit` Handlers / LIFO Order

| Lines | What | Details |
|---|---|---|
| 1262-1278 | `on.exit()` with `return()` chaining, `returnValue()` | |
| 1281-1286 | `splineDesign(*, derivs=4)` | Segfault in R <= 3.4.1 |
| 1289-1303 | `on.exit(expr, add=TRUE, after=FALSE)` for LIFO ordering | New feature |

### Lines 1306-1357: Miscellaneous Symbol/Logic/Indexing

| Lines | What | Details |
|---|---|---|
| 1306-1310 | `deparse(<symbol>)` with backtick | |
| 1313-1318 | `sys.on.exit()` called in correct frame | |
| 1321-1327 | `raw(0) & raw(0)` should give `raw(0)` not `logical(0)` | R 3.4.0-2 |
| 1330-1337 | `x[[quote(b)]]` and `x[[quote(b)]] <- pi` | PR#17314; R <= 3.4.x |
| 1340-1342 | `range(c(NA,TRUE,FALSE), finite=TRUE)` | Gave NAs in R <= 3.4.2 |
| 1345-1367 | `[<-` coercion in 0-length case; NULL subassignment | Various edge cases |

### Lines 1370-1415: `as.character(<list>)` Names / `as.matrix(<data.frame in d.fr.>)`

| Lines | What | Details |
|---|---|---|
| 1370-1381 | `as.character(list(list(one=1)))` should keep names | Gave "1" in all previous versions |
| 1384-1416 | `as.matrix()` for data frames containing data frames and matrices as columns | Failed at least since R 1.9.1 |

### Lines 1419-1423: `power.prop.test()` Impossible Conditions (PR#17345)

| Lines | What | Details |
|---|---|---|
| 1419-1423 | Should warn when `p2 > 1` | Silently gave p2=1.03 in 3.1.3 <= R <= 3.4.3 |

### Lines 1426-1450: `removeSource()` / Source Keeping

| Lines | What | Details |
|---|---|---|
| 1426-1435 | `removeSource(testf)` should not change `foo(x, NULL)` to `foo(x)` | Changed in R <= 3.4.3 |
| 1437-1450 | Source preservation in functions | |

### Lines 1453-1491: `ar.yw()` with Missing Values (PR#17366)

| Lines | What | Details |
|---|---|---|
| 1453-1491 | Univariate and multivariate `ar()` with `na.action=na.pass` | NA in x gave error in R <= 3.4.3 |

### Lines 1494-1528: Integer Overflow in `sum()` (PR#17372)

| Lines | What | Details |
|---|---|---|
| 1494-1528 | `sum(iL, "foo")`, `sum(3.14, iL)`, `sum(c(x,x))` with INT_MAX values | r2 was no error, sum(iL,1+2i) gave NA_real_ in R <= 3.4.x; LONG_INT support |

### Lines 1531-1550: `aggregate.data.frame(*, drop=FALSE)` Wishlist (PR#17280)

| Lines | What | Details |
|---|---|---|
| 1531-1550 | FUN called on empty sets should return NA, not NaN or 0 | In R <= 3.4.x, function was called on empty sets |

### Lines 1553-1555: `is.na(NULL)` Warning (PR#16107)

| Lines | What | Details |
|---|---|---|
| 1553-1555 | `is.na(NULL)` should return `logical(0)` without warning | Gave warning in R <= 3.4.x |

### Lines 1558-1599: Subtle `[[<-` with Nested Lists

| Lines | What | Details |
|---|---|---|
| 1558-1599 | `xx[[c(i,j,k)]] <- val` for deeply nested lists | Several failed for a day in R-devel |

### Lines 1602-1622: `duplicated()`/`unique()` for Data Frames (PR#17369, PR#17381)

| Lines | What | Details |
|---|---|---|
| 1602-1622 | Data frames with near-equal floats, `\r` characters, POSIXct during DST change | Differing results in R <= 3.4.x |

### Lines 1625-1644: `read.table()`/`scan()` with Quotes and Separators

| Lines | What | Details |
|---|---|---|
| 1625-1644 | Opening quote preceded by non-space when `sep` is given; quotes preceded by non-space without sep (PR#15245) | `read.table` failed in 3.4.x |

### Lines 1647-1667: `merge()` Names with `by.y`

| Lines | What | Details |
|---|---|---|
| 1647-1667 | `merge(parents, children, by.x="name", by.y="parent")` should not duplicate column names | Duplicate column "name" with warning in R <= 3.4.x |

### Lines 1670-1685: `scale(*, <non-numeric>)`

| Lines | What | Details |
|---|---|---|
| 1670-1685 | `scale(sparseMatrix, Matrix::colMeans(SM, sparseResult=TRUE))` | Wrong error in R <= 3.4.x |

### Lines 1688-1700: `as.data.frame.matrix()` Duplicated Rownames

| Lines | What | Details |
|---|---|---|
| 1688-1700 | Matrix with duplicated rownames -> data frame should fix them; `make.names=NA` and `make.names=FALSE` | Kept duplicated row names in R 3.4.x |

### Lines 1703-1734: Sorting Preserves Names / Order Arguments

| Lines | What | Details |
|---|---|---|
| 1703-1711 | `sort(v)` preserves names, strips extra attributes | Failed initially in ALTREP |
| 1714-1724 | `order(*, decreasing="TRUE")` and multi-column `order()` with `decreasing=c(T,F)` | Failed in ALTREP / until 3.5.x |
| 1727-1733 | `sort()` with various `decreasing`/`na.last` combinations | |

### Lines 1735-1741: `match.arg()` Evaluation (PR#17401)

| Lines | What | Details |
|---|---|---|
| 1735-1741 | `match.arg(x)` where default `x=y` references local variable | Failed in R <= 3.4.x |

### Lines 1744-1748: `getOption()` with Missing Default

| Lines | What | Details |
|---|---|---|
| 1744-1748 | `getOption(op, def)` when `def` is missing (passed down) | Failed for a few days in R-devel |

### Lines 1751-1761: Mantel-Haenszel Test Large Case (PR#17383)

| Lines | What | Details |
|---|---|---|
| 1751-1761 | `mantelhaen.test()` with 500K observations | Integer overflow and error in R <= 3.4.x |

### Lines 1764-1771: Compiler Inlining Named Logicals

| Lines | What | Details |
|---|---|---|
| 1764-1771 | `cmpfun(function() c("bar"=TRUE))` should preserve names | Failed after isTRUE/isFALSE changes in r74403 |

### Lines 1774-1778: Reverse Sort Stability

| Lines | What | Details |
|---|---|---|
| 1774-1778 | `sort.list(x, decreasing=TRUE)` for `c(1,1,3)` | Incorrect with wrapper optimization |

### Lines 1781-1796: `dump()`/`dput()` with `deparse.max.lines`

| Lines | What | Details |
|---|---|---|
| 1781-1796 | `dput(fn)` and `dump(oNam)` should not be truncated by option | Heavily truncated in R <= 3.4.4 |

### Lines 1799-1804: `optim()` with Trivial Bounds

| Lines | What | Details |
|---|---|---|
| 1799-1804 | `optim(rep(3,5), flb, lower=rep(-Inf,5))` should use "Nelder-Mead" | Warned and switched to "L-BFGS-B" in R <= 3.5.0 |

### Lines 1807-1813: Call Matching Mutation Check

| Lines | What | Details |
|---|---|---|
| 1807-1813 | `.Internal(match.call())` should not mutate input | |

### Lines 1816-1821: `simulate.lm(<glm gaussian, non-default-link>)` (PR#17415)

| Lines | What | Details |
|---|---|---|
| 1816-1821 | Simulated variances should be reasonable | Failed in R <= 3.5.0 (variances ~0.1) |

### Lines 1824-1865: `unlist()` for Nested Empty Lists and Factor Leaves

| Lines | What | Details |
|---|---|---|
| 1824-1840 | `unlist(list(list(list(), list())))` and deeper nesting | Gave errors in R <= 3.3.x |
| 1850-1866 | `unlist()` for lists containing factors | Gave invalid factors |

### Lines 1869-1881: `printCoefmat()`/`print.noquote()` Arg Matching

| Lines | What | Details |
|---|---|---|
| 1869-1876 | `printCoefmat(cm, right=TRUE)` should not error | Matched "right" multiple times |
| 1879-1881 | `print(<noquote>, quote=FALSE)` | Same multiple-match error |

### Lines 1884-1890: `agrep()` with Non-fixed Regex

| Lines | What | Details |
|---|---|---|
| 1884-1890 | `agrep("ABC|xyz", chvec, max.distance=m, fixed=FALSE)` | All three distances empty in R <= 3.5.0 |

### Lines 1893-1902: `str()` of Invalid Multibyte String

| Lines | What | Details |
|---|---|---|
| 1893-1902 | `str(cc)` where `cc` has invalid UTF-8 encoding | strtrim/nchar error in R <= 3.5.0 |

### Lines 1904-1957: Multivariate `lm()` and Related

| Lines | What | Details |
|---|---|---|
| 1904-1910 | `coef(lm(y ~ 0))` for multivariate y should have 5 columns | Had 3 in R <= 3.5.1 |
| 1913-1940 | `confint(<mlm>)` and `confint(*, parm=*)` | Gave empty matrix in R <= 3.5.1 |
| 1942-1957 | `cooks.distance()`, `rstandard()`, `rstudent()` for mlm | Silently wrong in R <= 3.5.1 |

### Lines 1959-1963: `kruskal.test()` Non-numeric g (PR#16719)

| Lines | What | Details |
|---|---|---|
| 1959-1963 | `kruskal.test(mpg ~ type, mtcars)` where `type` is character | Gave "all group levels must be finite" |

### Lines 1966-1972: Multivariate `lm()` with Matrix Offset (PR#17407)

| Lines | What | Details |
|---|---|---|
| 1966-1972 | `lm(cbind(mpg,qsec) ~ 1, offset=cbind(wt,wt*2))` | Error about offset length in R <= 3.5.1 |

### Lines 1975-1993: `print.data.frame()` Performance

| Lines | What | Details |
|---|---|---|
| 1975-1993 | Printing 1M-row data frame with `max.print=500` | Was >12 sec in R <= 3.5.1 (whole df formatted) |

### Lines 1996-2000: `hist()` Integer Overflow

| Lines | What | Details |
|---|---|---|
| 1996-2000 | `hist(seq(1e6, 2e6, by=20))` | NAs from integer overflow in R <= 3.5.1 |

### Lines 2003-2025: sort.int() ALTREP Issues / `match()` POSIXlt (PR#17459)

| Lines | What | Details |
|---|---|---|
| 2003-2020 | `sort.int(integer(0))` segfault; attribute handling; `is.unsorted()` for constant vector | ALTREP-related |
| 2022-2025 | `match(0, as.POSIXlt("2018-01-01"))` | Segfault in R < 3.6.0 |

### Lines 2029-2059: `as(1L, "double")` (PR#17457)

| Lines | What | Details |
|---|---|---|
| 2029-2059 | S4 coercion: `as(1L, "double")` should give 1.0; relationship between "double" and "numeric" classes | |

### Lines 2062-2068: `nextn()` for Large n

| Lines | What | Details |
|---|---|---|
| 2062-2068 | `nextn(214e7)` infinite loop; `nextn(2^32+1)` | Hung or gave NA in R <= 3.5.1 |

### Lines 2071-2082: `polym()` / `sample.int()` Edge Cases

| Lines | What | Details |
|---|---|---|
| 2071-2076 | `predict()` with `polym()` in vector case (PR#17474) | Failed in R <= 3.5.1 |
| 2079-2082 | `sample.int(2.9, 1e6, replace=TRUE)` should only sample 1:2 | Sampled 3 in 3.0.0 <= R <= 3.5.1 |

### Lines 2085-2098: `lm.influence()` / `cut()` Edge Cases

| Lines | What | Details |
|---|---|---|
| 2085-2092 | `lm.influence()` for simple regression through 0 | Error for a few days in R-devel |
| 2095-2098 | `cut(rep(0L, 7), breaks=3)` (PR#16802) | Error "breaks not unique" in R <= 3.5.1 |

### Lines 2101-2118: OutDec / `parseRd()` / `Rd2HTML()`

| Lines | What | Details |
|---|---|---|
| 2101-2106 | `OutDec=","` in deferred string conversions | |
| 2109-2118 | `\Sexpr{}` in Rd files correctly installed | |

### Lines 2122-2137: Plot / `duplicated(<df with 'f'>)` (PR#17485)

| Lines | What | Details |
|---|---|---|
| 2122-2127 | `plot(data.frame(.leap.seconds))` with length-1 condition | Error in R <= 3.5.1 |
| 2130-2137 | `duplicated()` on data frame with column named `f` | Error from `Map()` as `f` is Map's first arg |

### Lines 2140-2254: Data Frame Subassignment Edge Cases (PR#15362, PR#17504)

| Lines | What | Details |
|---|---|---|
| 2140-2163 | `df[<empty>, ] <- v` should be no-op; `df[<empty>, "new"] <- v` creates column | Error in R <= 3.5.1 |
| 2217-2254 | Subassigning multiple new columns with specified row | Subscript out of bounds in R <= 3.5.1 |

### Lines 2257-2268: `str()` with Invalid S4 Objects

| Lines | What | Details |
|---|---|---|
| 2257-2268 | `str()` on S4 object with NULL attributes | Gave error instead of warning in R <= 3.5.x |

### Lines 2271-2300: `seq.default()` Integer Overflow (PR#17497)

| Lines | What | Details |
|---|---|---|
| 2271-2300 | `seq(iM2, length=2L)`, `seq(-t30, t30, length=3L)` with near-INT_MAX values; non-integer `from`/`to` with integer `by` | Overflow errors/NAs in R <= 3.5.x |

### Lines 2303-2401: Compiler Argument Modification Checks

| Lines | What | Details |
|---|---|---|
| 2303-2401 | Extensive tests of `x + (x[] <- 2)`, `log(x, x[] <- 2)`, matrix/array indexing with side-effects, active bindings, default arguments | REFCNT correctness; 25+ individual checks |

### Lines 2408-2415: `gamma()`/`lgamma()` Limit Cases

| Lines | What | Details |
|---|---|---|
| 2408-2415 | `lgamma(0:-10)`, `gamma(-180.5)`, `gamma(c(200,Inf))`, `lgamma(Inf)` | Spurious "value out of range" warning forever |

### Lines 2418-2424: `sub()` Non-ASCII Encoding (PR#17509)

| Lines | What | Details |
|---|---|---|
| 2418-2424 | `sub("a", "\u00e4", x)` should set UTF-8 encoding | Encoding was "unknown" in R <= 3.5.x |

### Lines 2427-2434: `formula(model.frame())`

| Lines | What | Details |
|---|---|---|
| 2427-2434 | `formula(m0)` should return `Y ~ A*B` not `Y ~ A + B` | Gave `Y ~ A + B` in R <= 3.5.x |

### Lines 2437-2452: Matrix List Aliasing / `ar.ols()` (PR#17514, PR#17517)

| Lines | What | Details |
|---|---|---|
| 2437-2443 | `L <- matrix(list(c(0)), 2, 1); L[[2]][1] <- 11` should not modify L[[1]] | Failed in NAMED build |
| 2446-2452 | `ar.ols(lynx)` prediction and `var.pred` type | `var.pred` was 1x1 matrix in R <= 3.5.2 |

### Lines 2455-2476: Parser / `normalizePath()` / `strtoi()`

| Lines | What | Details |
|---|---|---|
| 2455-2459 | Parse data `line1` initialization | Failed in 3.5 and earlier |
| 2462-2471 | `normalizePath(NA_character_)` and `file.access(NA_character_)` | NA treated as error or file named "NA" |
| 2473-2476 | `strtoi("")` should be NA | Platform dependent in R <= 3.5.x |

### Lines 2479-2497: `formula.data.frame()` / `format()` Error Message

| Lines | What | Details |
|---|---|---|
| 2479-2488 | `formula(df)` in nested function should use correct `parent.frame()` | Wrong frame after r75911 |
| 2491-2497 | `format(.Internal(bodyCode(ls)))` error message | Was from `.Internal(...)` call in R <= 3.5.x |

### Lines 2500-2512: `writeLines(readLines())` / `max.col()`

| Lines | What | Details |
|---|---|---|
| 2500-2507 | `writeLines(readLines(tf), tf)` (PR#17528) | Output opened before input was read |
| 2510-2512 | `max.col(matrix(,1,0))` should give NA | Gave 1 in R <= 3.5.x |

### Lines 2516-2532: `model.matrix()` Invalid `contrasts.arg`

| Lines | What | Details |
|---|---|---|
| 2516-2532 | `model.matrix(~tension, contrasts.arg="contr.sum")` should warn | No warnings in R <= 3.5.0 |

### Lines 2535-2544: `axTicks()` Zero Zapping (PR#17534)

| Lines | What | Details |
|---|---|---|
| 2535-2544 | `axTicks(2)` should produce exact 0, not 1.38e-17 | Floating point in R <= 3.5.x |

### Lines 2547-2560: `isSymmetric()` with Dimnames

| Lines | What | Details |
|---|---|---|
| 2547-2560 | 1x1 and 0x0 matrices with non-symmetric dimnames | Gave TRUE wrongly in R 3.4.0 -- 3.5.x |

### Lines 2563-2568: `bxp()` Duplicate Arguments

| Lines | What | Details |
|---|---|---|
| 2563-2568 | `bxp(bx.p, ylab="Y LAB", ylab="two")` should warn | |

### Lines 2571-2601: `reformulate()` (PR#17359)

| Lines | What | Details |
|---|---|---|
| 2571-2601 | `reformulate(c("u","log(x)"), response="log(y)")` should produce call not symbol; environment preservation; deprecation for non-syntactic response | Had symbol in R <= 3.5.1 |

### Lines 2603-2628: `stopifnot()` with `exprObject`

| Lines | What | Details |
|---|---|---|
| 2603-2628 | `stopifnot(exprObject=ee)` where `ee` is expression; empty `exprs` | Various failures in R 3.5.x |

### Lines 2631-2636: `as.matrix.data.frame()` Logical Column (PR#17548)

| Lines | What | Details |
|---|---|---|
| 2631-2636 | Character matrix from data frame with logical column | |

### Lines 2639-2659: `formula(<character>)` Edge Cases

| Lines | What | Details |
|---|---|---|
| 2639-2659 | `formula("3")` error; `formula("ran = ~ 1|G")` deprecation; various unusual formula strings | |

### Lines 2662-2694: `str2expression()` / `quasi()` (PR#17560)

| Lines | What | Details |
|---|---|---|
| 2662-2663 | `str2expression(character())` should give `expression()` | |
| 2666-2694 | `quasi(link="log", variance=list(...))` with custom variance function | Failed "switch(vtemp...)" in R <= 3.6.0 |

### Lines 2697-2762: `rbind.data.frame()` NA Levels (PR#17562)

| Lines | What | Details |
|---|---|---|
| 2697-2743 | `rbind(dfa, dfb)` should preserve NA factor levels; `factor.exclude` argument | Dropped NA in R <= 3.6.0 |
| 2745-2762 | `rbind.data.frame()` with matrix columns | Failed since at least R 2.0.0 |

### Lines 2765-2791: `as.data.frame.array(<1D>)` / `vcov()` (PR#17570, PR#17571)

| Lines | What | Details |
|---|---|---|
| 2765-2768 | `as.data.frame(array(1:2))` should drop "array" class | Still "array" in R <= 3.6.0 |
| 2771-2791 | `vcov(qpoisfit, dispersion=1)` | Wrong in R 3.5.0 -- 3.6.0 |

### Lines 2795-2840: `runmed()` with NA (Turlach Algorithm)

| Lines | What | Details |
|---|---|---|
| 2795-2840 | `runmed(dd1, 21, algorithm="T")` with leading NaNs | Segfault in R 3.6.0; extensive tests of both algorithms with various `na.action` |

### Lines 2843-2909: `conformMethod()` S4 Logic Bug

| Lines | What | Details |
|---|---|---|
| 2843-2909 | Henrik Bengtsson's report: `&&` logic bug in `conformMethod()`; 10 methods for generic with 4 arguments | `coercion to 'logical(1)'` error in R <= 3.6.0 |

### Lines 2912-2919: `apply()` Invalid MARGIN

| Lines | What | Details |
|---|---|---|
| 2912-2919 | `apply(diag(3), 2:3, mean)` should give clear error mentioning MARGIN | Had "missing" in message |

### Lines 2922-2927: `cbind()` Data Frames No Columns (PR#17584)

| Lines | What | Details |
|---|---|---|
| 2922-2927 | `names(cbind(data.frame()))` should be `character()` not NULL | |

### Lines 2930-2944: `adist()` NUL Insertion (PR#17579)

| Lines | What | Details |
|---|---|---|
| 2930-2944 | Trafos attribute counts should match D/I/S occurrences | |

### Lines 2946-2957: `list2env()` / Coercion Error Messages

| Lines | What | Details |
|---|---|---|
| 2946-2951 | `list2env()` preserves value semantics | |
| 2954-2957 | `as.double(quote(foo(1)))` error message should say "language" not "pairlist" | |

### Lines 2960-2971: `ls.str()` with Error Object

| Lines | What | Details |
|---|---|---|
| 2960-2971 | `ls.str()` when environment contains error object with "missing" in message | Was `<missing>` in R <= 3.6.1 |

### Lines 2974-2990: `format()` for Large Numbers / Symbols

| Lines | What | Details |
|---|---|---|
| 2974-2984 | `format(xMAX, scientific=FALSE)` should produce 309-char string | Not obeyed in R < 4.0.0 |
| 2987-2990 | `format(as.symbol(ch))` should work | Error in R <= 3.6.x |

### Lines 2993-3043: `%%` and `%/%` with `Inf` (PR#17611)

| Lines | What | Details |
|---|---|---|
| 2993-3043 | `x %% Inf`, `x %/% Inf`, `(-x) %% L` for various signs and L including Inf | All returned NaN when L==Inf in R <= 3.6.1 |

### Lines 3046-3060: Data Frame Comparison with NULL

| Lines | What | Details |
|---|---|---|
| 3046-3060 | `data.frame(a=numeric(0)) == NULL` etc. | Many failed in R <= 3.6.x |

### Lines 3063-3092: Selective Warning/Message Suppression / `grepl(NA)`

| Lines | What | Details |
|---|---|---|
| 3063-3073 | `suppressWarnings(w("foo"), classes=c("bar","baz"))` | New feature |
| 3076-3086 | `suppressMessages(m("foo"), classes=...)` | New feature |
| 3089-3092 | `grepl(NA_character_, "something")` should give logical NA | Gave integer in R <= 3.6.1 |

### Lines 3095-3118: `options(warn=)` / `print.data.frame()` / `barplot()` / `methods()`

| Lines | What | Details |
|---|---|---|
| 3095-3097 | `options(warn = 1+.Machine$integer.max)` should error | Led to infinite loop in R <= 3.6.1 |
| 3100-3104 | `print.data.frame()` with `object_size` column (PR#17628) | Error in R <= 3.6.1 |
| 3106-3111 | `barplot(1:2, space=c(9,1), horiz=TRUE)` (PR#15522) | Wrong spacing in R <= 3.6.1 |
| 3113-3118 | `methods(class = <length > 1>)` | Many non-helpful warnings |

### Lines 3121-3161: `.traceback()` with `max.lines` (PR#17580)

| Lines | What | Details |
|---|---|---|
| 3121-3161 | `.traceback(max.lines=1)` truncation; `catch.script.errors=TRUE` | Always deparsed in full in R < 4.0.0 |

### Lines 3164-3240: `get_all_vars()` with Matrices/Data Frames (PR#13624, PR#14905)

| Lines | What | Details |
|---|---|---|
| 3164-3190 | `get_all_vars(~ M)` where M is a matrix; various data frame and list combinations | Last cases worked already in R <= 3.6.1 |
| 3230-3240 | `get_all_vars(Y[,1] ~ x)` where Y is a data frame | Wrong in R <= 3.6.1 |

### Lines 3193-3206: Multi-arg Rd Macros (PR#17627, PR#18324)

| Lines | What | Details |
|---|---|---|
| 3193-3206 | `\if{html}{...}`, `\href{...}{...}`, `\ifelse{a}{b}{c}` | Duplicated braces in R < 4.0.0/4.3.0 |

### Lines 3209-3218: `power.t.test()` Very Small n

| Lines | What | Details |
|---|---|---|
| 3209-3218 | `power.t.test(delta=0.6, sd=0.00001, power=0.9)` | Failed when `uniroot()` tried n < 1 |

### Lines 3221-3240: `contour()` / `get_all_vars()` Error Messages

| Lines | What | Details |
|---|---|---|
| 3221-3227 | `contour(volcano, levels=c(20*c(4:6,-Inf,8:10)))` | Had "invalid NA contour values" |

### Lines 3243-3259: Argument List / Matrix as Array

| Lines | What | Details |
|---|---|---|
| 3243-3248 | `attr(attr<-(y, value=1, "A"), "A")` | Failed in R <= 4.0.0 |
| 3250-3259 | `inherits(array(pi, dim=1:N), "array")` for all N; UseMethod dispatch for matrix/array | FALSE for N=2 in R < 4.0.0 |

### Lines 3262-3273: `*.colors()` Alpha (PR#17659)

| Lines | What | Details |
|---|---|---|
| 3262-3273 | Color functions should not append alpha=1 by default | Four functions gave extra "FF" in R <= 3.6.x |

### Lines 3276-3466: Generalized `head()`/`tail()` (PR#17652)

| Lines | What | Details |
|---|---|---|
| 3276-3317 | `head()`/`tail()` on calls, formulas, arrays with class | Various failures for calls |
| 3320-3330 | Ensure code doesn't access unneeded dimensions (pkg TraMineR) | |
| 3332-3400 | `head(a, 1)` for all array dimensions; 4-dim array tests with head/tail and keepnums | Not working for 1d arrays in R <= 3.6.x |
| 3452-3465 | Matrix of "language" (expression type) | |

### Lines 3468-3478: `plot.formula()` / `dnorm()` Border Cases

| Lines | What | Details |
|---|---|---|
| 3468-3471 | `plot(~grp, data=df, subset=x>1)` missing `drop=FALSE` | Failed in R <= 3.6.1 |
| 3474-3478 | `dnorm(0:1, sd=-Inf)` and `dlnorm(Inf,Inf,sd=0)` | Should warn and return NaN; v0Neg was 0 w/o warning |

### Lines 3481-3510: `ts()` / `window()` Unusual Frequency

| Lines | What | Details |
|---|---|---|
| 3481-3510 | `ts(x, start=2.5, frequency=0.2)`; `window()` with fractional frequency; `diff(tt, differences=2)` | Wrong results in R < 4.0.0 |

### Lines 3514-3551: `deparse1()` / `wilcox.test()` with Inf (PR#17671)

| Lines | What | Details |
|---|---|---|
| 3514-3522 | `do.call(acf, list(lynx))` / `do.call(fisher.test, list(t44))` data names | Funny data names in R < 4.0.0 |
| 3525-3551 | `wilcox.test()` with +/-Inf in x or y; paired case with Inf-Inf | Treated Inf non-robustly in R <= 3.6.x |

### Lines 3554-3634: `round()` / `signif()` "To Even" (PR#17668) -- Conditional Block

| Lines | What | Details |
|---|---|---|
| 3554-3634 | (Inside `if(FALSE)` -- pro tem disabled) Extensive round-to-even tests, extreme exponents, negative digits, denormalized numbers | More than half rounded wrong in R <= 3.6.x |

### Lines 3637-3665: `update.formula()` / `terms.formula()` Bug (PR#16326) / `choose()` Edge

| Lines | What | Details |
|---|---|---|
| 3637-3659 | `terms.formula(mkF(n))` for large formula with many "-w" terms | Memory corruption / wrong -1 in R <= 3.6.2 |
| 3661-3665 | `choose(4+eps, 4)` for nearly-integer n | Gave 0 and 4 in R <= 3.6.x |

### Lines 3668-3696: Error Messages / `rpois()`/`rbinom()`/`rgeom()`/`rhyper()` Overflow

| Lines | What | Details |
|---|---|---|
| 3668-3671 | `strptime(100, pi)` error should mention "format" not "x" | |
| 3674-3696 | `rpois(100, 0.99999*2^31)` etc. should return double instead of NA; `rhyper()` large args (PR#17694) | Many NAs in 3.0.0 <= R <= 3.6.x |

### Lines 3699-3715: `assertCondition()` / `smoothEnds()` (PR#17693)

| Lines | What | Details |
|---|---|---|
| 3699-3702 | `tools::assertError()` should not contain error object twice | |
| 3705-3715 | `smoothEnds(<integer>)` should return integer | Were double in R <= 3.6.x |

### Lines 3718-3729: `stopifnot()` Custom Named Messages

| Lines | What | Details |
|---|---|---|
| 3718-3729 | `stopifnot("must be kidding!" = 1==0)` custom messages; wrapping stopifnot | |

### Lines 3732-3743: `norm(<matrix-w-NA>)`

| Lines | What | Details |
|---|---|---|
| 3732-3734 | `norm(diag(c(1,NA)), "2")` should give NA | Error from svd() in R <= 3.6.x |
| 3738-3743 | `norm(m, "F")` with NA | "F" gave non-NA with some LAPACK |

### Lines 3745-3755: `dimnames(<matrix>)[[.]] <- v` (PR#17719)

| Lines | What | Details |
|---|---|---|
| 3745-3755 | Setting dimnames of 1x1 matrix; `NULL[["a"]] <- 1` returning list | Error in R <= 3.6.x; latter gave `c(a=1)` |

### Lines 3758-3770: `deparse()` "all"/"exact" Control

| Lines | What | Details |
|---|---|---|
| 3758-3770 | `deparse(x, control="all")` should include "digits17"; new "exact" and "hexNumeric" | "all" gave "1" in R <= 3.6.z |

### Lines 3773-3789: `suppressWarnings`/`Messages` Missing Restarts / `data()` (PR#17730)

| Lines | What | Details |
|---|---|---|
| 3773-3780 | `suppressWarnings(stop(cnd))` with missing restart | |
| 3783-3789 | `data(package="base")` should have 0 results | Gave all datasets data and warned in R <= 3.6.3 |

### Lines 3792-3824: `x[[Inf]]` / `x[[-i]]` (PR#17756)

| Lines | What | Details |
|---|---|---|
| 3792-3824 | `x[[Inf]]` should return NULL for lists; `x[[-Inf]]` error message; `x[[-1]]`, `x[[-2]]`, `x[[-3]]` | Inconsistent messages in R <= 3.6.3 |

### Lines 3828-3861: `paste(*, recycle0=TRUE)`

| Lines | What | Details |
|---|---|---|
| 3828-3861 | Extensive tests of zero-length recycling with `recycle0=TRUE` for `paste()` and `paste0()` | New feature; 0-length recycling with default FALSE was always "unusual" |

### Lines 3864-3875: `aov()` Formula Deparsing

| Lines | What | Details |
|---|---|---|
| 3864-3875 | `aov()` with 20 long variable names in `cbind()` response | Failed due to deparse line wrapping in R <= 4.0.0 |

### Lines 3878-3897: UTF-8 Validity / `summary.warnings()`

| Lines | What | Details |
|---|---|---|
| 3878-3882 | `validUTF8("\xed\xa0\x80")` must be FALSE (surrogate pair) | |
| 3884-3897 | `summary(warnings())` count ordering | Mis-sorted counts in R <= 4.0.0 |

### Lines 3900-3917: `plot.formula()` ylab / `...names()`

| Lines | What | Details |
|---|---|---|
| 3900-3904 | `plot(w~x, ylab=quote(y[j]))` (PR#10525 continuation) | ylab did not work in R <= 4.0.0 |
| 3907-3917 | `...names()` function | Wrong for a few days |

### Lines 3920-3941: Parse Data / Partial Matching Aliasing

| Lines | What | Details |
|---|---|---|
| 3920-3930 | Raw string `r"-(hello)-"` and `0x2L` parse data | Wrong in R 4.0.0 |
| 3933-3941 | `v$mi[[1]] <- 2` should not modify `v$misc` (PR#18349) | Missing defensive reference counts in R 4.0.0 |

### Lines 3945-3961: `round()`/`signif()` Argument Matching

| Lines | What | Details |
|---|---|---|
| 3945-3961 | `round(digits=99.23456)` and `round(banana=99.23456)` should error | Did not error in R <= 4.0.0 |

### Lines 3964-3983: `source(*, echo=TRUE)` / `on.exit()` Argument Matching (PR#17769, PR#17815)

| Lines | What | Details |
|---|---|---|
| 3964-3968 | `source(exprs=exP, echo=TRUE)` with empty lines | Failed in R <= 4.0.1 |
| 3971-3975 | `boxplot()` with call in labels | Failed in R <= 4.0.1 |
| 3978-3983 | `on.exit(add=FALSE, expr=cat('bar\n'))` | Invalid 'add' argument error in R <= 4.0.1 |

### Lines 3986-4002: Encoding / S4 `str()`

| Lines | What | Details |
|---|---|---|
| 3986-3992 | `duplicated()` with mixed latin1/utf8 encodings (PR#17809) | Failed in R <= 4.0.1 |
| 3995-4002 | `str(<S4 w/ extra attributes>)` | "CA" not shown in R <= 4.0.2 |

### Lines 4005-4015: `sort()`/`order()`/`rank()` for Raw Objects

| Lines | What | Details |
|---|---|---|
| 4005-4015 | Sorting raw objects with S3 class "int8" | Failed in R <= 4.0.2 |

### Lines 4018-4046: `r2dtable()`/`chisq.test()` Large Numbers (PR#16814) / `glm()` Null Deviance (PR#16877)

| Lines | What | Details |
|---|---|---|
| 4018-4035 | `r2dtable(1000, c(63194, 4787074), c(34677, 4815591))` | Completely wrong in R <= 4.0.2 |
| 4038-4046 | `glm()` internal refitting for null deviance with offset and non-identity link | Missing starting values in R < 4.1.0 |

### Lines 4049-4065: `c()` Generic NULL Handling

| Lines | What | Details |
|---|---|---|
| 4049-4065 | `c(foobar, NULL, one=1, NULL)` dispatch with custom `c.foobar` | First three cases failed in R <= 4.0.x |

### Lines 4068-4098: `quantile()` Edge Cases (PR#17891, PR#17892) / `as.Date("")` (PR#17909)

| Lines | What | Details |
|---|---|---|
| 4068-4070 | `quantile(0:1, 1+1e-14)` slightly outside [0,1] | Failed in R <= 4.0.2 |
| 4073-4083 | `quantile(x, probs=c(...,NA), names=FALSE)` | Error in R <= 4.0.2 |
| 4086-4090 | `Vectorize()` environment cleanup | Had 7 objects instead of 4 in R <= 4.0.2 |
| 4093-4098 | `as.Date("")` when at position [1] | Not treated correctly in R <= 4.0.2 |

### Lines 4101-4162: `..elt()` / `numToBits()` / `packBits()` (PR#17905, PR#17913, PR#17914)

| Lines | What | Details |
|---|---|---|
| 4101-4108 | `..elt(1)` visibility propagation | |
| 4111-4117 | `numToBits()` should not modify input | Was destructive for a month in R-devel |
| 4120-4124 | `.Internal(inspect())` with long integer vectors | Error in R <= 4.0.2 |
| 4127-4155 | `capture.output()` SE evaluation; `parent.frame()` correctness | Failed with NSE |
| 4158-4162 | `packBits(b, "double")` inverse of `numToBits()` | |

### Lines 4165-4212: `quantile()` with NAs (PR#17899) / `isS3stdGeneric()` / `all.equal.factor()` (PR#17897)

| Lines | What | Details |
|---|---|---|
| 4165-4191 | `quantile(x, probs=c(prb, NA), type=typ)` preserving class for ordered, Date, POSIXct | Lost class in R <= 4.0.2 |
| 4194-4198 | `isS3stdGeneric(print)` when traced | Was FALSE in R <= 4.0.2 |
| 4201-4212 | `all.equal()` for factors with two different NA representations | Gave TRUE wrongly from 2012 to R <= 4.0.2 |

### Lines 4215-4254: `[.formula` with NULL (PR#17935) / `.traceback()` Regression (PR#17930)

| Lines | What | Details |
|---|---|---|
| 4215-4244 | `(~ NULL)[1]`, `(z ~ NULL)[2]`, zero-length formulas | Subsetting failed in R <= 4.0.3 |
| 4247-4254 | `.traceback(1)` should have srcref attribute | Worked until R 3.6.3 but not 4.0.0-4.0.3 |

### Lines 4257-4287: Summary/Math Data Frame Methods / `unlist(<pairlist>)` (PR#17950)

| Lines | What | Details |
|---|---|---|
| 4257-4272 | `sum(aF)` for 0-row data frame; `exp(data.frame(L=TRUE))` | Probably never worked in R <= 4.0.3 |
| 4275-4287 | `unlist(as.pairlist(l.ex), recursive=FALSE)` | Lost content in R <= 4.0.3 |

### Lines 4290-4448: Reference Counting / `bquote` Splice / Task Callbacks / `all.equal` for Functions / `p.adjust` / S4 / DOTSXP

| Lines | What | Details |
|---|---|---|
| 4290-4293 | `class<-` mutation outside assignment context | |
| 4296-4310 | `bquote(splice=TRUE)` with attributed expressions | |
| 4313-4328 | Task callbacks: reference counting, `quote(foo)` evaluation | |
| 4331-4336 | `all.equal(<functions>)` should check environment | Gave TRUE in R <= 4.0.x |
| 4339-4347 | `p.adjust(<empty>, n=0)` (PR#18002) | Errored in R <= 4.0.3 |
| 4350-4353 | `show(<standardGeneric>)` with `.GlobalEnv` package | |
| 4356-4437 | `all.equal.function()` with `...` in env (PR#18010); DOTSXP objects; `identical()` for DOTSXP (PR#18032) | Various failures; extensive `...maker()` tests |
| 4440-4448 | `as.data.frame.list()` with `row.names=NULL` (PR#18034) | |

### Lines 4451-4485: `str()` Unusual Length / `checkRdaFiles()` / `quantile()` Names

| Lines | What | Details |
|---|---|---|
| 4451-4471 | `str(L)` where L has custom `length()` returning 4 but `unclass()` has 6 | Failed in R <= 4.0.x |
| 4474-4478 | `checkRdaFiles(<2 files>)$version` (PR#18041) | Gave "3 3" in R <= 4.0.3 |
| 4481-4485 | `names(quantile(lynx, ...))` consistency across digits settings | 3 different results in R <= 4.0.x |

### Lines 4488-4610: `sub()`/`gsub()` with NA Pattern (PR#18079) / Regex with Factors (PR#18063)

| Lines | What | Details |
|---|---|---|
| 4488-4496 | `gsub(NA, "_", x)` should keep attributes | Lost attributes in R <= 4.0 |
| 4499-4610 | Comprehensive `check_regexetc()` function testing `grep`, `grepl`, `regexpr`, `gregexpr`, `regexec`, `sub`, `gsub` on factors vs character, with/without NA, with different pattern types | Several broken by svn c80082/80136/80141 |

### Lines 4612-4632: `difftime` Objects `pmin()` / Encoding

| Lines | What | Details |
|---|---|---|
| 4612-4624 | `pmin(x_hr, y_mi)` when units differ; `rep()`, `[<-` for difftime (PR#18066) | Objects became wrong without warning in R <= 4.0.x |
| 4627-4632 | Bytes encoding unset to unknown | Impossible in R <= 4.0.x |

### Lines 4636-4750: Sorted ALTREP `unique`/`duplicated` Correctness (PR#17993)

| Lines | What | Details |
|---|---|---|
| 4636-4750 | Extensive tests: integer and real ALTREP sorted vectors; NA/NaN/Inf around 512-buffer boundary; length 0 and 1; S3 method precedence over ALTREP | ~30 test invocations with helper functions |

### Lines 4753-4787: `seq()` for Very Large From/To

| Lines | What | Details |
|---|---|---|
| 4753-4787 | `seq(-1.5e308, 1e308, by=1e307)` and `length.out` variants; `seq.int` vs `seq.default` equivalence | Error in R <= 4.1.0 |

### Lines 4790-4802: `.axisPars()` / `all.equal()` Near Overflow

| Lines | What | Details |
|---|---|---|
| 4790-4794 | `.axisPars((1:2)*777, log=TRUE)` should not warn | Warning in R <= 4.1.0 |
| 4797-4802 | `all.equal(f*x, f*y)` for f = 1e301+ | Failed for large f in R <= 4.1.0 |

### Lines 4805-4824: Primitive Reference Counts / `.Last.value` / `match()` (PR#18126)

| Lines | What | Details |
|---|---|---|
| 4805-4815 | `sum(x)`, `range(x)`, `round(x)`, `all(x)` should not increment refcnt | Counts were 6 and 2 in R <= 4.1.0 |
| 4818-4821 | `.Last.value` needs at least one reference | |
| 4823-4824 | `match(c("NA", "\u{e0}"), NA)` should give NA | Converted NA_character_ to "NA" |

### Lines 4828-4956: `pretty()` for Extreme Ranges (Very Large and Very Small)

| Lines | What | Details |
|---|---|---|
| 4828-4893 | `pretty(c(-B,B))` where `diff(range)` is Inf; systematic tests with various n, `.pretty(*, bounds=FALSE)` | Was `0 Inf Inf...` in R <= 4.1.0; extensive checks |
| 4896-4956 | Very small ranges near `double.xmin * double.eps`; `pretty()` was very slow producing huge vectors in R <= 4.5.1 | Multiple `h.u.bias` and `eps.correct` values tested |

### Lines 4959-5061: Graphics Axis/Pretty for Extreme Ranges

| Lines | What | Details |
|---|---|---|
| 4959-5061 | `plot()`, `axis()`, `axTicks()`, `axisTicks()` when `diff(range)` is Inf; log-scale axes; `GEPretty()` / `GScale()` | Infinite axis extents, wrong labels, errors in R <= 4.1.0-4.1.x |

### Lines 5064-5104: Vignette Product / `density()` with NA Weights (PR#18154, PR#18151) / `residuals(<lm-with-AsIs>)` / `qqline()`

| Lines | What | Details |
|---|---|---|
| 5064-5071 | Vignette product error message with file sizes | "(NA bytes)" in R <= 4.1.0 |
| 5074-5088 | `density(x, weights=w, na.rm=TRUE)` with NA in x | Error in R <= 4.1.0 |
| 5091-5099 | `residuals(<lm-with-AsIs>)` class should be "numeric" not "AsIs" | `plot.lm(which=2)` failed in R <= 4.1.1 |
| 5102-5104 | `qqline(I(1:12))` (PR#18190) | $ operator error |

### Lines 5107-5130: `as.character()` for Octmode/Hexmode / `within.list()` Fix

| Lines | What | Details |
|---|---|---|
| 5107-5123 | `as.character(as.hexmode(i))` should drop dim; law `as.<vector>(x)[j] === as.<vector>(x[j])` | Previously used `format()` |
| 5126-5130 | `within(list(1), let <- "abc")` | Failed for ~40 hours in R-devel |

### Lines 5133-5157: `mapply()` Zero-Length / `substr<-()` Attributes

| Lines | What | Details |
|---|---|---|
| 5133-5143 | `mapply(paste, character(), letters)` should return named empty list | Errored in R <= 4.1.x |
| 5146-5157 | `substring(Ch, 2) <- ...` should preserve attributes; negative `stop` values | Lost all attributes in R <= 4.1.x |

### Lines 5160-5196: `dimnames(table(.))` / `table(<data frame>)` (PR#18224)

| Lines | What | Details |
|---|---|---|
| 5160-5172 | `dimnames(table(warpbreaks[3]))` should have names; 1-column data frame | dnn had no names in R <= 4.1.x |
| 5174-5196 | `table(<d.fr.>, <d.fr.>)` should error; `table()` with POSIXlt | |

### Lines 5198-5209: `deparse()` Parenthesization (PR#18232)

| Lines | What | Details |
|---|---|---|
| 5198-5209 | `5 * if(TRUE) 2 else 3/4` vs `5 * (if(TRUE) 2 else 3)/4` | Missing parens in deparse in R <= 4.1.x |

### Lines 5212-5228: `remove.packages()` Base Pkg (PR#18227) / `lapply()` Index Guarding

| Lines | What | Details |
|---|---|---|
| 5212-5216 | `remove.packages("stats")` should error, not remove | |
| 5219-5228 | `parent.frame()$i` mutation in `lapply()` | |

### Lines 5230-5253: `is.vector(as.vector(.))` for Lists/Expressions

| Lines | What | Details |
|---|---|---|
| 5230-5253 | `as.vector()` should strip extra attributes; `as.vector.data.frame()` | `is.vector()` gave FALSE due to kept attributes |

### Lines 5256-5300: Array Indexing with Character Matrix (PR#18244) / Fractional Subscripts (PR#17977)

| Lines | What | Details |
|---|---|---|
| 5256-5273 | `m[cbind(letters, letters)]` where m has no dimnames | Random results in R <= 4.1.2 |
| 5276-5300 | `x[-3.5]`, `x[-0.5]`, `x[[0.5]]` should behave as `x[as.integer(.)]`; `check.bounds=TRUE` warning | Wrong warning in R <= 4.1.x |

### Lines 5303-5322: `all.equal.numeric(*, scale=)` / `all.equal(<selfStart>)` / `reformulate()` Error

| Lines | What | Details |
|---|---|---|
| 5303-5310 | `all.equal(c(1,1), c(1.01,1.01), scale=c(.01,.01))` (PR#18272) | Error or length 2 answer |
| 5313-5315 | `all.equal(SSfol, SSfol)` should not warn | Deprecated function warning |
| 5318-5322 | `reformulate(paste0("x",1:8), response=c("y","z"))` error message (PR#18281) | Bad error message |

### Lines 5325-5353: `globalCallingHandlers()` / `par()` Warnings (PR#18257, PR#18246)

| Lines | What | Details |
|---|---|---|
| 5325-5347 | `globalCallingHandlers(NULL)` inside `withCallingHandlers()` | Handlers erroneously removed in R <= 4.1.x |
| 5350-5353 | `par(usr)` and `par(las=1, list(cex=2))` should warn | Silently did nothing |

### Lines 5356-5385: `window()` Fuzz (PR#17527, PR#18291) / `smooth.spline()` Print

| Lines | What | Details |
|---|---|---|
| 5356-5378 | `window(x2, start=c(2,8))` should not error "'start' cannot be after 'end'" | Error in R <= 4.1.2 |
| 5382-5385 | `print(smooth.spline())` from wrapper function | Error in R <= 4.1.2 |

### Lines 5388-5435: `smooth.spline()` CV Criterion Sorting (PR#18294)

| Lines | What | Details |
|---|---|---|
| 5388-5435 | `smooth.spline(x[i], y[i])$cv.crit` should not depend on sort order; with/without weights; CV and GCV; near-duplicate x values | `cv.crit` differed by factor ~3000 in R <= 4.1.2 |

### Lines 5438-5475: `aggregate()` Formula in `lapply()` (PR#18299) / `rbind.data.frame()` Warning / `match.arg()` (PR#17959)

| Lines | What | Details |
|---|---|---|
| 5438-5444 | `lapply(list(mtcars), aggregate, x=mpg~cyl, mean)` and pipe syntax | Failed in R <= 4.1.2 |
| 5447-5465 | `rbind(df, c(3,4,5))` should warn about incomplete recycling | Did not warn in R <= 4.1.x |
| 5468-5475 | `match.arg("", c("","a"))` error message | Message showed `""` confusingly |

### Lines 5478-5496: Sweave Clean (PR#18242) / `as.list(<named_factor>)` (PR#18309)

| Lines | What | Details |
|---|---|---|
| 5478-5486 | `R CMD Sweave --clean` should only remove newly created files | Pre-existing directory removed in R <= 4.1.x |
| 5489-5496 | `as.list(f)` where f is named factor | Component names were on individual factors in R <= 4.1.x |

### Lines 5499-5520: `tanpi()` / `plot.lm(which=5)` (PR#17840)

| Lines | What | Details |
|---|---|---|
| 5499-5507 | `tanpi(k/4)` for integer k should be exact +/-1 at quarter-integers | Off by 2^-53 in R <= 4.1.x |
| 5510-5520 | `plot(lm(y~a+b+c, dd), which=5)` with character predictors and constant leverage | Non-conformable arguments error in R <= 4.1.x |

### Lines 5522-5526: File End

| Lines | What | Details |
|---|---|---|
| 5522 | Note: continued in `reg-tests-1e.R` for R >= 4.3.0 | |
| 5524-5526 | Final timing output | |
