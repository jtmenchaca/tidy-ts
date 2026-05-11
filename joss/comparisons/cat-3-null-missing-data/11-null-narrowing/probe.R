# Probe: Null Narrowing Errors in R
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

labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

# 11a: Division with NA — NA propagates silently
results[[1]] <- capture_outcome({
  df <- labs %>% mutate(pct = result_value / reference_high)
  na_count <- sum(is.na(df$pct))
  paste0(na_count, " NA from null div")
})

# 11b: Re-introduce NA after replace_na, then divide — NA propagates again
results[[2]] <- capture_outcome({
  filled <- labs %>% mutate(reference_high = replace_na(reference_high, 999))
  filled$reference_high[filled$result_value > 150] <- NA
  df <- filled %>% mutate(pct = result_value / reference_high)
  na_count <- sum(is.na(df$pct))
  paste0(na_count, " NA after re-null div")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
