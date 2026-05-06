# Distribution edge case tests from d-p-q-r-tst-2.R
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../../statistical_tests/source-tests/r-json-emit.R"))

# -- L48-92: Extreme tail tests --
# pexp
pexp_extreme <- pexp(c(1e1, 1e5, 1e10, 1e100, 1e300))
# pgamma
pgamma_extreme <- pgamma(c(1e1, 1e5, 1e10, 1e100, 1e300), shape = 2)
# pt
pt_extreme <- pt(-c(1e1, 1e5, 1e10, 1e100, 1e300), df = 5)
# pbinom
pbinom_extreme <- pbinom(c(0, 5, 10), size = 100, prob = 0.01)
# pgeom
pgeom_extreme <- pgeom(c(0, 10, 100, 1000), prob = 0.5)

# -- L95-99: dt with large x and log (was -Inf in R <= 2.15.2) --
dt_large_x <- dt(1e155, df = 5, log = TRUE)

# -- L131-134: df(0, df1, df2) for various df1 --
df_at_zero <- c(
  df(0, 1, 5),   # should be Inf
  df(0, 2, 5),   # should be 1
  df(0, 3, 5)    # should be 0
)

# -- L169-211: qt near zero and extreme tails --
qt_near_zero <- qt(0.5, df = c(1, 2, 4, 10, 100))
# All should be exactly 0

# qt extreme tail (PR#9804)
qt_extreme_p <- c(1e-10, 1e-20, 1e-50, 1e-100)
qt_extreme_df1 <- qt(qt_extreme_p, df = 1)
qt_extreme_df4 <- qt(qt_extreme_p, df = 4)

# -- L220-233: pbeta log upper tail --
pbeta_log <- pbeta(0.01, 2, 5, lower.tail = FALSE, log.p = TRUE)
pbeta_log2 <- pbeta(0.99, 2, 5, log.p = TRUE)

# -- L283-296: dnbinom extreme size/mu convergence to dpois --
# When size -> Inf, nbinom(size, mu) -> pois(mu)
nb_large_size <- dnbinom(0:10, size = 1e6, mu = 5)
pois_target <- dpois(0:10, lambda = 5)

# -- L338-356: qgamma for small shape; qpois(lambda=0) --
qgamma_small <- qgamma(0.5, shape = 1e-10)
qpois_zero <- qpois(c(0, 0.5, 1 - 1e-7), lambda = 0)

# -- L449-453: Lognormal sdlog=0 boundary --
dlnorm_sd0 <- dlnorm(c(0.5, 1, 2), meanlog = 0, sdlog = 0)
plnorm_sd0 <- plnorm(c(0.5, 1, 2), meanlog = 0, sdlog = 0)

# -- L791-828: qnorm extreme tails --
qnorm_extreme <- qnorm(c(1e-20, 1e-50, 1e-100, 1e-200, 1e-300))

# -- L552-561: Chi-squared df=0 (point mass at 0) --
pchisq_df0 <- pchisq(c(-1, 0, 0.5, 1), df = 0)
dchisq_df0 <- dchisq(c(-1, 0, 0.5, 1), df = 0)

emit_reference(list(
  # Extreme tails
  pexp_extreme = as.vector(pexp_extreme),
  pgamma_extreme = as.vector(pgamma_extreme),
  pt_extreme = as.vector(pt_extreme),
  pbinom_extreme = as.vector(pbinom_extreme),
  pgeom_extreme = as.vector(pgeom_extreme),

  # dt large x
  dt_large_x = dt_large_x,

  # df at zero
  df_at_zero = as.vector(df_at_zero),

  # qt near zero and extreme
  qt_near_zero = as.vector(qt_near_zero),
  qt_extreme_p = qt_extreme_p,
  qt_extreme_df1 = as.vector(qt_extreme_df1),
  qt_extreme_df4 = as.vector(qt_extreme_df4),

  # pbeta log
  pbeta_log = pbeta_log,
  pbeta_log2 = pbeta_log2,

  # dnbinom -> dpois convergence
  nb_large_size = as.vector(nb_large_size),
  pois_target = as.vector(pois_target),

  # qgamma small shape, qpois lambda=0
  qgamma_small = qgamma_small,
  qpois_zero = as.vector(qpois_zero),

  # lognormal sd=0
  dlnorm_sd0 = as.vector(dlnorm_sd0),
  plnorm_sd0 = as.vector(plnorm_sd0),

  # qnorm extreme
  qnorm_extreme = as.vector(qnorm_extreme),

  # chi-sq df=0
  pchisq_df0 = as.vector(pchisq_df0),
  dchisq_df0 = as.vector(dchisq_df0)
))
