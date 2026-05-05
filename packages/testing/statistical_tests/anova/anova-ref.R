cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# Fixed data
group1 <- c(12, 14, 11, 13, 15)
group2 <- c(17, 19, 18, 20, 16)
group3 <- c(22, 24, 23, 21, 25)

# --- Scenario 1: oneway ---
df <- data.frame(value = c(group1, group2, group3), group = factor(rep(1:3, each = 5)))
fit <- aov(value ~ group, data = df)
s <- summary(fit)
oneway <- list(
  F = s[[1]][["F value"]][1],
  p = s[[1]][["Pr(>F)"]][1],
  df_between = s[[1]][["Df"]][1],
  df_within = s[[1]][["Df"]][2],
  SS_between = s[[1]][["Sum Sq"]][1],
  SS_within = s[[1]][["Sum Sq"]][2],
  MS_between = s[[1]][["Mean Sq"]][1],
  MS_within = s[[1]][["Mean Sq"]][2]
)

# --- Scenario 2: welch ---
wt <- oneway.test(value ~ group, data = df, var.equal = FALSE)
welch <- list(
  F = wt$statistic[[1]],
  num.df = wt$parameter[["num df"]],
  denom.df = wt$parameter[["denom df"]],
  p.value = wt$p.value
)

# --- Scenario 3: oneway_unequal ---
group4 <- c(5, 6, 7, 8, 9, 10, 11)
df_unequal <- data.frame(
  value = c(group1, group2, group4),
  group = factor(c(rep(1, 5), rep(2, 5), rep(3, 7)))
)
fit_unequal <- aov(value ~ group, data = df_unequal)
s_unequal <- summary(fit_unequal)
oneway_unequal <- list(
  F = s_unequal[[1]][["F value"]][1],
  p = s_unequal[[1]][["Pr(>F)"]][1],
  df_between = s_unequal[[1]][["Df"]][1],
  df_within = s_unequal[[1]][["Df"]][2],
  SS_between = s_unequal[[1]][["Sum Sq"]][1],
  SS_within = s_unequal[[1]][["Sum Sq"]][2],
  MS_between = s_unequal[[1]][["Mean Sq"]][1],
  MS_within = s_unequal[[1]][["Mean Sq"]][2]
)

# --- Scenario 4: two_way ---
A1B1 <- c(4, 5, 6, 7)
A1B2 <- c(8, 9, 10, 11)
A2B1 <- c(6, 7, 8, 9)
A2B2 <- c(12, 13, 14, 15)

df_two <- data.frame(
  value = c(A1B1, A1B2, A2B1, A2B2),
  A = factor(c(rep("A1", 8), rep("A2", 8))),
  B = factor(rep(c(rep("B1", 4), rep("B2", 4)), 2))
)
fit_two <- aov(value ~ A * B, data = df_two)
s_two <- summary(fit_two)
two_way <- list(
  F_A = s_two[[1]][["F value"]][1],
  p_A = s_two[[1]][["Pr(>F)"]][1],
  F_B = s_two[[1]][["F value"]][2],
  p_B = s_two[[1]][["Pr(>F)"]][2],
  F_AB = s_two[[1]][["F value"]][3],
  p_AB = s_two[[1]][["Pr(>F)"]][3],
  df_A = s_two[[1]][["Df"]][1],
  df_B = s_two[[1]][["Df"]][2],
  df_AB = s_two[[1]][["Df"]][3],
  df_error = s_two[[1]][["Df"]][4]
)

emit_reference(list(
  oneway = oneway,
  welch = welch,
  oneway_unequal = oneway_unequal,
  two_way = two_way
))
