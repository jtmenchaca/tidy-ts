# Probe: Enum Validation in R
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

encounters <- tibble(
  patient_id = c("P001", "P002"),
  status = factor(c("admitted", "discharged"),
                  levels = c("admitted", "discharged", "transferred"))
)

# 34a: filter on invalid enum value — silent (returns 0 rows)
results[[1]] <- capture_outcome({
  filtered <- encounters %>% filter(status == "unknown")
  nrows <- nrow(filtered)
  paste0(nrows, " rows (silent empty)")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
