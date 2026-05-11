# Probe: Column Type Constraint in R
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
  name = c("Alice", "Bob"),
  age = c(30, 45),
  weight = c(65.5, 80.0),
  insurance = c("Medicare", "Medicaid")
)

# 25a: across with manual wrong column selection — runtime error
results[[1]] <- capture_outcome({
  patients %>% mutate(across(c(age, insurance), log))
})


cat(jsonlite::toJSON(results, auto_unbox = TRUE))
