# Probe: Column Reference Errors in R/tidyverse
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

patients <- read_csv("../fixtures/patients.csv", show_col_types = FALSE)
labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

results <- list()

# 1a: Misspelled column in mutate
# R's mutate with an unknown column: does it error, warn, or silently produce NA?
tryCatch(
  withCallingHandlers(
    {
      out <- patients %>% mutate(full_name = paste(patientId, last_name))
      # If we get here, check if there were warnings
      results[[length(results) + 1]] <- list(
        outcome = "silent",
        message = "no error or warning",
        result = as.character(out$full_name[1])
      )
    },
    warning = function(w) {
      results[[length(results) + 1]] <<- list(
        outcome = "warning",
        message = conditionMessage(w),
        result = NULL
      )
      invokeRestart("muffleWarning")
    }
  ),
  error = function(e) {
    results[[length(results) + 1]] <<- list(
      outcome = "error",
      message = conditionMessage(e),
      result = NULL
    )
  }
)

# 1b: Nonexistent column in filter
tryCatch(
  withCallingHandlers(
    {
      out <- patients %>% filter(diagnosis == "I50.9")
      results[[length(results) + 1]] <- list(
        outcome = "silent",
        message = "no error or warning",
        result = nrow(out)
      )
    },
    warning = function(w) {
      results[[length(results) + 1]] <<- list(
        outcome = "warning",
        message = conditionMessage(w),
        result = NULL
      )
      invokeRestart("muffleWarning")
    }
  ),
  error = function(e) {
    results[[length(results) + 1]] <<- list(
      outcome = "error",
      message = conditionMessage(e),
      result = NULL
    )
  }
)

# 1c: Misspelled column in arrange
tryCatch(
  withCallingHandlers(
    {
      out <- labs %>% arrange(desc(result_values))
      results[[length(results) + 1]] <- list(
        outcome = "silent",
        message = "no error or warning",
        result = nrow(out)
      )
    },
    warning = function(w) {
      results[[length(results) + 1]] <<- list(
        outcome = "warning",
        message = conditionMessage(w),
        result = NULL
      )
      invokeRestart("muffleWarning")
    }
  ),
  error = function(e) {
    results[[length(results) + 1]] <<- list(
      outcome = "error",
      message = conditionMessage(e),
      result = NULL
    )
  }
)

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
