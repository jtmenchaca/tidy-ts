#!/usr/bin/env Rscript

# Debug two-way ANOVA
cat("=== TWO-WAY ANOVA DEBUG ===\n")

source("test-helpers.R")

# Test data from twoWayAnova_v3.test.ts
data <- list(
  list(c(1, 2, 3, 4, 5), c(2, 3, 4, 5, 6), c(3, 4, 5, 6, 7)),
  list(c(4, 5, 6, 7, 8), c(5, 6, 7, 8, 9), c(6, 7, 8, 9, 10))
)

cat("Input data structure:\n")
str(data)

# Test the R function directly
tryCatch({
  result <- call_stat_test_function(list(func = "aov.two", args = c(jsonlite::toJSON(data), "0.05")), NULL)
  cat("R function result:\n")
  print(result)
}, error = function(e) {
  cat("R function error:", e$message, "\n")
})

# Test manual conversion
cat("\nManual data conversion:\n")
data_matrix <- data

# Convert matrix to long format
values <- c()
factor_a_labels <- c()
factor_b_labels <- c()

for (i in seq_along(data_matrix)) {
  for (j in seq_along(data_matrix[[i]])) {
    values <- c(values, data_matrix[[i]][[j]])
    factor_a_labels <- c(factor_a_labels, rep(i, length(data_matrix[[i]][[j]])))
    factor_b_labels <- c(factor_b_labels, rep(j, length(data_matrix[[i]][[j]])))
  }
}

cat("Values length:", length(values), "\n")
cat("Factor A labels length:", length(factor_a_labels), "\n")
cat("Factor B labels length:", length(factor_b_labels), "\n")

# Create data frame
df <- data.frame(
  value = values,
  factor_a = as.factor(factor_a_labels),
  factor_b = as.factor(factor_b_labels)
)

cat("Data frame:\n")
print(head(df, 10))
cat("Data frame dimensions:", nrow(df), "x", ncol(df), "\n")

# Test ANOVA
tryCatch({
  model <- lm(value ~ factor_a + factor_b + factor_a:factor_b, data = df)
  anova_result <- anova(model)
  cat("ANOVA result:\n")
  print(anova_result)
}, error = function(e) {
  cat("ANOVA error:", e$message, "\n")
})