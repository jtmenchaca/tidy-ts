# Companion to survtest.test.ts — basic KM on book-style datasets.
# Usage (from this directory): Rscript survtest-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── survtest: basic right-censored KM on test1 ──
test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)
fit <- survfit(Surv(time, status) ~ 1, test1)

# Counting-process KM on test2
test2 <- data.frame(
  start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
  stop = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
  event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
  x = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0),
  wt = 1:10
)
fit3 <- survfit(Surv(start, stop, event) ~ 1, test2)

result <- list(
  rc_time = fit$time,
  rc_n = fit$n,
  rc_n_risk = fit$n.risk,
  rc_n_event = fit$n.event,
  rc_surv = fit$surv,
  rc_std_err = fit$std.err,
  cp_n = fit3$n,
  cp_time = fit3$time,
  cp_n_risk = fit3$n.risk,
  cp_n_event = fit3$n.event,
  cp_surv_at_events = fit3$surv[fit3$n.event > 0],
  cp_std_err = fit3$std.err
)
emit_reference(result)
