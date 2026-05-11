# Probe: Empty DataFrame Operations in R
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

# 29a: sum on empty → arithmetic on fabricated 0
results[[1]] <- capture_outcome({
  empty <- tibble(x = numeric())
  total <- sum(empty$x)
  adjusted <- total * 2  # 0 * 2 = 0 — looks like a real result
  paste0("sum()=0, 0*2=", adjusted)
})

# 29b: mean on empty → arithmetic on fabricated NaN
results[[2]] <- capture_outcome({
  empty <- tibble(x = numeric())
  avg <- mean(empty$x)
  adjusted <- avg * 2  # NaN * 2 = NaN — propagates silently
  paste0("mean()=NaN, NaN*2=", adjusted)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
