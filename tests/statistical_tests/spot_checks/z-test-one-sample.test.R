#!/usr/bin/env Rscript

cat("\n📊 One-Sample Z-Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

# install.packages("BSDA")
library(BSDA)

data <- c(12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0)
mu <- 12.0
sigma <- 0.8

# One-sample z-test
result <- z.test(data, mu = mu, sigma.x = sigma, alternative = "two.sided", conf.level = 0.95)

cat("Data:", data, "\n")
cat("mu (null hypothesis):", mu, "\n")
cat("sigma (population SD):", sigma, "\n")
cat("Z-statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("Z-TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
