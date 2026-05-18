# Probe: Category 2 — Type Safety Errors in R/tidyverse
#
# Consolidates error classes 02, 10, 16, 22, 25, 30, 34.
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

labs <- read_csv("../../fixtures/lab_results.csv", show_col_types = FALSE)

# ═══════════════════════════════════════════════════════════════════════════════
# Type mismatch errors
# ═══════════════════════════════════════════════════════════════════════════════

# a: arithmetic on string column
results[[length(results) + 1]] <- capture_outcome({
  out <- labs %>% mutate(adjusted = test_name + 10)
  as.character(out$adjusted[1])
})

# b: numeric aggregation on string column
results[[length(results) + 1]] <- capture_outcome({
  out <- labs %>% group_by(test_name) %>% summarise(avg = mean(test_name))
  "returned NA for each group"
})

# c: comparing number to string literal
results[[length(results) + 1]] <- capture_outcome({
  out <- labs %>% filter(result_value == "high")
  "returned 0 rows, no error"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Type conversion and narrowing
# ═══════════════════════════════════════════════════════════════════════════════

conv_labs <- tibble(
  lab_id = c("L1", "L2", "L3"),
  test_name = c("BNP", "pH", "WBC"),
  result_str = c("1250", "7.28", "pending")
)

# d: as.numeric on non-numeric string — warning
results[[length(results) + 1]] <- capture_outcome({
  conv_labs <- conv_labs %>% mutate(result_num = as.numeric(result_str))
  na_count <- sum(is.na(conv_labs$result_num))
  paste0(na_count, " value coerced to NA")
})

# e: arithmetic on NA propagates silently
results[[length(results) + 1]] <- capture_outcome({
  conv_labs <- conv_labs %>% mutate(result_num = suppressWarnings(as.numeric(result_str)))
  conv_labs <- conv_labs %>% mutate(doubled = result_num * 2)
  na_count <- sum(is.na(conv_labs$doubled))
  paste0("NA propagated, ", na_count, " NA")
})

# f: mean after conversion returns NA silently
results[[length(results) + 1]] <- capture_outcome({
  conv_labs <- conv_labs %>% mutate(result_num = suppressWarnings(as.numeric(result_str)))
  avg <- mean(conv_labs$result_num)
  "mean returned NA silently"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Mixed return types
# ═══════════════════════════════════════════════════════════════════════════════

mixed_labs <- tibble(
  patient_id = c("P001", "P002", "P003"),
  test_name = c("BNP", "WBC", "Glucose"),
  result_value = c(1250, 15.2, 210)
)

# g: ifelse returning mixed types, then arithmetic — warning from coercion
results[[length(results) + 1]] <- capture_outcome({
  out <- mixed_labs %>% mutate(status = ifelse(result_value > 100, "HIGH", result_value))
  out <- out %>% mutate(doubled = as.numeric(status) * 2)
  na_count <- sum(is.na(out$doubled))
  paste0(na_count, " NA from character * 2")
})

# ═══════════════════════════════════════════════════════════════════════════════
# Temporal type safety
# ═══════════════════════════════════════════════════════════════════════════════

# h: invalid date string — as.Date produces NA silently
results[[length(results) + 1]] <- capture_outcome({
  dates <- as.Date(c("2024-01-15", "not-a-date", "2024-02-20"))
  na_count <- sum(is.na(dates))
  "Invalid date produced NA"
})

df_dates <- tibble(
  patient_id = c("P001", "P002"),
  admit_date = as.Date(c("2024-01-15", "2024-02-20")),
  los_days = c(3, 7)
)

# i: date compared to number — silent (Date is internally days-since-epoch)
results[[length(results) + 1]] <- capture_outcome({
  filtered <- df_dates %>% filter(admit_date > 100)
  nrows <- nrow(filtered)
  paste0(nrows, " rows (date > 100)")
})

# j: date + number arithmetic — silent (adds days)
results[[length(results) + 1]] <- capture_outcome({
  result <- df_dates %>% mutate(shifted = admit_date + 7)
  val <- as.character(result$shifted[1])
  paste0("date+7=", val)
})

# ═══════════════════════════════════════════════════════════════════════════════
# Column type constraint
# ═══════════════════════════════════════════════════════════════════════════════

patients <- tibble(
  name = c("Alice", "Bob"),
  age = c(30, 45),
  weight = c(65.5, 80.0),
  insurance = c("Medicare", "Medicaid")
)

# k: across with wrong column type — runtime error
results[[length(results) + 1]] <- capture_outcome({
  patients %>% mutate(across(c(age, insurance), log))
})

# ═══════════════════════════════════════════════════════════════════════════════
# Row label / transpose type safety
# ═══════════════════════════════════════════════════════════════════════════════

vitals <- tibble(
  metric = c("systolic", "diastolic"),
  P001 = c(120, 80),
  P002 = c(145, 92)
)

# l: t() coerces mixed types to character — arithmetic fails
results[[length(results) + 1]] <- capture_outcome({
  transposed <- t(vitals)
  doubled <- transposed[, 1] * 2
  paste0("doubled: ", doubled)
})

# m: pre-transpose column name after transpose — error
results[[length(results) + 1]] <- capture_outcome({
  transposed <- t(vitals)
  val <- transposed[, "P001"]
  "accessed pre-transpose col"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Enum validation
# ═══════════════════════════════════════════════════════════════════════════════

encounters <- tibble(
  patient_id = c("P001", "P002"),
  status = factor(c("admitted", "discharged"),
                  levels = c("admitted", "discharged", "transferred"))
)

# n: filter on invalid enum value — silent (returns 0 rows)
results[[length(results) + 1]] <- capture_outcome({
  filtered <- encounters %>% filter(status == "unknown")
  nrows <- nrow(filtered)
  paste0(nrows, " rows (silent empty)")
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
