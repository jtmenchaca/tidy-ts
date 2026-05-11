# Probe: Temporal Type Safety in R
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

# 22a: Invalid date string — as.Date behavior
results[[1]] <- capture_outcome({
  dates <- as.Date(c("2024-01-15", "not-a-date", "2024-02-20"))
  na_count <- sum(is.na(dates))
  "Invalid date produced NA"
})

df <- tibble(
  patient_id = c("P001", "P002"),
  admit_date = as.Date(c("2024-01-15", "2024-02-20")),
  los_days = c(3, 7)
)

# 22b: Compare date to number — Date is internally days-since-epoch
results[[2]] <- capture_outcome({
  filtered <- df %>% filter(admit_date > 100)
  nrows <- nrow(filtered)
  paste0(nrows, " rows (date > 100)")
})

# 22c: Add number to date — R silently adds days
results[[3]] <- capture_outcome({
  result <- df %>% mutate(shifted = admit_date + 7)
  val <- as.character(result$shifted[1])
  paste0("date+7=", val)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
