#!/usr/bin/env Rscript

cat("\n📊 One-Way ANOVA\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

group1 <- c(12, 14, 11, 13, 15)
group2 <- c(17, 19, 18, 20, 16)
group3 <- c(22, 24, 23, 21, 25)

values <- c(group1, group2, group3)
groups <- factor(c(rep(1, 5), rep(2, 5), rep(3, 5)))

# One-way ANOVA
result <- summary(aov(values ~ groups))

cat("Groups: [[", paste(group1, collapse = ", "), "], [", paste(group2, collapse = ", "), "], [", paste(group3, collapse = ", "), "]]\n")
cat("F-statistic:", result[[1]]$`F value`[1], "\n")
cat("df between:", result[[1]]$Df[1], "\n")
cat("df within:", result[[1]]$Df[2], "\n")
cat("p-value:", result[[1]]$`Pr(>F)`[1], "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("ONE-WAY ANOVA SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
