#!/usr/bin/env Rscript

# Detailed R Tukey analysis
library(multcomp, quietly = TRUE)

# Exact test data from tukeyHSD_v3.test.ts
group1 <- c(1, 2, 3, 4, 5)
group2 <- c(2, 3, 4, 5, 6)
group3 <- c(3, 4, 5, 6, 7)

# Create data frame
all_values <- c(group1, group2, group3)
group_labels <- rep(1:3, each = 5)
df <- data.frame(value = all_values, group = factor(group_labels))

print("=== DETAILED R TUKEY ANALYSIS ===")
print("Data:")
print(df)

# Perform one-way ANOVA first
aov_result <- aov(value ~ group, data = df)
print("\nANOVA Summary:")
print(summary(aov_result))

# Tukey HSD using multcomp package
tukey_mc <- glht(aov_result, linfct = mcp(group = "Tukey"))
print("\nGLHT object:")
print(tukey_mc)

# Get detailed summary
tukey_summary <- summary(tukey_mc)
print("\nTukey Summary:")
print(tukey_summary)

# Extract specific values
first_comparison <- tukey_summary$test
print("\nFirst comparison details:")
print(paste("T-statistic:", first_comparison$tstat[1]))
print(paste("P-value:", tukey_summary$test$pvalues[1]))
print(paste("Degrees of freedom:", tukey_mc$df))

# Compare with built-in TukeyHSD
print("\n=== BUILT-IN TukeyHSD ===")
builtin_tukey <- TukeyHSD(aov_result)
print(builtin_tukey)

# Raw comparison (what Rust might be calculating)
print("\n=== RAW T-TEST (what Rust might be doing) ===")
t_test_result <- t.test(group1, group2, var.equal = TRUE)
print(paste("Raw t-statistic:", abs(t_test_result$statistic)))
print(paste("Raw p-value:", t_test_result$p.value))
print(paste("Raw p-value / 3 (Bonferroni):", t_test_result$p.value / 3))