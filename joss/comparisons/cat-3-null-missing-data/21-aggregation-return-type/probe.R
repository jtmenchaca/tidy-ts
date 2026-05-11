# Probe: Aggregation Return Type Narrowing in R
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

values <- c(1250, NA, 450)

# 21a: sum() returns NA silently — no warning
results[[1]] <- capture_outcome({
  total <- sum(values)
  "sum() returned NA silently"
})

# 21b: Arithmetic on NA result propagates — no warning
results[[2]] <- capture_outcome({
  total <- sum(values)
  per_patient <- total / 2
  "NA propagated through division"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
