# Probe: Schema Validation Errors in R/tidyverse
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

# 6a: Non-numeric value in numeric column
tmp <- tempfile(fileext = ".csv")
writeLines(c("lab_id,result_value", "L1,100", "L2,pending", "L3,200"), tmp)

results[[1]] <- capture_outcome({
  df <- read_csv(tmp, col_types = cols(lab_id = col_character(), result_value = col_double()))
  has_na <- any(is.na(df$result_value))
  "non-numeric coerced to NA"
})

# 6b: Missing column — accessed after load
results[[2]] <- capture_outcome({
  df <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)
  df %>% mutate(x = nonexistent_column) %>% nrow()
})

# 6c: Empty cell in column that should be non-null
results[[3]] <- capture_outcome({
  df <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)
  na_count <- sum(is.na(df$reference_high))
  paste0(na_count, " cells silently became NA")
})

invisible(file.remove(tmp))

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
