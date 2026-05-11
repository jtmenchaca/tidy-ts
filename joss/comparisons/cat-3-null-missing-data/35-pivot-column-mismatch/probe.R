# Probe: Pivot Column Mismatch in R
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
  patient_id = c("P001", "P001", "P002"),
  metric = c("systolic", "diastolic", "systolic"),
  value = c(130, 85, 145)
)

# 35a: arithmetic on pivot null — systolic - diastolic with NA from missing combo
results[[1]] <- capture_outcome({
  wide <- vitals %>% pivot_wider(names_from = metric, values_from = value)
  wide <- wide %>% mutate(pp = systolic - diastolic)
  p002_pp <- wide %>% filter(patient_id == "P002") %>% pull(pp)
  paste0("145-NA=", p002_pp)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
