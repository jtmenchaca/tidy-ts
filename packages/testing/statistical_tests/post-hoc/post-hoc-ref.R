cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# Fixed data (3 groups)
g1 <- c(12, 14, 11, 13, 15, 10)
g2 <- c(17, 19, 18, 20, 16, 21)
g3 <- c(22, 24, 23, 21, 25, 20)

# --- Scenario 1: Tukey HSD ---
df <- data.frame(
  value = c(g1, g2, g3),
  group = factor(rep(c("A", "B", "C"), each = 6))
)
fit <- aov(value ~ group, data = df)
tukey <- TukeyHSD(fit)

tukey_result <- list(
  B_A = list(
    diff = tukey$group["B-A", "diff"],
    lwr = tukey$group["B-A", "lwr"],
    upr = tukey$group["B-A", "upr"],
    p_adj = tukey$group["B-A", "p adj"]
  ),
  C_A = list(
    diff = tukey$group["C-A", "diff"],
    lwr = tukey$group["C-A", "lwr"],
    upr = tukey$group["C-A", "upr"],
    p_adj = tukey$group["C-A", "p adj"]
  ),
  C_B = list(
    diff = tukey$group["C-B", "diff"],
    lwr = tukey$group["C-B", "lwr"],
    upr = tukey$group["C-B", "upr"],
    p_adj = tukey$group["C-B", "p adj"]
  )
)

# --- Scenario 2: Games-Howell ---
groups <- list(g1, g2, g3)
labels <- c("A", "B", "C")
k <- length(groups)

games_howell_result <- list()
idx <- 1
for (i in 1:(k - 1)) {
  for (j in (i + 1):k) {
    ni <- length(groups[[i]])
    nj <- length(groups[[j]])
    mi <- mean(groups[[i]])
    mj <- mean(groups[[j]])
    vi <- var(groups[[i]])
    vj <- var(groups[[j]])

    mean_diff <- mj - mi
    se <- sqrt(vi / ni + vj / nj)
    df_welch <- (vi / ni + vj / nj)^2 / ((vi / ni)^2 / (ni - 1) + (vj / nj)^2 / (nj - 1))
    q_stat <- abs(mean_diff) / se
    p_val <- ptukey(q_stat * sqrt(2), nmeans = k, df = df_welch, lower.tail = FALSE)

    pair_name <- paste0(labels[j], "_", labels[i])
    games_howell_result[[pair_name]] <- list(
      mean_diff = mean_diff,
      se = se,
      t_stat = q_stat,
      df = df_welch,
      p_value = p_val
    )
    idx <- idx + 1
  }
}

# --- Scenario 3: Dunn test ---
if (!require(dunn.test, quietly = TRUE)) {
  install.packages("dunn.test", repos = "https://cran.r-project.org/")
}
library(dunn.test)

all_values <- c(g1, g2, g3)
all_groups <- rep(c("A", "B", "C"), each = 6)

# Capture output to suppress printing
invisible(capture.output(
  dunn_res <- dunn.test(all_values, all_groups, method = "bonferroni")
))

# tidy-ts matches R `dunn.test`'s native convention:
#   - signed Z (R reports signed; comparison label is "first - second" where
#     "first" is the group whose rank mean is being compared against "second");
#   - one-sided p = 1 - pnorm(|Z|), then Bonferroni-multiplied by n_comparisons,
#     capped at 1 (this is `P.adjusted` in dunn.test output).
dunn_result <- list()
for (i in seq_along(dunn_res$comparisons)) {
  comp_name <- gsub(" - ", "_", dunn_res$comparisons[i])
  # dunn.test prints P/2 (one-sided / 2 of the adjusted) by default; the
  # underlying adjusted p is in $P.adjusted.
  dunn_result[[comp_name]] <- list(
    Z = dunn_res$Z[i],
    p_value = dunn_res$P.adjusted[i]
  )
}

# Emit all results
emit_reference(list(
  tukey = tukey_result,
  games_howell = games_howell_result,
  dunn = dunn_result
))
