# Probe: Category 6 — Contextual & Runtime Safety Errors in R/tidyverse
#
# Consolidates error classes 19, 29, 31.
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

# ═══════════════════════════════════════════════════════════════════════════════
# Residual grouping after summarize
# ═══════════════════════════════════════════════════════════════════════════════

labs <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  test_name = c("BNP", "WBC", "BNP", "WBC"),
  result_value = c(1250, 15.2, 450, 8.1)
)

# a: Second summarise on still-grouped result aggregates per-group (not overall)
results[[length(results) + 1]] <- capture_outcome({
  grouped <- labs %>% group_by(patient_id, test_name)
  summary1 <- suppressMessages(grouped %>% summarise(mean_val = mean(result_value)))
  # This gives per-patient means, NOT an overall mean
  summary2 <- summary1 %>% summarise(grand_mean = mean(mean_val))
  nrow_result <- nrow(summary2)
  paste0("gave ", nrow_result, " rows, not 1")
})

# ═══════════════════════════════════════════════════════════════════════════════
# Empty DataFrame operations
# ═══════════════════════════════════════════════════════════════════════════════

# b: sum on empty — arithmetic on fabricated 0
results[[length(results) + 1]] <- capture_outcome({
  empty <- tibble(x = numeric())
  total <- sum(empty$x)
  adjusted <- total * 2  # 0 * 2 = 0 — looks like a real result
  paste0("sum()=0, 0*2=", adjusted)
})

# c: mean on empty — arithmetic on fabricated NaN
results[[length(results) + 1]] <- capture_outcome({
  empty <- tibble(x = numeric())
  avg <- mean(empty$x)
  adjusted <- avg * 2  # NaN * 2 = NaN — propagates silently
  paste0("mean()=NaN, NaN*2=", adjusted)
})

# ═══════════════════════════════════════════════════════════════════════════════
# Nullable vs optional distinction
# ═══════════════════════════════════════════════════════════════════════════════

# d: Explicit NA and missing column both become NA — indistinguishable
results[[length(results) + 1]] <- capture_outcome({
  df1 <- tibble(id = "P001", value = NA_real_)  # explicitly missing
  df2 <- tibble(id = "P002")  # field doesn't exist
  combined <- bind_rows(df1, df2)
  both_na <- all(is.na(combined$value))
  "null and missing both NA"
})

# e: conditional fill — only check for explicit NA, miss absent column
# In R, both are NA so ifelse catches both indiscriminately
results[[length(results) + 1]] <- capture_outcome({
  df1 <- tibble(id = "P001", value = NA_real_)
  df2 <- tibble(id = "P002")
  combined <- bind_rows(df1, df2)
  filled <- combined %>% mutate(value = ifelse(is.na(value), "inconclusive", value))
  vals <- filled$value
  # Both rows get "inconclusive" — can't give absent row a different fill
  "both filled identically"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
