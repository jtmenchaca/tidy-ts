# Probe: Column Name Collision in R
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

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
      },
      message = function(m) {
        invokeRestart("muffleMessage")
      }
    ),
    error = function(e) {
      outcome <<- "error"
      msg <<- conditionMessage(e)
    }
  )
  list(outcome = outcome, message = msg, result = res)
}

admissions <- tibble(
  patient_id = c("P001", "P002"),
  date = c("2024-01-15", "2024-02-20"),
  department = c("ED", "ICU")
)

discharges <- tibble(
  patient_id = c("P001", "P002"),
  date = c("2024-01-18", "2024-02-25"),
  disposition = c("Home", "SNF")
)

# 18a: Explicit suffixes — access original name
results[[1]] <- capture_outcome({
  joined <- admissions %>% inner_join(discharges, by = "patient_id", suffix = c("_admit", "_discharge"))
  joined %>% select(all_of("date"))
})

# 18b: No suffixes — access ambiguous original name
results[[2]] <- capture_outcome({
  joined <- admissions %>% inner_join(discharges, by = "patient_id")
  joined %>% select(all_of("date"))
})


cat(jsonlite::toJSON(results, auto_unbox = TRUE))
