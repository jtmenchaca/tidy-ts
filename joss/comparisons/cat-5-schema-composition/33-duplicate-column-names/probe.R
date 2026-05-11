# Probe: Duplicate Column Names in R
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

# 33a: tibble with duplicate names, then toupper() — errors at creation
results[[1]] <- capture_outcome({
  df <- tibble(id = 1, name = "Alice", name = "ED")
  df %>% mutate(upper = toupper(name))
  "toupper() on duplicate col"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
