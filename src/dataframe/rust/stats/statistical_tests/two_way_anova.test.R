#!/usr/bin/env Rscript

# R script for Two-way ANOVA comparisons
# Usage: Rscript two_way_anova.test.R <function_name> <args...>

source("test-helpers.R")

# Define two-way ANOVA functions
two_way_anova_factor_a <- function(data_json, alpha) {
  data_matrix <- jsonlite::fromJSON(data_json, simplifyMatrix = FALSE)
  
  # Convert matrix to long format
  values <- c()
  factor_a_labels <- c()
  factor_b_labels <- c()
  
  for (i in seq_along(data_matrix)) {
    for (j in seq_along(data_matrix[[i]])) {
      cell_values <- data_matrix[[i]][[j]]
      values <- c(values, cell_values)
      factor_a_labels <- c(factor_a_labels, rep(i, length(cell_values)))
      factor_b_labels <- c(factor_b_labels, rep(j, length(cell_values)))
    }
  }
  
  # Create data frame
  df <- data.frame(
    value = values,
    factor_a = as.factor(factor_a_labels),
    factor_b = as.factor(factor_b_labels)
  )
  
  # Perform two-way ANOVA
  model <- lm(value ~ factor_a + factor_b + factor_a:factor_b, data = df)
  anova_result <- anova(model)
  
  # Extract Factor A results
  f_stat <- anova_result$`F value`[1]
  p_value <- anova_result$`Pr(>F)`[1]
  
  # Handle NaN or infinite values
  if (is.na(f_stat) || is.infinite(f_stat)) {
    f_stat <- 0
  }
  if (is.na(p_value) || is.infinite(p_value)) {
    p_value <- 1
  }
  
  list(
    test_statistic = f_stat,
    p_value = p_value,
    reject_null = p_value < as.numeric(alpha)
  )
}

two_way_anova_factor_b <- function(data_json, alpha) {
  data_matrix <- jsonlite::fromJSON(data_json, simplifyMatrix = FALSE)
  
  # Convert matrix to long format
  values <- c()
  factor_a_labels <- c()
  factor_b_labels <- c()
  
  for (i in seq_along(data_matrix)) {
    for (j in seq_along(data_matrix[[i]])) {
      cell_values <- data_matrix[[i]][[j]]
      values <- c(values, cell_values)
      factor_a_labels <- c(factor_a_labels, rep(i, length(cell_values)))
      factor_b_labels <- c(factor_b_labels, rep(j, length(cell_values)))
    }
  }
  
  # Create data frame
  df <- data.frame(
    value = values,
    factor_a = as.factor(factor_a_labels),
    factor_b = as.factor(factor_b_labels)
  )
  
  # Perform two-way ANOVA
  model <- lm(value ~ factor_a + factor_b + factor_a:factor_b, data = df)
  anova_result <- anova(model)
  
  # Extract Factor B results
  f_stat <- anova_result$`F value`[2]
  p_value <- anova_result$`Pr(>F)`[2]
  
  # Handle NaN or infinite values
  if (is.na(f_stat) || is.infinite(f_stat)) {
    f_stat <- 0
  }
  if (is.na(p_value) || is.infinite(p_value)) {
    p_value <- 1
  }
  
  list(
    test_statistic = f_stat,
    p_value = p_value,
    reject_null = p_value < as.numeric(alpha)
  )
}

two_way_anova_interaction <- function(data_json, alpha) {
  data_matrix <- jsonlite::fromJSON(data_json, simplifyMatrix = FALSE)
  
  # Convert matrix to long format
  values <- c()
  factor_a_labels <- c()
  factor_b_labels <- c()
  
  for (i in seq_along(data_matrix)) {
    for (j in seq_along(data_matrix[[i]])) {
      cell_values <- data_matrix[[i]][[j]]
      values <- c(values, cell_values)
      factor_a_labels <- c(factor_a_labels, rep(i, length(cell_values)))
      factor_b_labels <- c(factor_b_labels, rep(j, length(cell_values)))
    }
  }
  
  # Create data frame
  df <- data.frame(
    value = values,
    factor_a = as.factor(factor_a_labels),
    factor_b = as.factor(factor_b_labels)
  )
  
  # Perform two-way ANOVA
  model <- lm(value ~ factor_a + factor_b + factor_a:factor_b, data = df)
  anova_result <- anova(model)
  
  # Extract Interaction results
  f_stat <- anova_result$`F value`[3]
  p_value <- anova_result$`Pr(>F)`[3]
  
  # Handle NaN or infinite values
  if (is.na(f_stat) || is.infinite(f_stat)) {
    f_stat <- 0
  }
  if (is.na(p_value) || is.infinite(p_value)) {
    p_value <- 1
  }
  
  list(
    test_statistic = f_stat,
    p_value = p_value,
    reject_null = p_value < as.numeric(alpha)
  )
}

two_way_anova <- function(data_json, alpha) {
  data_matrix <- jsonlite::fromJSON(data_json, simplifyMatrix = FALSE)
  
  # Convert matrix to long format
  values <- c()
  factor_a_labels <- c()
  factor_b_labels <- c()
  
  for (i in seq_along(data_matrix)) {
    for (j in seq_along(data_matrix[[i]])) {
      cell_values <- data_matrix[[i]][[j]]
      values <- c(values, cell_values)
      factor_a_labels <- c(factor_a_labels, rep(i, length(cell_values)))
      factor_b_labels <- c(factor_b_labels, rep(j, length(cell_values)))
    }
  }
  
  # Create data frame
  df <- data.frame(
    value = values,
    factor_a = as.factor(factor_a_labels),
    factor_b = as.factor(factor_b_labels)
  )
  
  # Perform two-way ANOVA
  model <- lm(value ~ factor_a + factor_b + factor_a:factor_b, data = df)
  anova_result <- anova(model)
  
  # Return overall ANOVA results (Factor A)
  f_stat <- anova_result$`F value`[1]
  p_value <- anova_result$`Pr(>F)`[1]
  
  # Handle NaN or infinite values
  if (is.na(f_stat) || is.infinite(f_stat)) {
    f_stat <- 0
  }
  if (is.na(p_value) || is.infinite(p_value)) {
    p_value <- 1
  }
  
  list(
    test_statistic = f_stat,
    p_value = p_value,
    reject_null = p_value < as.numeric(alpha)
  )
}

# Override the call function for Two-way ANOVA tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "aov.two.factorA" = two_way_anova_factor_a(args$args[1], args$args[2]),
    "aov.two.factorB" = two_way_anova_factor_b(args$args[1], args$args[2]),
    "aov.two.interaction" = two_way_anova_interaction(args$args[1], args$args[2]),
    "aov.two" = two_way_anova(args$args[1], args$args[2]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
