# Probe: Schema Evolution Errors in R/tidyverse
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

encounters <- read_csv("../fixtures/encounters.csv", show_col_types = FALSE)
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

# 4a: Accessing dropped column
results[[1]] <- capture_outcome({
  encounters %>%
    select(encounter_id, patient_id, department) %>%
    mutate(doc = attending_physician) %>%
    nrow()
})

# 4b: Accessing original columns after summarise
results[[2]] <- capture_outcome({
  encounters %>%
    group_by(department) %>%
    summarise(count = n()) %>%
    filter(encounter_type == "Inpatient") %>%
    nrow()
})

# 4c: Sorting by dropped column
results[[3]] <- capture_outcome({
  encounters %>%
    select(-attending_physician) %>%
    arrange(attending_physician) %>%
    nrow()
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
