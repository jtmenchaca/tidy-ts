# Companion to stratatest.test.ts — duplicated strata vs unstratified.
# Usage (from this directory): Rscript stratatest-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)
test2 <- data.frame(
  start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
  stop = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
  event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
  x = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
)

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
  fit1_coef = as.vector(coef(fit1)),
  fit1_loglik = fit1$loglik,
  fit1_var = fit1$var[1, 1],
  fit1_mart = as.vector(r1_mart[!is.na(r1_mart)]),
  fit1_score = as.vector(r1_score[!is.na(r1_score)]),
  fit1_scho = as.vector(r1_scho),
  fit1_scho_time = as.numeric(names(r1_scho)),
  fit2_coef = as.vector(coef(fit2)),
  fit2_loglik = fit2$loglik,
  fit2_var = fit2$var[1, 1],
  fit2_mart = as.vector(r2_mart[!is.na(r2_mart)]),
  fit2_score = as.vector(r2_score[!is.na(r2_score)]),
  fit2_scho = as.vector(r2_scho),
  fit2_scho_time = as.numeric(names(r2_scho)),
  n1 = n1,
  ndead1 = ndead1,
  fit3_coef = as.vector(coef(fit3)),
  fit3_loglik = fit3$loglik,
  fit3_var = fit3$var[1, 1],
  fit3_mart = as.vector(r3_mart),
  fit3_score = as.vector(r3_score),
  fit3_scho = as.vector(r3_scho),
  fit3_scho_time = as.numeric(names(r3_scho)),
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
emit_reference(result)
