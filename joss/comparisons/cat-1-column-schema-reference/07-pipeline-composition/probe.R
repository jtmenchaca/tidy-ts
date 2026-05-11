# Probe: Pipeline Composition Errors in R/tidyverse
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

encounters <- read_csv("../fixtures/encounters.csv", show_col_types = FALSE)
labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

results <- list()

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

# 7a: Using old column name after rename
results[[1]] <- capture_outcome({
  encounters %>%
    rename(dept = department) %>%
    filter(department == "ICU") %>%
    nrow()
})

# 7b: Accessing column removed by groupby/summarise
results[[2]] <- capture_outcome({
  encounters %>%
    left_join(labs, by = c("encounter_id", "patient_id")) %>%
    select(patient_id, department, test_name, result_value) %>%
    group_by(patient_id) %>%
    summarise(max_lab = max(result_value, na.rm = TRUE)) %>%
    mutate(dept = department) %>%
    nrow()
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
