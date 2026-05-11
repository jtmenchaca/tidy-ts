# Probe: Join Nullability in R
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

patients <- tibble(
  patient_id = c("P001", "P002", "P003"),
  name = c("Alice Johnson", "Bob Smith", "Carol Davis")
)

encounters <- tibble(
  patient_id = c("P001", "P001"),
  department = c("Emergency", "ICU"),
  los_days = c(3, 7)
)

joined <- patients %>% left_join(encounters, by = "patient_id")

# 17a: String method on NA from left join — silent NA propagation
results[[1]] <- capture_outcome({
  out <- joined %>% mutate(dept_upper = toupper(department))
  na_count <- sum(is.na(out$dept_upper))
  paste0("produced ", na_count, " NA silently")
})

# 17b: Arithmetic on NA from left join — silent NA propagation
results[[2]] <- capture_outcome({
  out <- joined %>% mutate(los_weeks = los_days / 7)
  na_count <- sum(is.na(out$los_weeks))
  paste0("produced ", na_count, " NA silently")
})

# 17c: filter() silently drops NA rows
results[[3]] <- capture_outcome({
  long_stays <- joined %>% filter(los_days > 5)
  na_rows <- sum(is.na(joined$los_days))
  paste0("excluded ", na_rows, " NA rows")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
