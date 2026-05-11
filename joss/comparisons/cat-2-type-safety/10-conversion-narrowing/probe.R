# Probe: Conversion Narrowing Errors in R
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
  lab_id = c("L1", "L2", "L3"),
  test_name = c("BNP", "pH", "WBC"),
  result_str = c("1250", "7.28", "pending")
)

# 10a: as.numeric() on non-numeric — produces NA with warning
results[[1]] <- capture_outcome({
  labs <- labs %>% mutate(result_num = as.numeric(result_str))
  na_count <- sum(is.na(labs$result_num))
  paste0(na_count, " value coerced to NA")
})

# 10b: Downstream arithmetic on NA — silent propagation
results[[2]] <- capture_outcome({
  labs <- labs %>% mutate(result_num = suppressWarnings(as.numeric(result_str)))
  labs <- labs %>% mutate(doubled = result_num * 2)
  na_count <- sum(is.na(labs$doubled))
  paste0("NA propagated, ", na_count, " NA")
})

# 10c: mean() after conversion — returns NA silently
results[[3]] <- capture_outcome({
  labs <- labs %>% mutate(result_num = suppressWarnings(as.numeric(result_str)))
  avg <- mean(labs$result_num)
  "mean returned NA silently"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
