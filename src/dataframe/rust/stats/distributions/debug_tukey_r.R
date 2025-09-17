#!/usr/bin/env Rscript

# Debug the exact Tukey HSD case that's failing
cat("=== R TUKEY DEBUG ===\n")

# Test data from debug_actual_tukey.ts
group1 <- c(1, 2, 3, 4, 5)
group2 <- c(2, 3, 4, 5, 6)
group3 <- c(3, 4, 5, 6, 7)
groups <- list(group1, group2, group3)
alpha <- 0.05

# Convert to data frame for ANOVA
all_values <- unlist(groups)
group_labels <- rep(1:length(groups), lengths(groups))
df <- data.frame(value = all_values, group = factor(group_labels))

cat("Data:\n")
print(df)

# Perform ANOVA
aov_result <- aov(value ~ group, data = df)
cat("\nANOVA summary:\n")
print(summary(aov_result))

# Get key values
n_groups <- length(groups)
df_error <- aov_result$df.residual
cat("\nKey values:\n")
cat("Number of groups:", n_groups, "\n")
cat("Error degrees of freedom:", df_error, "\n")

# Use built-in TukeyHSD
tukey_result <- TukeyHSD(aov_result, "group")
cat("\nBuilt-in TukeyHSD result:\n")
print(tukey_result)

# Extract first comparison
first_comp <- tukey_result$group[1, ]
cat("\nFirst comparison (Group 2 vs Group 1):\n")
cat("Difference:", first_comp[1], "\n")
cat("Lower CI:", first_comp[2], "\n") 
cat("Upper CI:", first_comp[3], "\n")
cat("P-value (adjusted):", first_comp[4], "\n")

# Calculate critical value and test statistic
q_critical <- qtukey(1 - alpha, n_groups, df_error)
cat("\nCritical value q(", 1-alpha, ",", n_groups, ",", df_error, ") =", q_critical, "\n")

# Back-calculate SE from CI
se <- (first_comp[3] - first_comp[2]) / (2 * q_critical)
cat("Standard error:", se, "\n")

# Calculate test statistic
test_stat <- abs(first_comp[1]) / se
cat("Test statistic q:", test_stat, "\n")

# Calculate p-value
p_val <- 1 - ptukey(test_stat, n_groups, df_error)
cat("P-value from ptukey:", p_val, "\n")

# Check our specific values
cat("\n=== SPECIFIC VALUES FOR OUR CASE ===\n")
cat("Test statistic (should be ~1.414):", test_stat, "\n")
cat("P-value (should be ~0.591):", first_comp[4], "\n")
cat("ptukey(", test_stat, ",", n_groups, ",", df_error, ") =", ptukey(test_stat, n_groups, df_error), "\n")
cat("1 - ptukey =", 1 - ptukey(test_stat, n_groups, df_error), "\n")