# Probe: Nullable vs Optional Distinction in R
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

# 31a: Explicit NA and missing column both become NA — indistinguishable
results[[1]] <- capture_outcome({
  df1 <- tibble(id = "P001", value = NA_real_)  # explicitly missing
  df2 <- tibble(id = "P002")  # field doesn't exist
  combined <- bind_rows(df1, df2)
  both_na <- all(is.na(combined$value))
  "null and missing both NA"
})

# 31b: conditional fill — only check for explicit NA, miss absent column
# In R, both are NA so ifelse catches both indiscriminately
results[[2]] <- capture_outcome({
  filled <- combined %>% mutate(value = ifelse(is.na(value), "inconclusive", value))
  vals <- filled$value
  # Both rows get "inconclusive" — can't give absent row a different fill
  "both filled identically"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
