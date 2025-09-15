#!/usr/bin/env Rscript

# R script for ANOVA comparisons
# Usage: Rscript anova.test.R <function_name> <args...>

source("test-helpers.R")

# Define one-way ANOVA function
anova_one_way <- function(groups_json, alpha) {
  groups <- jsonlite::fromJSON(groups_json, simplifyMatrix = FALSE)
  
  # Convert to long format for R
  values <- c()
  group_labels <- c()
  
  for (i in seq_along(groups)) {
    group_data <- groups[[i]]
    values <- c(values, group_data)
    group_labels <- c(group_labels, rep(i, length(group_data)))
  }
  
  # Create data frame
  df <- data.frame(
    value = values,
    group = as.factor(group_labels)
  )
  
  # Perform ANOVA using lm and anova
  model <- lm(value ~ group, data = df)
  anova_result <- anova(model)
  
  # Extract F-statistic and p-value
  f_stat <- anova_result$`F value`[1]
  p_value <- anova_result$`Pr(>F)`[1]
  
  list(
    test_statistic = f_stat,
    p_value = p_value,
    reject_null = p_value < as.numeric(alpha)
  )
}

# Override the call function for ANOVA tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "aov.one" = anova_one_way(args$args[1], args$args[2]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
