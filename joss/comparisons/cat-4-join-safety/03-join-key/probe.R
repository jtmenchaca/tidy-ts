# Probe: Join Key Errors in R/tidyverse
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

patients <- read_csv("../fixtures/patients.csv", show_col_types = FALSE)
encounters <- read_csv("../fixtures/encounters.csv", show_col_types = FALSE)
labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

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

# 3a: Join key doesn't exist in left table
results[[1]] <- capture_outcome({
  out <- patients %>% left_join(labs, by = "encounter_id")
  nrow(out)
})

# 3b: Misspelled join key (case mismatch)
results[[2]] <- capture_outcome({
  out <- patients %>% left_join(encounters, by = "patient_ID")
  nrow(out)
})

# 3c: Accessing column from wrong table post-join
results[[3]] <- capture_outcome({
  joined <- patients %>% left_join(encounters, by = "patient_id")
  joined %>% mutate(rx = prescription_id) %>% nrow()
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
