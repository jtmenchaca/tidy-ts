# Probe: Aggregation on Columns with Missing Data in R
suppressPackageStartupMessages(library(tidyverse))

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
setwd(this_dir)

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

# 12a: mean() then arithmetic — NA propagates through *2
results[[1]] <- capture_outcome({
  val <- mean(labs$reference_high)
  doubled <- val * 2
  paste0("mean*2 returned NA: ", is.na(doubled))
})

# 12b: sum() then arithmetic — NA propagates through *2
results[[2]] <- capture_outcome({
  val <- sum(labs$reference_high)
  doubled <- val * 2
  paste0("sum*2 returned NA: ", is.na(doubled))
})

# 12c: min() then arithmetic — NA propagates through *2
results[[3]] <- capture_outcome({
  val <- min(labs$reference_high)
  doubled <- val * 2
  paste0("min*2 returned NA: ", is.na(doubled))
})

# 12d: groupby mean then arithmetic — NA groups propagate through +1
results[[4]] <- capture_outcome({
  out <- labs %>%
    group_by(test_name) %>%
    summarise(avg_ref = mean(reference_high)) %>%
    mutate(inc = avg_ref + 1)
  na_count <- sum(is.na(out$inc))
  paste0(na_count, " NA+1 still NA")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
