#!/usr/bin/env Rscript

# Debug Games-Howell test
cat("=== R GAMES-HOWELL DEBUG ===\n")

# Install and load PMCMRplus
if (!require("PMCMRplus", quietly = TRUE)) {
  install.packages("PMCMRplus", repos = "https://cloud.r-project.org/", quiet = TRUE)
  library(PMCMRplus)
}

# Test data from the failing test
group1 <- c(1, 2, 3, 4, 5)
group2 <- c(2, 3, 4, 5, 6)
group3 <- c(3, 4, 5, 6, 7)
groups <- list(group1, group2, group3)

# Convert to data frame
all_values <- unlist(groups)
group_labels <- rep(1:length(groups), lengths(groups))
df <- data.frame(value = all_values, group = factor(group_labels))

cat("Data:\n")
print(df)

# Run Games-Howell test
cat("\n=== GAMES-HOWELL TEST ===\n")
gh_result <- gamesHowellTest(value ~ group, data = df)
print(gh_result)

# Extract matrices
cat("\n=== P-VALUE MATRIX ===\n")
print(gh_result$p.value)

cat("\n=== STATISTIC MATRIX ===\n")
print(gh_result$statistic)

# Get first comparison details
first_p <- gh_result$p.value[1, 1]  # Group 2 vs Group 1
first_stat <- abs(gh_result$statistic[1, 1])

cat("\n=== FIRST COMPARISON DETAILS ===\n")
cat("Test statistic:", first_stat, "\n")
cat("P-value:", first_p, "\n")

# Compare with manual calculation
cat("\n=== MANUAL CALCULATION CHECK ===\n")
mean1 <- mean(group1)
mean2 <- mean(group2)
var1 <- var(group1)
var2 <- var(group2)
n1 <- length(group1)
n2 <- length(group2)

cat("Group 1: mean =", mean1, ", var =", var1, ", n =", n1, "\n")
cat("Group 2: mean =", mean2, ", var =", var2, ", n =", n2, "\n")

# Welch's t-test standard error
se_diff <- sqrt(var1/n1 + var2/n2)
cat("Standard error:", se_diff, "\n")

# t-statistic
t_stat <- abs(mean1 - mean2) / se_diff
cat("t-statistic:", t_stat, "\n")

# Welch's degrees of freedom
df_welch <- (var1/n1 + var2/n2)^2 / ((var1/n1)^2/(n1-1) + (var2/n2)^2/(n2-1))
cat("Welch df:", df_welch, "\n")

# Raw p-value (two-tailed)
p_raw <- 2 * pt(-abs(t_stat), df = df_welch)
cat("Raw p-value:", p_raw, "\n")

# Compare with PMCMRplus result
cat("PMCMRplus p-value:", first_p, "\n")
cat("Difference:", abs(first_p - p_raw), "\n")