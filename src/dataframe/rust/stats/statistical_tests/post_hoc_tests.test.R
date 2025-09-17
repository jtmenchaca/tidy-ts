#!/usr/bin/env Rscript

# R script for post-hoc test comparisons
# Usage: Rscript post_hoc_tests.test.R <function_name> <args...>

source("test-helpers.R")

# Install required packages if not available
required_packages <- c("multcomp", "PMCMRplus", "FSA", "jsonlite")
for (pkg in required_packages) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    install.packages(pkg, repos = "https://cloud.r-project.org/", quiet = TRUE)
  }
}

library(multcomp, quietly = TRUE)
library(PMCMRplus, quietly = TRUE)
library(FSA, quietly = TRUE)
library(jsonlite, quietly = TRUE)

# Helper function to convert groups to data frame
groups_to_df <- function(groups_json) {
  # Parse the JSON string to get nested arrays
  groups <- fromJSON(groups_json, simplifyVector = FALSE)  # Keep as list structure
  
  # Convert to flat vectors
  all_values <- as.numeric(unlist(groups))
  group_labels <- rep(1:length(groups), lengths(groups))
  
  # Create data frame
  df <- data.frame(value = all_values, group = factor(group_labels))
  return(df)
}

# Tukey HSD test using direct calculation (proper approach)
tukey_hsd_test <- function(groups_json, alpha) {
  df <- groups_to_df(groups_json)
  
  # Perform one-way ANOVA first to get pooled variance
  aov_result <- aov(value ~ group, data = df)
  
  # Calculate group means and sizes directly
  group_means <- aggregate(value ~ group, data = df, FUN = mean)$value
  group_sizes <- aggregate(value ~ group, data = df, FUN = length)$value
  
  # Get MSE (pooled variance) from ANOVA
  mse <- summary(aov_result)[[1]]["Residuals", "Mean Sq"]
  
  # Calculate standard error for first comparison (group 2 vs group 1)
  # SE = sqrt(MSE * (1/n_i + 1/n_j))
  se <- sqrt(mse * (1/group_sizes[1] + 1/group_sizes[2]))
  
  # Calculate mean difference (group 2 - group 1)
  mean_diff <- group_means[2] - group_means[1]
  
  # Calculate Tukey HSD test statistic: q = sqrt(2) * |mean_diff| / SE
  test_statistic <- sqrt(2) * abs(mean_diff) / se
  
  # Get p-value from TukeyHSD for comparison (this is the gold standard)
  # Use confidence level based on alpha
  conf_level <- 1 - as.numeric(alpha)
  tukey_result <- TukeyHSD(aov_result, "group", conf.level = conf_level)
  p_value <- tukey_result$group[1, 4]  # p adj
  
  list(
    test_statistic = test_statistic,
    p_value = p_value,
    method = "Tukey HSD",
    n_comparisons = nrow(tukey_result$group)
  )
}

# Games-Howell test using direct calculation and PMCMRplus for validation
games_howell_test <- function(groups_json, alpha) {
  tryCatch({
    df <- groups_to_df(groups_json)
    
    # Calculate group means, sizes, and variances directly
    group_stats <- aggregate(value ~ group, data = df, FUN = function(x) {
      c(mean = mean(x), n = length(x), var = var(x))
    })
    
    # Extract first two groups for comparison (group 2 vs group 1)
    mean1 <- group_stats$value[1, 1]  # mean of group 1
    n1 <- group_stats$value[1, 2]     # size of group 1
    var1 <- group_stats$value[1, 3]   # variance of group 1
    
    mean2 <- group_stats$value[2, 1]  # mean of group 2
    n2 <- group_stats$value[2, 2]     # size of group 2
    var2 <- group_stats$value[2, 3]   # variance of group 2
    
    # Calculate Games-Howell test statistic
    # PMCMRplus uses q = sqrt(2) * |mean1 - mean2| / sqrt((var1/n1) + (var2/n2))
    # This matches the studentized range approach used in Tukey HSD
    mean_diff <- abs(mean2 - mean1)
    se_welch <- sqrt(var1/n1 + var2/n2)
    test_statistic <- sqrt(2) * mean_diff / se_welch
    
    # Use PMCMRplus for p-value (gold standard)
    gh_result <- gamesHowellTest(value ~ group, data = df)
    p_matrix <- gh_result$p.value
    first_p_value <- p_matrix[1, 1]  # "2" vs "1" 
    
    list(
      test_statistic = test_statistic,
      p_value = first_p_value,
      method = "Games-Howell",
      n_comparisons = sum(!is.na(p_matrix))
    )
  }, error = function(e) {
    return(NULL)
  })
}

# Dunn's test using direct calculation for test statistic
dunn_test <- function(groups_json, alpha) {
  df <- groups_to_df(groups_json)
  
  # Dunn's test using FSA package (this calculates Z-statistic properly)
  dunn_result <- dunnTest(value ~ group, data = df, method = "bonferroni")
  
  # Extract the first comparison
  first_comparison <- dunn_result$res[1, ]
  
  # The Z-statistic from FSA is already calculated correctly as:
  # Z = (R_i/n_i - R_j/n_j) / sqrt(n(n+1)/12 * (1/n_i + 1/n_j))
  # where R_i, R_j are rank sums and n_i, n_j are group sizes
  
  list(
    test_statistic = abs(first_comparison$Z),  # Z-statistic (properly calculated)
    p_value = first_comparison$P.adj,          # Adjusted p-value
    method = "Dunn's Test",
    n_comparisons = nrow(dunn_result$res)
  )
}

# Override the call function for post-hoc tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "post.hoc.tukey" = tukey_hsd_test(args$args[1], args$args[2]),
    "post.hoc.gameshowell" = games_howell_test(args$args[1], args$args[2]),
    "post.hoc.dunn" = dunn_test(args$args[1], args$args[2]),
    NA
  )
}

# Run the test
run_stat_test(NULL)