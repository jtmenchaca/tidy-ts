# reg-tests-1a.R -- Comprehensive Test Summary

**Source file:** `reg-tests-1a.R` (4922 lines)
**Scope:** Regression tests for R up to PR#9999, covering R versions < 3.0.0
**Total test blocks:** ~280 distinct test blocks (counting each `stopifnot`, `try`, or assertion group as one block)

---

## R Functions / Topics Covered (with first-appearing line references)

| Function / Topic | First Line |
|---|---|
| `aggregate` / `aggregate.ts` | 19, 2888, 4847 |
| `aperm` | 23 |
| `append` | 71 |
| `array` | 76 |
| `as.POSIXlt` / `as.POSIXct` / `as.Date` | 82, 2863, 2887 |
| `autoload` | 91 |
| `axis` / `axTicks` | 96, 3631 |
| `backsolve` | 103 |
| `Bessel` (`besselI`, `besselK`, `besselY`) | 122, 4779 |
| `c` | 132 |
| `Cauchy` (`dcauchy`) | 138 |
| `chol` / `chol2inv` | 143, 177 |
| `col2rgb` | 183, 3177 |
| `colnames` / `rownames` | 194, 4440 |
| `Constants` (`pi`, `letters`, `month.abb`) | 201 |
| `cor` / `cov` (Spearman, Pearson, pairwise) | 214, 2656, 2975, 3651 |
| `DateTimeClasses` / `.leap.seconds` | 229 |
| `deriv` / `D` | 237 |
| `diff` / `diff.POSIXt` | 250, 4396 |
| `duplicated` / `unique` | 258, 1994, 3585 |
| `eigen` | 269, 977, 2183, 1801 |
| `euro` | 303 |
| `Exponential` (`dexp`, `rexp`) | 308 |
| `family` (Gamma) | 314 |
| `fft` / `mvfft` | 320 |
| `findInterval` | 335 |
| `fisher.test` | 822, 1531, 2754 |
| `format` / `formatC` / `prettyNum` | 370, 1514, 1839, 3993, 4029, 4402 |
| `Geometric` (`qgeom`, `pgeom`) | 378, 4095 |
| `glm` / `glm.fit` / `predict.glm` | 387, 864, 1209, 1434, 3224, 3556, 4212, 4409 |
| `Hyperbolic` (`sinh`, `cosh`, `tanh`, etc.) | 435 |
| `image` | 453, 1197, 3840 |
| `integrate` | 464 |
| `is.finite` / `is.nan` / `is.na` / `is.infinite` | 476 |
| `kronecker` | 523 |
| `list` / `pairlist` | 531 |
| `log` / `log2` / `log10` | 546 |
| `Logistic` (`plogis`, `dlogis`) | 556, 3238 |
| `Lognormal` (`qlnorm`, `plnorm`) | 566, 4636 |
| `lower.tri` / `upper.tri` | 572 |
| `make.names` | 578, 2326 |
| `mean` / `median` | 583, 4760 |
| `Multinomial` (`rmultinom`, `dmultinom`) | 589, 4604 |
| `Poisson` (`dpois`, `qpois`) | 612, 4115 |
| `qr` / `qr.solve` / `qr.Q` / `qr.R` / `qr.X` | 617, 631, 1314, 2148, 3858 |
| `quantile` | 656 |
| `rep` | 671, 4708 |
| `Round` (`trunc`, `round`, `ceiling`, `floor`) | 679, 1191, 2696, 2951 |
| `seq` / `seq.int` / `seq.POSIXt` | 690, 1379, 1779, 3312, 4768 |
| `sort` / `sort.list` / `order` | 700, 1372, 1688, 3644, 3971, 4328 |
| `substr` / `substring` | 718, 1055 |
| `svd` / `La.svd` | 726, 1361 |
| `Trig` (`sin`, `cos`, `atan`, `atan2`, etc.) | 743 |
| `Uniform` (`runif`, `punif`, `qunif`) | 769, 4246 |
| `unique` | 776 |
| `which.min` / `which.max` | 786, 4648 |
| `Wilcoxon` (`dwilcox`, `pwilcox`, `wilcox.test`) | 792, 1156 |
| `.Machine` | 8, 800 |
| `arima` / `arima0` / `predict.arima` | 815, 2524 |
| `splinefun` / `spline` / `interpSpline` | 830, 1451, 3243 |
| `ks.test` | 1142 |
| `chisq.test` | 2761, 3835 |
| `t.test` | 4527 |
| `cor.test` | 3651 |
| `power.t.test` | 2178 |
| `lm` / `predict.lm` / `lm.influence` | 855, 983, 1627, 2036, 2165, 2213, 3319, 4173 |
| `step` / `add1` | 855, 1818, 2411, 3736 |
| `aov` / `anova` / `model.tables` | 1704, 2486, 2987, 4422 |
| `manova` | 1305 |
| `loess` | 1785 |
| `hclust` / `cutree` / `as.dendrogram` | 2120, 2507, 2937 |
| `cmdscale` | 2494 |
| `princomp` / `prcomp` | 2517, 3893 |
| `density` | 3620, 4729 |
| `bw.SJ` | 4737 |
| `ecdf` | 3250 |
| `runmed` | 3577 |
| `optimize` / `uniroot` | 4554, 4576 |
| `acf` / `ccf` / `pacf` | 2198, 4232, 4584 |
| `ksmooth` | 1028 |
| `spec.pgram` / `spec.ar` | 2821 |
| `boxplot.stats` | 4522 |
| `ns` / `bs` / `predict.bs` | 2539, 2549 |
| `merge` / `merge.data.frame` | 1106, 1478, 2648, 4238, 4500 |
| `data.frame` / `rbind.data.frame` / `[<-.data.frame` | 848, 1010, 1496, 1506, 2063, 2930, 3007, 3954, 4600 |
| `read.table` / `read.fwf` / `scan` / `type.convert` | 884, 1036, 1257, 1348, 1900, 2707, 2899, 3404, 3844 |
| `gsub` / `sub` / `regexpr` / `grep` / `agrep` | 2673, 2980, 3501, 3945, 4446 |
| `rank` | 2023, 2570 |
| `table` | 2029 |
| `cumsum` / `cumprod` / `cummax` / `cummin` | 3054 |
| `det` / `determinant` | 2400 |
| `identical` | 1669, 4485 |
| `all.equal` | 1568, 4124 |
| `apply` | 3169 |
| `mapply` | 3902 |
| `sweep` | 4910 |
| `Binomial` (`qbinom`, `pbinom`, `dbinom`) | 2783, 3906, 4080 |
| `Negative Binomial` (`dnbinom`, etc.) | 4086 |
| `Beta` (`dbeta`, `pbeta`, `qbeta`) | 1244, 4102 |
| `Chi-squared` (`dchisq`, non-central) | 971 |
| `F distribution` (`df`, `qf`) | 4103, 4360 |
| `t distribution` (`pt`, `qt`) | 1234, 4118, 4334 |
| `Weibull` (`pweibull`) | 1527 |
| `Gamma` (`dgamma`, `pgamma`, etc.) | 4006 |
| `se.contrast` / `eff.aovlist` | 3450 |
| `influence.measures` / `rstandard` / `rstudent` / `dffits` / `cooks.distance` | 3920 |
| `pbirthday` | 4052 |
| `jitter` | 4692 |
| `max.col` | 4697 |
| `mle` (stats4) | 4509 |
| `unlink` (wildcards) | 4794 |
| `readBin` / `writeChar` | 1070, 4713 |
| `serialize` / `save` / `load` | 4014, 4686, 4886 |

---

## Test Blocks by Section

### Lines 1-17: Setup
| Lines | What | Details |
|---|---|---|
| 1-17 | File setup | Opens PDF device, sets `stringsAsFactors=FALSE`, stores `.Machine$double.eps` as `Meps`, checks env variables, defines `assertError` |

### Lines 18-20: aggregate (PR#376)
| Lines | What | Details |
|---|---|---|
| 19 | `aggregate` on `ts` | `aggregate(ts(1:20), nfreq=1/3)` -- regression for PR#376 |

### Lines 23-67: aperm
| Lines | What | Details |
|---|---|---|
| 25-30 | `aperm` dimnames | Checks dimnames are reordered correctly when permuting a 4x6 array |
| 32-34 | `aperm` with NULL dimnames | One dim has NULL names; checks permutation preserves structure |
| 36-39 | `aperm` named dimnames | Checks `names(dimnames())` are reordered |
| 41-43 | `aperm` mixed NULL/named dimnames | Checks names of dimnames with one NULL component |
| 45-47 | `aperm` resize=FALSE | `dim(aperm(x, c(2,1), FALSE)) == dim(x)` and dimnames are NULL |
| 49-66 | `aperm` type preservation | Integer, double, complex, character, list arrays: checks `aperm == t()` and type is preserved |

### Lines 70-72: append
| Lines | What | Details |
|---|---|---|
| 71 | `append` | `append(1:5, 0:1, after=3) == append(1:3, c(0:1, 4:5))` |

### Lines 75-78: array
| Lines | What | Details |
|---|---|---|
| 77 | `array` zero-length dim | `array(1:3, 0)` -- odd but valid |

### Lines 81-87: as.POSIXlt
| Lines | What | Details |
|---|---|---|
| 83-86 | `range`/`min`/`max`/`mean` on single POSIXlt | All should return the same value |

### Lines 90-92: autoload
| Lines | What | Details |
|---|---|---|
| 91 | `ls("Autoloads")` vs `.AutoloadEnv` | Must be identical |

### Lines 95-99: axis
| Lines | What | Details |
|---|---|---|
| 97-98 | `axis(side=4)` | Plots with custom axis labels |

### Lines 102-112: backsolve
| Lines | What | Details |
|---|---|---|
| 106-111 | `backsolve` | Tests forward/back substitution with transpose options; verifies `r %*% y == x` |

### Lines 115-117: basename/dirname
| Lines | What | Details |
|---|---|---|
| 116 | `dirname(character(0))` | Zero-length input |

### Lines 120-128: Bessel functions
| Lines | What | Details |
|---|---|---|
| 124-125 | `besselK` exponential scaling | `besselK(x,nu)*exp(x) / besselK(x,nu,expo=TRUE)` must be ~1 |
| 126-127 | `besselI` exponential scaling | Same pattern for `besselI` |

### Lines 131-134: c
| Lines | What | Details |
|---|---|---|
| 133 | `c` on lists | `c(ll, d=1:3)` == `c(ll, as.list(c(d=1:3)))` |

### Lines 137-139: Cauchy distribution
| Lines | What | Details |
|---|---|---|
| 138 | `dcauchy` | `dcauchy(-1:4) == 1/(pi*(1+(-1:4)^2))` |

### Lines 142-173: chol / chol2inv
| Lines | What | Details |
|---|---|---|
| 144-150 | `chol` basic and pivoted | `t(cm) %*% cm` recovers original matrix |
| 152-172 | `chol` with rank-deficient matrix | Tests pivoting on positive semi-definite matrix |
| 177-179 | `chol2inv` | `ma %*% chol2inv(cma)` == identity |

### Lines 182-190: col2rgb
| Lines | What | Details |
|---|---|---|
| 184-189 | `col2rgb` | Palette indices match named palette; hex color parsing; gray scale consistency |

### Lines 193-197: colnames
| Lines | What | Details |
|---|---|---|
| 195-196 | `rownames`/`colnames` on 0-column matrix | `do.NULL = FALSE` |

### Lines 200-210: Constants
| Lines | What | Details |
|---|---|---|
| 201-204 | Letter/month constants | `nchar(letters)==1`, `month.abb == substr(month.name,1,3)` |
| 206 | `pi` | `pi == 4*atan(1)` |
| 209 | Machin's formula | `pi/4 == 4*atan(1/5) - atan(1/239)` |

### Lines 213-227: cor / cov
| Lines | What | Details |
|---|---|---|
| 214-215 | `var(1)` | `is.na(var(1))` and `!is.nan(var(1))` |
| 217-219 | `cor` self-correlation | Must be <= 1 (failed in R <= 1.3.x on Linux/Solaris) |
| 222-227 | Spearman with NAs | `cor(X,X,method="spearman",use="complete")` with/without NA rows must match. Bug fix for <= 1.8.1 |

### Lines 229-233: DateTimeClasses
| Lines | What | Details |
|---|---|---|
| 230-232 | Leap seconds | Differences between consecutive leap seconds; at least 11 have 365-day gaps |

### Lines 236-246: deriv
| Lines | What | Details |
|---|---|---|
| 238-245 | `D` and `deriv` | Symbolic differentiation of `sin(cos(x+y^2))`; `deriv` with formula and function forms must match |

### Lines 249-254: diff
| Lines | What | Details |
|---|---|---|
| 251-253 | `diff` with lag and differences | `diff(x, lag=2)`, `diff(diff(x)) == diff(x, differences=2)` |

### Lines 257-265: duplicated
| Lines | What | Details |
|---|---|---|
| 261-264 | `duplicated` / `unique` | Unique elements; `duplicated(iris)[143]` is TRUE |

### Lines 268-299: eigen
| Lines | What | Details |
|---|---|---|
| 270-298 | `eigen` symmetric and non-symmetric | Verifies `sm %*% V == V %*% diag(lam)` and reconstruction. Compares symmetric vs non-symmetric solutions. |

### Lines 302-304: euro
| Lines | What | Details |
|---|---|---|
| 303 | `euro` / `euro.cross` | `euro == signif(euro,6)` and `euro.cross == outer(1/euro, euro)` |

### Lines 307-310: Exponential
| Lines | What | Details |
|---|---|---|
| 309 | `dexp` | `dexp(1, r) / (r*exp(-r))` must be ~1 |

### Lines 313-316: family
| Lines | What | Details |
|---|---|---|
| 315 | `Gamma()` link/inverse | `gf$linkfun(gf$linkinv(1:10)) == 1:10` |

### Lines 319-331: fft
| Lines | What | Details |
|---|---|---|
| 322-330 | `fft` / `mvfft` | Forward-inverse FFT recovery for N=1..130; `mvfft` matches column-wise `fft` |

### Lines 334-355: findInterval
| Lines | What | Details |
|---|---|---|
| 338-354 | `findInterval` | Equivalence with `N * ecdf(X)(tt)` and `rowSums(outer(tt, X, ">="))`; NA and Inf handling |

### Lines 357-366: fix
| Lines | What | Details |
|---|---|---|
| 360-364 | `fix(pi)` | `pi` must remain unchanged after `fix()` with `editor="cat"` |

### Lines 369-374: format
| Lines | What | Details |
|---|---|---|
| 371-373 | `prettyNum` with `big.mark` | Checks placement of `'` separator |

### Lines 377-383: Geometric distribution
| Lines | What | Details |
|---|---|---|
| 380-382 | `qgeom` / `pgeom` inverse | `qgeom(pgeom(qg, prob=.2), prob=.2) == qg` |

### Lines 386-431: glm / logLik
| Lines | What | Details |
|---|---|---|
| 389-395 | `glm` offset equivalence | `y1 - y2 ~ 1` vs `y1 ~ offset(y2)` give same coefficients |
| 397-425 | `glm` AIC correctness | Anorexia data; `AIC(model)` == `model$aic` |
| 427-430 | `logLik` lm vs glm | `logLik(lm(x~1))` == `logLik(glm(x~1))` including df attribute. Bug in 1.4.1 |

### Lines 433-449: Hyperbolic functions
| Lines | What | Details |
|---|---|---|
| 436-448 | `cosh`/`sinh`/`tanh`/`asinh`/`acosh`/`atanh` | Identity checks against exponential definitions; inverse function round-trips |

### Lines 452-460: image
| Lines | What | Details |
|---|---|---|
| 454-458 | `image` degenerate cases | 1x1 matrix, constant matrix, with breaks and oldstyle |

### Lines 463-472: integrate
| Lines | What | Details |
|---|---|---|
| 464-471 | `integrate` | `dnorm` from -1.96 to 1.96 (~0.95); `dnorm` over full real line (~1); `1/((x+1)*sqrt(x))` from 0 to Inf (~pi) |

### Lines 475-519: is.finite / is.nan / is.na / Inf arithmetic
| Lines | What | Details |
|---|---|---|
| 496-505 | `is.na`/`is.nan`/`is.finite` | Comprehensive checks on 0/0, Inf, NaN, NA |
| 506 | `is.nan(list(...))` | Must give error |
| 509-518 | Inf arithmetic | `lgamma(Inf)==Inf`, `Inf+Inf==Inf`, `Inf-Inf==NaN`, `exp(-Inf)==0`, `log(0)==-Inf`, `atan(Inf)==pi/2` |

### Lines 522-527: kronecker
| Lines | What | Details |
|---|---|---|
| 524-526 | `kronecker` | Scalar times matrix; block diagonal construction |

### Lines 530-542: list / pairlist
| Lines | What | Details |
|---|---|---|
| 534-541 | `is.list`/`is.pairlist`/`is.null` | Various conversions between list, pairlist, NULL |

### Lines 545-551: log
| Lines | What | Details |
|---|---|---|
| 546-550 | `log`/`log10`/`log2` | Base conversion equivalences; complex log identity; Euler's identity `1+exp(pi*1i) ~= 0` |

### Lines 554-562: Logistic distribution
| Lines | What | Details |
|---|---|---|
| 557-561 | `plogis`/`dlogis` | CDF formula check; `log(lower.tail=FALSE)` check |

### Lines 565-568: Lognormal
| Lines | What | Details |
|---|---|---|
| 567 | `qlnorm(plnorm(x))` round-trip | Must recover x within tolerance |

### Lines 571-574: lower.tri
| Lines | What | Details |
|---|---|---|
| 573 | `lower.tri` vs `upper.tri` | `lower.tri(ma) == !upper.tri(ma, diag=TRUE)` |

### Lines 577-579: make.names
| Lines | What | Details |
|---|---|---|
| 578 | `make.names(letters)` | Must return letters unchanged |

### Lines 582-585: mean
| Lines | What | Details |
|---|---|---|
| 584 | `mean` with 50% trim | `mean(x, trim=0.5) == median(x)` |

### Lines 588-608: Multinomial
| Lines | What | Details |
|---|---|---|
| 590-607 | `rmultinom`/`dmultinom` | Column sums == N; mean close to expected; `dmultinom` probabilities sum to 1 |

### Lines 611-613: Poisson
| Lines | What | Details |
|---|---|---|
| 612 | `dpois` | Evaluates at non-integer arguments |

### Lines 616-652: qr
| Lines | What | Details |
|---|---|---|
| 618-628 | `qr` complex case and rank-deficient | `qr.solve` with complex matrix; `qr.X(qr(X)) == X` for rank-deficient X |
| 632-652 | QR decomposition properties | `X == Q %*% R`, `crossprod(Qc) == I`, dimnames preservation |

### Lines 655-667: quantile
| Lines | What | Details |
|---|---|---|
| 657-666 | `quantile` | Exact equality with `sort(x)` at appropriate probabilities; interpolation formula with ties |

### Lines 670-675: rep
| Lines | What | Details |
|---|---|---|
| 671-674 | `rep` zero-length and `each` | `rep(letters, 0)` is `character(0)`; combined `each` and varying `times` |

### Lines 678-686: Round
| Lines | What | Details |
|---|---|---|
| 681-685 | `trunc`/`ceiling`/`floor`/`signif`/`round` | Relationships between rounding functions |

### Lines 689-696: seq
| Lines | What | Details |
|---|---|---|
| 691-695 | `seq` with `by` | Edge cases: `seq(3,3,by=pi)==3`, `seq(1,6,by=3)==c(1,4)` |

### Lines 699-714: sort
| Lines | What | Details |
|---|---|---|
| 701-713 | `sort`/`is.unsorted` | Quick vs shell sort equivalence; index.return; ties handling |

### Lines 717-722: substr
| Lines | What | Details |
|---|---|---|
| 719-721 | `substr` vs `substring` vs `strsplit` | Character extraction equivalence |

### Lines 725-739: svd
| Lines | What | Details |
|---|---|---|
| 727-738 | `svd` | Hilbert matrix 9x6; reconstruction `X == U D V'` and `D == U' X V`; simple 2-column case |

### Lines 742-766: Trigonometric functions
| Lines | What | Details |
|---|---|---|
| 744-765 | `sin`/`cos`/`atan`/`atan2`/`acos`/`asin`/`atan` | Symmetry, Euler formula `exp(ix) == cos(x)+i*sin(x)`, inverse roundtrips |

### Lines 768-772: Uniform distribution
| Lines | What | Details |
|---|---|---|
| 770-771 | `punif`/`dunif`/`runif` | `punif(u)==u`, `dunif(u)==1`, `runif(100,2,2)==2` (bug fix for <= 0.63.1) |

### Lines 775-782: unique
| Lines | What | Details |
|---|---|---|
| 777-781 | `unique` | Custom my.unique matches; `unique(iris)` has 149 rows |

### Lines 785-788: which.min / which.max
| Lines | What | Details |
|---|---|---|
| 786-787 | `which.min`/`which.max` | Zero-length result for empty/all-NA input |

### Lines 791-797: Wilcoxon distribution
| Lines | What | Details |
|---|---|---|
| 793-796 | `dwilcox`/`pwilcox` | Symmetry: `dwilcox(x,4,6)==dwilcox(x,6,4)`; CDF == cumulative sum of PMF |

### Lines 800-810: .Machine
| Lines | What | Details |
|---|---|---|
| 801-809 | Machine constants | Epsilon properties; `log2(xmax)==max.exp`; overflow to Inf |

### Lines 813-818: PR#640 -- arima0 diff bug
| Lines | What | Details |
|---|---|---|
| 815-817 | `arima0` with seasonal differencing | `diff.default` computed incorrect starting time |

### Lines 821-827: PR#644 -- fisher.test crash
| Lines | What | Details |
|---|---|---|
| 823-826 | `fisher.test` | 19x2 matrix that crashed on Windows in 1.2.x |

### Lines 829-843: PR#653 -- spline extrapolation
| Lines | What | Details |
|---|---|---|
| 831-843 | `splinefun(method="natural")` / `interpSpline` | Extrapolation must match when data is reflected; must match `interpSpline` |

### Lines 847-852: PR#698 -- data frame subsetting
| Lines | What | Details |
|---|---|---|
| 849-851 | `[.data.frame` with out-of-range logical | Must give error (didn't before 1.2.1) |

### Lines 855-860: PR#753 -- step
| Lines | What | Details |
|---|---|---|
| 857-859 | `step` with `data` argument | Variable lookup in `step` |

### Lines 863-881: PR#796 -- AIC in binomial glm
| Lines | What | Details |
|---|---|---|
| 865-874 | `glm` binomial AIC | `cbind(ncases,ncontrols)` vs proportion form must give same AIC (~236.9645) |
| 877-881 | `glm` binomial AIC with zeros | Lindsey example: AIC must be finite (was NaN before 1.2.1) |

### Lines 884-890: PR#802 -- scan crash
| Lines | What | Details |
|---|---|---|
| 887-889 | `scan` with `what=list(,,,)` | Must not segfault |

### Lines 893-913: Misc 1.2.x fixes
| Lines | What | Details |
|---|---|---|
| 894-896 | `t` on list array | `t(tmp) == aperm(tmp)` for list array |
| 900-913 | `...` and `rbind` context (PR#860) | Functions using `...` with `rbind` and `substitute` |

### Lines 916-930: scan / read.table with blank lines
| Lines | What | Details |
|---|---|---|
| 917-930 | `count.fields`/`scan`/`read.table` | Handling of blank lines in file; correct parsing of 3x3 data |

### Lines 933-946: PR#870-872
| Lines | What | Details |
|---|---|---|
| 934-937 | `as.numeric(" ")` etc | Must return NA (was not NA in 1.2.2) |
| 941-946 | `deparse` attribute names | Attribute names with spaces must deparse/source correctly |
| 950-962 | `match.arg` / `formals` | PR#872: `formals()` inside called function; printing defaults |

### Lines 965-968: PR#873 -- long formulas
| Lines | What | Details |
|---|---|---|
| 966-968 | `terms` with long formula | Formula with many `log()` calls; errored in 1.2.2 |

### Lines 971-974: PR#881 -- non-central chi-squared
| Lines | What | Details |
|---|---|---|
| 972-973 | `dchisq` non-central | `dchisq(c(7.1,7.2,7.3), df=2, ncp=20)` must be monotonically increasing |

### Lines 977-980: PR#882 -- eigen on 0x0 matrix
| Lines | What | Details |
|---|---|---|
| 978-979 | `eigen` on 0x0 matrix | Must not segfault |

### Lines 983-987: PR#979 -- expand.model.frame with subset
| Lines | What | Details |
|---|---|---|
| 984-987 | `expand.model.frame` | Must work when model was fit with `subset` |

### Lines 990-996: gzfile compression
| Lines | What | Details |
|---|---|---|
| 991-996 | `gzfile` compression | Writing 1:1000 in small pieces; file size must be < 2000 bytes |

### Lines 999-1000: PR#1010 -- plot.mts
| Lines | What | Details |
|---|---|---|
| 1000 | `plot(ts(matrix(...)), type="p")` | Must not error |

### Lines 1003-1007: readLines with ok=FALSE
| Lines | What | Details |
|---|---|---|
| 1004-1007 | `readLines` with `ok=FALSE` | Requesting more lines than available must give error |

### Lines 1010-1014: PR#1047 -- [<-.data.frame
| Lines | What | Details |
|---|---|---|
| 1011-1013 | `[<-.data.frame` with `lapply` | `test[] <- lapply(df, factor)` must work |

### Lines 1017-1025: PR#1048 -- dummy.coef
| Lines | What | Details |
|---|---|---|
| 1021-1024 | `dummy.coef` with Helmert contrasts | Must work with `z * I(x)` and `z * poly(x,1)` |

### Lines 1028-1033: PR#1050 -- ksmooth
| Lines | What | Details |
|---|---|---|
| 1030-1032 | `ksmooth` | `ksmooth(x,y, x.points=x)$y == y` (was doing unwanted smoothing) |

### Lines 1036-1052: scan line length / as.character formula
| Lines | What | Details |
|---|---|---|
| 1037-1043 | `scan` long lines | 20000-character line must be read fully |
| 1047-1051 | `as.character` on formula | Must not truncate long formulas |

### Lines 1055-1077: substr<- / readChar
| Lines | What | Details |
|---|---|---|
| 1056-1067 | `substr<-` | Replacement shorter/longer/exact match; last case was wrong in 1.3.1 |
| 1071-1076 | `readChar` | Reading from text file connection |

### Lines 1080-1103: predict / arima0
| Lines | What | Details |
|---|---|---|
| 1082-1084 | `predict.lm` intercept-only | Must not error |
| 1089-1102 | `predict.arima0` with `newxreg` | Matrix newxreg requirement fix |

### Lines 1105-1118: merge with NAs / POSIXct
| Lines | What | Details |
|---|---|---|
| 1106-1111 | `merge` with NA factor level | NA level must propagate correctly |
| 1114-1118 | `merge` with POSIXct | Row counts with `all=TRUE` |

### Lines 1121-1127: PR#1149 -- promax
| Lines | What | Details |
|---|---|---|
| 1122-1126 | `promax` rotation matrix | `loadings %*% rotmat == pm$loadings` |

### Lines 1129-1139: PR#1155 -- strptime yday
| Lines | What | Details |
|---|---|---|
| 1131-1138 | `strptime` with `%j` | Month/mday must be set when yday is supplied |

### Lines 1142-1177: PR#1004 / PR#1150 -- ks.test and wilcox.test
| Lines | What | Details |
|---|---|---|
| 1147-1154 | `ks.test` exact | Hollander & Wolfe example: D=0.6, p=15/286~0.0524. Rounding error fix. |
| 1160-1176 | `wilcox.test` confidence intervals | One-sample paired: p=0.0391, CI=(-0.786, -0.010), estimate=-0.46. Two-sample: p=0.2544, CI=(-0.76, 0.15), estimate=-0.305. Hodges-Lehmann estimators. |

### Lines 1179-1194: Range / integer / rounding fixes
| Lines | What | Details |
|---|---|---|
| 1180 | `range(numeric(0))` | Length must be 2 |
| 1185-1187 | `integer(0)` arithmetic | `integer(0) / (1:3)` must have length 0 |
| 1192-1193 | `round` on large numbers | `round(100000/3, -2) - 33300 == 0` |

### Lines 1197-1232: Various PR fixes (1160-1175)
| Lines | What | Details |
|---|---|---|
| 1198-1205 | `image` midpoint finding (PR#1160) | Non-uniform x-coordinates |
| 1210-1231 | `glm` Pearson residuals (PR#1175/1123) | Direct vs `residuals(type="pearson")`; sign consistency; link independence for saturated model |

### Lines 1234-1253: pt / cancor / qbeta / binomial null
| Lines | What | Details |
|---|---|---|
| 1235 | `pt(-Inf, 3, ncp=0)` | Must be 0 (was 0.5) |
| 1240 | `cancor` | 100x1 vs 100x3 matrices |
| 1245-1247 | `qbeta` (PR#1201) | `pbeta(qbeta(x, .143891, .05), .143891, .05)` round-trip |
| 1252-1253 | `glm` binomial null model (PR#1216) | `glm(y ~ 0, family=binomial)` must not error |

### Lines 1257-1302: type.convert / La.svd/eigen / predict with offset
| Lines | What | Details |
|---|---|---|
| 1258-1261 | `type.convert` integer overflow | 12345689 is integer; 12345689012 is double |
| 1271-1293 | `predict.glm` with offset (PR#1422 related) | `predict(fit, newdata, se=TRUE)` must work with offsets |
| 1297-1301 | PR#1267 hashing NaN | `unique(c(NaN, b))` must be consistent |

### Lines 1305-1345: manova / qr dimnames
| Lines | What | Details |
|---|---|---|
| 1306-1311 | `manova` intercept-only | `print` and `summary` must work |
| 1318-1345 | `qr.*()` dimnames | `qr.coef`, `qr.R`, `qr.qty`, `qr.fitted`, `qr.X` must preserve row/column names |

### Lines 1348-1404: Various PR fixes
| Lines | What | Details |
|---|---|---|
| 1349-1352 | `read.fwf` with `#` (PR#1297) | `comment.char=""` must prevent `#` interpretation |
| 1356-1358 | `abs` Math group dispatch | `abs(data.frame)` |
| 1362-1369 | `La.svd` integer args (PR#1363) | Must match `svd` |
| 1373-1376 | `order`/`sort.list` on NA_STRING | `sort` and `sort.list` must agree on NA placement |
| 1380-1383 | `seq` on large values | `length(seq(1024902010, 1024902025, by=1)) == 16` |
| 1387-1391 | `max`/`min` of complex(0) | Must error |
| 1395-1402 | `min`/`max` of NULL/integer(0) (PR#1283) | `min(NULL)==Inf`, `max(NULL)==-Inf` |
| 1406-1415 | `range()` / `c()` edge cases | `range() == range(numeric(0))`; `c()` is NULL |

### Lines 1418-1466: Various PR fixes (1431-1473)
| Lines | What | Details |
|---|---|---|
| 1419 | `persp` with numeric labels (PR#1431) | Must not segfault |
| 1435-1441 | `glm` start/offset (PR#1422) | `update` with `start=coef()` |
| 1444-1448 | `file.info()$isdir` (PR#1439) | Must be proper logical |
| 1451-1466 | `predict.*bSpline` extrapolation (PR#1473) | Derivatives 0-3 for both poly and B-spline representations |

### Lines 1469-1493: PR#902 / PR#1510 / PR#1524
| Lines | What | Details |
|---|---|---|
| 1470-1474 | Warning with 9000-char message (PR#902) | Must not segfault |
| 1479-1482 | `merge` with different by names (PR#1510) | `by.x != by.y` |
| 1486-1492 | `paste`/`unlist` names (PR#1524) | `names(unlist(list(aa=list(bb=1))))` is "aa.bb" |

### Lines 1496-1611: Data frame operations (PR#1530-1608)
| Lines | What | Details |
|---|---|---|
| 1496-1502 | `drop` consistency (PR#1530) | `DF[1,1:3]` vs `xx[,1:3]` |
| 1507-1511 | `rbind.data.frame` logical (PR#1536) | Must not convert logical to factor |
| 1515 | `prettyNum` leading comma (PR#1548) | `prettyNum(123456, big.mark=",") == "123,456"` |
| 1519-1520 | `cut.dendrogram` (PR#1552) | Must not error |
| 1523-1525 | `predict.smooth.spline` deriv | Length must match |
| 1527-1528 | `pweibull` large values | `pweibull(seq(1,50,...), 2, 3, log=TRUE) < 0` |
| 1531 | `fisher.test` total one (PR#1662) | `fisher.test(cbind(0, c(0,0,0,1)))` must not crash |
| 1534 | `complex(7)` modulus | `Mod(vector("complex",7)) == 0` |
| 1537-1538 | `hist.POSIXt` numeric breaks | Must not error |
| 1542-1543 | `poly` on matrix | `poly(x, degree=2)` on 10x3 matrix |
| 1548-1554 | `cut` with Inf (PR#1694) | `cut(c(-Inf,-10,0,10,Inf), c(-Inf,0,Inf))` must not produce NAs |
| 1558-1560 | `ls.str` on function env | Must not error |
| 1564-1565 | `all.equal.character` with NA (PR#1767) | Must not error |
| 1568-1572 | `all.equal` length mismatch | Must return single character string |
| 1576-1611 | Character/factor conversions in data frames (PR#1577/1608) | Multiple scenarios of `[[<-`, `$<-`, `merge` preserving character/factor type |

### Lines 1614-1694: Various fixes (pre-1.6.0 to 1.5.1)
| Lines | What | Details |
|---|---|---|
| 1615-1616 | Logicals in data frame | Must not convert to factor |
| 1619-1624 | Factor recycling in data.frame (PR#1713) | `data.frame(x=c("A","B"), y="C")` must recycle |
| 1629-1635 | Rank-deficient prediction | `predict(fit) == predict(fit, train)` |
| 1639-1643 | `terms` with duplicate names | Must error |
| 1647-1649 | `as.character.octmode` (PR#1759) | `as.character(0_oct) == "0"` |
| 1653-1658 | `unsplit` with list `f` (PR#1843) | Must recover original vector |
| 1669-1670 | `identical(NA, NaN)` | Must be FALSE |
| 1675-1678 | `predict` with `poly` (PR#1840) | Poly vs raw speed predictor must give same answer |
| 1683-1685 | `Ops.data.frame` (PR#1889) | `d > list(5)` must work |
| 1688-1696 | `order(na.last=NA)` (PR#1913) | Various edge cases: scalar, all-NA, decreasing |

### Lines 1698-1765: Various fixes (1.5.1 - 1.6.x)
| Lines | What | Details |
|---|---|---|
| 1699-1701 | `as.list` logical coercion (PR#1926) | Must not coerce to integer |
| 1704-1725 | Long `Error()` expression in `aov` (PR#1315) | Complex Error term formula |
| 1728-1731 | `as.character` expression truncation | Must not truncate at 60 chars |
| 1737-1755 | `Ops.ordered` / `Ops` with NextMethod | Comparison on ordered factors; chained `NextMethod` dispatch |
| 1758-1764 | `t()` on ts | Must drop ts class and tsp attribute |
| 1768-1770 | `NextMethod` from anonymous function (PR#1211) | Must error, not segfault |
| 1773-1776 | `cbind(NULL)` / `rbind(NULL)` | Must return NULL |

### Lines 1779-1998: Various fixes (1.6.0 - 1.6.2)
| Lines | What | Details |
|---|---|---|
| 1780-1782 | `seq.POSIXt` rounding | Length 4, not 5 |
| 1786-1792 | `loess` > 4 predictors | Must error, not segfault |
| 1796-1798 | `format.AsIs` on matrix | Must print |
| 1801-1807 | `eigen` dimnames (PR#2116) | Eigenvectors must not have irrelevant dimnames |
| 1810-1815 | `pretty` rounding (PR#1032) | Various edge cases |
| 1818-1824 | `add1` nonsensical scope | Error message must be clear |
| 1828-1831 | `stripchart` with NAs (PR#2018) | Must not error |
| 1835 | `is.ts(log(as.ts(1:10)))` (PR#2315) | Must be TRUE for integer ts |
| 1839-1843 | `formatC` rounding (PR#2299) | `formatC(99.9, 1, format="fg") == "100"` |
| 1847-1853 | `attr` partial matching | `attr(tmp, "n")` with "n" and "n.ch" attributes |
| 1868-1875 | `difftime` group generics (PR#2345) | `x+x`, `2*x`, `x<y` for difftime |
| 1879-1883 | `names` with `c()` (PR#2358) | `names(mm)[1]` is NA, not "NA" |
| 1887-1897 | `pmax` dimnames (PR#2357) | Must preserve partial dimnames |
| 1900-1919 | `type.convert` NA handling | Factor levels with "NA" string |
| 1922-1931 | Parse/pushback (PR#2396) | `pushBack` + `parse` on connection |
| 1935-1939 | `max.col` with NAs | NA row must give NA |
| 1943-1954 | `readLines` on CR-terminated files / pushback (PR#2469) | Mac OS line endings |
| 1958-1964 | `solve` dimnames | Colnames of `solve(A)` should be rownames of A |
| 1968-1972 | 0-length dimension subsetting (PR#2507) | `A[1, 0, 2]` must work |
| 1978-1983 | `cbind`/`rbind` with zero-length (PR#2541) | Must not fatal-error |
| 1987-1991 | `AIC` multiple objects (PR#2518) | `AIC(lm1, lm2, k=2)` |
| 1994-1998 | `unique` on ordered factor (PR#2591) | Must preserve ordered class |

### Lines 2001-2117: Various fixes (1.6.2 - pre-1.7.0)
| Lines | What | Details |
|---|---|---|
| 2002-2004 | Coercion of length-0 vectors (PR#2587) | Assigning NA to numeric(0) must stay numeric |
| 2009-2013 | `[<-` object bit | `I(TRUE)` must keep object bit after replacement |
| 2017-2020 | `inherits` for basic classes | `inherits(1:3, "integer")` must be TRUE |
| 2023-2026 | `rank` for character with NA | Must be numeric |
| 2029-2032 | `table` with NA factor levels | Must keep NA levels |
| 2036-2060 | `lm.influence` for mlm | Multivariate lm influence; hat values, coefficients, sigma, wt.res must match univariate |
| 2063-2117 | `rbind.data.frame` char/ordered/factor/AsIs | Extensive tests of type preservation when rbinding different column types |

### Lines 2120-2163: hclust / as.hclust / agnes
| Lines | What | Details |
|---|---|---|
| 2121-2144 | `hclust`/`as.hclust`/`agnes` consistency | Labels preservation, idempotency of `as.hclust`, cluster package comparison |
| 2148-2153 | `qr(LAPACK=TRUE)` pivoting (PR#2867) | Must actually pivot for rank-deficient matrix |
| 2157-2162 | `rownames<-`/`colnames<-` on 3D array | Must not error |

### Lines 2165-2241: Various fixes (1.7.0)
| Lines | What | Details |
|---|---|---|
| 2166-2175 | Predict on constant model (PR#2958) | `predict(lm(y~1), newdata)` must have correct length |
| 2178-2180 | `power.t.test(delta=NULL)` (PR#2993) | Must work |
| 2183-2186 | `eigen` 1x1 matrix (PR#3221) | Eigenvectors must be a matrix |
| 2190-2195 | `[[<-.data.frame` with POSIXlt | Assignment of POSIXlt to data frame column |
| 2198-2204 | `pacf` on n x 1 matrix | Must work even though `is.matrix(z)` is TRUE |
| 2207-2210 | `lsfit` rank 0 residuals | Must return actual residuals, not zeros |
| 2214-2217 | `predict.lm` type="terms", interval="confidence" | Must not error |
| 2220-2224 | 0-level factors | `sort(factor(numeric(0)))` and `unique` must work |
| 2228-2229 | `data` with multiple inputs | `data(cars, women)` must work |
| 2233-2240 | `body()` and `formals()` lookup (related) | Must look in same environment |

### Lines 2243-2297: String NA handling (PR#3078)
| Lines | What | Details |
|---|---|---|
| 2244-2288 | Comprehensive string NA tests | `substr`, `substring`, `sub`, `gsub`, `agrep`, `grep`, `abbreviate`, `chartr`, `strsplit`, `toupper`/`tolower`, `nchar` -- all must distinguish `NA` from `"NA"` |
| 2292-2297 | Coercing 0-length generic vectors | `as.double(list())`, `as.integer(list())`, etc. |

### Lines 2300-2308: help on reserved words
| Lines | What | Details |
|---|---|---|
| 2303-2307 | `?` and `help()` on `TRUE`, `FALSE`, `NULL`, `NA`, `Inf`, `NaN`, `NA_integer_`, etc. | Must not error |

### Lines 2311-2392: Various fixes (1.7.x)
| Lines | What | Details |
|---|---|---|
| 2312-2316 | Row names in data.frame | Recycling with named vector |
| 2320-2321 | Empty `paste` | `paste(character(0), character(0))` length 0 |
| 2326-2333 | `make.names` concatenation | Must be associative with `unique=TRUE` |
| 2337-2339 | `data.frame(check.names=FALSE)` (PR#3280) | Names like "a*" must be preserved |
| 2344-2351 | `contrasts` with `get()` | Must find function in local scope |
| 2354-2357 | `get`/`exists` mode checking | `exists(".Device", mode="function")` must be FALSE |
| 2360-2364 | Recursive indexing (PR#3324) | `x[[c("c","d")]]` must error, not segfault |
| 2367-2373 | Empty indexing of data frames (PR#3532) | `x[numeric(0)]` must work |
| 2376-2384 | `.Random.seed` scoping | Must use global env, not search path |
| 2388-2390 | `qqnorm` with NAs (PR#3750) | Must preserve NAs in result |
| 2394-2397 | `round` on length-0 POSIX (PR#3763) | Must not give floating point exception |

### Lines 2400-2404: det / determinant
| Lines | What | Details |
|---|---|---|
| 2401-2403 | `det`/`determinant` on singular matrix | `det(m)==0`, `determinant(m)$mod==-Inf` |

### Lines 2407-2491: Non-syntactic names in model fitting
| Lines | What | Details |
|---|---|---|
| 2408-2476 | `lm`/`step`/`add1`/`aov` with backtick names | Swiss data with "Infant Mortality"; Quine data with "Slow or fast"; `npk` with "block no" |

### Lines 2494-2560: cmdscale / cutree / princomp / arima / splines
| Lines | What | Details |
|---|---|---|
| 2496-2503 | `cmdscale` with `add=TRUE` | k=1 vs k=20 must give same first coordinate |
| 2507-2513 | `cutree` | Multiple heights including 0 and max |
| 2517-2521 | `princomp` with NAs and update | `na.action=na.exclude` |
| 2525-2536 | `arima`/`arima0`/`predict.arima` | `tsdiag`; prediction with differencing |
| 2539-2559 | `ns`/`bs`/`predict.bs`/`predict.ns` | Consistency: `predict(basis) == predict(basis, newx=wh)` |

### Lines 2562-2601: Various fixes (pre-2.0.0)
| Lines | What | Details |
|---|---|---|
| 2563-2567 | `coerceVector` internal | Must error, not segfault |
| 2571-2580 | `rank` name preservation | Names must be preserved for all `na.last` options |
| 2584-2586 | `as.dist` with `diag=TRUE` | Must set Diag attribute |
| 2588 | `ave` with unused factor levels | Must drop unused levels |
| 2593-2601 | 1D array `crossprod` (PR#4092) | Must not segfault |

### Lines 2604-2715: Various fixes (1.8.0 - 1.9.0)
| Lines | What | Details |
|---|---|---|
| 2605 | `rmultinom` with zero probabilities (PR#4431) | Must not produce NAs |
| 2610-2617 | `getAnywhere` with extra dots (PR#4275) | Must find S3 methods |
| 2621-2625 | `symnum` on logical/0-length | Must work |
| 2629-2630 | `abbreviate` with leading spaces (PR#4564) | Must not infinite-loop |
| 2634-2638 | `crossprod` on 0-extent matrices | Must return zero matrix |
| 2642-2645 | `DF[[i,j]]` | Must be row i, col j |
| 2649-2653 | `merge` single-column df (PR#4299) | Column names must be correct |
| 2658-2670 | `cor(mat, use="pairwise")` | Must match "complete" and default for data without NAs |
| 2674-2678 | `regexpr` fixed=TRUE | Indices must be 1-based |
| 2682-2684 | `filter(init=)` time order (PR#5017) | Must use correct initial value order |
| 2688-2693 | `writeChar` user error (PR#5090) | Must not segfault |
| 2697-2699 | `round` on 0-extent matrix (PR#4710) | Must preserve dim |
| 2703-2704 | `stepfun` empty (PR#5405) | Must error, not segfault |
| 2708-2715 | `read.table` embedded newlines (PR#4955) | Quoted fields with `\n` |

### Lines 2718-2810: Various fixes (1.8.x - 1.9.0)
| Lines | What | Details |
|---|---|---|
| 2719-2736 | Model frame scoping | `model.matrix(m)` where `rep` is a local variable |
| 2740-2750 | `strptime` invalid dates | Must return NA for invalid month/day |
| 2754-2758 | `fisher.test` workspace (PR#4688) | Must give proper error, not Inf p-value |
| 2762-2763 | `chisq.test` simulate infinite loop (PR#5701) | Must not infinite-loop on constant matrix |
| 2767-2771 | `as.matrix` on logical data frame | Must keep logical mode |
| 2775-2780 | `outer` with POSIXct | Must preserve class |
| 2784-2791 | `qbinom` at boundary (PR#5900) | `qbinom(0.95, 10, 1)==10`, size=0 case |
| 2795-2797 | `base::` and `:::` scoping | Must error for wrong package |
| 2801-2805 | `princomp` prediction without centers (PR#6452) | Must give NAs |
| 2809-2810 | `sub` coercion (PR#6451) | `sub(x=NA, ...)` must work |

### Lines 2813-2958: Various fixes (1.8.1 - 1.9.1)
| Lines | What | Details |
|---|---|---|
| 2814-2818 | `length<-` on factor | Must preserve factor class |
| 2822-2831 | `spec.pgram` accuracy | `mean(spP$spec/spA$spec)` must be ~1 |
| 2835 | POSIXct "1970-01-01" | Must not be NA |
| 2840-2847 | `split.default` on factors (PR#6672) | NAs must be excluded |
| 2851-2859 | `points.formula` with subset (PR#6652) | `col` argument handling |
| 2863-2865 | `seq.POSIXt` by DSTdays (PR#4558) | Length must be 7 |
| 2869-2874 | `cbind`/`rbind` on list matrices (PR#6702) | Must produce list result |
| 2878-2884 | Date objects with NAs | `summary` must work |
| 2887-2889 | `as.Date` on factor | Must work |
| 2893-2896 | `as.data.frame.list` (PR#6782) | row.names in names must be preserved |
| 2900-2902 | `type.convert` with na.strings (PR#6781) | `-` as NA string |
| 2906-2908 | Factor attribute order (PR#6799) | `af == af[1:2]` must be identical |
| 2912-2915 | Comparison on lists/expressions | Must error |
| 2919 | `approx` with NaN (PR#6809) | Must not segfault |
| 2924-2927 | `aggregate.data.frame` one-row result | Must not error |
| 2930-2934 | `[<-.data.frame` with df value | Must work |
| 2937-2948 | `as.dendrogram.hclust` order | `order.dendrogram` must match `hclust$order`; `rev(rev(d))` is identity |
| 2952-2957 | `trunc` on Date | Must truncate toward negative infinity, not toward zero |

### Lines 2962-3004: Fixes for 1.9.1 patched
| Lines | What | Details |
|---|---|---|
| 2965-2966 | `options(list(...))` | Must error, not segfault |
| 2970 | `list.files` recursive (PR#7100) | Must not crash on deep paths |
| 2975-2977 | `cor` 1D array (PR#7116) | `cor(array, matrix)` must be symmetric |
| 2981-2984 | `gsub` perl=TRUE (PR#7108) | Must not return NULL or segfault |
| 2988-2995 | `aov`/`anova`/`model.tables` (PR#7132) | Nested factors |
| 2997-3001 | `Surv` object subsetting | str/print with repetition |

### Lines 3007-3064: Names in data frame columns / cumsum
| Lines | What | Details |
|---|---|---|
| 3008-3051 | Names in data frame columns | Various assignment methods must strip names from numeric/factor columns; AsIs and matrix columns must preserve them; rbind must preserve matrix dimnames |
| 3054-3099 | `cumsum`/`cumprod`/`cummax`/`cummin` | Name preservation; NA propagation for double, complex, integer |

### Lines 3101-3148: Complex superassignments
| Lines | What | Details |
|---|---|---|
| 3102-3148 | `<<-` with complex indexing | Nested list/matrix super-assignments; checks no cycles created |

### Lines 3151-3207: Various fixes (1.9.x - 2.0.0)
| Lines | What | Details |
|---|---|---|
| 3152-3156 | `model.frame` ts attributes | Must not preserve ts class in model frame |
| 3160-3166 | Recursive assignment range checks (PR#7196) | `l[[2:3]] <- 1` on too-short list must error |
| 3170-3174 | `apply` 3D with named result (PR#7205) | Must work |
| 3178 | `col2rgb("red")` | Must return matrix |
| 3183-3207 | Matrix subscript with NAs | Assignment with NA indices; only length-1 values allowed in >= 2.0.0 |

### Lines 3210-3233: Various fixes (1.9.1 - 2.0.0)
| Lines | What | Details |
|---|---|---|
| 3211-3212 | `hist` with Inf (PR#7220) | Must work (with warning) |
| 3216-3221 | `merge`/`rbind.data.frame` names | Column name handling |
| 3225-3235 | `glm` matrix response names | Must preserve names from `y` |
| 3239 | `dlogis(-2000)` | Must be 0, not NaN |

### Lines 3243-3268: Various fixes (2.0.0)
| Lines | What | Details |
|---|---|---|
| 3244-3247 | `splinefun` short vectors (PR#7290) | Length-0 must not segfault; length-1 must return constant |
| 3251-3253 | `ecdf` with NAs (PR#7292) | Must work |
| 3257-3258 | `as.Date("2001", "%Y")` | Must not segfault |
| 3262-3273 | `rank`/`order`/`sort` invalid inputs | Lists and raw must error |

### Lines 3276-3498: Various fixes (2.0.0 - 2.1.0)
| Lines | What | Details |
|---|---|---|
| 3277-3278 | `pmax` with NAs | `pmax(c(1,2,NA), c(3,4,NA), na.rm=TRUE)` |
| 3282-3286 | Expression subassignment (PR#7326) | Must not segfault |
| 3290-3292 | `sum` arg matching | `sum(1:4, NA, n=78, na.rm=TRUE)` == 88, not 11 |
| 3296-3299 | `text` segfault | `text(list(5,6), labels="a")` must error, not segfault |
| 3303-3309 | Number-like row.names | `write.table`/`read.table` round-trip |
| 3313-3316 | `seq` integer return | `seq(length=3)` must return `1:3` as integer |
| 3320-3327 | `labels.lm` (PR#7417) | Must return correct labels |
| 3331-3334 | `sprintf` overrun (PR#7554) | Must not segfault |
| 3338-3344 | `all`/`any` character coercion | `all("TRUE")` must work |
| 3347-3384 | Named dimnames in `%*%` and `crossprod` | Comprehensive tests with matrices and 1D arrays |
| 3387-3393 | `eval` with NULL environment | `eval(quote(y), NULL)` must work |
| 3396-3401 | Data frame replacement with nothing to replace | `A[is.na(A)] <- 0` on data frame with no NAs |
| 3404-3415 | `scan` on partial lines | Must read across line boundaries correctly |
| 3418-3420 | `formatC` invalid flag (PR#7686) | Must error, not segfault |
| 3424-3431 | `contrasts` integer coercion (PR#7695) | Must coerce to double |
| 3434-3437 | Extreme log axis range | De-normalized doubles |
| 3441-3447 | `scan` with `allowEscape` | Quoted strings with embedded quotes |
| 3450-3498 | `se.contrast` / `eff.aovlist` | One-stratum design; orthogonal vs non-orthogonal contrasts; efficiency calculation |

### Lines 3501-3544: Regex / dist / colSums / summary
| Lines | What | Details |
|---|---|---|
| 3502-3532 | `sub`/`gsub` various fixes (PR#7742) | Character coercion; `perl=TRUE` boundary cases; `^` anchoring; zero-width matches |
| 3535-3536 | `dist` length 0 | `dist(matrix(0,0,1))` must work |
| 3540-3543 | `colSums`/`rowSums` on 0-extent matrix (PR#7775) | Must work |
| 3548-3549 | `summary` on AsIs matrix | Must not infinite-recurse |

### Lines 3554-3611: Fixes for 2.1.1
| Lines | What | Details |
|---|---|---|
| 3557-3561 | `predict.glm` names (PR#7792) | Must preserve names |
| 3565-3569 | `as.data.frame` error (PR#7808) | Complex array subsetting |
| 3573 | `as.personList` (PR#7797) | "Roeland" must not be chopped |
| 3578-3582 | `runmed` Turlach algorithm | Must match Stuetzle and not segfault |
| 3586-3589 | `duplicated`/`unique` on list | Must work |
| 3593-3603 | `proj` on aovlist with row.names | Must not error |
| 3607-3610 | Log plot reversed axis (PR#7894) | Must not error |

### Lines 3615-3671: Fixes for 2.1.1 patched
| Lines | What | Details |
|---|---|---|
| 3616-3617 | `regexpr` with MBCS and NA | Must not crash |
| 3621-3623 | `density` with Inf (PR#8033) | Must give correct values |
| 3625-3626 | `Arg(-1)` | Must be pi |
| 3630-3632 | Reversed log-scaled axis (PR#7973) | `axTicks` must return values |
| 3636-3641 | `window.default` rounding (Iacus) | Various `deltat` values |
| 3645-3648 | `order` with `na.last=FALSE` | NAs must sort first |
| 3652-3654 | `cor.test` Spearman overflow (PR#8087) | n=46341; p-value must not be NA |
| 3658-3668 | `seek` on file (PR#7896) | Read/write position tracking |

### Lines 3675-3721: Fixes for 2.2.0
| Lines | What | Details |
|---|---|---|
| 3676-3683 | Hexadecimal constants | `0xAbc == 2748`; `as.integer("0xAbc")` |
| 3687-3694 | `save`/`load` raw vector on big-endian | Must round-trip correctly |
| 3699-3701 | S4 class with `expression()` slot (PR#7922) | Must work |
| 3705-3708 | `Ops.data.frame` check.names | Must not prepend X to numeric column names |
| 3712-3716 | `sum` integer type | `typeof(sum(1:10)) == "integer"` |
| 3720-3722 | `PrintGenericVector` overflow | 5000-element list must not segfault |

### Lines 3725-3821: Fixes for 2.2.0 (continued)
| Lines | What | Details |
|---|---|---|
| 3727-3733 | `weighted.residuals` for glm (PR#7961) | Must match lm result |
| 3737-3755 | `add1.lm`/`add1.glm` with missing values (PR#8049) | Must not error |
| 3759-3772 | `levels<-.factor` attribute preservation | Must not drop other attributes |
| 3776-3778 | `format` 0-row matrix | Must preserve dim |
| 3782-3787 | `ls.diag` with missing values (PR#8139) | Must not fail |
| 3791-3795 | `window.default` tolerance | Must use appropriate tolerance |
| 3799-3802 | Subassign length-0 to NULL (PR#8157) | Must work |
| 3806-3818 | Raw in data frames and lists | Various assignment patterns |

### Lines 3824-3940: Fixes for 2.2.1
| Lines | What | Details |
|---|---|---|
| 3825-3831 | `summary.matrix` on Surv class | Must not infinite-recurse |
| 3835-3837 | `chisq.test` simulate fuzz | p-value near boundary |
| 3841 | `image` all-NA matrix (PR#8228) | Must not error |
| 3845-3850 | `read.fwf` header (PR#8226) | Must work |
| 3853-3855 | `diag` with NA dimnames | Must not error |
| 3859-3880 | Pivoted decomposition colnames (PR#8258) | `qr`, `qr(LAPACK=TRUE)`, `chol(pivot=TRUE)` must preserve colnames after unpivoting |
| 3884 | `Im(-1)` (PR#8272) | Must be 0, not same as `Arg` |
| 3889-3890 | `aggregate.ts` rounding | Must not error |
| 3894-3899 | `prcomp(tol=)` (summary) | `summary` must work when `tol` trims components |
| 3903-3904 | `mapply` MoreArgs type | Must error, not segfault |
| 3908-3910 | `qbinom` with `log.p=TRUE` | `-Inf` must give finite result |
| 3914-3917 | `t()` with NULL dimnames | Must preserve NULL dimnames structure |
| 3920-3938 | Infinite influence measures (PR#8367) | `rstandard`/`rstudent`/`dffits`/`covratio`/`cooks.distance` must give NaN not Inf; `plot.lm` on glm |

### Lines 3945-3998: Fixes for 2.2.1 patched - 2.3.0
| Lines | What | Details |
|---|---|---|
| 3946-3951 | `sub(fixed=TRUE)` trailing bytes | Must not have random bytes |
| 3955-3960 | `rbind.data.frame` with 0 rows (PR#8506) | Dimensions must be correct |
| 3963-3966 | `all.equal` on glm | Must not fail on recursive environment |
| 3972-3990 | `sort` attribute/name handling | Must drop tsp; must sort names (except partial) |
| 3994-3996 | `formatC` on `as.single` (PR#8211) | Must return "1" |

### Lines 4000-4071: Fixes for 2.3.0
| Lines | What | Details |
|---|---|---|
| 4001-4003 | `outer` on factors | Must work |
| 4007-4011 | `dgamma`/`pgamma`/`qgamma`/`rgamma` negative shape | Must return NaN |
| 4015-4017 | `serialize` function with local env | Must work |
| 4021-4026 | `dummy_vfprintf` overlong format | Must not segfault |
| 4030-4040 | `format`/`formatC` with marks | Big mark and small mark formatting; width adjustment |
| 4044-4050 | `data.matrix` zero-length columns | Must be numeric |
| 4052-4054 | `pbirthday` | Edge cases: `pbirthday(950, coincident=250)==0` |
| 4058-4071 | Raw matrices (PR#8529/30) | `rbind`/`cbind`/`[<-` on raw matrices |
| 4075-4077 | `window` non-overlapping with `extend=TRUE` (PR#8545) | Must work |

### Lines 4080-4161: Distribution edge cases and misc
| Lines | What | Details |
|---|---|---|
| 4081-4083 | `pbinom(size=0)` (PR#8560) | Must return correct values, not NaN |
| 4087-4099 | `dnbinom`/`pnbinom`/`qnbinom`/`rnbinom`/`dgeom`/`pgeom`/`qgeom`/`rgeom` limits | Boundary p=0, p=1 |
| 4103-4121 | `df`, `dbeta`, `pbeta`, `qnbinom`, `qpois`, `pt` edge cases | Zero args; underflow; infinite loop prevention; extreme tails |
| 4125-4128 | `all.equal.numeric` overflow | Large integers must not produce NA |
| 4132-4134 | `for` loop over raw | Must work |
| 4138-4139 | `as.list` on symbol | Must work |
| 4143-4149 | `min`/`max` INT_MAX (PR#8731) | Must handle `.Machine$integer.max` |
| 4159-4161 | `apply` NULL result | Must work |
| 4165-4171 | `sum` on data frame (PR#8385) | Various calling patterns |

### Lines 4173-4228: plot.lm / misc
| Lines | What | Details |
|---|---|---|
| 4174-4183 | `plot.lm` all 6 which values | Including leverage plot (which=5) |
| 4187-4194 | `rbind.data.frame` row names (re-fix PR#8506) | Must preserve row names |
| 4198-4199 | `mean(NA)` | Must return NA (was not NA in 2.3.0) |
| 4203-4209 | `title` with length > 1 args | `col`, `cex`, `lty`, `lwd`, `bg` of length > 1 |
| 4213-4217 | `glm` array offset | Must accept array offset |
| 4222-4228 | `bindingIsLocked` | Must return proper logical values |

### Lines 4232-4268: Various fixes (2.3.0 - 2.4.0)
| Lines | What | Details |
|---|---|---|
| 4232-4235 | `ccf` non-aligned ts | Must work |
| 4240-4243 | `merge` Cartesian product names | Must make unique |
| 4247-4254 | `punif`/`qunif` Inf range and zero range | Must return NA or correct boundary values |
| 4258-4262 | `cbind` coercion to list | Must not segfault |
| 4266-4267 | `xy.coords(numeric(0))` | Must not error |
| 4271-4274 | `[<-` on ts | Must not corrupt tsp |

### Lines 4286-4392: Fixes for 2.4.0
| Lines | What | Details |
|---|---|---|
| 4287-4296 | `model.frame`/`model.matrix` with complex/raw/character | Complex response OK; complex/raw on RHS must error |
| 4300-4308 | `stringsAsFactors` | Data frame creation with `stringsAsFactors=FALSE` |
| 4313-4325 | `environment<-` duplication | Must not modify original |
| 4329-4331 | `sort.list` radix on factor | Must work |
| 4335-4337 | `qt` bisection search (PR#9050) | `qt(pt(x,df=20,ncp=1),df=20,ncp=1)` round-trip |
| 4341-4345 | `poly` raw argument | Must pass `raw` to `polym` |
| 4349-4357 | `plot.xy` type "s"/"S" (PR#9046) | Step plots must work |
| 4361-4363 | `qf` large df2 | `ncp=0` must match without ncp |
| 4367-4381 | `as.vector`/`as.list` regression | Name preservation for lists, pairlists, expressions |
| 4385-4392 | Array subsetting attributes | Must drop custom attributes (but not for `x[]`) |

### Lines 4396-4498: Fixes for 2.3.1 - 2.4.0
| Lines | What | Details |
|---|---|---|
| 4396-4399 | `diff` for POSIXt | `diff(POSIXct)` vs `diff(POSIXlt)` must agree |
| 4403-4406 | `format(trim=TRUE, big.mark=",")` (PR#9118) | Must trim correctly |
| 4410-4420 | `residuals.glm` without y (PR#9124) | All residual types must work with `y=FALSE` |
| 4424-4429 | `anova.mlm` (regression) | Must work |
| 4432-4437 | `stopifnot` long expression | Must not duplicate TRUE in message |
| 4441-4444 | `rownames` on 0x0 matrix (PR#9136) | Must return `character(0)` |
| 4448-4473 | `grep(value=TRUE)` names | Must preserve names, including for `perl=TRUE`, `agrep`, and NA patterns |
| 4477-4482 | `max.print` option | Must print exactly the right number of lines |
| 4486-4489 | `identical` pairlist names / attribute order | Must check names; must not depend on attribute order |
| 4494-4497 | Failed subassign `*tmp*` cleanup | Must not leave `*tmp*` in global env |

### Lines 4500-4551: Fixes for 2.4.1
| Lines | What | Details |
|---|---|---|
| 4501-4505 | `merge` zero-row data frame | Must work |
| 4509-4514 | `mle` parameter order (PR#9313) | Must give same result regardless of start order |
| 4518-4519 | `rbind` data.frame + list (PR#9446) | Must not error |
| 4523-4524 | `boxplot.stats` with Inf | Must not error |
| 4528-4531 | `t.test` one-sample group | `t.test(x=x[1], y=x[-1], var.equal=TRUE)` must work |
| 4535-4536 | Corrupted ts object | `structure(1:3, class="ts")` must print |
| 4540-4549 | `rm` (PR#9399) | `rm(x1)` where x1="x2" must remove x1, not x2; `rm(c("a","b"))` must error |

### Lines 4554-4791: Fixes for 2.5.0 - 2.5.1
| Lines | What | Details |
|---|---|---|
| 4555-4561 | `optimize` translation error (PR#9438) | Must find correct maximum |
| 4565-4573 | Subassignment type coercion | Expression/raw/character subassignment must work |
| 4577-4581 | `uniroot` at boundary | Must work when root is at interval endpoint |
| 4585-4588 | `acf(lag.max=0)` / `ccf` sign (PR#9360/9394) | Must not error; lag-0 cross-correlation sign correct |
| 4592-4597 | Complex `sum`/`prod` | Must give correct result |
| 4601-4610 | 0-row data frame from `read.table` | `rbind` combinations must work |
| 4614-4626 | `attr` partial matching | Multiple attributes with shared prefix |
| 4630-4633 | `which(arr.ind=TRUE)` empty | Must return 0-row matrix |
| 4637-4638 | `plnorm` lower.tail (PR#9520) | `plnorm(0, lower.tail=FALSE)==1` |
| 4642-4645 | `supsmu` all-NA (PR#9519) | Must not segfault |
| 4649-4651 | `which.max`/`which.min` with Inf (PR#9522) | Must find position |
| 4656-4659 | `str.dendrogram` with `max.level=NA` | Must not error |
| 4663-4666 | `[<-.data.frame` delete last column (PR#9565) | Must work |
| 4669-4671 | `try` with anonymous function | Must work |
| 4675-4676 | `choose(11,6)` | Must be exactly 462 |
| 4680-4683 | `strptime` %j format (PR#9577) | Day 32 must not be NA |
| 4688-4689 | `mosaicplot` sort | Must work |
| 4693-4694 | `jitter` (PR#9580) | Must not produce NaN |
| 4698-4705 | `max.col` ties (PR#9542) | Must be random, not always last |
| 4709-4710 | `rep(each=0, length.out=1)` | Must not segfault |
| 4714-4726 | `readBin` beyond raw vector end | Must not read past end |
| 4730-4734 | `density` negative values (PR#8876) | Must be >= 0 |
| 4738-4740 | `bw.SJ` search interval | Must not error on `1:20` |
| 4744-4745 | Hex integer `0x10L` (PR#9648) | Must be 16L |
| 4749-4751 | `rbind` 0-row data frame only (PR#9657) | Must work |
| 4755-4757 | `factor` with NA in dimnames | Must not segfault |
| 4761-4765 | `median` return type | `median(integer(0))` must be `NA_integer_`, `median(numeric(0))` must be `NA_real_` |
| 4769-4770 | `seq.int` reversed `by` | Must error |
| 4774-4776 | Pairlist subassignment to NULL | Must not segfault |
| 4780-4789 | Bessel for nu < 0 | Scaling identity and numerical correctness |

### Lines 4794-4823: unlink wildcards
| Lines | What | Details |
|---|---|---|
| 4795-4822 | `unlink` with `?` and `*` wildcards | File and directory deletion patterns on various OSes |

### Lines 4826-4918: Fixes for 2.6.0
| Lines | What | Details |
|---|---|---|
| 4827-4831 | Duplicated column names in data frame | Must access correct column |
| 4837-4843 | `predict.glm` with numeric factor levels | Must work |
| 4847-4861 | `aggregate.data.frame` type preservation | Factor/ordered/character grouping variables must preserve type |
| 4865-4870 | `formals<-` with NULL body (PR#9758) | Must preserve all formals |
| 4874 | `R.version` subsetting | Must return simple.list |
| 4878-4882 | `[[` on data frame with character row | `swiss[["Broye", "Agriculture"]]` must work |
| 4886-4898 | `save`/`load` raw vector ASCII | Must round-trip correctly |
| 4901-4907 | `match.arg` multiple values (PR#9859) | `several.ok=TRUE` must match subset |
| 4911-4913 | `sweep` 0-extent matrix | Must work |
| 4917-4918 | `julian` with POSIXlt origin (PR#9908) | Must work |

### Lines 4920-4922: File end
| Lines | What | Details |
|---|---|---|
| 4920 | Note | Continued in `reg-tests-1b.R` |
| 4922 | `proc.time()` | Timing |
