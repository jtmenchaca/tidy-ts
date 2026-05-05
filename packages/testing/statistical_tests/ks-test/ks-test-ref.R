cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

sample1 <- c(0.12, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89, 0.91, 0.95, 0.99)
sample2 <- c(0.05, 0.15, 0.25, 0.35, 0.55, 0.65, 0.75, 0.85, 0.92, 0.98)
non_uniform <- c(0.01, 0.02, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40)

# 1. Two-sample, two-sided
res <- ks.test(sample1, sample2)
two_sample_two_sided_D <- unname(res$statistic)
two_sample_two_sided_p_value <- res$p.value

# 2. Two-sample, less
res <- ks.test(sample1, sample2, alternative = "less")
two_sample_less_D <- unname(res$statistic)
two_sample_less_p_value <- res$p.value

# 3. Two-sample, greater
res <- ks.test(sample1, sample2, alternative = "greater")
two_sample_greater_D <- unname(res$statistic)
two_sample_greater_p_value <- res$p.value

# 4. One-sample uniform test
res <- ks.test(sample1, "punif", min = 0, max = 1)
uniform_test_D <- unname(res$statistic)
uniform_test_p_value <- res$p.value

# 5. Non-uniform (should reject)
res <- ks.test(non_uniform, "punif", min = 0, max = 1)
non_uniform_D <- unname(res$statistic)
non_uniform_p_value <- res$p.value

# 6. Identical samples
res <- ks.test(sample1, sample1)
identical_samples_D <- unname(res$statistic)
identical_samples_p_value <- res$p.value

# 7. Very different samples
x <- c(1, 2, 3, 4, 5)
y <- c(10, 11, 12, 13, 14)
res <- ks.test(x, y)
very_different_D <- unname(res$statistic)
very_different_p_value <- res$p.value

emit_reference(list(
  two_sample_two_sided_D = two_sample_two_sided_D,
  two_sample_two_sided_p_value = two_sample_two_sided_p_value,
  two_sample_less_D = two_sample_less_D,
  two_sample_less_p_value = two_sample_less_p_value,
  two_sample_greater_D = two_sample_greater_D,
  two_sample_greater_p_value = two_sample_greater_p_value,
  uniform_test_D = uniform_test_D,
  uniform_test_p_value = uniform_test_p_value,
  non_uniform_D = non_uniform_D,
  non_uniform_p_value = non_uniform_p_value,
  identical_samples_D = identical_samples_D,
  identical_samples_p_value = identical_samples_p_value,
  very_different_D = very_different_D,
  very_different_p_value = very_different_p_value
))
