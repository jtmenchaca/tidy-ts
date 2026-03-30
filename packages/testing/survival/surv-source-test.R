# Companion to surv.test.ts — Surv() object creation and sorting (R survival).
# Usage (from this directory): Rscript surv-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

aeq <- function(x, y) all.equal(as.vector(x), as.vector(y))

# Right-censored Surv object
temp <- Surv(c(1, 10, 20, 30), c(2, NA, 0, 40), c(1,1,1,1))

# Sort/order tests
x1 <- Surv(c(4, 6, 3, 2, 1, NA, 2), c(1, 0, NA, 0, 1, 1, 1))

result <- list(
  rc_interval = as.vector(temp),
  right_cens_5 = as.vector(Surv(1:5)),
  sort_order = order(x1),
  sort_order_desc = order(x1, decreasing = TRUE),
  sorted = as.vector(sort(x1))
)
emit_reference(result)
