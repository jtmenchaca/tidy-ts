#!/usr/bin/env Rscript

# Debug new Games-Howell calculation
cat("=== GAMES-HOWELL CALCULATION DEBUG ===\n")

source("post_hoc_tests.test.R")

# Test data
groups <- list(c(1, 2, 3, 4, 5), c(2, 3, 4, 5, 6), c(3, 4, 5, 6, 7))
groups_json <- jsonlite::toJSON(groups)

cat("Testing new Games-Howell function:\n")
result <- games_howell_test(groups_json, "0.05")
print(result)

cat("\nManual calculation check:\n")
df <- data.frame(
  value = c(1,2,3,4,5, 2,3,4,5,6, 3,4,5,6,7),
  group = factor(c(rep(1,5), rep(2,5), rep(3,5)))
)

# Calculate group stats manually
group1_data <- df$value[df$group == 1]
group2_data <- df$value[df$group == 2]

mean1 <- mean(group1_data)
mean2 <- mean(group2_data)
var1 <- var(group1_data)
var2 <- var(group2_data)
n1 <- length(group1_data)
n2 <- length(group2_data)

cat("Group 1: mean =", mean1, ", var =", var1, ", n =", n1, "\n")
cat("Group 2: mean =", mean2, ", var =", var2, ", n =", n2, "\n")

mean_diff <- abs(mean2 - mean1)
se_welch <- sqrt(var1/n1 + var2/n2)
test_stat_calc <- mean_diff / se_welch

cat("Mean difference:", mean_diff, "\n")
cat("Welch SE:", se_welch, "\n")
cat("Test statistic:", test_stat_calc, "\n")

# Compare with PMCMRplus
cat("\nPMCMRplus result:\n")
gh_result <- PMCMRplus::gamesHowellTest(value ~ group, data = df)
print(gh_result$statistic)
cat("PMCMRplus statistic for 2vs1:", abs(gh_result$statistic[1,1]), "\n")