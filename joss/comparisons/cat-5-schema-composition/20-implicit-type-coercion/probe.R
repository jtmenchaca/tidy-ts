# Probe: Implicit Type Coercion in R
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
      }
    ),
    error = function(e) {
      outcome <<- "error"
      msg <<- conditionMessage(e)
    }
  )
  list(outcome = outcome, message = msg, result = res)
}

# 20a: bind_rows with double + character — R errors (stricter than Python)
results[[1]] <- capture_outcome({
  numeric_doses <- tibble(drug = c("Aspirin"), dose = c(325))
  text_doses <- tibble(drug = c("Insulin"), dose = c("sliding scale"))
  bind_rows(numeric_doses, text_doses)
})

# 20b: bind_rows with logical + numeric — silent coercion (TRUE → 1)
results[[2]] <- capture_outcome({
  a <- tibble(patient = "P001", critical = TRUE)
  b <- tibble(patient = "P002", critical = 2)
  combined <- bind_rows(a, b)
  col_class <- class(combined$critical)
  paste0("logical coerced to ", col_class)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
