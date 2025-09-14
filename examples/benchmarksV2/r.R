#!/usr/bin/env Rscript

# Configuration
SIZES <- c(500000)
ITERATIONS <- 7
WARMUP_RUNS <- 5

# Boolean flags to enable/disable specific operations
OPTIONS <- list(
  creation = TRUE,
  filter = TRUE,
  select = TRUE,
  sort = TRUE,
  mutate = TRUE,
  distinct = TRUE,
  groupBy = TRUE,
  summarize = TRUE,
  innerJoin = TRUE,
  leftJoin = TRUE,
  outerJoin = TRUE,
  pivotLonger = TRUE,
  pivotWider = TRUE,
  bindRows = TRUE,
  stats = TRUE
)

# Load required libraries
library(dplyr)
library(tidyr)
library(jsonlite)

# Prevent scientific notation
options(scipen=999)

# Logging function to display first 5 rows of datasets
log_dataset_head <- function(df, operation_name, library_name) {
  tryCatch({
    cat("\n", operation_name, " - ", library_name, " (first 5 rows):\n", sep = "", file = stderr())
    if (is.data.frame(df)) {
      print(head(df, 5), file = stderr())
    } else {
      cat("Result type:", class(df), "\n", file = stderr())
      if (length(df) <= 10) {
        print(df, file = stderr())
      } else {
        cat("Result preview:", paste(head(df, 5), collapse = ", "), "...\n", file = stderr())
      }
    }
  }, error = function(e) {
    cat("\n", operation_name, " - ", library_name, " (error logging): ", e$message, "\n", sep = "", file = stderr())
  })
}

generate_data <- function(size) {
  set.seed(42)
  df <- data.frame(
    id = 1:size,
    value = runif(size, 0, 1000),
    category = paste0("category_", (1:size - 1) %% 20),
    score = runif(size, 0, 100),
    active = (1:size - 1) %% 3 == 0
  )
  # Convert to factors for better performance
  df$category <- as.factor(df$category)
  return(df)
}

generate_join_data <- function(size) {
  set.seed(42)
  left_data <- data.frame(
    id = 1:size,
    value_a = runif(size, 0, 1000),
    category = c("A", "B", "C")[((1:size - 1) %% 3) + 1]
  )
  left_data$category <- as.factor(left_data$category)
  
  right_size <- as.integer(size * 0.8)
  right_data <- data.frame(
    id = sample(1:size, right_size, replace = TRUE),
    value_b = runif(right_size, 0, 1000),
    status = c("active", "pending", "complete")[((1:right_size - 1) %% 3) + 1]
  )
  right_data$status <- as.factor(right_data$status)
  
  list(left = left_data, right = right_data)
}

generate_pivot_data <- function(size) {
  set.seed(42)
  df <- data.frame(
    id = 1:size,
    region = paste0("region_", (1:size - 1) %% 5),
    product = paste0("product_", (1:size - 1) %% 10),
    q1 = sample(0:999, size, replace = TRUE),
    q2 = sample(0:999, size, replace = TRUE),
    q3 = sample(0:999, size, replace = TRUE),
    q4 = sample(0:999, size, replace = TRUE)
  )
  df$region <- as.factor(df$region)
  df$product <- as.factor(df$product)
  return(df)
}

measure_operation <- function(func, iterations = ITERATIONS, warmup = WARMUP_RUNS, log_result = FALSE, operation_name = "", library_name = "") {
  # Warm up
  for (i in 1:warmup) {
    invisible(func())
  }
  
  times <- numeric(iterations)
  result <- NULL
  for (i in 1:iterations) {
    start <- Sys.time()
    result <- invisible(func())
    end <- Sys.time()
    times[i] <- as.numeric(difftime(end, start, units = "secs")) * 1000
  }
  
  # Log result if requested
  if (log_result && !is.null(result)) {
    log_dataset_head(result, operation_name, library_name)
  }
  
  # Return median of last N-1 runs (excluding first run after warmup)
  if (length(times) > 1) {
    return(median(times))
  } else {
    return(times[1])
  }
}

run_r_benchmarks <- function() {
  cat("Running R benchmarks...\n\n", file = stderr())
  
  results <- list()
  
  for (size in SIZES) {
    cat("  Testing", format(size, big.mark = ","), "rows...\n", file = stderr())
    data <- generate_data(size)
    join_data <- generate_join_data(size)
    pivot_data <- generate_pivot_data(size)
    
    # Prebuild data.frames for consistent performance
    cat("    - Prebuilding data.frames...\n", file = stderr())
    r_df <- data
    r_left <- join_data$left
    r_right <- join_data$right
    r_pivot <- pivot_data
    
    # Prebuild split data.frames for bindRows
    df1_r <- data[1:(nrow(data) %/% 2), ]
    df2_r <- data[(nrow(data) %/% 2 + 1):nrow(data), ]
    
    cat("    - data.frames prebuilt\n", file = stderr())
    
    size_results <- list()
    
    # DataFrame Creation
    if (OPTIONS$creation) {
      r_time <- measure_operation(function() data.frame(data), log_result = TRUE, operation_name = "DataFrame Creation", library_name = "R")
      size_results$creation <- list(
        r = r_time,
        ratio = 1.0  # R only, no comparison
      )
    }
    
    # Filter Operations (3 tests with weighted averaging)
    if (OPTIONS$filter) {
      # Test 1: Simple numeric filtering
      r_numeric <- measure_operation(function() dplyr::filter(r_df, value > 500), log_result = TRUE, operation_name = "Filter (numeric)", library_name = "R")
      
      # Test 2: String filtering
      r_string <- measure_operation(function() dplyr::filter(r_df, category == "category_5"), log_result = TRUE, operation_name = "Filter (string)", library_name = "R")
      
      # Test 3: Complex filtering
      r_complex <- measure_operation(function() dplyr::filter(r_df, value > 300 & score > 50 & active), log_result = TRUE, operation_name = "Filter (complex)", library_name = "R")
      
      # Weighted average
      avg_r <- (r_numeric * 2 + r_string + r_complex) / 4
      size_results$filter <- list(
        r = avg_r,
        ratio = 1.0
      )
    }
    
    # Select Columns
    if (OPTIONS$select) {
      r_time <- measure_operation(function() dplyr::select(r_df, id, value, category), log_result = TRUE, operation_name = "Select Columns", library_name = "R")
      size_results$select <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Sort Operations (5 tests with weighted averaging)
    if (OPTIONS$sort) {
      # Generate specific test data for different sort scenarios
      numeric_data <- data.frame(
        value = runif(size, 0, 1000),
        date = as.Date(paste0("2020-", sprintf("%02d", sample(1:12, size, replace = TRUE)), "-", sprintf("%02d", sample(1:28, size, replace = TRUE)))),
        score = ifelse(1:size %% 10 == 0, NA, runif(size, 0, 100))
      )
      
      mixed_data <- data.frame(
        name = paste0("name_", (1:size - 1) %% 100),
        category = paste0("category_", (1:size - 1) %% 20),
        value = runif(size, 0, 1000),
        active = (1:size - 1) %% 3 == 0
      )
      
      grouped_data <- data.frame(
        group = paste0("group_", (1:size - 1) %% 5),
        value = runif(size, 0, 1000),
        priority = sample(0:9, size, replace = TRUE)
      )
      
      # Test 1: Numeric Fast Path
      r_numeric <- measure_operation(function() dplyr::arrange(numeric_data, value))
      
      # Test 2: Multi-column Numeric Fast Path
      r_multi_numeric <- measure_operation(function() dplyr::arrange(numeric_data, value, desc(score)))
      
      # Test 3: String Stable Path
      r_string <- measure_operation(function() dplyr::arrange(mixed_data, name))
      
      # Test 4: Mixed Types Stable Path
      r_mixed <- measure_operation(function() dplyr::arrange(mixed_data, category, desc(value)))
      
      # Test 5: Grouped Data Stable Path
      r_grouped <- measure_operation(function() {
        grouped_data %>% 
          group_by(group) %>% 
          arrange(desc(value), .by_group = TRUE)
      })
      
      # Weighted average
      avg_r <- (r_numeric * 2 + r_multi_numeric * 2 + r_string + r_mixed + r_grouped) / 7
      size_results$sort <- list(
        r = avg_r,
        ratio = 1.0
      )
    }
    
    # Mutate Operations
    if (OPTIONS$mutate) {
      r_time <- measure_operation(function() dplyr::mutate(r_df, score_pct = score / 100), log_result = TRUE, operation_name = "Mutate", library_name = "R")
      size_results$mutate <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Distinct Operations
    if (OPTIONS$distinct) {
      r_time <- measure_operation(function() dplyr::distinct(r_df), log_result = TRUE, operation_name = "Distinct", library_name = "R")
      size_results$distinct <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Group By Operations (3 tests with weighted averaging)
    if (OPTIONS$groupBy) {
      # Test 1: Single column grouping
      r_single <- measure_operation(function() {
        r_df %>% 
          group_by(category) %>% 
          summarise(count = n(), .groups = "drop")
      }, log_result = TRUE, operation_name = "GroupBy (single)", library_name = "R")
      
      # Test 2: Multiple column grouping
      r_multi <- measure_operation(function() {
        r_df %>% 
          group_by(category, active) %>% 
          summarise(count = n(), .groups = "drop")
      }, log_result = TRUE, operation_name = "GroupBy (multi)", library_name = "R")
      
      # Test 3: High cardinality grouping
      r_high_card <- measure_operation(function() {
        r_df %>% 
          group_by(id) %>% 
          summarise(count = n(), .groups = "drop")
      }, log_result = TRUE, operation_name = "GroupBy (high cardinality)", library_name = "R")
      
      # Weighted average
      avg_r <- (r_single * 2 + r_multi * 2 + r_high_card) / 5
      size_results$groupBy <- list(
        r = avg_r,
        ratio = 1.0
      )
    }
    
    # Summarize Operations (3 tests with weighted averaging)
    if (OPTIONS$summarize) {
      # Test 1: Ungrouped summarization
      r_ungrouped <- measure_operation(function() {
        r_df %>% 
          summarise(
            count = n(),
            avg_value = mean(value),
            total_value = sum(value)
          )
      }, log_result = TRUE, operation_name = "Summarize (ungrouped)", library_name = "R")
      
      # Test 2: Grouped summarization
      r_grouped <- measure_operation(function() {
        r_df %>% 
          group_by(category) %>% 
          summarise(
            count = n(),
            avg_value = mean(value),
            total_value = sum(value),
            .groups = "drop"
          )
      }, log_result = TRUE, operation_name = "Summarize (grouped)", library_name = "R")
      
      # Test 3: Complex grouped summarization
      r_complex <- measure_operation(function() {
        r_df %>% 
          group_by(category, active) %>% 
          summarise(
            count = n(),
            avg_value = mean(value),
            avg_score = mean(score),
            .groups = "drop"
          )
      }, log_result = TRUE, operation_name = "Summarize (complex)", library_name = "R")
      
      # Weighted average
      avg_r <- (r_ungrouped + r_grouped * 2 + r_complex) / 4
      size_results$summarize <- list(
        r = avg_r,
        ratio = 1.0
      )
    }
    
    # Inner Join Operations
    if (OPTIONS$innerJoin) {
      r_time <- measure_operation(function() {
        merge(r_left, r_right, by = "id", all = FALSE)
      }, log_result = TRUE, operation_name = "Inner Join", library_name = "R")
      size_results$innerJoin <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Left Join Operations
    if (OPTIONS$leftJoin) {
      r_time <- measure_operation(function() {
        merge(r_left, r_right, by = "id", all.x = TRUE)
      }, log_result = TRUE, operation_name = "Left Join", library_name = "R")
      size_results$leftJoin <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Outer Join Operations
    if (OPTIONS$outerJoin) {
      r_time <- measure_operation(function() {
        merge(r_left, r_right, by = "id", all = TRUE)
      }, log_result = TRUE, operation_name = "Outer Join", library_name = "R")
      size_results$outerJoin <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Pivot Longer Operations (wide to long)
    if (OPTIONS$pivotLonger) {
      r_time <- measure_operation(function() {
        pivot_longer(r_pivot, 
                    cols = c("q1", "q2", "q3", "q4"),
                    names_to = "quarter",
                    values_to = "sales")
      }, log_result = TRUE, operation_name = "Pivot Longer", library_name = "R")
      size_results$pivotLonger <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Pivot Wider Operations (long to wide)
    if (OPTIONS$pivotWider) {
      # Create long format data for pivot wider test
      long_data_size <- min(size, 10000)
      long_data <- data.frame(
        id = rep(1:(long_data_size %/% 4), each = 4),
        region = rep(paste0("region_", (1:(long_data_size %/% 4) - 1) %% 5), each = 4),
        quarter = rep(c("q1", "q2", "q3", "q4"), long_data_size %/% 4),
        sales = runif(long_data_size, 0, 1000)
      )
      
      r_time <- measure_operation(function() {
        pivot_wider(long_data,
                   names_from = quarter,
                   values_from = sales)
      }, log_result = TRUE, operation_name = "Pivot Wider", library_name = "R")
      size_results$pivotWider <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Bind Rows Operations
    if (OPTIONS$bindRows) {
      r_time <- measure_operation(function() rbind(df1_r, df2_r), log_result = TRUE, operation_name = "Bind Rows", library_name = "R")
      size_results$bindRows <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    # Statistical Functions
    if (OPTIONS$stats) {
      r_time <- measure_operation(function() {
        c(
          sum = sum(r_df$value),
          mean = mean(r_df$value),
          median = median(r_df$value),
          variance = var(r_df$value),
          stdev = sd(r_df$value),
          unique = length(unique(r_df$value))
        )
      }, log_result = TRUE, operation_name = "Statistical Functions", library_name = "R")
      size_results$stats <- list(
        r = r_time,
        ratio = 1.0
      )
    }
    
    results[[sprintf("%d", size)]] <- size_results
  }
  
  cat("R benchmarks completed!\n\n", file = stderr())
  return(results)
}

# Run benchmarks and output JSON
if (interactive()) {
  # If running interactively, just run the function
  results <- run_r_benchmarks()
  print(toJSON(results, pretty = TRUE, auto_unbox = TRUE))
} else {
  # If running as script, output JSON
  # Capture stdout during benchmark execution but keep stderr
  sink_file <- tempfile()
  sink(sink_file)
  results <- run_r_benchmarks()
  sink()
  
  # Now output only the JSON
  cat(toJSON(results, pretty = TRUE, auto_unbox = TRUE))
  
  # Clean up temp file
  unlink(sink_file)
}
