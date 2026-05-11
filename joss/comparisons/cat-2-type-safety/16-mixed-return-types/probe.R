# Probe: Mixed Return Types in R
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
  test_name = c("BNP", "WBC", "Glucose"),
  result_value = c(1250, 15.2, 210)
)

# 16a: ifelse returning mixed types, then arithmetic — silent coercion to character
results[[1]] <- capture_outcome({
  out <- labs %>% mutate(status = ifelse(result_value > 100, "HIGH", result_value))
  # status is now character — arithmetic on it fails or coerces
  out <- out %>% mutate(doubled = as.numeric(status) * 2)
  na_count <- sum(is.na(out$doubled))
  paste0(na_count, " NA from character * 2")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
