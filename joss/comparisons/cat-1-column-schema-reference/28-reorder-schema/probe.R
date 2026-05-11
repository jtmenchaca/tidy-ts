# Probe: Reorder vs Select in R
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
  age = 30,
  insurance = "Medicare"
)

# 28a: select() silently drops unmentioned columns
results[[1]] <- capture_outcome({
  patients %>% select(name, patient_id)
  "Silently dropped 2 columns"
})


cat(jsonlite::toJSON(results, auto_unbox = TRUE))
