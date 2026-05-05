# Reference values for nonparametric tests (Wilcoxon signed-rank, Kruskal-Wallis)

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# Fixed data
paired_x <- c(85, 90, 78, 92, 88, 76, 95, 82)
paired_y <- c(80, 85, 75, 89, 84, 72, 90, 78)

kw_g1 <- c(7, 8, 6, 9, 7, 8)
kw_g2 <- c(12, 14, 11, 13, 15, 12)
kw_g3 <- c(18, 20, 17, 19, 21, 18)

results <- list()

# 1. Wilcoxon signed-rank, two-sided (exact=FALSE, correct=TRUE matches our implementation)
w1 <- wilcox.test(paired_x, paired_y, paired = TRUE, exact = FALSE, correct = TRUE)
results$wilcoxon_two_sided_V <- unname(w1$statistic)
results$wilcoxon_two_sided_p_value <- w1$p.value

# 2. Wilcoxon signed-rank, greater
w2 <- wilcox.test(paired_x, paired_y, paired = TRUE, alternative = "greater", exact = FALSE, correct = TRUE)
results$wilcoxon_greater_V <- unname(w2$statistic)
results$wilcoxon_greater_p_value <- w2$p.value

# 3. Wilcoxon signed-rank, less
w3 <- wilcox.test(paired_x, paired_y, paired = TRUE, alternative = "less", exact = FALSE, correct = TRUE)
results$wilcoxon_less_V <- unname(w3$statistic)
results$wilcoxon_less_p_value <- w3$p.value

# 4. Wilcoxon signed-rank with ties (exact=FALSE, correct=TRUE)
ties_x <- c(1, 2, 2, 3, 4)
ties_y <- c(1, 1, 2, 2, 3)
w4 <- wilcox.test(ties_x, ties_y, paired = TRUE, exact = FALSE, correct = TRUE)
results$wilcoxon_ties_V <- unname(w4$statistic)
results$wilcoxon_ties_p_value <- w4$p.value

# 5. Kruskal-Wallis basic (3 groups)
k1 <- kruskal.test(list(kw_g1, kw_g2, kw_g3))
results$kruskal_basic_H <- unname(k1$statistic)
results$kruskal_basic_p_value <- k1$p.value
results$kruskal_basic_df <- unname(k1$parameter)

# 6. Kruskal-Wallis two groups
k2 <- kruskal.test(list(kw_g1, kw_g2))
results$kruskal_two_groups_H <- unname(k2$statistic)
results$kruskal_two_groups_p_value <- k2$p.value
results$kruskal_two_groups_df <- unname(k2$parameter)

# 7. Kruskal-Wallis with ties
ties_g1 <- c(1, 2, 2, 3)
ties_g2 <- c(2, 3, 3, 4)
ties_g3 <- c(3, 4, 4, 5)
k3 <- kruskal.test(list(ties_g1, ties_g2, ties_g3))
results$kruskal_ties_H <- unname(k3$statistic)
results$kruskal_ties_p_value <- k3$p.value
results$kruskal_ties_df <- unname(k3$parameter)

emit_reference(results)
