# Companion to zph.test.ts — cox.zph() proportional hazards testing
# Usage (from this directory): Rscript zph-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# test1 from zph.R — hand-computed Breslow MLE
test1 <- data.frame(
  time   = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x      = c(0, 2, 1, 1, 1, 0, 0)
)

# Breslow MLE analytic solution
r <- (3 + sqrt(33)) / 2
U <- c(1/(r+1), 3/(r+3), -r/(r+3), 0)
imat <- c(r/(r+1)^2, 3*r/(r+3)^2, 3*r/(r+3)^2, 0)
g <- c(1, 6, 6, 9)  # death times

# Hand-computed score test (identity transform)
u2 <- c(sum(U), sum(g * U))
i2 <- matrix(c(sum(imat), sum(g * imat), sum(g * imat), sum(g^2 * imat)), 2, 2)
sctest_identity <- as.vector(solve(i2, u2) %*% u2)

# cox.zph with identity transform
fit1 <- coxph(Surv(time, status) ~ x, test1, ties = 'breslow')
zp1 <- cox.zph(fit1, transform = 'identity', global = FALSE)

# cox.zph with log transform
zp1_log <- cox.zph(fit1, transform = 'log', global = FALSE)

result <- list(
  coef            = as.vector(coef(fit1)),
  loglik          = fit1$loglik,
  sctest_identity = zp1$table[1, "chisq"],
  sctest_log      = zp1_log$table[1, "chisq"],
  hand_sctest     = sctest_identity,
  analytic_coef   = log(r)
)
emit_reference(result)
