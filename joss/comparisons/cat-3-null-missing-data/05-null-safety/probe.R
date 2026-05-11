# Probe: Null Safety Errors in R/tidyverse
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

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

# 5a: String method on column with NA (discharge_date has NA for ED visits)
results[[1]] <- capture_outcome({
  out <- encounters %>% mutate(los_label = str_sub(discharge_date, 1, 10))
  has_na <- any(is.na(out$los_label))
  "NA propagated silently"
})

# 5b: Arithmetic on column with NA (reference_high has NA)
results[[2]] <- capture_outcome({
  out <- labs %>% mutate(deviation = result_value - reference_high)
  has_na <- any(is.na(out$deviation))
  "NA propagated silently"
})

# 5c: Comparison with NA — filtering silently drops NA rows
results[[3]] <- capture_outcome({
  total <- nrow(labs)
  critical <- labs %>% filter(reference_high > 100)
  na_rows <- sum(is.na(labs$reference_high))
  paste0(na_rows, " NA rows silently dropped")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
