# Companion to ekm.test.ts — extended KM with arm switching.
# Usage (from this directory): Rscript ekm-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

tdata <- aml
tdata$id <- 1:nrow(tdata)
tdata <- survSplit(Surv(time, status) ~ ., tdata, cut = c(9, 17, 30))
tdata$trt <- rep(c(1,1,2,2,2), length = nrow(tdata))
tdata$wt <- rep(1:6, length = nrow(tdata))
tdata$status[tdata$time == 13] <- 1

ekm <- tryCatch(
  survfit(Surv(tstart, time, status) ~ trt, tdata, id = id,
          entry = TRUE, influence = TRUE, weights = wt),
  error = function(e) {
    # Fallback without entry= for older survival package versions
    survfit(Surv(tstart, time, status) ~ trt, tdata, id = id,
            influence = TRUE, weights = wt)
  }
)

result <- list(
  n_id = if (!is.null(ekm$n.id)) ekm$n.id else 0,
  n = ekm$n,
  time = ekm$time,
  n_risk = ekm$n.risk,
  n_enter = if (!is.null(ekm$n.enter)) ekm$n.enter else rep(0, length(ekm$time)),
  n_event = ekm$n.event,
  n_censor = ekm$n.censor,
  surv = ekm$surv,
  strata = as.vector(ekm$strata)
)
emit_reference(result)
