#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# Brown-Forsythe (Levene with median) - manual implementation matching R's car::leveneTest
# This avoids requiring external packages.
# BF test: compute |x_ij - median(group_i)|, then one-way ANOVA on those deviations.

brown_forsythe <- function(groups) {
  k <- length(groups)
  # Compute absolute deviations from group medians
  deviations <- lapply(groups, function(g) abs(g - median(g)))

  # One-way ANOVA on the deviations
  all_devs <- unlist(deviations)
  group_labels <- factor(rep(1:k, sapply(deviations, length)))
  fit <- aov(all_devs ~ group_labels)
  s <- summary(fit)

  list(
    F = s[[1]][["F value"]][1],
    p = s[[1]][["Pr(>F)"]][1],
    df_between = s[[1]][["Df"]][1],
    df_within = s[[1]][["Df"]][2]
  )
}

# --- Scenario 1: equal_variance (groups with similar spread) ---
g1 <- c(10, 12, 11, 13, 14)
g2 <- c(20, 22, 21, 23, 24)
g3 <- c(30, 32, 31, 33, 34)
res <- brown_forsythe(list(g1, g2, g3))
equal_variance <- list(
  equal_F = res$F,
  equal_p = res$p,
  equal_df_between = res$df_between,
  equal_df_within = res$df_within
)

# --- Scenario 2: unequal_variance (groups with different spread) ---
g4 <- c(10, 11, 10, 11, 10)        # low variance
g5 <- c(5, 15, 25, 35, 45)          # high variance
g6 <- c(18, 22, 20, 24, 16)         # medium variance
res <- brown_forsythe(list(g4, g5, g6))
unequal_variance <- list(
  unequal_F = res$F,
  unequal_p = res$p,
  unequal_df_between = res$df_between,
  unequal_df_within = res$df_within
)

# --- Scenario 3: two_groups ---
g7 <- c(5.1, 4.9, 5.3, 5.0, 5.2, 4.8, 5.4)
g8 <- c(2.0, 8.0, 5.0, 1.0, 9.0, 3.0, 7.0)
res <- brown_forsythe(list(g7, g8))
two_groups <- list(
  two_F = res$F,
  two_p = res$p,
  two_df_between = res$df_between,
  two_df_within = res$df_within
)

emit_reference(c(
  equal_variance,
  unequal_variance,
  two_groups
))
