# Probe: Window Function Output Type in R
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

values <- c(100, 200, 300, 400)

# 24a: lag() silently introduces NA
results[[1]] <- capture_outcome({
  lagged <- lag(values)
  na_count <- sum(is.na(lagged))
  "lag() introduced 1 NA"
})

# 24b: Arithmetic on NA from lag propagates
results[[2]] <- capture_outcome({
  lagged <- lag(values)
  diff <- lagged - values
  na_count <- sum(is.na(diff))
  "NA propagated in subtraction"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
