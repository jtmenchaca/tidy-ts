#!/usr/bin/env Rscript

cat("\n📊 Two-Sample Z-Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

library(BSDA)

group1 <- c(23.5, 24.1, 22.8, 23.9, 24.3)
group2 <- c(21.2, 20.7, 21.8, 20.9, 21.5)
sigma1 <- 1.2
sigma2 <- 1.0

# Two-sample z-test
result <- z.test(group1, group2, sigma.x = sigma1, sigma.y = sigma2,
                 alternative = "two.sided", conf.level = 0.95)

cat("Group 1:", group1, "\n")
cat("Group 2:", group2, "\n")
cat("sigma1:", sigma1, "\n")
cat("sigma2:", sigma2, "\n")
cat("Z-statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("TWO-SAMPLE Z-TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
