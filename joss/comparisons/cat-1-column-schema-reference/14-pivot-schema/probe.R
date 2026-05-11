# Probe: Pivot Type Safety in R
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

vitals <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  metric = c("systolic", "diastolic", "systolic", "diastolic"),
  value = c(130, 85, 145, 92)
)

wide <- vitals %>% pivot_wider(names_from = metric, values_from = value)

# 14a: Accessing non-existent pivot column
results[[1]] <- capture_outcome({
  wide %>% mutate(fever = temperature > 100.4) %>% nrow()
})

# 14b: Pre-pivot column gone
results[[2]] <- capture_outcome({
  wide %>% filter(metric == "systolic") %>% nrow()
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
