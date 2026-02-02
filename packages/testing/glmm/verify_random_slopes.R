# Verify random slopes test data with glmmTMB

library(glmmTMB)

# Parameters matching Rust test
n_groups <- 8
obs_per_group <- 12
n <- n_groups * obs_per_group

# True fixed effects
beta_0 <- 5.0
beta_1 <- 0.8

# True random effects (deterministic)
group_intercepts <- c(-0.8, -0.5, -0.3, -0.1, 0.2, 0.4, 0.6, 0.9)
group_slopes <- c(0.35, 0.25, 0.15, 0.05, -0.05, -0.15, -0.25, -0.35)

# Compute empirical SD of "random" effects
cat("Empirical SD of group intercepts:", sd(group_intercepts), "\n")
cat("Empirical SD of group slopes:", sd(group_slopes), "\n")
cat("Correlation of intercepts and slopes:", cor(group_intercepts, group_slopes), "\n")

# Create data frame
df <- data.frame(
  obs_id = 1:n,
  group = factor(rep(paste0("G", 1:n_groups), each = obs_per_group)),
  time = rep(0:(obs_per_group - 1), n_groups)
)

# Add group-level random effects
df$b0 <- group_intercepts[as.numeric(df$group)]
df$b1 <- group_slopes[as.numeric(df$group)]

# Generate response with small deterministic noise
df$noise <- 0.05 * ((df$obs_id - n/2) / (n/2))
df$y <- beta_0 + beta_1 * df$time + df$b0 + df$b1 * df$time + df$noise

cat("\n=== Data Summary ===\n")
cat("n =", n, "\n")
cat("y range:", range(df$y), "\n")
cat("y mean:", mean(df$y), "\n")
cat("y sd:", sd(df$y), "\n")

# Fit with glmmTMB (ML)
cat("\n=== Fitting with glmmTMB (ML) ===\n")
fit_ml <- glmmTMB(y ~ time + (1 + time | group), data = df, REML = FALSE)
print(summary(fit_ml))

cat("\n=== Variance Components ===\n")
vc <- VarCorr(fit_ml)
print(vc)

# Extract specific values
cat("\n=== Key Results (ML) ===\n")
cat("Intercept SD:", attr(vc$cond$group, "stddev")["(Intercept)"], "\n")
cat("Slope SD:", attr(vc$cond$group, "stddev")["time"], "\n")
cat("Correlation:", attr(vc$cond$group, "correlation")["(Intercept)", "time"], "\n")
cat("Residual SD:", sigma(fit_ml), "\n")

cat("\n=== Fixed Effects ===\n")
print(fixef(fit_ml))

# Also check with REML for comparison
cat("\n=== Fitting with glmmTMB (REML) ===\n")
fit_reml <- glmmTMB(y ~ time + (1 + time | group), data = df, REML = TRUE)
vc_reml <- VarCorr(fit_reml)
cat("REML Intercept SD:", attr(vc_reml$cond$group, "stddev")["(Intercept)"], "\n")
cat("REML Slope SD:", attr(vc_reml$cond$group, "stddev")["time"], "\n")
cat("REML Residual SD:", sigma(fit_reml), "\n")
