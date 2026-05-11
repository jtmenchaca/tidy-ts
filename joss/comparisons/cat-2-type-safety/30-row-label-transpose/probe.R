# Probe: Transpose Type Safety in R
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
  metric = c("systolic", "diastolic"),
  P001 = c(120, 80),
  P002 = c(145, 92)
)

# 30a: t() coerces mixed types to character — arithmetic fails
results[[1]] <- capture_outcome({
  transposed <- t(vitals)
  # All values are now character because metric column is character
  doubled <- transposed[, 1] * 2
  paste0("doubled: ", doubled)
})

# 30b: Access pre-transpose column name — error
results[[2]] <- capture_outcome({
  transposed <- t(vitals)
  val <- transposed[, "P001"]
  "accessed pre-transpose col"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
