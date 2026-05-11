# Probe: Column Existence Error Messages in R
suppressPackageStartupMessages(library(tidyverse))

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

patients <- tibble(
  patient_id = "P001",
  name = "Alice",
  department = "ED"
)

# 36a: group_by with wrong column — error message quality
results[[1]] <- capture_outcome({
  patients %>% group_by(dept)
})

# 36b: select with wrong column — error message quality
results[[2]] <- capture_outcome({
  patients %>% select(dept)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
