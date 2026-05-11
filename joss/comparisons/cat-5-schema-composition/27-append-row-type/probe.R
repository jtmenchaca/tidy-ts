# Probe: Append Row Type Mismatch in R
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
  age = 30
)

# 27a: Missing column silently filled with NA
results[[1]] <- capture_outcome({
  new_row <- tibble(patient_id = "P002", name = "Bob")
  combined <- bind_rows(patients, new_row)
  "Missing col filled with NA"
})

# 27b: Wrong type — R errors on double + character
results[[2]] <- capture_outcome({
  bad_row <- tibble(patient_id = "P003", name = "Carol", age = "thirty")
  bind_rows(patients, bad_row)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
