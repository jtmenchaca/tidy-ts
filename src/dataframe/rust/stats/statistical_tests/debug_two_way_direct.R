#!/usr/bin/env Rscript

# Direct test of two-way ANOVA function
cat("=== DIRECT TWO-WAY ANOVA TEST ===\n")

library(jsonlite)

# Load the function
source("two_way_anova.test.R")

# Test data
data <- list(
  list(c(1, 2, 3, 4, 5), c(2, 3, 4, 5, 6), c(3, 4, 5, 6, 7)),
  list(c(4, 5, 6, 7, 8), c(5, 6, 7, 8, 9), c(6, 7, 8, 9, 10))
)

data_json <- toJSON(data)
alpha <- "0.05"

cat("Calling two_way_anova directly:\n")
result <- two_way_anova(data_json, alpha)
print(result)