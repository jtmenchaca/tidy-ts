# Probe: Type Mismatch Errors in R/tidyverse
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)
results <- list()

# Helper to capture outcome
capture_outcome <- function(expr) {
  outcome <- "silent"
  msg <- "no error or warning"
  res <- NULL
  tryCatch(
    withCallingHandlers(
      { res <- expr },
      warning = function(w) {
        outcome <<- "warning"
        msg <<- conditionMessage(w)
        invokeRestart("muffleWarning")
      }
    ),
    error = function(e) {
      outcome <<- "error"
      msg <<- conditionMessage(e)
    }
  )
  list(outcome = outcome, message = msg, result = res)
}

# 2a: Arithmetic on string column
results[[1]] <- capture_outcome({
  out <- labs %>% mutate(adjusted = test_name + 10)
  as.character(out$adjusted[1])
})

# 2b: Numeric aggregation on string column
results[[2]] <- capture_outcome({
  out <- labs %>% group_by(test_name) %>% summarise(avg = mean(test_name))
  "returned NA for each group"
})

# 2c: Comparing number to string
results[[3]] <- capture_outcome({
  out <- labs %>% filter(result_value == "high")
  "returned 0 rows, no error"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
