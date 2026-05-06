# Distribution consistency tests from d-p-q-r-tests.R
# Tests p-q inversion and cumsum(d) == p for distributions we expose.
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../../statistical_tests/source-tests/r-json-emit.R"))

set.seed(123)

# -- Geometric: dgeom == p*(1-p)^x, cumsum(dgeom) == pgeom (L71-74) --
geom_pr <- 0.3
geom_x <- 0:10
geom_d <- dgeom(geom_x, geom_pr)
geom_p <- pgeom(geom_x, geom_pr)

# -- Binomial: cumsum(dbinom) == pbinom (L53-68, simplified) --
binom_n <- 20
binom_p <- 0.3
binom_x <- 0:binom_n
binom_d <- dbinom(binom_x, size = binom_n, prob = binom_p)
binom_P <- pbinom(binom_x, size = binom_n, prob = binom_p)

# -- Poisson: dpois(0:5, 0) edge case + cumsum consistency (L104-116) --
pois_zero <- dpois(0:5, 0)
pois_lam <- 5
pois_x <- 0:15
pois_d <- dpois(pois_x, lambda = pois_lam)
pois_P <- ppois(pois_x, lambda = pois_lam)

# -- Negative binomial: cumsum(dnbinom) == pnbinom (L95-100) --
nb_size <- 1.2
nb_prob <- 0.5
nb_x <- 0:7
nb_d <- dnbinom(nb_x, size = nb_size, prob = nb_prob)
nb_P <- pnbinom(nb_x, size = nb_size, prob = nb_prob)
# PR#842 specific values
nb_pr842_p <- pnbinom(c(1, 3), .9, .5)

# -- Hypergeometric: cumsum(dhyper) == phyper (L77-91, simplified) --
hyper_m <- 10
hyper_n <- 7
hyper_k <- 8
hyper_x <- 0:min(hyper_k, hyper_m)
hyper_d <- dhyper(hyper_x, hyper_m, hyper_n, hyper_k)
hyper_P <- phyper(hyper_x, hyper_m, hyper_n, hyper_k)

# -- Normal boundary values (L220-243) --
norm_qnorm_0 <- qnorm(0)
norm_qnorm_1 <- qnorm(1)
# Wichura test values
norm_wichura <- qnorm(c(0.25, .001, 1e-20))

# -- Normal sd=0 and sd=Inf (L228-233) --
norm_x <- c(-1e100, 1, 2, 3, 4, 5, 6, 1e200)
norm_d_sd0 <- dnorm(norm_x, 3, sd = 0)
norm_p_sd0 <- pnorm(norm_x, 3, sd = 0)

# -- p-q inversion for distributions we expose (L346-368, simplified) --
# Use fixed test values instead of random to be reproducible
pq_beta_x <- c(0.1, 0.3, 0.5, 0.7, 0.9)
pq_beta_p <- pbeta(pq_beta_x, shape1 = 0.8, shape2 = 2)
pq_beta_q <- qbeta(pq_beta_p, shape1 = 0.8, shape2 = 2)

pq_norm_x <- c(-2, -1, 0, 1, 2)
pq_norm_p <- pnorm(pq_norm_x, mean = -1, sd = 3)
pq_norm_q <- qnorm(pq_norm_p, mean = -1, sd = 3)

pq_gamma_x <- c(0.5, 1, 2, 5, 10)
pq_gamma_p <- pgamma(pq_gamma_x, shape = 2, scale = 5)
pq_gamma_q <- qgamma(pq_gamma_p, shape = 2, scale = 5)

pq_exp_x <- c(0.1, 0.5, 1, 2, 5)
pq_exp_p <- pexp(pq_exp_x, rate = 2)
pq_exp_q <- qexp(pq_exp_p, rate = 2)

pq_chisq_x <- c(0.5, 1, 3, 5, 10)
pq_chisq_p <- pchisq(pq_chisq_x, df = 3)
pq_chisq_q <- qchisq(pq_chisq_p, df = 3)

pq_t_x <- c(-3, -1, 0, 1, 3)
pq_t_p <- pt(pq_t_x, df = 11)
pq_t_q <- qt(pq_t_p, df = 11)

pq_f_x <- c(0.5, 1, 2, 5)
pq_f_p <- pf(pq_f_x, df1 = 12, df2 = 6)
pq_f_q <- qf(pq_f_p, df1 = 12, df2 = 6)

pq_unif_x <- c(0.3, 0.5, 0.8, 1.2, 1.8)
pq_unif_p <- punif(pq_unif_x, min = 0.2, max = 2)
pq_unif_q <- qunif(pq_unif_p, min = 0.2, max = 2)

pq_weibull_x <- c(0.5, 1, 1.5, 2, 3)
pq_weibull_p <- pweibull(pq_weibull_x, shape = 3, scale = 2)
pq_weibull_q <- qweibull(pq_weibull_p, shape = 3, scale = 2)

pq_lnorm_x <- c(0.1, 0.5, 1, 2, 5)
pq_lnorm_p <- plnorm(pq_lnorm_x, meanlog = -1, sdlog = 3)
pq_lnorm_q <- qlnorm(pq_lnorm_p, meanlog = -1, sdlog = 3)

# Discrete p-q (with f1 = 1 - 1e-7 fudge for discrete)
f1 <- 1 - 1e-7
pq_binom_x <- c(0, 3, 7, 10, 15, 20)
pq_binom_p <- pbinom(pq_binom_x, size = 20, prob = 0.3)
pq_binom_q <- qbinom(pq_binom_p * f1, size = 20, prob = 0.3)

pq_pois_x <- c(0, 2, 5, 8, 12, 20)
pq_pois_p <- ppois(pq_pois_x, lambda = 5)
pq_pois_q <- qpois(pq_pois_p * f1, lambda = 5)

pq_geom_x <- c(0, 1, 3, 5, 10)
pq_geom_p <- pgeom(pq_geom_x, prob = 0.3)
pq_geom_q <- qgeom(pq_geom_p * f1, prob = 0.3)

pq_nbinom_x <- c(0, 2, 5, 10, 20)
pq_nbinom_p <- pnbinom(pq_nbinom_x, size = 7, prob = 0.5)
pq_nbinom_q <- qnbinom(pq_nbinom_p * f1, size = 7, prob = 0.5)

pq_hyper_x <- c(0, 2, 4, 6, 8)
pq_hyper_p <- phyper(pq_hyper_x, m = 40, n = 30, k = 20)
pq_hyper_q <- qhyper(pq_hyper_p * f1, m = 40, n = 30, k = 20)

emit_reference(list(
  # Geometric consistency
  geom_pr = geom_pr,
  geom_x = as.vector(geom_x),
  geom_d = as.vector(geom_d),
  geom_p = as.vector(geom_p),

  # Binomial consistency
  binom_n = binom_n,
  binom_p = binom_p,
  binom_x = as.vector(binom_x),
  binom_d = as.vector(binom_d),
  binom_P = as.vector(binom_P),

  # Poisson edge + consistency
  pois_zero = as.vector(pois_zero),
  pois_lam = pois_lam,
  pois_x = as.vector(pois_x),
  pois_d = as.vector(pois_d),
  pois_P = as.vector(pois_P),

  # Negative binomial
  nb_size = nb_size,
  nb_prob = nb_prob,
  nb_x = as.vector(nb_x),
  nb_d = as.vector(nb_d),
  nb_P = as.vector(nb_P),
  nb_pr842_p = as.vector(nb_pr842_p),

  # Hypergeometric
  hyper_m = hyper_m,
  hyper_n = hyper_n,
  hyper_k = hyper_k,
  hyper_x = as.vector(hyper_x),
  hyper_d = as.vector(hyper_d),
  hyper_P = as.vector(hyper_P),

  # Normal boundaries
  norm_x = as.vector(norm_x),
  norm_qnorm_0 = norm_qnorm_0,
  norm_qnorm_1 = norm_qnorm_1,
  norm_wichura = as.vector(norm_wichura),
  norm_d_sd0 = as.vector(norm_d_sd0),
  norm_p_sd0 = as.vector(norm_p_sd0),

  # p-q inversion: continuous
  pq_beta_x = pq_beta_x,
  pq_beta_q = as.vector(pq_beta_q),
  pq_norm_x = as.vector(pq_norm_x),
  pq_norm_q = as.vector(pq_norm_q),
  pq_gamma_x = pq_gamma_x,
  pq_gamma_q = as.vector(pq_gamma_q),
  pq_exp_x = pq_exp_x,
  pq_exp_q = as.vector(pq_exp_q),
  pq_chisq_x = pq_chisq_x,
  pq_chisq_q = as.vector(pq_chisq_q),
  pq_t_x = as.vector(pq_t_x),
  pq_t_q = as.vector(pq_t_q),
  pq_f_x = pq_f_x,
  pq_f_q = as.vector(pq_f_q),
  pq_unif_x = pq_unif_x,
  pq_unif_q = as.vector(pq_unif_q),
  pq_weibull_x = pq_weibull_x,
  pq_weibull_q = as.vector(pq_weibull_q),
  pq_lnorm_x = pq_lnorm_x,
  pq_lnorm_q = as.vector(pq_lnorm_q),

  # p-q inversion: discrete
  pq_binom_x = as.vector(pq_binom_x),
  pq_binom_q = as.vector(pq_binom_q),
  pq_pois_x = as.vector(pq_pois_x),
  pq_pois_q = as.vector(pq_pois_q),
  pq_geom_x = as.vector(pq_geom_x),
  pq_geom_q = as.vector(pq_geom_q),
  pq_nbinom_x = as.vector(pq_nbinom_x),
  pq_nbinom_q = as.vector(pq_nbinom_q),
  pq_hyper_x = as.vector(pq_hyper_x),
  pq_hyper_q = as.vector(pq_hyper_q)
))
