#!/usr/bin/env Rscript

library(PMCMRplus)

# Test data
df <- data.frame(
  value = c(1,2,3,4,5, 2,3,4,5,6, 3,4,5,6,7),
  group = factor(c(rep(1,5), rep(2,5), rep(3,5)))
)

cat("=== PMCMRplus Games-Howell ===\n")
gh_result <- gamesHowellTest(value ~ group, data = df)
print(gh_result)

cat("\nStatistic matrix:\n")
print(gh_result$statistic)
cat("First comparison statistic:", abs(gh_result$statistic[1,1]), "\n")

cat("\nManual calculation:\n")
group1_data <- df$value[df$group == 1]
group2_data <- df$value[df$group == 2]

mean1 <- mean(group1_data)
mean2 <- mean(group2_data)
var1 <- var(group1_data)
var2 <- var(group2_data)
n1 <- length(group1_data)
n2 <- length(group2_data)

mean_diff <- abs(mean2 - mean1)
se_welch <- sqrt(var1/n1 + var2/n2)
t_stat <- mean_diff / se_welch

cat("Manual t-statistic (|mean_diff|/SE):", t_stat, "\n")
cat("PMCMRplus reports:", abs(gh_result$statistic[1,1]), "\n")