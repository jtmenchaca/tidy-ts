#!/usr/bin/env Rscript

# Debug different alpha values for Tukey HSD
cat("=== TUKEY HSD ALPHA DEBUG ===\n")

source("test-helpers.R")

# Test data
groups <- list(c(1, 2, 3, 4, 5), c(2, 3, 4, 5, 6), c(3, 4, 5, 6, 7))
groups_json <- jsonlite::toJSON(groups)

cat("Testing with α=0.05:\n")
result_05 <- call_stat_test_function(list(func = "post.hoc.tukey", args = c(groups_json, "0.05")), NULL)
print(result_05)

cat("\nTesting with α=0.01:\n")
result_01 <- call_stat_test_function(list(func = "post.hoc.tukey", args = c(groups_json, "0.01")), NULL)
print(result_01)

cat("\nDirect R TukeyHSD with both alphas:\n")

# Convert to data frame
all_values <- unlist(groups)
group_labels <- rep(1:length(groups), lengths(groups))
df <- data.frame(value = all_values, group = factor(group_labels))

# ANOVA
aov_result <- aov(value ~ group, data = df)

# TukeyHSD with different alphas
cat("α=0.05:\n")
tukey_05 <- TukeyHSD(aov_result, "group", conf.level = 0.95)
print(tukey_05)

cat("\nα=0.01:\n")
tukey_01 <- TukeyHSD(aov_result, "group", conf.level = 0.99)
print(tukey_01)

# Check if test statistic changes
cat("\nTest statistic should be the same for both:\n")
first_comp_05 <- tukey_05$group[1, ]
first_comp_01 <- tukey_01$group[1, ]

cat("α=0.05 - diff:", first_comp_05[1], "p-value:", first_comp_05[4], "\n")
cat("α=0.01 - diff:", first_comp_01[1], "p-value:", first_comp_01[4], "\n")

# Calculate test statistic manually
mean_diff <- first_comp_05[1]
ci_lower_05 <- first_comp_05[2]
ci_upper_05 <- first_comp_05[3]
ci_lower_01 <- first_comp_01[2]  
ci_upper_01 <- first_comp_01[3]

# Back-calculate SE and test statistic
n_groups <- 3
df_error <- aov_result$df.residual

q_critical_05 <- qtukey(0.95, n_groups, df_error)
q_critical_01 <- qtukey(0.99, n_groups, df_error)

se_05 <- (ci_upper_05 - ci_lower_05) / (2 * q_critical_05)
se_01 <- (ci_upper_01 - ci_lower_01) / (2 * q_critical_01)

test_stat_05 <- abs(mean_diff) / se_05
test_stat_01 <- abs(mean_diff) / se_01

cat("Calculated test statistic α=0.05:", test_stat_05, "\n")
cat("Calculated test statistic α=0.01:", test_stat_01, "\n")
cat("Critical values - α=0.05:", q_critical_05, "α=0.01:", q_critical_01, "\n")