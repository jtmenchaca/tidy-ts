#!/usr/bin/env Rscript

cat("\n📊 Paired T-Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

library(effsize)

before <- c(120, 135, 118, 140, 125, 132, 128, 122)
after <- c(125, 142, 123, 148, 130, 140, 135, 128)

# Paired t-test
result <- t.test(before, after, paired = TRUE, alternative = "two.sided", conf.level = 0.95)

# Cohen's d for paired samples (using within=FALSE for standard formula)
cohens_d <- cohen.d(before, after, paired = TRUE, within = FALSE)

cat("Before:", before, "\n")
cat("After:", after, "\n")
cat("t-statistic:", result$statistic, "\n")
cat("df:", result$parameter, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")
cat("Cohen's d:", cohens_d$estimate, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("PAIRED T-TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
