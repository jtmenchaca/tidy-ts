cat("\n📊 Two-Way ANOVA\n")
cat(strrep("-", 80), "\n")

# Data structure: 2 (Diet) × 3 (Exercise) design
diet <- factor(rep(c("low", "high"), each=9))
exercise <- factor(rep(rep(c("none", "moderate", "intense"), each=3), 2))
values <- c(
  2.1, 2.3, 2.5,  # low diet, no exercise
  3.1, 3.3, 3.5,  # low diet, moderate exercise
  4.1, 4.3, 4.5,  # low diet, intense exercise
  3.2, 3.4, 3.6,  # high diet, no exercise
  4.2, 4.4, 4.6,  # high diet, moderate exercise
  5.2, 5.4, 5.6   # high diet, intense exercise
)

model <- aov(values ~ diet * exercise)
result <- summary(model)

cat("Data structure: 2 (Diet) × 3 (Exercise) design\n")
cat("\nFactor A (Diet):\n")
cat("  F-statistic:", result[[1]]$`F value`[1], "\n")
cat("  p-value:", result[[1]]$`Pr(>F)`[1], "\n")
cat("  df:", result[[1]]$Df[1], "\n")

cat("\nFactor B (Exercise):\n")
cat("  F-statistic:", result[[1]]$`F value`[2], "\n")
cat("  p-value:", result[[1]]$`Pr(>F)`[2], "\n")
cat("  df:", result[[1]]$Df[2], "\n")

cat("\nInteraction (A×B):\n")
cat("  F-statistic:", result[[1]]$`F value`[3], "\n")
cat("  p-value:", result[[1]]$`Pr(>F)`[3], "\n")
cat("  df:", result[[1]]$Df[3], "\n")

cat("\n", strrep("=", 80), "\n")
cat("TWO-WAY ANOVA SPOT CHECK\n")
cat(strrep("=", 80), "\n")
