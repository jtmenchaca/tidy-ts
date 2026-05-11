# Probe: API Escape / Direct Mutation in R
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

patients <- tibble(
  patient_id = c("P001", "P002", "P003"),
  first_name = c("Maria", "James", "Abigail"),
  age = c(66, 49, 34)
)

# 9a: $ access with typo — returns NULL silently
results[[1]] <- capture_outcome({
  val <- patients$fist_name  # typo
  "typo returned NULL silently"
})

# 9b: Direct vector assignment changes column type silently
results[[2]] <- capture_outcome({
  p <- patients
  p$age[1] <- "old"
  "col type changed to character"
})

# 9c: for-loop sum coerces types — silent
results[[3]] <- capture_outcome({
  total <- 0
  for (i in seq_len(nrow(patients))) {
    total <- total + patients$age[i]  # works for numeric
  }
  # But summing first_name concatenates via paste
  str_total <- ""
  for (i in seq_len(nrow(patients))) {
    str_total <- paste0(str_total, patients$first_name[i])
  }
  paste0("loop concat: ", nchar(str_total), " chars")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
