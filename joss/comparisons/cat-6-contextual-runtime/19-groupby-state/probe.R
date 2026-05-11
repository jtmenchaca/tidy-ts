# Probe: GroupBy State Tracking in R
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

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
      },
      message = function(m) {
        # Capture messages too (summarise emits messages, not warnings)
        outcome <<- "silent"
        msg <<- conditionMessage(m)
        invokeRestart("muffleMessage")
      }
    ),
    error = function(e) {
      outcome <<- "error"
      msg <<- conditionMessage(e)
    }
  )
  list(outcome = outcome, message = msg, result = res)
}

labs <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  test_name = c("BNP", "WBC", "BNP", "WBC"),
  result_value = c(1250, 15.2, 450, 8.1)
)

# 19b: Second summarise on still-grouped result aggregates per-group (not overall)
results[[1]] <- capture_outcome({
  grouped <- labs %>% group_by(patient_id, test_name)
  summary1 <- suppressMessages(grouped %>% summarise(mean_val = mean(result_value)))
  # This gives per-patient means, NOT an overall mean
  summary2 <- summary1 %>% summarise(grand_mean = mean(mean_val))
  nrow_result <- nrow(summary2)
  paste0("gave ", nrow_result, " rows, not 1")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
