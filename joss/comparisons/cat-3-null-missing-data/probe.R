# Probe: Category 3 — Null & Missing Data Errors in R/tidyverse
#
# Consolidates error classes 05, 11, 12, 21, 24, 26, 35.
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

# ── Shared data ──────────────────────────────────────────────────────────────

encounters <- read_csv("../fixtures/encounters.csv", show_col_types = FALSE)
labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

# ═══════════════════════════════════════════════════════════════════════════════
# Null safety
# ═══════════════════════════════════════════════════════════════════════════════

# a: String method on column with NA (discharge_date has NA for ED visits)
results[[length(results) + 1]] <- capture_outcome({
  out <- encounters %>% mutate(los_label = str_sub(discharge_date, 1, 10))
  has_na <- any(is.na(out$los_label))
  "NA propagated silently"
})

# b: Arithmetic on column with NA (reference_high has NA)
results[[length(results) + 1]] <- capture_outcome({
  out <- labs %>% mutate(deviation = result_value - reference_high)
  has_na <- any(is.na(out$deviation))
  "NA propagated silently"
})

# c: Comparison with NA — filtering silently drops NA rows
results[[length(results) + 1]] <- capture_outcome({
  total <- nrow(labs)
  critical <- labs %>% filter(reference_high > 100)
  na_rows <- sum(is.na(labs$reference_high))
  paste0(na_rows, " NA rows silently dropped")
})

# ═══════════════════════════════════════════════════════════════════════════════
# Null narrowing
# ═══════════════════════════════════════════════════════════════════════════════

labs_11 <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

# d: Division with NA — NA propagates silently
results[[length(results) + 1]] <- capture_outcome({
  df <- labs_11 %>% mutate(pct = result_value / reference_high)
  na_count <- sum(is.na(df$pct))
  paste0(na_count, " NA from null div")
})

# e: Re-introduce NA after replace_na, then divide — NA propagates again
results[[length(results) + 1]] <- capture_outcome({
  filled <- labs_11 %>% mutate(reference_high = replace_na(reference_high, 999))
  filled$reference_high[filled$result_value > 150] <- NA
  df <- filled %>% mutate(pct = result_value / reference_high)
  na_count <- sum(is.na(df$pct))
  paste0(na_count, " NA after re-null div")
})

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregation on missing data
# ═══════════════════════════════════════════════════════════════════════════════

labs_12 <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)

# f: mean() then arithmetic — NA propagates through *2
results[[length(results) + 1]] <- capture_outcome({
  val <- mean(labs_12$reference_high)
  doubled <- val * 2
  paste0("mean*2 returned NA: ", is.na(doubled))
})

# g: sum() then arithmetic — NA propagates through *2
results[[length(results) + 1]] <- capture_outcome({
  val <- sum(labs_12$reference_high)
  doubled <- val * 2
  paste0("sum*2 returned NA: ", is.na(doubled))
})

# h: min() then arithmetic — NA propagates through *2
results[[length(results) + 1]] <- capture_outcome({
  val <- min(labs_12$reference_high)
  doubled <- val * 2
  paste0("min*2 returned NA: ", is.na(doubled))
})

# i: groupby mean then arithmetic — NA groups propagate through +1
results[[length(results) + 1]] <- capture_outcome({
  out <- labs_12 %>%
    group_by(test_name) %>%
    summarise(avg_ref = mean(reference_high)) %>%
    mutate(inc = avg_ref + 1)
  na_count <- sum(is.na(out$inc))
  paste0(na_count, " NA+1 still NA")
})

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregation return type narrowing
# ═══════════════════════════════════════════════════════════════════════════════

values_21 <- c(1250, NA, 450)

# j: sum() returns NA silently — no warning
results[[length(results) + 1]] <- capture_outcome({
  total <- sum(values_21)
  "sum() returned NA silently"
})

# k: Arithmetic on NA result propagates — no warning
results[[length(results) + 1]] <- capture_outcome({
  total <- sum(values_21)
  per_patient <- total / 2
  "NA propagated through division"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Window function output type
# ═══════════════════════════════════════════════════════════════════════════════

values_24 <- c(100, 200, 300, 400)

# l: lag() silently introduces NA
results[[length(results) + 1]] <- capture_outcome({
  lagged <- lag(values_24)
  na_count <- sum(is.na(lagged))
  "lag() introduced 1 NA"
})

# m: Arithmetic on NA from lag propagates
results[[length(results) + 1]] <- capture_outcome({
  lagged <- lag(values_24)
  diff <- lagged - values_24
  na_count <- sum(is.na(diff))
  "NA propagated in subtraction"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Sorting on nullable columns
# ═══════════════════════════════════════════════════════════════════════════════

labs_26 <- tibble(
  patient_id = c("P001", "P002", "P003"),
  result_value = c(100, NA, 50)
)

# n: arrange silently puts NA at end
results[[length(results) + 1]] <- capture_outcome({
  sorted_df <- labs_26 %>% arrange(result_value)
  "NA silently placed at end"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Pivot column mismatch
# ═══════════════════════════════════════════════════════════════════════════════

vitals <- tibble(
  patient_id = c("P001", "P001", "P002"),
  metric = c("systolic", "diastolic", "systolic"),
  value = c(130, 85, 145)
)

# o: arithmetic on pivot null — systolic - diastolic with NA from missing combo
results[[length(results) + 1]] <- capture_outcome({
  wide <- vitals %>% pivot_wider(names_from = metric, values_from = value)
  wide <- wide %>% mutate(pp = systolic - diastolic)
  p002_pp <- wide %>% filter(patient_id == "P002") %>% pull(pp)
  paste0("145-NA=", p002_pp)
})

# ═══════════════════════════════════════════════════════════════════════════════
# Nullable vs optional distinction
# ═══════════════════════════════════════════════════════════════════════════════

# p: Explicit NA and missing column both become NA — indistinguishable
results[[length(results) + 1]] <- capture_outcome({
  df1 <- tibble(id = "P001", value = NA_real_)  # explicitly missing
  df2 <- tibble(id = "P002")  # field doesn't exist
  combined <- bind_rows(df1, df2)
  both_na <- all(is.na(combined$value))
  "null and missing both NA"
})

# q: conditional fill — only check for explicit NA, miss absent column
results[[length(results) + 1]] <- capture_outcome({
  df1 <- tibble(id = "P001", value = NA_real_)
  df2 <- tibble(id = "P002")
  combined <- bind_rows(df1, df2)
  filled <- combined %>% mutate(value = ifelse(is.na(value), "inconclusive", value))
  vals <- filled$value
  "both filled identically"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
