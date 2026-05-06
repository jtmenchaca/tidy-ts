# Comprehensive Summary of `reg-tests-1e.R`

**File**: `tests/reg-tests-1e.R` (R regression tests for R >= 4.3.0)
**Total lines**: 3153
**Total test blocks**: ~160 distinct test blocks (each separated by blank lines, containing one or more `stopifnot`/`assertError`/`assertWarning` assertions)

---

## R Functions / Features Covered (with line references)

| Function/Feature | Lines |
|---|---|
| `env.profile()` / hashed environments | 42-47 |
| `as.character.Rd()` / `parse_Rd()` | 50-59 |
| `parse()` error classes (`parseError`) | 63-97 |
| `fisher.test()` | 100-112 |
| `tar()` | 115-136 |
| `sort()` with `partial` + `na.last` | 138-186 |
| `head()` / `tail()` | 189-193, 600-610 |
| `[[]]` (empty subscript) | 196-215 |
| PRIMNAME in error messages | 218-221 |
| `isGeneric()` | 224-230, 1617-1619, 1666-1672 |
| `poly()` with Date | 233-248 |
| `as.difftime()` | 251-255 |
| `ordered()` | 258-262 |
| Rd macro definition (multi-line) | 265-275 |
| `expand.model.frame()` | 279-291 |
| `time()` / `ts()` | 295-298, 2001-2003 |
| `factanal()` / `print(loadings())` | 301-306 |
| `print()` of zero-length objects | 309-319 |
| `isS3method()` | 322-324 |
| `cor.test.formula()` | 327-333 |
| `data.frame()` / `as.data.frame()` coercion | 336-393, 731-747, 1227-1233, 1323-1368 |
| `UseMethod()` dispatch | 395-414 |
| `download.file()` | 417-424 |
| `packageDescription()` / encoding | 428-435 |
| `format.bibentry()` / Rd macros | 438-442 |
| `predict.lm()` / offset | 445-477 |
| `numeric_version` methods | 481-484, 1874-1883 |
| `class<-` on matrix | 487-500 |
| `uniroot()` | 503-507 |
| `subset.data.frame()` / `chkDots()` | 510-512 |
| `a:b` colon operator length check | 515-526 |
| `rm()` with `list=NULL` | 529-533 |
| `ns()` (splines) | 536-543 |
| `sum()` / `min()` duplicate `na.rm` | 546-553 |
| `as.complex()` | 556-571, 1025-1041, 1044-1060 |
| `methods()` / `.S3methods()` | 575-666 |
| `strsplit()` multibyte | 669-671 |
| `contrib.url()` | 674-676 |
| S4 `.local()` method dispatch | 679-684 |
| `substr<-` UTF-8 overrun | 687-718 |
| `readChar()` large `nchars` | 724-728 |
| `as.data.frame()` deprecation | 367-393, 731-747 |
| `qqplot()` confidence bands | 750-759 |
| `<object>` type / S4 prototype | 762-794 |
| `kappa()` / `rcond()` / `norm()` | 797-873 |
| `round()` / `signif()` argument matching | 877-884, 1955-1957 |
| `transform()` | 887-895 |
| `sqrt()` byte-compiled warning | 899-901 |
| `is.atomic(NULL)` | 903-907 |
| `isoreg()` | 910-914 |
| `format()` / `print()` of complex numbers | 917-929 |
| `cbind()` / `rbind()` deparse.level | 932-944, 1622-1663 |
| LaTeX accent conversion | 947-976 |
| `match()` with POSIXct/POSIXlt | 979-1008 |
| `diff()` error message | 1011-1016 |
| `drop.terms()` | 1019-1098, 1861-1871 |
| `cov2cor()` | 1101-1115 |
| `formals<-` / `body<-` | 1118-1137 |
| `as.function()` error message | 1140-1144 |
| `removeSource()` | 1147-1175 |
| `startDynamicHelp()` | 1178-1183 |
| `==` for call objects | 1186-1192 |
| `<POSIXlt>[]` subsetting | 1194-1205 |
| `str()` for classed language | 1208-1213 |
| `Rd2ex()` | 1216-1224 |
| `dbinom()` / `pbinom()` / `dpois()` non-integer | 1236-1246 |
| `terms.formula()` deprecation | 1249-1259 |
| expression mutation | 1262-1265 |
| `xtabs()` round-trip | 1268-1271 |
| Overflowing exponents | 1274-1276 |
| Hex float parsing | 1279-1297, 1557-1562 |
| `as.raw()` / `as.integer()` from list | 1300-1320 |
| `scan()` NA handling | 1371-1376 |
| `debugcall()` S4 generic | 1379-1391 |
| `toTitleCase()` | 1394-1405 |
| `format.data.frame()` / NA names | 1408-1451 |
| `beta()` / `lbeta()` underflow | 1454-1458 |
| `Sys.setLanguage()` | 1461-1496 |
| `missingArgError` subclasses | 1499-1532 |
| `colSums()` / `rowSums()` dims validation | 1535-1541, 2220-2246 |
| `kappa(*, exact=TRUE)` singular | 1544-1554 |
| `debug()` / `debugonce()` S4 | 1565-1600 |
| `options(scipen=)` validation | 1603-1614 |
| `cbind()` / `rbind()` with raw vectors | 1622-1663 |
| `sort.int()` empty input | 1674-1680 |
| `OutDec` option warnings | 1683-1698 |
| `sessionInfo()` / `La_version()` | 1701-1724 |
| `arima()` seasonal argument | 1727-1736 |
| `binomial()$linkinv()` / `$mu.eta()` | 1739-1747 |
| `duplicated()` / `unique()` for expressions | 1750-1760 |
| `print(summary.default())` precision | 1763-1780 |
| `summary.data.frame()` | 1783-1786 |
| `summary(<difftime>)` | 1789-1804 |
| `unique(<difftime>)` | 1807-1810 |
| `optimize()` non-finite warnings | 1813-1837 |
| `as.environment()` | 1840-1843 |
| `tools::parseLatex()` | 1846-1851 |
| `quantile()` fuzz | 1854-1858 |
| `reformulate()` / `drop.terms()` | 1861-1871 |
| `model.frame()` error messages | 1886-1915 |
| Primitive function attributes | 1918-1926 |
| `terms.formula(*, specials=)` | 1929-1945 |
| `environment(<primitive>)` | 1948-1952 |
| `prettyNum(*, zero.print=)` | 1960-1969 |
| `[.table` class preservation | 1972-1982 |
| `t.test()` with Inf | 1985-1997 |
| `match()` Date vs character | 2006-2024 |
| `length<-` on expression | 2027-2031 |
| `assignInNamespace()` / `fixInNamespace()` | 2034-2049 |
| `hist()` with log | 2052-2054, 2088-2097 |
| Complex subassignment Im part | 2057-2077 |
| `format()` list dispatch | 2080-2085 |
| `requireNamespace(versionCheck=)` | 2100-2104, 2155-2157 |
| `gzcon()` / `gzfile()` empty/concat | 2107-2137 |
| `tcltk` slave terminology | 2140-2152 |
| `rep()` error messages | 2160-2185 |
| `chkDots(*, allowed=)` | 2188-2198 |
| `messageCondition` / `packageStartupMessage` | 2201-2208 |
| `dump()` empty to connection | 2211-2217 |
| `lbeta()` complex | 2249-2259 |
| `jitter()` robustness | 2262-2275 |
| `substr()` / `substring()` large strings | 2278-2286 |
| `.pretty()` small range | 2289-2294 |
| `poly(<factor>)` | 2297-2308 |
| `terms.formula()` NA matching | 2311-2343 |
| GROWABLE dim/dimnames drop | 2347-2356 |
| `all.equal(*, check.class=)` | 2359-2371 |
| `diff()` dimension preservation | 2374-2393 |
| `str()` for Date/POSIXt length-0 | 2396-2401 |
| Active binding mutation guard | 2403-2409 |
| `sequence.default()` nvec recycling | 2411-2449 |
| 1d-array subassignment | 2452-2462 |
| `array()` error messages | 2465-2471 |
| `*tmp*` not found in complex assignment | 2473-2479 |
| LaTeX accents in bibentry fields | 2482-2488 |
| `order()` with NA radix | 2491-2492 |
| `provideDimnames(use.names=)` | 2495-2520 |
| `besselJ()` small nu | 2523-2532 |
| `pretty(<char>)` | 2535-2537 |
| `summary()` empty character | 2540-2544 |
| `toeplitz()` asymmetric edge cases | 2547-2558 |
| `format(<named raw>)` | 2561-2566 |
| `rep.int()` / `rep_len()` factor names | 2569-2574 |
| `str()` with NextMethod | 2577-2615 |
| `R_GetBindingType` / binding accessors | 2618-2708 |
| `R_GetDotType` / dots API | 2710-2987 |
| `...length()` / `...names()` / `...elt()` scoping | 2989-3116 |
| `isa()` / `union()` S3 vs S4 | 3118-3133 |
| Context stack overflow | 3136-3147 |

---

## Detailed Test Block Listing

### 1. Hashed environment growth (lines 42-47)
- **Function**: `env.profile()`, `list2env()`
- **Checks**: Small hashed environments (size 1-6) grow properly; `nch >= 24`
- **Bug**: Hashed environments did not grow for size <= 4 in R <= 4.1.x

### 2. `as.character.Rd(deparse = TRUE)` with curly braces (lines 50-59)
- **Function**: `tools::parse_Rd()`, `as.character.Rd()`
- **PR**: PR#18324
- **Checks**: Round-trip of `\link[=Paren]{\{}` through deparse; curly braces for grouping not escaped
- **Bug**: Failed to re-escape curly brace in R <= 4.2.x

### 3. Parse error classes with line numbers (lines 63-97)
- **Function**: `parse()`
- **PR**: PR#18328 (Duncan Murdoch)
- **Checks**: 15 invalid parse expressions produce `parseError` class errors with correct line/column numbers
- **Data**: Pipe operator misuse, invalid escapes (`\uh`, `\Uh`, `\xh`, `\c`, `\0`, `\U{badf00d}`, `\Ubadf00d`), duplicate formals
- **Bug**: Gave just `simpleError` with no line:column numbers in R <= 4.2.0

### 4. `fisher.test()` with too-full table (lines 100-112)
- **Function**: `fisher.test()`
- **PR**: PR#18336
- **Checks**: 6x6 sparse matrix produces error (not segfault); error message mentions "hash key > INT_MAX"
- **Bug**: Segfault in R <= 4.2.0

### 5. `tar()` warning about illegal uid/gid (lines 115-136)
- **Function**: `tar()`
- **PR**: PR#18344
- **Checks**: Creating tar with invalid uid produces single warning starting "invalid uid"
- **Bug**: Gave 2 warnings per wrong file in previous R versions

### 6. `sort()` with `partial` and `na.last` (lines 138-186)
- **Function**: `sort()`
- **PR**: PR#18335
- **Checks**: Partial sorting with `na.last=FALSE` and `na.last=TRUE` for vectors with NAs; helper `chkSortP()` tests multiple vectors including random (128 iterations)
- **Data**: `c(7,2,4,5,3,6,NA)`, `c(2,3,1,NA)`, `c(NA,3,1,NA)`, 14-element vector with 2 NAs
- **Bug**: Several failed for `na.last=FALSE` and `TRUE`

### 7. `head()` with character `n` (lines 189-193)
- **Function**: `head()`
- **PR**: PR#18357
- **Checks**: `head(letters, "3")` errors; `head(letters, TRUE)` returns `"a"`
- **Bug**: Returned complete `letters` without warning

### 8. `x[[]]` empty subscript error (lines 196-215)
- **Function**: `[[]]` operator
- **PR**: PR#18367
- **Checks**: `c(a=1,2)[[]]`, `NULL[[]]` produce `MissingSubscriptError`; `xx[[]] <- pi` also errors
- **Bug**: `[[]]` matched element with name "" in R <= 4.2.x

### 9. PRIMNAME in error messages (lines 218-221)
- **Function**: Primitive operators
- **PR**: PR#18375
- **Checks**: `date > 1` error message contains `(>)` not `(6)`
- **Bug**: Showed numeric PRIMVAL instead of PRIMNAME

### 10. `isGeneric()` with wrong name (lines 224-230)
- **Function**: `isGeneric()`
- **PR**: PR#18370
- **Checks**: Warning message says "name 'size' instead of 'haha'"
- **Bug**: Confusing message previously

### 11. `poly(<Date>, *)` in lm() (lines 233-248)
- **Function**: `poly()`, `lm()`, `predict()`
- **Checks**: `lm(y ~ x + f + poly(D,3))` and `poly(D,2, raw=TRUE)` work with Date column; predictions match expected values
- **Bug**: `poly(D, 3)` failed since R 4.1.x; `poly(.., raw=TRUE)` failed in all earlier versions

### 12. `as.difftime()` integer coercion (lines 251-255)
- **Function**: `as.difftime()`
- **Checks**: Coerces integer to double, keeps names
- **Bug**: Integers were kept (difftime arithmetic could overflow) in R <= 4.2.x

### 13. `ordered()` with missing `x` (lines 258-262)
- **Function**: `ordered()`
- **PR**: PR#18389
- **Checks**: `ordered(levels = c("a","b"))` identical to `factor(levels=..., ordered=TRUE)`
- **Bug**: `ordered()` call failed in R <= 4.2.x

### 14. Multi-line Rd macro definition (lines 265-275)
- **Function**: `tools::parse_Rd()`, `tools::Rd2txt()`
- **Checks**: Multi-line `\newcommand` macro expands correctly to "LaTeX"
- **Bug**: Empty output in R <= 4.2.x

### 15. `expand.model.frame()` for non-data fits (lines 279-291)
- **Function**: `expand.model.frame()`
- **PR**: PR#18414 (also PR#1423)
- **Checks**: Works with `lm()` fit using variables from a `list2env()` environment
- **Bug**: "object 'y' not found" in R <= 4.2.1

### 16. `time()` rounding errors (lines 295-298)
- **Function**: `time()`, `ts()`
- **Checks**: `floor(as.numeric(time(x)))` matches true year for monthly ts from 2002-2022
- **Bug**: 10 differences in R <= 4.2.x

### 17. Sorted printing of 1-factor loadings (lines 301-306)
- **Function**: `factanal()`, `print(loadings())`
- **PR**: PR#17863
- **Checks**: `print(loadings(f1), sort=TRUE)` prints as 1-column matrix, not vector
- **Bug**: Printed as vector in R <= 4.2.x

### 18. Print of zero-length special objects (lines 309-319)
- **Function**: `print()` for octmode, hexmode, roman, person, bibentry, citation
- **PR**: PR#18422
- **Checks**: Each zero-length object prints correct representation (e.g. `<0-length octmode>`)
- **Bug**: Printed nothing or invalid R-code in R <= 4.2.x

### 19. `isS3method()` for dot-prefixed names (lines 322-324)
- **Function**: `isS3method()`
- **Checks**: `isS3method(".Internal")` returns FALSE
- **Bug**: Failed with "invalid first argument" in R <= 4.2.x

### 20. `cor.test.formula()` scoping (lines 327-333)
- **Function**: `cor.test()`
- **PR**: PR#18439
- **Checks**: Formula with local data frame scoping works correctly (parameter == 4)
- **Bug**: R <= 4.2.x evaluated in `environment(formula)`

### 21. Roman/hexmode/octmode in data frames (lines 336-364)
- **Function**: `as.data.frame()`, `data.frame()`, `cbind()`
- **PR**: PR#18421 (Benjamin Feakins)
- **Checks**: Multiple special types (roman, octmode, hexmode, raw, logical, difftime, POSIXct) can be placed in data frames via `as.data.frame()`, `data.frame()`, and `cbind()`
- **Bug**: Gave errors in R <= 4.2.x

### 22. Deprecation of direct `as.data.frame.<cls>()` calls (lines 367-393)
- **Function**: `as.data.frame.logical()`, etc.
- **Checks**: Direct calls to `as.data.frame.<type>()` for 12 types produce deprecation warnings; indirect calls still work
- **Bug**: Worked without deprecation warning in R <= 4.2.x

### 23. `UseMethod()` dispatch with long class strings (lines 395-414)
- **Function**: `UseMethod()`
- **PR**: PR#18447
- **Checks**: Long class string (500+ chars, 25 reps) produces error not segfault
- **Bug**: Segfault in R <= 4.2.2

### 24. `download.file()` with invalid option (lines 417-424)
- **Function**: `download.file()`
- **PR**: PR#18455
- **Checks**: Invalid `download.file.method` option produces proper error
- **Bug**: "object 'status' not found" in R <= 4.2.2

### 25. `packageDescription()` with invalid encoding (lines 428-435)
- **Function**: `packageDescription()`, `packageVersion()`
- **Checks**: Package with "FTU-8" encoding still returns version 1.0
- **Bug**: Gave "packageNotFoundError" in 3.5.0 <= R <= 4.2.2

### 26. `format.bibentry()` with Rd macros (lines 438-442)
- **Function**: `format.bibentry()`, `tools::loadRdMacros()`
- **Checks**: Custom macro `\authors` expands to `\R` producing "R (2023)."
- **Bug**: Macro definitions not used in R <= 4.2.2

### 27. `predict.lm()` offset environment (lines 445-477)
- **Function**: `predict.lm()`
- **PR**: PR#18456
- **Checks**: Prediction with `offset()` in formula evaluates offset in correct environment; rank-deficient models with offset
- **Bug**: "object 'x' not found" error in previous versions

### 28. `numeric_version` methods (lines 481-484)
- **Function**: `numeric_version`, `format()`, `is.na<-()`
- **Checks**: `format(x[,2])` returns `c(NA_character_, "0")`; `is.na(x)[1] <- TRUE` works
- **Bug**: Two spurious warnings in R <= 4.2.2

### 29. `class<-` on matrix (lines 487-500)
- **Function**: `class<-`
- **Checks**: Setting `class(m) <- "matrix"` or `class(m) <- class(m)` does not add class attribute to matrix
- **Bug**: Matrix got a class attribute in R 4.0.0 <= v <= 4.2.x

### 30. `uniroot()` near Inf (lines 503-507)
- **Function**: `uniroot()`
- **Checks**: `f(x) = 4469/x - 572/(1-x)` on `(1e-6, 1)` finds root near 0.88653
- **Bug**: Gave small negative root in R < 4.3.0

### 31. `chkDots()` in `subset.data.frame()` (lines 510-512)
- **Function**: `subset.data.frame()`
- **Checks**: `subset(df, y = 2)` warns about unused `...` arguments
- **Bug**: Silent about unused args in R < 4.3.0

### 32. `a:b` length check (lines 515-526)
- **Function**: `:` operator
- **PR**: PR#18419
- **Checks**: `a:1` where `length(a) > 1` errors (with env var) or warns; correct results for warning case
- **Bug**: Only warned (never errored) in R <= 4.2.z

### 33. `rm(list=NULL)` (lines 529-533)
- **Function**: `rm()`
- **PR**: PR#18422
- **Checks**: `rm(list=NULL)` is a no-op
- **Bug**: Briefly failed

### 34. `ns()` with boundary quantiles (lines 536-543)
- **Function**: `splines::ns()`
- **PR**: PR#18442
- **Checks**: `ns(nn, 4)` where quantiles land on boundary produces valid 4-column matrix with full rank
- **Bug**: Gave "NA/NaN/Inf in foreign function call" error

### 35. Duplicate `na.rm` in `sum()`/`min()` (lines 546-553)
- **Function**: `sum()`, `min()`
- **Checks**: `sum(3,4,na.rm=5,6,NA,8,na.rm=TRUE)` errors about duplicate formal
- **Bug**: Gave numeric results without warning in R <= 4.3.z

### 36. `as.complex(NA_real_)` imaginary part (lines 556-571)
- **Function**: `as.complex()`
- **Checks**: `as.complex(NA_real_)` has `Im() == 0`; same for `NA_integer_`, `NA`, `NaN`, `Inf`, `-Inf`
- **Bug**: Behavior varies across R versions

### 37. `methods()` visibility in base (lines 575-666)
- **Function**: `methods()`, `.S3methods()`, `getS3method()`, `.S3method()`
- **Checks**: Base package methods are visible; cluster package `coef.hclust` visible when loaded, invisible after detach; registered methods show correct "from"; `getS3method("myFUN", "numeric")` gives proper error
- **Bug**: Various visibility issues in R 4.3.0

### 38. `strsplit()` multibyte character splitting (lines 669-671)
- **Function**: `strsplit()`
- **PR**: PR#18546
- **Checks**: `strsplit("\u00e4", "^", perl=TRUE)` returns 1 element
- **Bug**: Split into two invalid characters in R <= 4.3.z

### 39. `contrib.url()` with empty input (lines 674-676)
- **Function**: `contrib.url()`
- **Checks**: `contrib.url(character())` returns `character()`
- **Bug**: Returned "/src/contrib" in R <= 4.3.1

### 40. S4 `.local()` method with `...` not at end (lines 679-684)
- **Function**: S4 `setMethod()`
- **PR**: PR#18538
- **Checks**: `foo("a")` returns -5 (from method default) not 22 (from generic default)
- **Bug**: Returned 22 in R <= 4.3.z

### 41. `substr<-` UTF-8 overrun (lines 687-718)
- **Function**: `substr<-`
- **Checks**: 4 test cases with UTF-8 multibyte characters (CJK char U+5B57 "字") testing replacement at boundaries; no buffer overrun
- **Bug**: Produced invalid multibyte strings, `nchar()` errors in R <= 4.3.1

### 42. `readChar()` with large `nchars` (lines 724-728)
- **Function**: `readChar()`
- **PR**: PR#18557
- **Checks**: `readChar(tf, 4e8)` warns but returns correct content
- **Bug**: "cannot allocate memory block of size 16777216 Tb"

### 43. False-positive deprecation warnings for `as.data.frame` (lines 731-747)
- **Function**: `as.data.frame()`
- **Checks**: `as.data.frame(pi)`, `data.frame(dtime=as.POSIXlt(...))`, `mapply(as.data.frame, ...)`, S4 generic dispatch do not produce false deprecation warnings
- **Bug**: 1+3+2 false positive warnings in 4.3.0 <= R <= 4.3.1

### 44. `qqplot()` confidence bands (lines 750-759)
- **Function**: `qqplot()`
- **PR**: PR#18570
- **Checks**: Confidence bands for unequal-sized x (length 7) and y (length 63) at 0.90 level; both directions tested
- **Bug**: Lower and upper bands were nonsensical in R <= 4.3.1

### 45. New `<object>` type (lines 762-794)
- **Function**: `asS3()`, `asS4()`, `get()`, `inherits()`, `str()`, `dput()`
- **Checks**: Object/S4 type creation, attribute access, `get()` with mode "object"/"S4", `inherits()` for both types, subscript errors
- **Bug**: Experimental feature testing

### 46. `kappa()`, `rcond()`, `norm()` bug fixes (lines 797-873)
- **Function**: `kappa()`, `rcond()`, `norm()`
- **PR**: PR#18543
- **Checks**: 7 specific bug fixes for real and complex matrices:
  1. `kappa(z, norm="1", method="direct")` ignores lower triangle (was wrong, now 7.6)
  2. `kappa(z, norm="2", LINPACK=TRUE)` now warns
  3. `kappa(z, norm="2", LINPACK=FALSE)` now warns
  4. `kappa.qr(z)` for wide matrices
  5. `rcond(x, triangular=TRUE)` with new `uplo="L"` argument
  6. `kappa(z)` for 0-row/0-col matrices
  7. `kappa(m00, ...)` and `rcond(m00)` for empty matrices
  - Also: new norm "M" and "F" support for `exact=TRUE`
  - Complex matrix versions of all above
- **Bug**: Multiple incorrect results in R <= 4.3.1

### 47. `round()`/`signif()` argument matching (lines 877-884)
- **Function**: `round()`, `signif()`
- **Checks**: Named argument passing, empty arguments with trailing commas, missing `x` errors
- **Bug**: Not handled properly in R <= 4.3.x

### 48. `transform()` with non-syntactic names (lines 887-895)
- **Function**: `transform()`
- **PR**: PR#17890
- **Checks**: `transform(df)` no-op preserves `A-1` name; modification and addition preserve names
- **Bug**: "A-1" became "A.1" in R < 4.4.0

### 49. Byte-compiled `sqrt()` NaN warning (lines 899-901)
- **Function**: `sqrt()`, `compiler::cmpfun()`
- **Checks**: Byte-compiled `sqrt(-1L)` produces warning
- **Bug**: No warning for negative integer scalars

### 50. `is.atomic(NULL)` (lines 903-907)
- **Function**: `is.atomic()`, `sort()`, `sort.int()`
- **Checks**: `is.atomic(NULL)` is FALSE; `sort(NULL)` and `sort.int(NULL)` return NULL
- **Bug**: `is.atomic(NULL)` was TRUE previously

### 51. `isoreg()` with Inf (lines 910-914)
- **Function**: `isoreg()`
- **PR**: PR#18603
- **Checks**: `isoreg(Inf)`, `isoreg(c(0,Inf))`, `isoreg(rep(1e307,20))` all error
- **Bug**: Segfault in R <= 4.3.1

### 52. Complex number formatting (lines 917-929)
- **Function**: `format()`, `print()`, `as.character()` for complex
- **PR**: PR#16752
- **Checks**: `100 + 0:4 + 1e9i` formats with non-scientific real part
- **Bug**: Had exponential format for Re() from R 3.3.0 to R 4.3.z

### 53. `cbind()`/`rbind()` deparse.level for methods (lines 932-944)
- **Function**: `cbind()` S3 dispatch
- **PR**: PR#18579 (Mikael Jagan)
- **Checks**: `deparse.level` argument correctly passed to S3 method
- **Bug**: Did not work in R <= 4.3.x

### 54. LaTeX accent conversion (lines 947-976)
- **Function**: `tools::parseLatex()`, `tools::latexToUtf8()`, `tools::deparseLatex()`, `tools:::cleanupLatex()`
- **Checks**: `\~{n}` vs `\~{}` disambiguation; accented I and i conversion; `deparseLatex(dropBraces=TRUE)` round-trip
- **Bug**: Various conversion errors in R <= 4.3.1

### 55. `match()` with POSIXct/POSIXlt (lines 979-1008)
- **Function**: `match()`
- **PR**: PR#18618
- **Checks**: Matching works correctly for POSIXct, POSIXlt, character, Date, and fractional-second times
- **Bug**: Failed partly in R 4.3.0 -- 4.3.2

### 56. `diff()` error message (lines 1011-1016)
- **Function**: `diff()`
- **PR**: PR#18598
- **Checks**: `diff(1:6, differences=integer(0L))` produces "must be integers >= 1" error
- **Bug**: "missing value where TRUE/FALSE needed" in R <= 4.3.2

### 57. `drop.terms()` with zero-length dropx (lines 1019-1022)
- **Function**: `drop.terms()`
- **PR**: PR#18563
- **Checks**: `drop.terms(tt, dropx=0[0], keep.response=TRUE)` returns identical terms
- **Bug**: Errored in R <= 4.3.2

### 58. `as.complex()` from string (lines 1025-1041)
- **Function**: `as.complex()`
- **Checks**: Pure imaginary strings like "1i", "+4.i", "-.1i", "-4.3e-17i" parse correctly; invalid suffixes ("12iL", "12irene", "12I") warn and return NA
- **Bug**: Returned NA with warning for valid strings in R <= 4.4.0

### 59. `c(NA, <complex>)` and `cumsum(<complex_w_NA>)` (lines 1044-1060)
- **Function**: `c()`, `cumsum()`, `cumprod()`, `sum()`, `prod()`
- **Checks**: `c(1i, NA)` preserves imaginary parts; cumulative operations consistent
- **Bug**: Gave `NA_complex_` in more cases in R <= 4.4.0

### 60. `getS3method()` matching dispatch (lines 1063-1070)
- **Function**: `getS3method()`, `isS3method()`
- **PR**: PR#18627
- **Checks**: `isS3method("t", "test")` is FALSE; `getS3method("t","test",optional=TRUE)` is NULL; `t()` on "test" class object does not call `t.test()`
- **Bug**: `getS3method()` returned `t.test` function in R <= 4.3.2

### 61. `drop.terms()` multiple fixes (lines 1073-1098)
- **Function**: `drop.terms()`, `formula()`
- **PR**: PR#18564, PR#18565, PR#18566
- **Checks**: Default `keep.response=FALSE` drops response; offset preserved correctly with proper index; no-response formula handled
- **Bug**: Various issues in R <= 4.3.2

### 62. `cov2cor(<0x0>)` (lines 1101-1104)
- **Function**: `cov2cor()`
- **PR**: PR#18423
- **Checks**: `cov2cor(matrix(0,0,0))` returns the input
- **Bug**: Error in R <= 4.3.2

### 63. `cov2cor()` warnings with negative/NA diagonal (lines 1107-1115)
- **Function**: `cov2cor()`
- **PR**: PR#18424
- **Checks**: `cov2cor(diag(-1, 3L))` produces NaN matrix with proper warning
- **Bug**: 2 warnings on 3 lines, 2nd inaccurate in R <= 4.3.2

### 64. `formals<-` with constant body (lines 1118-1137)
- **Function**: `formals<-`, `body<-`
- **Checks**: Setting `formals(g) <- formals(g)` and `body(h) <- body(h)` is identity for functions with constant bodies (string, integer, logical, complex, double, Inf)
- **Bug**: Error "list argument expected" in R <= 4.3.x

### 65. `as.function()` error message (lines 1140-1144)
- **Function**: `as.function()`
- **Checks**: Error message says "as.function" not "function"
- **Bug**: Wrong function name in message in R <= 4.3.x

### 66. `removeSource()` for formals and sub-functions (lines 1147-1175)
- **Function**: `removeSource()`
- **PR**: PR#18638
- **Checks**: Removes srcref from formals of nested functions and from quoted function expressions
- **Bug**: Did not remove srcref from formals in R <= 4.3.2

### 67. `startDynamicHelp()` port validation (lines 1178-1183)
- **Function**: `tools::startDynamicHelp()`, `help.start()`
- **PR**: PR#18645
- **Checks**: Port 123456 (out of range) produces error
- **Bug**: Silently failed in R <= 4.3.2

### 68. `==` for call objects (lines 1186-1192)
- **Function**: `==`, `!=` for language objects
- **PR**: PR#18676
- **Checks**: `quote({a}) != quote({b})`, `quote(c(1)) != quote(c(1L))`, float precision distinction
- **Bug**: New behavior testing

### 69. `<POSIXlt>[]` subsetting balanced attribute (lines 1194-1205)
- **Function**: POSIXlt subsetting
- **PR**: PR#18681
- **Checks**: Subsetting after modifying `$mon` does not incorrectly set "balanced" attribute
- **Bug**: Set "balanced" incorrectly in R 4.3.*

### 70. `str()` for classed language objects (lines 1208-1213)
- **Function**: `str()`
- **Checks**: `str(structure(quote(a > 2*b), class='new_class'))` shows `a > 2 * b`
- **Bug**: Showed `> a 2 * b` using `as.character()` in R <= 4.3.*

### 71. `Rd2ex()` code after `\dontshow{}` (lines 1216-1224)
- **Function**: `tools::Rd2ex()`
- **Checks**: Code directly after `\dontshow{if(TRUE)}` is not skipped
- **Bug**: Skipped the `stop()` in R < 4.4.0

### 72. `as.data.frame(<empty matrix>)` (lines 1227-1233)
- **Function**: `as.data.frame()`
- **Checks**: Empty matrix (0 columns) produces data frame with `names` attribute
- **Bug**: Had no `$names` in R < 4.4.0

### 73. `R_nonInt()` stricter checking (lines 1236-1246)
- **Function**: `dbinom()`, `pbinom()`, `dpois()`
- **Checks**: Non-integer size parameter (9876543.2) produces NaN with warning; non-integer dpois produces warning
- **Bug**: Did not warn, treated as integer in R < 4.4.0

### 74. `terms.formula()` deprecated arguments (lines 1249-1259)
- **Function**: `terms.formula()`
- **Checks**: Using `abb` or `neg.out` arguments produces deprecation warnings
- **Bug**: Deprecation was only on help page in R 4.3.*

### 75. Expression mutation safety (lines 1262-1265)
- **Function**: Expression subassignment
- **Checks**: `x[[2]] <- list()` on `expression(a)` does not mutate after error
- **Bug**: Error jump happened after mutation through R 4.3.3

### 76. `xtabs()` round-trip with NA counts (lines 1268-1271)
- **Function**: `as.data.frame()`, `xtabs()`
- **Checks**: `table |> as.data.frame() |> xtabs()` preserves NA counts
- **Bug**: NA turned into 0 in R < 4.4.0

### 77. Overflowing exponents (lines 1274-1276)
- **Function**: Numeric parsing
- **PR**: PR#16358
- **Checks**: `1e999999999999` equals `Inf`
- **Bug**: Not handled previously

### 78. Hex float parsing (lines 1279-1297)
- **Function**: `as.numeric()`
- **PR**: PR#17199
- **Checks**: Hex floats like `0x1.00000000d0000p-987` parsed correctly; empty exponent digits rejected
- **Bug**: Were zero on systems where long double == double; R 4.4.0 accepted empty exponent

### 79. `as.<atomic>(<list of raw(1)>)` (lines 1300-1320)
- **Function**: `as.raw()`, `as.integer()`, `as.character()`, `as.double()`
- **PR**: PR#18696
- **Checks**: Converting lists of atomic singletons back to vectors works
- **Bug**: `as.raw(rl)` and `as.integer(rl)` failed in R <= 4.4.x

### 80. `as.data.frame.matrix()` with NA rownames (lines 1323-1368)
- **Function**: `as.data.frame.matrix()`
- **PR**: PR#18702
- **Checks**: Matrices with NA rownames handled correctly with `make.names=TRUE/FALSE/NA`
- **Bug**: Lost row.names, dim was 0x3 instead of 2x3 in R <= 4.4.0

### 81. `scan()` NA handling (lines 1371-1376)
- **Function**: `scan()`
- **PR**: PR#17289
- **Checks**: `scan(text="NA", what=double(), na.strings=character())` errors (does not treat "NA" as double)
- **Bug**: Treated "NA" as NA regardless of na.strings

### 82. `debugcall()` with S4 generic (lines 1379-1391)
- **Function**: `debugcall()`, `isS3stdGeneric()`, `isdebugged()`, `undebug()`
- **PR**: PR#18143
- **Checks**: `debugcall(summary(factor(1)))` works when S4 generic version cached
- **Bug**: Error about `@` on function object in R <= 4.4.0

### 83. `toTitleCase()` with suspensive hyphenation (lines 1394-1405)
- **Function**: `tools::toTitleCase()`
- **PR**: PR#18674, PR#18724
- **Checks**: Conjunctions after hyphens stay lowercase; `toTitleCase(character(0))` returns character(0)
- **Bug**: "and" capitalized after hyphen; empty input returned `list()`

### 84. `format.data.frame()` / NA names (lines 1408-1451)
- **Function**: `format.data.frame()`, `as.data.frame.list()`
- **PR**: PR#18745, PR#18702
- **Checks**: NA names preserved (not converted to "NA"); `check.names=FALSE` respected; `fix.empty.names` interactions
- **Bug**: NA names became "NA" in R <= 4.4.1

### 85. `beta()`/`lbeta()` potential underflow (lines 1454-1458)
- **Function**: `beta()`, `lbeta()`
- **Checks**: `beta(2e306, 4*2e306) == 0`; `lbeta()` returns correct value
- **Bug**: Warned about potential underflow

### 86. `Sys.setLanguage()` / locale testing (lines 1461-1496)
- **Function**: `Sys.setLanguage()`
- **Checks**: Switching to French, error messages change; `ls.str()` prints `<missing>` correctly in non-English
- **Bug**: Language not switched; `ls.str()` showed error message instead of `<missing>` in R <= 4.4.1

### 87. `missingArgError` subclasses (lines 1499-1532)
- **Function**: Error classification
- **Checks**: Various missing argument scenarios produce correct error subclasses (`evalError`, `getvarError`, `missingArgError`); byte-compiled and interpreted match
- **Bug**: New classed errors in R >= 4.5.0

### 88. `colSums()`/`rowMeans()` dims validation (lines 1535-1541)
- **Function**: `colSums()`, `rowMeans()`
- **PR**: PR#18811
- **Checks**: `colSums(A, dims=1:2)` gives "invalid 'dims'" error
- **Bug**: Error was "'length = 2' in coercion to 'logical(1)'"

### 89. `kappa(*, exact=TRUE)` for singular matrices (lines 1544-1554)
- **Function**: `kappa()`, `.kappa_tri()`
- **PR**: PR#18817
- **Checks**: Singular matrices return `Inf` for all 3 methods
- **Bug**: Returned 1 or 0 with warning in R <= 4.4.2

### 90. Hexadecimal constants without exponent (lines 1557-1562)
- **Function**: Parser
- **Checks**: `0x1.234` (without p-exponent) is legal
- **Bug**: Was a parse error in R <= 4.4.2

### 91. `debug()` / `debugonce()` for S4 generics (lines 1565-1600)
- **Function**: `debug()`, `debugonce()`, `selectMethod()`, `untrace()`
- **PR**: PR#18822, PR#18824
- **Checks**: `debug("Ops", signature=c("array","array"))` works; `debugonce()` can be called twice without error
- **Bug**: Both failed in R <= 4.4.2

### 92. `options(scipen=)` validation (lines 1603-1614)
- **Function**: `options()`
- **Checks**: Invalid scipen values (NULL, vector, huge) error; extreme values warn and clamp to [-9, 9999]
- **Bug**: NULL would invalidate `as.character(Sys.time())` in R <= 4.4.2

### 93. `isGeneric(fdef=)` without `f` (lines 1617-1619)
- **Function**: `isGeneric()`
- **PR**: PR#18369 (Mikael Jagan)
- **Checks**: `isGeneric(fdef=print)` works
- **Bug**: "argument 'f' is missing" in R <= 4.4.2

### 94. `cbind()`/`rbind()` with raw vectors (lines 1622-1663)
- **Function**: `cbind()`, `rbind()`
- **Checks**: Raw vectors combined with logical, integer, double, complex; NULL combined with zero-length vectors; edge cases for dimensions
- **Bug**: Segfaults with LTO/C99 inlining; first three were wrong before R 4.4.3

### 95. `isGeneric(getName=TRUE)` with fdef (lines 1666-1672)
- **Function**: `isGeneric()`
- **PR**: PR#18829
- **Checks**: `isGeneric("+", fdef=\`+\`, getName=TRUE)` returns named string, not just TRUE
- **Bug**: Wrongly returned just TRUE

### 96. `sort.int()` empty input quick method (lines 1674-1680)
- **Function**: `sort.int()`
- **Checks**: `sort.int(integer(0), method="quick")` and with `index.return=TRUE` for both integer and double
- **Bug**: Array-access errors and segfaults in R <= 4.4.2

### 97. `OutDec` option warnings (lines 1683-1698)
- **Function**: `options()`, `format()`, `print()`, `prettyNum()`
- **Checks**: Multi-character or empty `OutDec` produces warnings from format and print
- **Bug**: New warnings for illegal OutDec

### 98. `sessionInfo()` prints `La_version()` (lines 1701-1724)
- **Function**: `sessionInfo()`, `La_version()`
- **Checks**: LAPACK version appears in output when non-empty
- **Bug**: LAPACK line entirely empty when `si$LAPACK` was ""

### 99. `arima()` seasonal argument (lines 1727-1736)
- **Function**: `arima()`
- **Checks**: `arima(presidents, seasonal=c(1,0))` gives proper error about `seasonal`; `arima(lynx, order=c(0,1,0))` AIC correct
- **Bug**: Gave solve.default() error in R <= 4.4.2

### 100. `binomial()$linkinv()` / `$mu.eta()` with integers (lines 1739-1747)
- **Function**: `binomial()` link functions
- **Checks**: Integer and double inputs produce identical results for all 5 link functions
- **Bug**: Integer not allowed for logit in R <= 4.4.2

### 101. `duplicated()`/`unique()` for expressions (lines 1750-1760)
- **Function**: `anyDuplicated()`, `duplicated()`, `unique()` for `expression`
- **Checks**: `expression(1,0+1,x+1,x+2,x+1,(x)+1,1,(1),(x+1))` -- duplicates detected correctly
- **Bug**: Did not work for expressions in R < 4.5.0

### 102. `print(summary.default())` precision (lines 1763-1780)
- **Function**: `summary.default()`, `format()`
- **Checks**: Mean of helconc data formats as "164325" not "164326" (avoids double-rounding)
- **Bug**: Wrong double-rounding for years in R < 4.5.0

### 103. `summary.data.frame(*, digits=NULL)` (lines 1783-1786)
- **Function**: `summary.data.frame()`
- **Checks**: `digits=NULL` argument works
- **Bug**: Failed briefly

### 104. `summary(<difftime>)` (lines 1789-1804)
- **Function**: `summary()` for difftime
- **Checks**: Returns difftime with summaryDefault class; prints correctly with units
- **Bug**: Not useful in R < 4.5.0

### 105. `unique(<difftime>)` (lines 1807-1810)
- **Function**: `unique()` for difftime
- **Checks**: Preserves difftime class
- **Bug**: Lost class in R < 4.5.0

### 106. `optimize()` non-finite function values (lines 1813-1837)
- **Function**: `optimize()`
- **Checks**: Function returning NaN, Inf, -Inf produces specific warnings; finds correct minimum when possible
- **Bug**: Only one generic "NA/Inf replaced" message in R < 4.4.z

### 107. `as.environment(x=)` named argument (lines 1840-1843)
- **Function**: `as.environment()`
- **Checks**: `as.environment(x = list(a=1, bb=2))` works
- **Bug**: Required `object=` or no name in R <= 4.4.z

### 108. `tools::parseLatex()` issues (lines 1846-1851)
- **Function**: `tools::parseLatex()`
- **PR**: PR#18855
- **Checks**: Unmatched `{` errors; `\begin{foo}\end{foo}` works; `\Sexpr{1+{1}}` works; mismatched begin/end errors; `\newcommand` with `\begin` works

### 109. `quantile()` fuzz (lines 1854-1858)
- **Function**: `quantile()`
- **PR**: PR#15811
- **Checks**: `quantile(1:1390, 0.7, type=2)` returns 973.5
- **Bug**: Was 973 in R <= 4.4.x

### 110. `drop.terms()` / `reformulate()` for single term (lines 1861-1871)
- **Function**: `drop.terms()`, `reformulate()`
- **PR**: PR#18861
- **Checks**: Dropping the only term gives intercept-only formula; with and without intercept
- **Bug**: Error in `reformulate()` in R < 4.5.0

### 111. `duplicated(<numeric_version>)` empty input (lines 1874-1883)
- **Function**: `duplicated()` for numeric_version
- **PR**: PR#18699
- **Checks**: Empty input does not warn; single and duplicate inputs work
- **Bug**: Warning "no non-missing arguments to max" in R-devel

### 112. `model.frame()` error messages (lines 1886-1915)
- **Function**: `model.matrix()`, `model.frame()`
- **PR**: PR#18860
- **Checks**: 4 scenarios: missing variable, wrong type (list), not found, wrong type (closure) -- all produce descriptive error messages
- **Bug**: Last case had different (worse) error message

### 113. Setting attributes on primitive functions (lines 1918-1926)
- **Function**: `structure()`, `attributes<-`, `attr<-`
- **Checks**: All three ways of setting attributes on `sum` error; `sum` unchanged afterward
- **Bug**: Modified the `base::sum` primitive in R <= 4.4.x

### 114. `terms.formula(*, specials=)` with non-syntactic names (lines 1929-1945)
- **Function**: `terms.formula()`, `drop.terms()`
- **PR**: PR#18568
- **Checks**: `specials = "|"` works; `drop.terms()` correctly removes special terms
- **Bug**: Terms unchanged in R <= 4.4.x

### 115. `environment(<primitive>)` setting (lines 1948-1952)
- **Function**: `environment<-`
- **Checks**: Setting environment on primitive produces deprecation warning; setting to NULL is silent no-op
- **Bug**: Was mutilating the base object in R <= 4.4.x

### 116. `signif()` for large numbers (lines 1955-1957)
- **Function**: `signif()`
- **PR**: PR#18889
- **Checks**: `signif(1.06e308, 2)` returns `1.1e308`; `signif(1.0055e308, 3)` returns `1.01e308`

### 117. `prettyNum(*, zero.print=, replace.zero=)` (lines 1960-1969)
- **Function**: `prettyNum()`
- **Checks**: `replace.zero=TRUE` with multi-char `zero.print` works correctly
- **Bug**: Same as without replace.zero in R <= 4.5.0

### 118. `[.table` class preservation (lines 1972-1982)
- **Function**: `[.table`
- **PR**: PR#18845
- **Checks**: Subsetting preserves additional classes (e.g., "myT")
- **Bug**: Only kept "table" class in R <= 4.5.x

### 119. `t.test()` with Inf (lines 1985-1997)
- **Function**: `t.test()`
- **PR**: PR#18901
- **Checks**: One-sample and two-sample t.test with Inf values returns htest with NA p-value/CI
- **Bug**: Errored in R <= 4.5.1

### 120. `ts()` with `ts.eps` argument (lines 2001-2003)
- **Function**: `ts()`
- **Checks**: `ts.eps` argument now passed to C code; too-strict eps causes error
- **Bug**: `ts.eps` was not passed to C code in R <= 4.5.1

### 121. `match()` Date vs character (lines 2006-2024)
- **Function**: `match()`, `%in%`
- **PR**: PR#18931
- **Checks**: Large Date sequence matching is fast; Date-character cross-matching works both directions
- **Bug**: Slow (0.260s vs 0.003s) and failed around R-devel 2025-06-26

### 122. `length<-` on expression (lines 2027-2031)
- **Function**: `length<-` for expression
- **Checks**: Truncating and extending expressions works

### 123. `assignInNamespace()` / `fixInNamespace()` for S3 methods (lines 2034-2049)
- **Function**: `assignInNamespace()`, `fixInNamespace()`
- **Checks**: Modifying `toRd.default` method in tools namespace; S3 dispatch table updated
- **Bug**: Error "object 'toRd' of mode 'function' was not found" in R <= 4.5.1

### 124. `hist()` with `log="x"` (lines 2052-2054)
- **Function**: `hist()`
- **PR**: PR#18921
- **Checks**: `hist(1:100, breaks=2^(0:8), log="x")` produces no warnings

### 125. Complex subassignment preserving zero Im (lines 2057-2077)
- **Function**: Complex vector/array subassignment
- **Checks**: Assigning real/integer/NA values into complex vector preserves `Im() == 0` where expected; tested for vector, 1d-array, 2d-array, 3d-array
- **Bug**: More NAs in Im() than expected in R <= 4.5.z

### 126. `format(<list of objects>)` dispatch (lines 2080-2085)
- **Function**: `format()` for lists
- **Checks**: `format(as.list(dts))` dispatches to `format.Date()` correctly
- **Bug**: Returned raw numeric strings in R <= 4.5.z

### 127. `hist(*, plot=FALSE)` warning for unused args (lines 2088-2097)
- **Function**: `hist()`
- **Checks**: `hist(..., log="x", plot=FALSE)` warns about `log`; `warn.unused=FALSE` suppresses
- **Bug**: Warning had `...` instead of `log`

### 128. `requireNamespace(versionCheck=)` for loaded namespace (lines 2100-2104)
- **Function**: `requireNamespace()`
- **PR**: PR#18255
- **Checks**: Version check `> getRversion()` fails as expected
- **Bug**: Did not show error for loaded namespace

### 129. `gzcon()` / `gzfile()` empty file (lines 2107-2119)
- **Function**: `gzcon()`, `gzfile()`, `readLines()`
- **PR**: PR#18887
- **Checks**: Reading empty file returns `character(0)`
- **Bug**: Returned non-deterministic non-empty content

### 130. Concatenated gzip streams (lines 2122-2137)
- **Function**: `gzcon()`, `gzfile()`
- **Checks**: Writing "Hello " then appending "World\n" in gzip; reading back gives "Hello World"

### 131. tcltk `slave` terminology deprecation (lines 2140-2152)
- **Function**: `tkpack.slaves()` -> `tkpack.child()`
- **PR**: PR#17835
- **Checks**: `tkpack.slaves()` produces deprecation warning with `$new == "tkpack.child"`

### 132. Invalid `versionCheck` should error quietly (lines 2155-2157)
- **Function**: `requireNamespace()`
- **Checks**: Invalid versionCheck ("999.0") errors even with `quietly=TRUE`
- **Bug**: Silently returned FALSE

### 133. `rep()` error messages (lines 2160-2185)
- **Function**: `rep()`
- **PR**: PR#18926
- **Checks**: 11 error cases with 3 distinct messages: overflow, invalid times given each, invalid times
- **Bug**: All had same generic "invalid 'times' argument" message

### 134. `chkDots(*, allowed=)` implementation (lines 2188-2198)
- **Function**: `chkDots()`
- **PR**: PR#18936
- **Checks**: `allowed="foo"` lets `foo` through; other args warn; warning is classed `chkDotsWarning`

### 135. `messageCondition` and `packageStartupMessage` (lines 2201-2208)
- **Function**: `messageCondition()`, `packageStartupMessage()`
- **Checks**: Custom message class propagated; `suppressPackageStartupMessages()` works

### 136. `dump()` empty to connection (lines 2211-2217)
- **Function**: `dump()`
- **PR**: PR#18729
- **Checks**: `dump(character(), con)` does not error
- **Bug**: Error in R <= 4.5

### 137. `colSums()`/etc. with complex NAs in different parts (lines 2220-2246)
- **Function**: `colSums()`, `rowSums()`, `colMeans()`, `rowMeans()`, `sum()`
- **Checks**: Complex matrix where NAs are only in Im part; all 4 functions match `apply()` equivalents for both `na.rm=TRUE` and `na.rm=FALSE`
- **Bug**: Almost all differed in R <= 4.5.1

### 138. `lbeta()` with complex arguments (lines 2249-2259)
- **Function**: `beta()`, `lbeta()`, `log10()`, `log2()`
- **PR**: PR#18946
- **Checks**: `beta(1i,1)`, `lbeta(1i,1)` etc. all error for complex; `log10(1i)` and `log2()` work
- **Bug**: `lbeta(1i,1)` returned non-sense complex in R <= 4.5.1

### 139. `jitter()` robustness (lines 2262-2275)
- **Function**: `jitter()`
- **Checks**: Negative factor/amount no longer produce NaN; Inf and NaN in input handled
- **Bug**: Failed for `d` computation with Inf/NA; negative amount/factor gave NaN

### 140. `substr()`/`substring()` large strings (lines 2278-2286)
- **Function**: `substring()`
- **PR**: PR#18851
- **Checks**: `substring(Lstr, 1e6)` on 1M+ char string returns correct suffix
- **Bug**: `last = 1000000L` was not large enough in R <= 4.5.1

### 141. `.pretty()` with very small range (lines 2289-2294)
- **Function**: `.pretty()`
- **Checks**: `pretty(c(0, 1e-322), eps.correct=2)` produces n=2 (not millions)
- **Bug**: n=1112538 in R <= 4.5.1

### 142. `poly(<factor>)` (lines 2297-2308)
- **Function**: `poly()`, `lm()`
- **Checks**: `poly(x, 2)` and `poly(xf, 2)` error for character/factor; ordered factor works
- **Bug**: `poly(factor, .)` gave no error in R 4.1.1--4.5.x

### 143. `terms.formula()` NA matching in variables (lines 2311-2343)
- **Function**: `terms.formula()`
- **PR**: PR#15275
- **Checks**: Duplicate terms with `NA`, `NaN`, `FALSE`, `0L`, `0`, `NA_integer_`, `NA_real_`, `NA_complex_`, `NA_character_`, `character(0)` in formula are matched/unmatched correctly
- **Bug**: Equal NAs were not matched; STRING_ELT access on empty possible

### 144. GROWABLE dim/dimnames drop (lines 2347-2356)
- **Function**: Vector extension (GROWABLE)
- **Checks**: After growing a vector in-place, dim and dimnames are dropped
- **Bug**: Dim and dimnames were kept in R <= 4.5.z

### 145. `all.equal(*, check.class=FALSE)` (lines 2359-2371)
- **Function**: `all.equal()`
- **Checks**: `check.class=FALSE` bypasses class comparison for numeric, character, raw
- **Bug**: `check.class` not passed downstream in R <= 4.5.2

### 146. `diff()` dimension preservation (lines 2374-2393)
- **Function**: `diff()` for matrix, ts, Date, POSIXct, difftime
- **Checks**: `diff(fnm, lag=2, differences=5)` returns 0-row matrix (not dropping to vector); ts boundary case
- **Bug**: `diff()` result was not a matrix in R <= 4.5.2

### 147. `str()` for length-0 Date/POSIXt with `give.attr=FALSE` (lines 2396-2401)
- **Function**: `str()`
- **Checks**: `give.attr=FALSE` respected for 0-length Date and POSIXct
- **Bug**: Not obeyed in R <= 4.5.2

### 148. Active binding mutation guard (lines 2403-2409)
- **Function**: Active bindings, subassignment
- **Checks**: `x[1] <- 2` where x is active binding does not mutate underlying value
- **Bug**: Mutation through active bindings possible

### 149. `sequence.default()` nvec recycling (lines 2411-2449)
- **Function**: `sequence.default()`
- **PR**: PR#18304
- **Checks**: `nvec` shorter than `n` is recycled (or truncated with `recycle=FALSE`); extensive testing with both `recycle=FALSE` and `recycle=TRUE`
- **Bug**: Last 6 cases failed for `recycle=TRUE`

### 150. 1d-array subassignment by name (lines 2452-2462)
- **Function**: Array subassignment
- **PR**: PR#18973
- **Checks**: `x["a"] <- 100` on 1d array preserves dim and dimnames
- **Bug**: Dropped dim() and dimnames() in previous versions

### 151. `array()` error messages (lines 2465-2471)
- **Function**: `array()`
- **Checks**: `array(NULL)` says "was 'NULL'"; `array(,NULL)` says "'dim' cannot"
- **Bug**: Had 'dims' instead of 'dim'

### 152. `*tmp*` not found in complex assignment (lines 2473-2479)
- **Function**: Complex replacement functions
- **Checks**: `f(x, y[] <- 1) <- 3` does not error with "*tmp* not found"
- **Bug**: Used to fail

### 153. LaTeX accents in bibentry fields (lines 2482-2488)
- **Function**: `bibentry()`, `tools::toRd()`
- **Checks**: Publisher field `Ja{\\'e}n` converts to `Ja\u00e9n`; Series field `{Economistas}` preserved
- **Bug**: Publisher/Series not subject to `cleanupLatex()` in R <= 4.5.2

### 154. `order()` with NA radix method (lines 2491-2492)
- **Function**: `order()`
- **Checks**: `order(NA_character_, 'c', method='radix', na.last=NA)` works
- **Bug**: STRING_ELT bounds error in barrier build

### 155. `provideDimnames(use.names=)` (lines 2495-2520)
- **Function**: `provideDimnames()`
- **Checks**: `use.names=TRUE` creates names for dimnames; composition is idempotent
- **Bug**: New feature testing

### 156. `besselJ()` with very small nu (lines 2523-2532)
- **Function**: `besselJ()`
- **Checks**: `besselJ(0:41, 1e-15)` matches expected values to 8 digits
- **Bug**: Off by ~1e15 since r32446 (2005)

### 157. `pretty(<char>)` (lines 2535-2537)
- **Function**: `pretty()`
- **Checks**: `pretty(c("1","9","100"))` returns `20*0:5`
- **Bug**: Wrongly gave 0 2 4 6 8 10 (bug > 15 years old)

### 158. `summary()` empty character vector (lines 2540-2544)
- **Function**: `summary()`
- **PR**: PR#16750
- **Checks**: `summary(character())` Min.nchar/Max.nchar match `summary(nchar(character()))`
- **Bug**: Gave +-Inf with warnings briefly

### 159. `toeplitz()` asymmetric edge cases (lines 2547-2558)
- **Function**: `toeplitz()`
- **PR**: PR#18996
- **Checks**: All 81 combinations of types (integer, double, complex) x lengths (0,1,2) for both arguments
- **Bug**: 18 out of 81 wrong in R <= 4.5.z

### 160. `format(<named raw>)` (lines 2561-2566)
- **Function**: `format()` for raw vectors
- **Checks**: Names preserved after formatting
- **Bug**: Lost names in R <= 4.5.z

### 161. `rep.int()`/`rep_len()` on factor drops names (lines 2569-2574)
- **Function**: `rep.int()`, `rep_len()`
- **PR**: PR#18999
- **Checks**: Named factor input produces unnamed output
- **Bug**: Had names in 4.0.0 <= R <= 4.5.z

### 162. `str()` with NextMethod (lines 2577-2615)
- **Function**: `str()`, `.S3method()`
- **PR**: PR#19001
- **Checks**: `str()` on objects with methods using `NextMethod()` does not show extra "List of" line; works for both direct definition and `.S3method()` registration; two-level inheritance
- **Bug**: Extra "List of" line in R <= 4.5.z

### 163. `R_GetBindingType` / binding accessors (lines 2618-2708)
- **Function**: `.Internal(getBindingType())`, `.Internal(delayedBindingExpression())`, `.Internal(delayedBindingEnvironment())`, `.Internal(forcedBindingExpression())`, `activeBindingFunction()`
- **Checks**: Returns correct types: "unbound", "value", "missing", "delayed", "forced", "active"; works for local frames, forwarded `...`, base namespace; delayed/forced expression retrieval; active binding function retrieval

### 164. `R_GetDotType` and dots API (lines 2710-2987)
- **Function**: `.Internal(getDotType())`, `.Internal(dotDelayedExpression())`, `.Internal(dotDelayedEnvironment())`, `.Internal(dotForcedExpression())`
- **PR**: PR#18928
- **Checks**: Dot promise introspection through forwarded `...`, deeper chains; delayed vs forced detection; expression/environment retrieval; `R_DotsExist()` for empty dots and non-DOTSXP; `inherits=FALSE` scoping restrictions for all dots C API functions

### 165. `...length()`, `...names()`, `...elt()` scoping (lines 2989-3116)
- **Function**: `...length()`, `...names()`, `...elt()`
- **PR**: PR#18928
- **Checks**: R-level dots functions retain inherited scoping through `local()` and nested functions; error when no `...` in scope; `...` overwritten with non-DOTSXP skips frame
- **Bug**: Various scoping issues

### 166. `isa()` / `union()` S3 vs S4 consistency (lines 3118-3133)
- **Function**: `isa()`, `union()`, `setClass()`, `removeClass()`
- **Checks**: `isa()` works for S3 and S4 class hierarchies; `union()` on factors preserves correct level order
- **Bug**: Levels were wrong briefly

### 167. Context stack overflow checks (lines 3136-3147)
- **Function**: `parse()`
- **PR**: PR#18458
- **Checks**: 50 nested braces, parens, brackets, double-brackets, and if-statements all produce `contextstackOverflow` + `parseError` errors
- **Bug**: Segfault with ASAN due to off-by-one

---

## Summary Statistics

- **Total distinct test blocks**: ~167
- **PR/Bug references**: PR#15275, PR#15811, PR#16358, PR#16752, PR#17199, PR#17289, PR#17835, PR#17863, PR#17890, PR#18143, PR#18255, PR#18304, PR#18324, PR#18328, PR#18335, PR#18336, PR#18344, PR#18357, PR#18362, PR#18367, PR#18369, PR#18370, PR#18375, PR#18389, PR#18414, PR#18419, PR#18421, PR#18422 (x2), PR#18423, PR#18424, PR#18439, PR#18442, PR#18447, PR#18455, PR#18456, PR#18458, PR#18538, PR#18543, PR#18546, PR#18555, PR#18557, PR#18563, PR#18564, PR#18565, PR#18566, PR#18568, PR#18570, PR#18579, PR#18598, PR#18603, PR#18618, PR#18627, PR#18638, PR#18645, PR#18674, PR#18676, PR#18681, PR#18696, PR#18699, PR#18702 (x2), PR#18724, PR#18729, PR#18745, PR#18811, PR#18817, PR#18822, PR#18824, PR#18829, PR#18845, PR#18851, PR#18855, PR#18860, PR#18861, PR#18887, PR#18889, PR#18901, PR#18921, PR#18926, PR#18928 (x10+), PR#18931, PR#18936, PR#18946, PR#18973, PR#18996, PR#18999, PR#19001, PR#16750
- **R versions tested against**: Primarily R <= 4.2.x, R <= 4.3.x, R <= 4.4.x, R <= 4.5.x bugs
- **Statistical test functions present**: `fisher.test()` (line 108), `cor.test()` (line 331), `t.test()` (lines 1985-1997), `qqplot()` (lines 750-759)
- **Other notable function families**: `kappa()`/`rcond()`/`norm()`, `terms()`/`drop.terms()`/`reformulate()`, `as.data.frame()` variants, `cbind()`/`rbind()`, S4 methods/generics, `...` introspection API, `str()`, `format()`, `print()`
