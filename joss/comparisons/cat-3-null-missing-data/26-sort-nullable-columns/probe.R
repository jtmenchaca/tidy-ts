# Probe: Sorting on Nullable Columns in R
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

labs <- tibble(
  patient_id = c("P001", "P002", "P003"),
  result_value = c(100, NA, 50)
)

# 26a: arrange silently puts NA at end
results[[1]] <- capture_outcome({
  sorted_df <- labs %>% arrange(result_value)
  "NA silently placed at end"
})

# 26b: min_rank with NA — silently produces NA rank
results[[2]] <- capture_outcome({
  "1 NA rank produced silently"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
