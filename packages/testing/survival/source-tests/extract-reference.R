# Extract reference values from R survival package as JSON
# Usage: Rscript extract-reference.R <test-name>
# Outputs a single JSON object to stdout

library(survival)
options(digits = 15)

args <- commandArgs(trailingOnly = TRUE)
test_name <- if (length(args) > 0) args[1] else stop("Usage: Rscript extract-reference.R <test-name>")

toJSON <- function(x) {
  if (is.matrix(x)) {
    # Convert matrix to list of rows
    rows <- lapply(1:nrow(x), function(i) as.vector(x[i, ]))
    paste0("[", paste(sapply(rows, toJSON), collapse = ","), "]")
  } else if (is.list(x) && !is.null(names(x))) {
    pairs <- mapply(function(k, v) paste0('"', k, '":', toJSON(v)),
                    names(x), x, SIMPLIFY = FALSE)
    paste0("{", paste(pairs, collapse = ","), "}")
  } else if (is.vector(x) && length(x) > 1) {
    paste0("[", paste(sapply(x, toJSON), collapse = ","), "]")
  } else if (is.logical(x)) {
    tolower(as.character(x))
  } else if (is.numeric(x)) {
    if (is.infinite(x)) {
      if (x > 0) '"Infinity"' else '"-Infinity"'
    } else if (is.nan(x)) {
      '"NaN"'
    } else {
      formatC(x, digits = 15, format = "g")
    }
  } else if (is.character(x)) {
    paste0('"', x, '"')
  } else {
    "null"
  }
}

if (test_name == "doaml") {
  # Cox PH Breslow (lines 8-12)
  fit_b <- coxph(Surv(aml$time, aml$status) ~ aml$x, method = "breslow")
  mart <- resid(fit_b, type = "mart")
  score_resid <- resid(fit_b, type = "score")
  scho_resid <- resid(fit_b, type = "scho")

  # Drop intercept (lines 15-19)
  fit2 <- coxph(Surv(time, status) ~ x - 1, method = "breslow", data = aml)

  # Stratified KM (lines 21-24)
  km_strat <- survfit(Surv(aml$time, aml$status) ~ aml$x)

  # survdiff (line 24)
  sd <- survdiff(Surv(aml$time, aml$status) ~ aml$x)

  # Overall KM (lines 32-34)
  km <- survfit(Surv(time, status) ~ 1, aml)

  # Risk weights with null Cox + offset (lines 37-50)
  tfit <- coxph(Surv(aml$time, aml$status) ~ offset(log(1:23)))
  sfit <- survfit(tfit, stype = 2, ctype = 1, censor = FALSE)
  rscore <- exp(log(1:23) - mean(log(1:23)))[order(aml$time)]
  atime <- sort(aml$time)
  denom <- rev(cumsum(rev(rscore)))
  denom <- denom[match(unique(atime), atime)]
  deaths <- tapply(aml$status, aml$time, sum)
  chaz <- cumsum(deaths / denom)
  hand_surv <- as.vector(exp(-chaz[deaths > 0]))

  # Efron (lines 56-59)
  fit_e <- coxph(Surv(time, status) ~ x, aml, method = "efron")

  # Counting process Efron (lines 58-59)
  fit_cp <- coxph(Surv(rep(0, 23), time, status) ~ x, aml, method = "efron")

  # Efron survfit from Cox model (line 53)
  sfit_efron <- survfit(tfit)

  result <- list(
    # Breslow Cox PH
    breslow_coef = as.vector(coef(fit_b)),
    breslow_loglik = fit_b$loglik,
    breslow_var = fit_b$var[1, 1],
    breslow_score = fit_b$score,
    breslow_nevent = fit_b$nevent,
    # Residuals
    breslow_mart = as.vector(mart),
    breslow_score_resid = as.vector(score_resid),
    breslow_scho_resid = as.vector(scho_resid),
    breslow_scho_time = as.numeric(names(scho_resid)),
    # Drop intercept gives same result
    drop_intercept_loglik = fit2$loglik,
    drop_intercept_coef = as.vector(coef(fit2)),
    drop_intercept_var = fit2$var[1, 1],
    # Overall KM
    km_time = km$time,
    km_surv = km$surv,
    km_std_err = km$std.err,
    # Stratified KM (all time points, not just summary)
    km_strat_time = km_strat$time,
    km_strat_surv = km_strat$surv,
    km_strat_std_err = km_strat$std.err,
    km_strat_strata = as.vector(km_strat$strata),
    # survdiff
    survdiff_chisq = sd$chisq,
    survdiff_obs = sd$obs,
    survdiff_exp = sd$exp,
    # Risk weights: null Cox with offset (stype=2, ctype=1, censor=FALSE)
    riskwt_surv = sfit$surv,
    riskwt_time = sfit$time,
    riskwt_hand_surv = hand_surv,
    # Efron survfit from Cox model (default stype/ctype)
    efron_sfit_surv = sfit_efron$surv,
    efron_sfit_time = sfit_efron$time,
    # Efron
    efron_coef = as.vector(coef(fit_e)),
    efron_loglik = fit_e$loglik,
    # Counting process Efron
    cp_efron_coef = as.vector(coef(fit_cp)),
    cp_efron_loglik = fit_cp$loglik
  )
  cat(toJSON(result), "\n")
} else if (test_name == "book1") {
  # Tests from Therneau & Grambsch appendix: Breslow estimate
  # Data set 1 (not in time order, has 1 NA)
  test1 <- data.frame(
    time   = c(9, 3, 1, 1, 6, 6, 8),
    status = c(1, NA, 1, 0, 1, 1, 0),
    x      = c(0, 2, 1, 1, 1, 0, 0)
  )

  # iter=0 Breslow
  fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0, method = "breslow")

  # iter=1 Breslow
  fit1 <- coxph(Surv(time, status) ~ x, test1, iter = 1, method = "breslow")

  # converged Breslow (with nocenter=NULL to get exact analytical solution)
  fit <- coxph(Surv(time, status) ~ x, test1, method = "breslow", eps = 1e-8, nocenter = NULL)

  # Residuals at converged fit
  mart <- resid(fit, type = "mart")
  score_r <- resid(fit, type = "score")
  scho_r <- resid(fit, type = "scho")

  # survfit from Cox model at x=0 (with censor)
  sfit_censor <- survfit(fit, list(x = 0), censor = TRUE)
  # survfit without censor times
  sfit_nocensor <- survfit(fit, list(x = 0), censor = FALSE)

  # Residuals at iter=0
  mart0 <- resid(fit0, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0 <- resid(fit0, type = "scho")

  # survfit from iter=0 fit at x=0
  sfit0 <- survfit(fit0, list(x = 0))

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_mart = as.vector(mart0),
    fit0_score = as.vector(score0),
    fit0_scho = as.vector(scho0),
    fit0_scho_time = as.numeric(names(scho0)),
    # survfit from iter=0 at x=0
    sfit0_cumhaz = sfit0$cumhaz,
    sfit0_surv = sfit0$surv,
    sfit0_stderr_sq = sfit0$std.err^2,
    sfit0_time = sfit0$time,
    # iter=1
    fit1_coef = as.vector(coef(fit1)),
    # converged
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    fit_means = fit$means,
    fit_mart = as.vector(mart),
    fit_score = as.vector(score_r),
    fit_scho = as.vector(scho_r),
    fit_scho_time = as.numeric(names(scho_r)),
    # survfit from converged at x=0, censor=TRUE
    sfit_surv = sfit_censor$surv,
    sfit_cumhaz = sfit_censor$cumhaz,
    sfit_stderr_sq = sfit_censor$std.err^2,
    sfit_time = sfit_censor$time,
    # survfit from converged at x=0, censor=FALSE
    sfit_nc_surv = sfit_nocensor$surv,
    sfit_nc_stderr_sq = sfit_nocensor$std.err^2,
    sfit_nc_time = sfit_nocensor$time
  )
  cat(toJSON(result), "\n")

} else if (test_name == "book2") {
  # Tests from Therneau & Grambsch appendix: Efron estimate
  test1 <- data.frame(
    time   = c(9, 3, 1, 1, 6, 6, 8),
    status = c(1, NA, 1, 0, 1, 1, 0),
    x      = c(0, 2, 1, 1, 1, 0, 0)
  )

  # iter=0 Efron (default)
  fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0)

  # converged Efron (nocenter=NULL for exact solution)
  fit <- coxph(Surv(time, status) ~ x, test1, eps = 1e-8, nocenter = NULL)

  # Residuals at iter=0
  mart0 <- resid(fit0, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0 <- resid(fit0, type = "scho")

  # Residuals at converged
  mart <- resid(fit, type = "mart")
  score_r <- resid(fit, type = "score")
  scho_r <- resid(fit, type = "scho")

  # survfit from iter=0 at x=0 (censor=FALSE)
  sfit0 <- survfit(fit0, list(x = 0), censor = FALSE)

  # survfit from converged at x=0 (censor=FALSE)
  sfit <- survfit(fit, list(x = 0), censor = FALSE)

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_mart = as.vector(mart0),
    fit0_score = as.vector(score0),
    fit0_scho = as.vector(scho0),
    fit0_scho_time = as.numeric(names(scho0)),
    # survfit iter=0
    sfit0_surv = sfit0$surv,
    sfit0_stderr_sq = sfit0$std.err^2,
    sfit0_time = sfit0$time,
    # converged
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    fit_means = fit$means,
    fit_mart = as.vector(mart),
    fit_score = as.vector(score_r),
    fit_scho = as.vector(scho_r),
    fit_scho_time = as.numeric(names(scho_r)),
    # survfit converged
    sfit_surv = sfit$surv,
    sfit_stderr_sq = sfit$std.err^2,
    sfit_time = sfit$time
  )
  cat(toJSON(result), "\n")

} else if (test_name == "doweight") {
  # Weighted Cox model tests
  testw1 <- data.frame(
    time   = c(1, 1, 2, 2, 2, 2, 3, 4, 5),
    status = c(1, 0, 1, 1, 1, 0, 0, 1, 0),
    x      = c(2, 0, 1, 1, 0, 1, 0, 1, 0),
    wt     = c(1, 2, 3, 4, 3, 2, 1, 2, 1)
  )
  # Replicated data (equivalent to weights)
  xx <- testw1$wt
  testw2 <- data.frame(
    time   = rep(testw1$time, xx),
    status = rep(testw1$status, xx),
    x      = rep(testw1$x, xx),
    id     = rep(1:9, xx)
  )

  # Breslow iter=0 with weights
  fit0 <- coxph(Surv(time, status) ~ x, testw1, weights = wt, method = "breslow", iter = 0)
  # Breslow converged with weights
  fit_b <- coxph(Surv(time, status) ~ x, testw1, weights = wt, method = "breslow")
  # Breslow converged with replicated data (should match)
  fitb_rep <- coxph(Surv(time, status) ~ x, testw2, method = "breslow")

  # Residuals
  mart0 <- resid(fit0, type = "mart")
  mart_b <- resid(fit_b, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0 <- resid(fit0, type = "scho")
  score_b <- resid(fit_b, type = "score")
  scho_b <- resid(fit_b, type = "scho")

  # Efron with weights (default method)
  fit0_e <- coxph(Surv(time, status) ~ x, testw1, weights = wt, iter = 0)
  fit_e <- coxph(Surv(time, status) ~ x, testw1, weights = wt)

  # Efron residuals
  mart0_e <- resid(fit0_e, type = "mart")
  mart_e <- resid(fit_e, type = "mart")
  score_e <- resid(fit_e, type = "score")
  scho_e <- resid(fit_e, type = "scho")

  # Efron loglik from analytical formula
  lfun <- function(beta) {
    r <- exp(beta)
    a <- 7*r + 3
    b <- 4*r + 2
    11*beta - (log(r^2 + 11*r + 7) +
      (10/3)*(log(a+b) + log(2*a/3 + b) + log(a/3 + b)) + 2*log(2*r + 1))
  }

  # survfit from weighted Cox
  surv_w <- survfit(fit0, newdata = list(x = 0))
  surv_rep <- survfit(coxph(Surv(time, status) ~ x, testw2, method = "breslow", iter = 0),
                      newdata = list(x = 0))

  result <- list(
    # Breslow iter=0
    b0_coef = as.vector(coef(fit0)),
    b0_loglik = fit0$loglik[1],
    b0_var = fit0$var[1, 1],
    b0_mart = as.vector(mart0),
    b0_score = as.vector(score0),
    b0_scho = as.vector(scho0),
    b0_scho_time = as.numeric(names(scho0)),
    # Breslow converged
    b_coef = as.vector(coef(fit_b)),
    b_loglik = fit_b$loglik,
    b_var = fit_b$var[1, 1],
    b_mart = as.vector(mart_b),
    b_score = as.vector(score_b),
    b_scho = as.vector(scho_b),
    b_scho_time = as.numeric(names(scho_b)),
    # Replicated data should match
    b_rep_coef = as.vector(coef(fitb_rep)),
    b_rep_loglik = fitb_rep$loglik,
    # Efron iter=0
    e0_loglik = fit0_e$loglik[1],
    e0_var = fit0_e$var[1, 1],
    e0_mart = as.vector(mart0_e),
    # Efron converged
    e_coef = as.vector(coef(fit_e)),
    e_loglik = fit_e$loglik,
    e_var = fit_e$var[1, 1],
    e_mart = as.vector(mart_e),
    e_score = as.vector(score_e),
    e_scho = as.vector(scho_e),
    e_scho_time = as.numeric(names(scho_e)),
    # Analytical Efron loglik checks
    efron_loglik_0 = lfun(0),
    efron_loglik_conv = lfun(as.vector(coef(fit_e))),
    # Weighted survfit matches replicated
    surv_w_surv = surv_w$surv,
    surv_rep_surv = surv_rep$surv
  )
  cat(toJSON(result), "\n")

} else if (test_name == "book3") {
  # Tests from Therneau & Grambsch appendix: Data set 2, Breslow estimate
  # Counting process (start-stop) data
  test2 <- data.frame(
    start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
    stop  = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
    event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
    x     = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
  )

  # iter=0 Breslow
  fit0 <- coxph(Surv(start, stop, event) ~ x, test2, iter = 0, method = "breslow")
  mart0 <- resid(fit0, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0 <- resid(fit0, type = "scho")

  # survfit from iter=0 at x=0
  sfit0 <- survfit(fit0, list(x = 0), censor = FALSE)

  # iter=1 Breslow
  fit1 <- coxph(Surv(start, stop, event) ~ x, test2, iter = 1, method = "breslow")

  # converged Breslow
  fit <- coxph(Surv(start, stop, event) ~ x, test2, eps = 1e-8, method = "breslow",
               nocenter = NULL)
  mart <- resid(fit, type = "mart")
  score_r <- resid(fit, type = "score")
  scho_r <- resid(fit, type = "scho")

  # survfit from converged at x=0
  sfit <- survfit(fit, list(x = 0), censor = FALSE)

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_score_test = fit0$score,
    fit0_mart = as.vector(mart0),
    fit0_score = as.vector(score0),
    fit0_scho = as.vector(scho0),
    fit0_scho_time = as.numeric(names(scho0)),
    # survfit iter=0 at x=0
    sfit0_surv = sfit0$surv,
    sfit0_stderr_sq = sfit0$std.err^2,
    sfit0_time = sfit0$time,
    # iter=1
    fit1_coef = as.vector(coef(fit1)),
    # converged
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    fit_mart = as.vector(mart),
    fit_score = as.vector(score_r),
    fit_scho = as.vector(scho_r),
    fit_scho_time = as.numeric(names(scho_r)),
    # survfit converged at x=0
    sfit_surv = sfit$surv,
    sfit_stderr_sq = sfit$std.err^2,
    sfit_cumhaz = sfit$cumhaz,
    sfit_time = sfit$time
  )
  cat(toJSON(result), "\n")

} else if (test_name == "book4") {
  # Tests from Therneau & Grambsch appendix: Data set 2, Efron estimate
  test2 <- data.frame(
    start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
    stop  = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
    event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
    x     = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
  )

  # iter=0 Efron (default)
  fit0 <- coxph(Surv(start, stop, event) ~ x, test2, iter = 0)
  mart0 <- resid(fit0, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0 <- resid(fit0, type = "scho")

  # converged Efron
  fit <- coxph(Surv(start, stop, event) ~ x, test2, eps = 1e-8, nocenter = NULL)
  mart <- resid(fit, type = "mart")
  score_r <- resid(fit, type = "score")
  scho_r <- resid(fit, type = "scho")

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_mart = as.vector(mart0),
    fit0_score = as.vector(score0),
    fit0_scho = as.vector(scho0),
    fit0_scho_time = as.numeric(names(scho0)),
    # converged
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    fit_mart = as.vector(mart),
    fit_score = as.vector(score_r),
    fit_scho = as.vector(scho_r),
    fit_scho_time = as.numeric(names(scho_r))
  )
  cat(toJSON(result), "\n")

} else if (test_name == "counting") {
  # Tests that counting process (start-stop) gives same result as right-censored
  options(na.action = na.exclude)
  test1 <- data.frame(
    time   = c(9, 3, 1, 1, 6, 6, 8),
    status = c(1, NA, 1, 0, 1, 1, 0),
    x      = c(0, 2, 1, 1, 1, 0, 0)
  )
  # Counting process version — exclude the NA row (obs 14 with x=NA)
  test1b_full <- data.frame(
    start  = c(0, 3,  0,  0, 5,  0, 6, 14,  0,  0, 10, 20, 30, 0),
    stop   = c(3, 10, 10, 5, 20, 6, 14, 20, 30, 10, 20, 30, 40, 10),
    status = c(0, 1,  0,  0, 1,  0, 0, 1,  0,  0, 0, 0, 1,  0),
    x      = c(1, 1,  1,  1, 1,  0, 0, 0,  0,  0, 0, 0, 0, NA),
    id     = c(3, 3,  4,  5, 5,  6, 6, 6,  7,  1, 1, 1, 1, 2)
  )
  # For collapse, use the clean version without NA
  test1b <- test1b_full[!is.na(test1b_full$x), ]

  # Right-censored fits
  fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0)
  fit  <- coxph(Surv(time, status) ~ x, test1)

  # Counting process fits (use full data; R will exclude NA via na.action)
  fit0b <- coxph(Surv(start, stop, status) ~ x, test1b_full, iter = 0)
  fitb  <- coxph(Surv(start, stop, status) ~ x, test1b_full)

  # Residuals for right-censored (with NAs excluded by na.exclude)
  mart0_raw <- resid(fit0)
  mart0 <- mart0_raw[!is.na(mart0_raw)]
  mart_raw <- resid(fit)
  mart <- mart_raw[!is.na(mart_raw)]
  score0_raw <- resid(fit0, type = "score")
  score0 <- score0_raw[!is.na(score0_raw)]
  score_raw <- resid(fit, type = "score")
  score <- score_raw[!is.na(score_raw)]
  scho0 <- resid(fit0, type = "scho")
  scho  <- resid(fit, type = "scho")

  # Counting process raw residuals (per-row, NA excluded)
  mart0b_all <- resid(fit0b)
  mart0b_raw <- mart0b_all[!is.na(mart0b_all)]
  martb_all <- resid(fitb)
  martb_raw <- martb_all[!is.na(martb_all)]
  score0b_all <- resid(fit0b, type = "score")
  score0b_raw <- score0b_all[!is.na(score0b_all)]
  scoreb_all <- resid(fitb, type = "score")
  scoreb_raw <- scoreb_all[!is.na(scoreb_all)]
  scho0b <- resid(fit0b, type = "scho")
  schob <- resid(fitb, type = "scho")

  # Collapsed residuals (sum by id, using the clean data)
  mart0b_col <- resid(fit0b, collapse = test1b_full$id)
  mart0b_col <- mart0b_col[!is.na(mart0b_col)]
  martb_col <- resid(fitb, collapse = test1b_full$id)
  martb_col <- martb_col[!is.na(martb_col)]

  result <- list(
    # Right-censored coefs
    fit0_coef = as.vector(coef(fit0)),
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    # Counting process coefs (should match)
    fit0b_coef = as.vector(coef(fit0b)),
    fitb_coef = as.vector(coef(fitb)),
    fitb_loglik = fitb$loglik,
    fitb_var = fitb$var[1, 1],
    # Right-censored residuals (NA-excluded)
    mart0 = as.vector(mart0),
    mart = as.vector(mart),
    score0 = as.vector(score0),
    score = as.vector(score),
    scho0 = as.vector(scho0),
    scho0_time = as.numeric(names(scho0)),
    scho = as.vector(scho),
    scho_time = as.numeric(names(scho)),
    # Counting process raw residuals (per-row)
    mart0b_raw = as.vector(mart0b_raw),
    martb_raw = as.vector(martb_raw),
    score0b_raw = as.vector(score0b_raw),
    scoreb_raw = as.vector(scoreb_raw),
    scho0b = as.vector(scho0b),
    scho0b_time = as.numeric(names(scho0b)),
    schob = as.vector(schob),
    schob_time = as.numeric(names(schob)),
    # Collapsed residuals (should match right-censored)
    mart0b_col = as.vector(mart0b_col),
    martb_col = as.vector(martb_col)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "book5") {
  # Tests of weighted Cox model — Breslow estimate (section 1.3 of appendix)
  testw1 <- data.frame(
    time   = c(1, 1, 2, 2, 2, 2, 3, 4, 5),
    status = c(1, 0, 1, 1, 1, 0, 0, 1, 0),
    x      = c(2, 0, 1, 1, 0, 1, 0, 1, 0),
    wt     = c(1, 2, 3, 4, 3, 2, 1, 2, 1),
    id     = 1:9
  )
  testw2 <- testw1[rep(1:9, testw1$wt), -4]  # drop wt column
  row.names(testw2) <- NULL
  indx <- match(1:9, testw2$id)

  # iter=0 Breslow (weighted)
  fit0 <- coxph(Surv(time, status) ~ x, testw1, weights = wt,
                method = "breslow", iter = 0)
  # iter=0 Breslow (replicated)
  fit0b <- coxph(Surv(time, status) ~ x, testw2, method = "breslow", iter = 0)

  # converged Breslow (weighted and replicated)
  fit  <- coxph(Surv(time, status) ~ x, testw1, weights = wt, method = "breslow")
  fitb <- coxph(Surv(time, status) ~ x, testw2, method = "breslow")

  # Residuals at iter=0
  mart0  <- resid(fit0, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0  <- resid(fit0, type = "scho")

  # Residuals converged
  mart_r  <- resid(fit, type = "mart")
  score_r <- resid(fit, type = "score")
  scho_r  <- resid(fit, type = "scho")

  # Replicated residuals converged
  martb  <- resid(fitb, type = "mart")
  scoreb <- resid(fitb, type = "score")
  schob  <- resid(fitb, type = "scho")

  # Weighted residuals
  mart_wt  <- resid(fit, type = "mart", weighted = TRUE)
  score_wt <- resid(fit, type = "score", weighted = TRUE)

  # survfit at x=pi (iter=0) and x=0.3 (converged), censor=FALSE
  sfit0 <- survfit(fit0, list(x = pi), censor = FALSE)
  sfit  <- survfit(fit, list(x = 0.3), censor = FALSE)

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_mart = as.vector(mart0),
    fit0_score = as.vector(score0),
    fit0_scho = as.vector(scho0),
    fit0_scho_time = as.numeric(names(scho0)),
    # survfit iter=0 at x=pi
    sfit0_surv = sfit0$surv,
    sfit0_stderr_sq = sfit0$std.err^2,
    sfit0_cumhaz = sfit0$cumhaz,
    sfit0_time = sfit0$time,
    # converged
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    fit_mart = as.vector(mart_r),
    fit_score = as.vector(score_r),
    fit_scho = as.vector(scho_r),
    fit_scho_time = as.numeric(names(scho_r)),
    # survfit converged at x=0.3
    sfit_surv = sfit$surv,
    sfit_stderr_sq = sfit$std.err^2,
    sfit_cumhaz = sfit$cumhaz,
    sfit_time = sfit$time,
    # replicated data equivalence
    fit0b_mart = as.vector(resid(fit0b, type = "mart")[indx]),
    fit0b_score = as.vector(resid(fit0b, type = "score")[indx]),
    fitb_mart = as.vector(martb[indx]),
    fitb_score = as.vector(scoreb[indx]),
    # weighted residuals
    mart_wt = as.vector(mart_wt),
    score_wt = as.vector(score_wt)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "book6") {
  # Tests of weighted Cox model — Efron estimate (section 1.3 of appendix)
  testw1 <- data.frame(
    time   = c(1, 1, 2, 2, 2, 2, 3, 4, 5),
    status = c(1, 0, 1, 1, 1, 0, 0, 1, 0),
    x      = c(2, 0, 1, 1, 0, 1, 0, 1, 0),
    wt     = c(1, 2, 3, 4, 3, 2, 1, 2, 1)
  )

  # iter=0 Efron
  fit0 <- coxph(Surv(time, status) ~ x, testw1, weights = wt, iter = 0)
  # converged Efron
  fit  <- coxph(Surv(time, status) ~ x, testw1, weights = wt)

  # Residuals at iter=0
  mart0  <- resid(fit0, type = "mart")
  score0 <- resid(fit0, type = "score")
  scho0  <- resid(fit0, type = "scho")

  # Residuals converged
  mart_r  <- resid(fit, type = "mart")
  score_r <- resid(fit, type = "score")
  scho_r  <- resid(fit, type = "scho")

  # Weighted residuals
  mart_wt  <- resid(fit, type = "mart", weighted = TRUE)
  score_wt <- resid(fit, type = "score", weighted = TRUE)

  # survfit at x=pi (iter=0) and x=0.3 (converged), censor=FALSE
  sfit0 <- survfit(fit0, list(x = pi), censor = FALSE)
  sfit  <- survfit(fit, list(x = 0.3), censor = FALSE)

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_mart = as.vector(mart0),
    fit0_score = as.vector(score0),
    fit0_scho = as.vector(scho0),
    fit0_scho_time = as.numeric(names(scho0)),
    # survfit iter=0 at x=pi
    sfit0_surv = sfit0$surv,
    sfit0_stderr_sq = sfit0$std.err^2,
    sfit0_cumhaz = sfit0$cumhaz,
    sfit0_time = sfit0$time,
    # converged
    fit_coef = as.vector(coef(fit)),
    fit_loglik = fit$loglik,
    fit_var = fit$var[1, 1],
    fit_mart = as.vector(mart_r),
    fit_score = as.vector(score_r),
    fit_scho = as.vector(scho_r),
    fit_scho_time = as.numeric(names(scho_r)),
    # survfit converged at x=0.3
    sfit_surv = sfit$surv,
    sfit_stderr_sq = sfit$std.err^2,
    sfit_cumhaz = sfit$cumhaz,
    sfit_time = sfit$time,
    # weighted residuals
    mart_wt = as.vector(mart_wt),
    score_wt = as.vector(score_wt)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "book7") {
  # Tests from appendix: Data set 1 + exact method
  test1 <- data.frame(
    time   = c(9, 3, 1, 1, 6, 6, 8),
    status = c(1, NA, 1, 0, 1, 1, 0),
    x      = c(0, 2, 1, 1, 1, 0, 0)
  )

  # iter=0 exact
  fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0, method = "exact")
  # iter=1 exact
  fit1 <- coxph(Surv(time, status) ~ x, test1, iter = 1, method = "exact")
  # converged exact (beta -> infinity, will warn)
  fit2 <- tryCatch(
    coxph(Surv(time, status) ~ x, test1, method = "exact"),
    warning = function(w) suppressWarnings(coxph(Surv(time, status) ~ x, test1, method = "exact"))
  )

  mart0_raw <- resid(fit0)
  mart0 <- mart0_raw[!is.na(mart0_raw)]
  mart1_raw <- resid(fit1)
  mart1 <- mart1_raw[!is.na(mart1_raw)]
  mart2_raw <- resid(fit2)
  mart2 <- mart2_raw[!is.na(mart2_raw)]

  # Multivariate exact: right-censored vs counting on lung data
  zz <- rep(0, nrow(lung))
  fit_rc <- coxph(Surv(time, status) ~ age + ph.ecog + sex, lung, method = "exact")
  fit_cp <- coxph(Surv(zz, time, status) ~ age + ph.ecog + sex, lung, method = "exact")

  result <- list(
    # iter=0
    fit0_loglik = fit0$loglik[1],
    fit0_var = fit0$var[1, 1],
    fit0_coef = as.vector(coef(fit0)),
    fit0_mart = as.vector(mart0),
    # iter=1
    fit1_coef = as.vector(coef(fit1)),
    fit1_loglik = fit1$loglik[2],
    fit1_var = fit1$var[1, 1],
    fit1_mart = as.vector(mart1),
    # converged
    fit2_coef = as.vector(coef(fit2)),
    fit2_mart = as.vector(mart2),
    # multivariate: right-censored vs counting should match
    mv_rc_coef = as.vector(coef(fit_rc)),
    mv_rc_loglik = fit_rc$loglik,
    mv_rc_var = as.vector(fit_rc$var),
    mv_rc_score = fit_rc$score,
    mv_cp_coef = as.vector(coef(fit_cp)),
    mv_cp_loglik = fit_cp$loglik,
    mv_cp_var = as.vector(fit_cp$var),
    mv_cp_score = fit_cp$score
  )
  cat(toJSON(result), "\n")

} else if (test_name == "stratatest") {
  # Stratified residuals test — duplicated strata should give same answers
  test1 <- data.frame(
    time   = c(9, 3, 1, 1, 6, 6, 8),
    status = c(1, NA, 1, 0, 1, 1, 0),
    x      = c(0, 2, 1, 1, 1, 0, 0)
  )
  test2 <- data.frame(
    start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
    stop  = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
    event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
    x     = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
  )

  # Right-censored: unstratified vs duplicated strata
  n1 <- nrow(test1)
  ndead1 <- sum(test1$status[!is.na(test1$status)])
  temp1 <- rbind(test1, test1)
  tstrat1 <- rep(1:2, c(n1, n1))

  fit1 <- coxph(Surv(time, status) ~ x, test1)
  fit2 <- coxph(Surv(time, status) ~ x + strata(tstrat1), temp1)

  r1_mart <- resid(fit1)
  r2_mart <- resid(fit2)
  r1_score <- resid(fit1, type = "score")
  r2_score <- resid(fit2, type = "score")
  r1_scho <- resid(fit1, type = "scho")
  r2_scho <- resid(fit2, type = "scho")

  # Counting process: unstratified vs duplicated strata
  n2 <- nrow(test2)
  ndead2 <- sum(test2$event)
  temp2 <- rbind(test2, test2)
  tstrat2 <- rep(1:2, c(n2, n2))

  fit3 <- coxph(Surv(start, stop, event) ~ x, test2)
  fit4 <- coxph(Surv(start, stop, event) ~ x + strata(tstrat2), temp2)

  r3_mart <- resid(fit3)
  r4_mart <- resid(fit4)
  r3_score <- resid(fit3, type = "score")
  r4_score <- resid(fit4, type = "score")
  r3_scho <- resid(fit3, type = "scho")
  r4_scho <- resid(fit4, type = "scho")

  result <- list(
    # Right-censored unstratified
    fit1_coef = as.vector(coef(fit1)),
    fit1_loglik = fit1$loglik,
    fit1_var = fit1$var[1, 1],
    fit1_mart = as.vector(r1_mart[!is.na(r1_mart)]),
    fit1_score = as.vector(r1_score[!is.na(r1_score)]),
    fit1_scho = as.vector(r1_scho),
    fit1_scho_time = as.numeric(names(r1_scho)),
    # Right-censored stratified (first n obs should match)
    fit2_coef = as.vector(coef(fit2)),
    fit2_loglik = fit2$loglik,
    fit2_var = fit2$var[1, 1],
    fit2_mart = as.vector(r2_mart[!is.na(r2_mart)]),
    fit2_score = as.vector(r2_score[!is.na(r2_score)]),
    fit2_scho = as.vector(r2_scho),
    fit2_scho_time = as.numeric(names(r2_scho)),
    n1 = n1,
    ndead1 = ndead1,
    # Counting process unstratified
    fit3_coef = as.vector(coef(fit3)),
    fit3_loglik = fit3$loglik,
    fit3_var = fit3$var[1, 1],
    fit3_mart = as.vector(r3_mart),
    fit3_score = as.vector(r3_score),
    fit3_scho = as.vector(r3_scho),
    fit3_scho_time = as.numeric(names(r3_scho)),
    # Counting process stratified (first n obs should match)
    fit4_coef = as.vector(coef(fit4)),
    fit4_loglik = fit4$loglik,
    fit4_var = fit4$var[1, 1],
    fit4_mart = as.vector(r4_mart),
    fit4_score = as.vector(r4_score),
    fit4_scho = as.vector(r4_scho),
    fit4_scho_time = as.numeric(names(r4_scho)),
    n2 = n2,
    ndead2 = ndead2
  )
  cat(toJSON(result), "\n")

} else if (test_name == "infcox") {
  # Near-infinite coefficients test
  test3 <- data.frame(
    futime = 1:12,
    fustat = c(1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0),
    x1 = rep(0:1, 6),
    x2 = c(rep(0, 6), rep(1, 6))
  )

  fit3 <- suppressWarnings(coxph(Surv(futime, fustat) ~ x1 + x2, test3, iter = 25))

  # Analytical loglik
  true_loglik <- function(beta) {
    r1 <- exp(beta[1])
    r2 <- exp(beta[2])
    -log(3 * (1 + r1 + r2 + r1 * r2)) - log(2 + 2 * r1 + 3 * r2 + 3 * r1 * r2) -
      log(1 + r1 + 3 * r2 + 3 * r1 * r2)
  }

  result <- list(
    coef = as.vector(coef(fit3)),
    loglik = fit3$loglik,
    var = as.vector(fit3$var),
    coefs_below_neg22 = all(fit3$coef < -22),
    true_loglik_at_coef = true_loglik(as.vector(coef(fit3)))
  )
  cat(toJSON(result), "\n")

} else if (test_name == "detail") {
  # Counting-process hazard detail test
  test2 <- data.frame(
    start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
    stop  = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
    event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
    x     = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
  )

  fit1 <- coxph(Surv(start, stop, event) ~ x, test2, init = -1, iter = 0)
  temp <- coxph.detail(fit1)

  # By-hand Breslow hazard at beta = -1
  r <- exp(-1)
  hazard <- c(1/(r+1), 1/(r+2), 1/(3*r+2), 1/(3*r+1), 1/(3*r+1),
              1/(3*r+2), 1/(2*r+2))
  # coxph.detail groups the tied time=9 deaths, so haz[6] = sum of 6,7
  detail_haz <- c(hazard[1:5], sum(hazard[6:7]))

  # By-hand loglik, U, Imat at beta = -1
  loglik_val <- 4*(-1) - (log(r+1) + log(r+2) + 2*log(3*r+2) + 2*log(3*r+1) +
                           log(2*r+2))
  u_val <- 1/(r+1) + 1/(3*r+1) + 2*(1/(3*r+2) + 1/(2*r+2)) -
           (r/(r+2) + 3*r/(3*r+2) + 3*r/(3*r+1))
  imat_val <- r*(1/(r+1)^2 + 2/(r+2)^2 + 6/(3*r+2)^2 +
                  6/(3*r+1)^2 + 6/(3*r+2)^2 + 4/(2*r+2)^2)

  # Mart, score, scho residuals from the model
  mart <- resid(fit1, type = "mart")
  score_r <- resid(fit1, type = "score")
  scho_r <- resid(fit1, type = "scho")

  result <- list(
    coef = as.vector(coef(fit1)),
    loglik = fit1$loglik,
    var = fit1$var[1, 1],
    means = fit1$means,
    detail_haz = as.vector(temp$hazard),
    byhand_haz = as.vector(detail_haz),
    detail_time = as.vector(temp$time),
    byhand_loglik = loglik_val,
    byhand_u = u_val,
    byhand_imat = imat_val,
    mart = as.vector(mart),
    score = as.vector(score_r),
    scho = as.vector(scho_r),
    scho_time = as.numeric(names(scho_r))
  )
  cat(toJSON(result), "\n")

} else if (test_name == "difftest") {
  # ── difftest: survdiff with dummy group + stratified log-rank ──
  aml3 <- data.frame(
    time = c(9,13,13,18,23,28,31,34,45,48,161,
             5,5,8,8,12,16,23,27,30,33,43,45,
             1,2,2,3,3,3,4),
    status = c(1,1,0,1,1,0,1,1,0,1,0,
               1,1,1,1,1,0,1,1,1,1,1,1,
               0,0,0,0,0,0,0),
    x = factor(c(rep("Maintained",11), rep("Nonmaintained",12), rep("Dummy",7)))
  )

  sd_aml <- survdiff(Surv(time, status) ~ x, aml)
  sd_aml3 <- survdiff(Surv(time, status) ~ x, aml3)

  # Stratified survdiff on lung
  tdata <- na.omit(lung[, c('time', 'status', 'pat.karno', 'inst')])
  sd_lung <- survdiff(Surv(time, status) ~ pat.karno + strata(inst), tdata)

  # coxph comparison for observed/expected
  cfit <- coxph(Surv(time, status) ~ factor(pat.karno) + strata(inst),
                tdata, iter = 0)
  temp1 <- tapply(tdata$status - 1, list(tdata$pat.karno, tdata$inst), sum)
  temp1 <- ifelse(is.na(temp1), 0, temp1)
  temp2 <- tapply(cfit$resid, list(tdata$pat.karno, tdata$inst), sum)
  temp2 <- ifelse(is.na(temp2), 0, temp2)
  temp2 <- temp1 - temp2  # expected

  result <- list(
    aml_chisq = sd_aml$chisq,
    aml_n = as.vector(sd_aml$n),
    aml_obs = as.vector(sd_aml$obs),
    aml_exp = as.vector(sd_aml$exp),
    aml3_chisq = sd_aml3$chisq,
    aml3_n = as.vector(sd_aml3$n),
    aml3_obs = as.vector(sd_aml3$obs),
    aml3_exp = as.vector(sd_aml3$exp),
    lung_chisq = sd_lung$chisq,
    lung_n = as.vector(sd_lung$n),
    lung_obs = as.vector(sd_lung$obs),
    lung_exp = as.vector(sd_lung$exp),
    lung_var = matrix(sd_lung$var, nrow = nrow(sd_lung$var)),
    lung_pat_karno_levels = as.integer(sort(unique(tdata$pat.karno))),
    lung_coxvar = matrix(cfit$var, nrow = nrow(cfit$var)),
    lung_coxvar_inv = matrix(solve(cfit$var), nrow = nrow(cfit$var))
  )
  cat(toJSON(result), "\n")

} else if (test_name == "survfit1") {
  # ── survfit1: basic KM on aml with groups ──
  fit1 <- survfit(Surv(time, status) ~ x, data = aml)

  # stype=2: exp(-cumhaz) survival
  fit_s2 <- survfit(Surv(time, status) ~ x, data = aml, stype = 2)

  result <- list(
    time = fit1$time,
    n_risk = fit1$n.risk,
    n_event = fit1$n.event,
    n_censor = fit1$n.censor,
    surv = fit1$surv,
    cumhaz = fit1$cumhaz,
    std_err = fit1$std.err,
    std_chaz = fit1$std.chaz,
    strata = as.vector(fit1$strata),
    logse = fit1$logse,
    surv_s2 = fit_s2$surv,
    cumhaz_s2 = fit_s2$cumhaz,
    std_err_s2 = fit_s2$std.err,
    std_chaz_s2 = fit_s2$std.chaz,
    n_risk_s2 = fit_s2$n.risk,
    n_event_s2 = fit_s2$n.event
  )
  cat(toJSON(result), "\n")

} else if (test_name == "survtest") {
  # ── survtest: basic right-censored KM on test1 ──
  test1 <- data.frame(time = c(9, 3, 1, 1, 6, 6, 8),
                      status = c(1, NA, 1, 0, 1, 1, 0),
                      x = c(0, 2, 1, 1, 1, 0, 0))
  fit <- survfit(Surv(time, status) ~ 1, test1)

  # Counting-process KM on test2
  test2 <- data.frame(start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
                      stop = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
                      event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
                      x = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0),
                      wt = 1:10)
  fit3 <- survfit(Surv(start, stop, event) ~ 1, test2)

  result <- list(
    # Right-censored KM on test1
    rc_time = fit$time,
    rc_n = fit$n,
    rc_n_risk = fit$n.risk,
    rc_n_event = fit$n.event,
    rc_surv = fit$surv,
    rc_std_err = fit$std.err,
    # Counting-process KM on test2
    cp_n = fit3$n,
    cp_time = fit3$time,
    cp_n_risk = fit3$n.risk,
    cp_n_event = fit3$n.event,
    cp_surv_at_events = fit3$surv[fit3$n.event > 0],
    cp_std_err = fit3$std.err
  )
  cat(toJSON(result), "\n")

} else if (test_name == "tiedtime") {
  # ── tiedtime: floating-point tie handling ──
  tdata <- data.frame(time = c(1, 2, sqrt(2)^2, 2, sqrt(2)^2),
                      status = rep(1, 5),
                      group = c(1, 1, 1, 2, 2))
  fit <- survfit(Surv(time, status) ~ group, data = tdata)

  result <- list(
    sum_strata = sum(fit$strata),
    length_time = length(fit$time),
    strata = as.vector(fit$strata),
    time = fit$time,
    surv = fit$surv,
    n_risk = fit$n.risk,
    n_event = fit$n.event
  )
  cat(toJSON(result), "\n")

} else if (test_name == "surv") {
  # ── surv: Surv() object creation and sorting ──
  # Mostly R-specific S3 object tests, but we extract the key assertions
  aeq <- function(x, y) all.equal(as.vector(x), as.vector(y))

  temp <- Surv(c(1, 10, 20, 30), c(2, NA, 0, 40), c(1,1,1,1))
  x1 <- Surv(c(4, 6, 3, 2, 1, NA, 2), c(1,0, NA, 0,1,1,1))

  result <- list(
    interval2_test = as.vector(Surv(c(1,10,20,30), c(2,NA,0,40), type='interval2')),
    right_cens_5 = as.vector(Surv(1:5)),
    sort_order = order(x1),
    sort_order_desc = order(x1, decreasing=TRUE)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "survfit2") {
  # ── survfit2: modified Dory-Korn confidence interval ──
  tdata <- data.frame(time = 1:10, status = c(1,0,1,0,1,0,0,0,1,0))
  fit1 <- survfit(Surv(time, status) ~ 1, tdata, conf.lower='modified')
  fit2 <- survfit(Surv(time, status) ~ 1, tdata)

  stdlow <- fit2$std.err * sqrt(c(1, 10/9, 1, 8/7, 1, 6/5, 6/4, 6/3, 1, 2/1))
  lower <- exp(log(fit2$surv) - qnorm(.975)*stdlow)

  result <- list(
    time = fit2$time,
    surv = fit2$surv,
    std_err = fit2$std.err,
    cumhaz = fit2$cumhaz,
    modified_lower = fit1$lower,
    expected_lower = as.vector(lower),
    regular_lower = fit2$lower,
    regular_upper = fit2$upper
  )
  cat(toJSON(result), "\n")

} else if (test_name == "ekm") {
  # ── ekm: extended KM with arm switching ──
  tdata <- aml
  tdata$id <- 1:nrow(tdata)
  tdata <- survSplit(Surv(time, status) ~ ., tdata, cut = c(9, 17, 30))
  tdata$trt <- rep(c(1,1,2,2,2), length = nrow(tdata))
  tdata$wt <- rep(1:6, length = nrow(tdata))
  tdata$status[tdata$time == 13] <- 1

  ekm <- survfit(Surv(tstart, time, status) ~ trt, tdata, id = id,
                 entry = TRUE, influence = TRUE, weights = wt)

  result <- list(
    n_id = ekm$n.id,
    n = ekm$n,
    time = ekm$time,
    n_risk = ekm$n.risk,
    n_enter = ekm$n.enter,
    n_event = ekm$n.event,
    n_censor = ekm$n.censor,
    surv = ekm$surv,
    strata = as.vector(ekm$strata)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "cancer") {
  # ── cancer: coxph on lung with multiple covariates + strata ──
  # Filter complete cases for the 6 covariates + strata
  tdata <- na.omit(lung[, c('time', 'status', 'ph.ecog', 'ph.karno',
                             'pat.karno', 'wt.loss', 'sex', 'age', 'inst')])

  cfit1 <- coxph(Surv(time, status) ~ ph.ecog + ph.karno + pat.karno +
                   wt.loss + sex + age + strata(inst), tdata)

  # Also a simpler model without strata for basic validation
  tdata2 <- na.omit(lung[, c('time', 'status', 'age', 'sex')])
  cfit_simple <- coxph(Surv(time, status) ~ age + sex, tdata2)

  result <- list(
    coef = as.vector(coef(cfit1)),
    loglik = cfit1$loglik,
    var_diag = diag(cfit1$var),
    n = cfit1$n,
    nevent = cfit1$nevent,
    coef_names = names(coef(cfit1)),
    simple_coef = as.vector(coef(cfit_simple)),
    simple_loglik = cfit_simple$loglik,
    simple_var = matrix(cfit_simple$var, nrow = 2),
    simple_n = cfit_simple$n,
    simple_nevent = cfit_simple$nevent,
    simple_score = cfit_simple$score
  )
  cat(toJSON(result), "\n")

} else if (test_name == "testnull") {
  # ── testnull: null Cox models with strata ──
  # Right-censored
  fit1_rc <- coxph(Surv(stop, event) ~ rx + strata(number), bladder, iter = 0)
  fit2_rc <- coxph(Surv(stop, event) ~ strata(number), bladder)

  # Counting process
  fit1_cp <- coxph(Surv(start, stop, event) ~ rx + strata(number), bladder2, iter = 0)
  fit2_cp <- coxph(Surv(start, stop, event) ~ strata(number), bladder2)

  result <- list(
    rc_loglik_iter0 = fit1_rc$loglik[2],
    rc_loglik_null = fit2_rc$loglik,
    rc_resid_iter0 = as.vector(fit1_rc$resid),
    rc_resid_null = as.vector(fit2_rc$resid),
    cp_loglik_iter0 = fit1_cp$loglik[2],
    cp_loglik_null = fit2_cp$loglik,
    cp_resid_iter0 = as.vector(fit1_cp$resid),
    cp_resid_null = as.vector(fit2_cp$resid)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "singtest") {
  # ── singtest: singular X matrix ──
  test1 <- data.frame(time = c(4,3,1,1,2,2,3),
                       status = c(1,NA,1,0,1,1,0),
                       x = c(0,2,1,1,1,0,0))
  temp <- rep(0:3, rep(7, 4))
  stest <- data.frame(
    start = 10 * temp,
    stop = 10 * temp + test1$time,
    status = rep(test1$status, 4),
    x = c(test1$x + 1:7, rep(test1$x, 3)),
    epoch = rep(1:4, rep(7, 4))
  )

  fit1 <- coxph(Surv(start, stop, status) ~ x * factor(epoch), stest)
  na_pattern <- is.na(fit1$coef)

  result <- list(
    coef = as.vector(fit1$coef),
    na_pattern = na_pattern,
    loglik = fit1$loglik,
    n = fit1$n,
    nevent = fit1$nevent
  )
  cat(toJSON(result), "\n")

} else if (test_name == "testreg") {
  # ── testreg: parametric survreg — Tier 4, extract basic reference only ──
  test1 <- data.frame(time = c(4,3,1,1,2,2,3),
                       status = c(1,NA,1,0,1,1,0),
                       x = c(0,2,1,1,1,0,0))

  # Basic Weibull survreg for reference
  fit <- survreg(Surv(time, status) ~ x, test1, dist = 'weibull')
  result <- list(
    coef = as.vector(coef(fit)),
    loglik = fit$loglik,
    scale = fit$scale,
    dist = "weibull"
  )
  cat(toJSON(result), "\n")

} else if (test_name == "coxsurv") {
  # ── coxsurv: survfit from Cox model on lung ──
  tdata <- na.omit(lung[, c('time', 'status', 'age', 'sex', 'ph.ecog', 'meal.cal')])
  fit <- coxph(Surv(time, status) ~ age + sex + meal.cal + strata(ph.ecog),
               data = tdata)
  surv1 <- survfit(fit)

  # Simple model for basic comparison
  tdata2 <- na.omit(lung[, c('time', 'status', 'age', 'sex')])
  fit2 <- coxph(Surv(time, status) ~ age + sex, data = tdata2)
  surv2 <- survfit(fit2)

  result <- list(
    # Stratified model
    strat_time = surv1$time,
    strat_surv = surv1$surv,
    strat_cumhaz = surv1$cumhaz,
    strat_std_err = surv1$std.err,
    strat_strata = as.vector(surv1$strata),
    strat_n = surv1$n,
    # Simple model
    simple_time = surv2$time,
    simple_surv = surv2$surv,
    simple_cumhaz = surv2$cumhaz,
    simple_std_err = surv2$std.err,
    simple_n = surv2$n
  )
  cat(toJSON(result), "\n")

} else if (test_name == "coxsurv2") {
  # ── coxsurv2: weighted Cox survival curves ──
  set.seed(1953)
  rwt <- runif(nrow(lung), .5, 3)

  # Aalen (stype=2) with Breslow ties
  surv1 <- survfit(Surv(time, status) ~ sex, data = lung, stype = 2)
  fit1 <- coxph(Surv(time, status) ~ age + strata(sex), data = lung, iter = 0,
                ties = 'breslow')
  fit1$var <- 0 * fit1$var

  surv2 <- survfit(fit1, stype = 2)
  surv3 <- survfit(fit1)

  # KM
  surv_km <- survfit(Surv(time, status) ~ sex, data = lung)
  surv_km2 <- survfit(fit1, stype = 1)

  result <- list(
    # Aalen stype=2: Cox with beta=0 should match ordinary survfit
    aalen_surv_match = all.equal(as.vector(surv1$surv), as.vector(surv2$surv)),
    aalen_time_match = all.equal(as.vector(surv1$time), as.vector(surv2$time)),
    km_surv_match = all.equal(as.vector(surv_km$surv), as.vector(surv_km2$surv)),
    # Direct values
    aalen_surv = surv1$surv,
    aalen_time = surv1$time,
    aalen_strata = as.vector(surv1$strata),
    km_surv = surv_km$surv,
    km_time = surv_km$time,
    km_strata = as.vector(surv_km$strata)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "coxsurv3") {
  # ── coxsurv3: counting-process Cox survfit with hand-computed values ──
  test2 <- data.frame(start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
                      stop = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
                      event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
                      x = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0))

  fit <- coxph(Surv(start, stop, event) ~ x, test2)
  surv1 <- survfit(fit, newdata = list(x = 0), censor = FALSE)

  # Hand-computed hazard at each event time
  r <- exp(fit$coefficients)
  true_lambda <- c(1/(r+1), 1/(r+2), 1/(3*r+2), 1/(3*r+1),
                   1/(3*r+1), 1/(3*r+2) + 1/(2*r+2))
  true_time <- c(2, 3, 6, 7, 8, 9)

  result <- list(
    coef = as.vector(fit$coefficients),
    loglik = fit$loglik,
    surv1_time = surv1$time,
    surv1_surv = surv1$surv,
    surv1_cumhaz = surv1$cumhaz,
    surv1_std_err = surv1$std.err,
    true_lambda = true_lambda,
    true_time = true_time,
    true_cumhaz = cumsum(true_lambda)
  )
  cat(toJSON(result), "\n")

} else if (test_name == "coxsurv4") {
  # ── coxsurv4: strata-by-covariate interactions ──
  tdata <- na.omit(lung[, c('time', 'status', 'age', 'sex', 'ph.ecog')])
  fit1 <- coxph(Surv(time, status) ~ age * strata(sex) + strata(ph.ecog),
                data = tdata)

  result <- list(
    coef = as.vector(coef(fit1)),
    loglik = fit1$loglik,
    n = fit1$n,
    nevent = fit1$nevent
  )
  cat(toJSON(result), "\n")

} else if (test_name == "coxsurv5") {
  # ── coxsurv5: multi-state survival — Tier 4, basic extraction ──
  result <- list(
    note = "Multi-state survival tests require Tier 4 implementation"
  )
  cat(toJSON(result), "\n")

} else if (test_name == "coxsurv6") {
  # ── coxsurv6: multi-state with shared hazards — Tier 4, basic extraction ──
  result <- list(
    note = "Multi-state with shared hazards requires Tier 4 implementation"
  )
  cat(toJSON(result), "\n")

} else {
  stop(paste("Unknown test:", test_name))
}
