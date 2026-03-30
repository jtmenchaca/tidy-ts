# Diagnostic: dump intermediate agsurv values for nested survfit
# Run: Rscript nested-debug.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

myfit <- coxph(Surv(time, status) ~ age + factor(sex), lung)

# The model matrix x and other internals
x <- model.matrix(myfit)  # includes intercept? No, coxph strips it
x <- x[, -1, drop = FALSE]  # Remove intercept if present
# Actually, model.matrix on coxph gives the design matrix without intercept
# Let's be safe:
mm <- model.matrix(~ age + factor(sex), data = lung[complete.cases(lung$time, lung$status, lung$age, lung$sex),])
x <- mm[, -1, drop = FALSE]  # drop intercept

# Get complete data matching what coxph used
d <- lung[complete.cases(lung$time, lung$status, lung$age, lung$sex),]
n <- nrow(d)

# xcenter = sum(means * coef) + offset_mean
beta <- coef(myfit)
means <- myfit$means
xcenter <- sum(means * beta)  # no offset

# Risk scores as R computes them
risk_scores <- as.vector(exp(x %*% beta - xcenter))

# Sort order: by time, events first at ties
ord <- order(d$time, -(d$status - 1))  # status is 1/2 in lung, so status-1 is 0/1
time_sorted <- d$time[ord]
status_sorted <- (d$status - 1)[ord]  # convert to 0/1
risk_sorted <- risk_scores[ord]

# Unique times
utimes <- unique(time_sorted)

# For each unique time: nrisk (sum of risk in risk set), nevent, haz
ntime <- length(utimes)
nrisk_vec <- numeric(ntime)
nevent_vec <- numeric(ntime)
haz_vec <- numeric(ntime)

for (k in seq_along(utimes)) {
  t <- utimes[k]
  # Risk set: all subjects with time >= t (since sorted ascending, it's from position of first t to end)
  # Actually nrisk = reverse cumsum of risk grouped by time
  in_risk <- time_sorted >= t
  nrisk_vec[k] <- sum(risk_sorted[in_risk])
  at_t <- time_sorted == t & status_sorted == 1
  nevent_vec[k] <- sum(at_t)
  if (nrisk_vec[k] > 0) {
    haz_vec[k] <- nevent_vec[k] / nrisk_vec[k]
  }
}

cumhaz_base <- cumsum(haz_vec)

# For newdata[1]: age=74, sex=1 -> factor(sex)2 = 0
newx1 <- c(74, 0)
newx_eta1 <- sum(beta * (newx1 - means))
cumhaz_1 <- cumhaz_base * exp(newx_eta1)
surv_1 <- exp(-cumhaz_1)

# Now compare with actual survfit output
sf <- survfit(myfit, lung[1:5,])

result <- list(
  # Fit info
  coef = as.vector(beta),
  means = as.vector(means),
  xcenter = xcenter,

  # Risk scores (first 10 sorted)
  risk_first10 = risk_sorted[1:10],

  # Per unique time (first 20)
  utimes_first20 = utimes[1:20],
  nrisk_first20 = nrisk_vec[1:20],
  nevent_first20 = nevent_vec[1:20],
  haz_first20 = haz_vec[1:20],
  cumhaz_base_first20 = cumhaz_base[1:20],

  # Newx prediction
  newx_eta1 = newx_eta1,
  exp_newx_eta1 = exp(newx_eta1),

  # Manual cumhaz vs survfit cumhaz (first 20)
  manual_cumhaz1_first20 = cumhaz_1[1:20],
  sf_cumhaz1_first20 = sf$cumhaz[1:20, 1],
  manual_surv1_first20 = surv_1[1:20],
  sf_surv1_first20 = sf$surv[1:20, 1],

  # Full survfit output for comparison
  sf_time = sf$time,
  sf_cumhaz_1 = sf$cumhaz[,1],
  sf_surv_1 = sf$surv[,1],

  # Do manual and survfit agree?
  manual_vs_sf_cumhaz_diff = (cumhaz_1 - sf$cumhaz[,1])[1:20],

  # n
  n = n,
  n_utimes = ntime
)
emit_reference(result)
