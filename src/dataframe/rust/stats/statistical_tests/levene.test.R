#!/usr/bin/env Rscript

# R script for Levene's test comparisons
# Usage: Rscript levene.test.R <function_name> <args...>

source("test-helpers.R")

# Define Levene's test function
levene_test <- function(groups_json, alpha) {
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
  
  # Perform Levene's test using car package
  if (!require(car, quietly = TRUE)) {
    # Fallback to manual calculation if car package not available
    # Calculate group means
    group_means <- tapply(df$value, df$group, mean)
    
    # Calculate absolute deviations from group means
    df$abs_dev <- abs(df$value - group_means[df$group])
    
    # Perform one-way ANOVA on absolute deviations
    model <- lm(abs_dev ~ group, data = df)
    anova_result <- anova(model)
    
    f_stat <- anova_result$`F value`[1]
    p_value <- anova_result$`Pr(>F)`[1]
  } else {
    # Use car::leveneTest if available
    levene_result <- car::leveneTest(value ~ group, data = df)
    f_stat <- levene_result$`F value`[1]
    p_value <- levene_result$`Pr(>F)`[1]
  }
  
  list(
    test_statistic = f_stat,
    p_value = p_value,
    reject_null = p_value < as.numeric(alpha)
  )
}

# Define equal variances test function
has_equal_variances <- function(groups_json, alpha) {
  result <- levene_test(groups_json, alpha)
  result$reject_null <- !result$reject_null  # Invert logic for equal variances
  result
}

# Override the call function for Levene tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "levene.test" = levene_test(args$args[1], args$args[2]),
    "levene.test.equalvar" = has_equal_variances(args$args[1], args$args[2]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
