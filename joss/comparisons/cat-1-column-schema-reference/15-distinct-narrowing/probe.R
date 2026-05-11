# Probe: Distinct Column Narrowing in R
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
  patient_id = c("P001", "P001", "P002", "P002"),
  department = c("Cardiology", "Cardiology", "Emergency", "Primary Care"),
  encounter_type = c("Outpatient", "Inpatient", "ED", "Outpatient"),
  physician = c("Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez")
)

# 15a: distinct drops non-specified columns — but no type tracking
results[[1]] <- capture_outcome({
  unique_depts <- encounters %>% distinct(patient_id, department)
  has_physician <- "physician" %in% colnames(unique_depts)
  "physician col dropped"
})

# 15b: distinct with .keep_all keeps arbitrary values — silent
results[[2]] <- capture_outcome({
  unique_all <- encounters %>% distinct(patient_id, department, .keep_all = TRUE)
  has_physician <- "physician" %in% colnames(unique_all)
  "all cols kept, arbitrary vals"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
