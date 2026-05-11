# Probe: Category 1 — Column & Schema Reference Errors in R/tidyverse
#
# Consolidates error classes 01, 04, 07, 14, 15, 28, 36.
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

patients <- read_csv("../fixtures/patients.csv", show_col_types = FALSE)
labs <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)
encounters <- read_csv("../fixtures/encounters.csv", show_col_types = FALSE)

# ═══════════════════════════════════════════════════════════════════════════════
# Column reference errors
# ═══════════════════════════════════════════════════════════════════════════════

# 1a: Misspelled column in mutate
tryCatch(
  withCallingHandlers(
    {
      out <- patients %>% mutate(full_name = paste(patientId, last_name))
      results[[length(results) + 1]] <- list(
        outcome = "silent",
        message = "no error or warning",
        result = as.character(out$full_name[1])
      )
    },
    warning = function(w) {
      results[[length(results) + 1]] <<- list(
        outcome = "warning",
        message = conditionMessage(w),
        result = NULL
      )
      invokeRestart("muffleWarning")
    }
  ),
  error = function(e) {
    results[[length(results) + 1]] <<- list(
      outcome = "error",
      message = conditionMessage(e),
      result = NULL
    )
  }
)

# 1b: Nonexistent column in filter
tryCatch(
  withCallingHandlers(
    {
      out <- patients %>% filter(diagnosis == "I50.9")
      results[[length(results) + 1]] <- list(
        outcome = "silent",
        message = "no error or warning",
        result = nrow(out)
      )
    },
    warning = function(w) {
      results[[length(results) + 1]] <<- list(
        outcome = "warning",
        message = conditionMessage(w),
        result = NULL
      )
      invokeRestart("muffleWarning")
    }
  ),
  error = function(e) {
    results[[length(results) + 1]] <<- list(
      outcome = "error",
      message = conditionMessage(e),
      result = NULL
    )
  }
)

# 1c: Misspelled column in arrange
tryCatch(
  withCallingHandlers(
    {
      out <- labs %>% arrange(desc(result_values))
      results[[length(results) + 1]] <- list(
        outcome = "silent",
        message = "no error or warning",
        result = nrow(out)
      )
    },
    warning = function(w) {
      results[[length(results) + 1]] <<- list(
        outcome = "warning",
        message = conditionMessage(w),
        result = NULL
      )
      invokeRestart("muffleWarning")
    }
  ),
  error = function(e) {
    results[[length(results) + 1]] <<- list(
      outcome = "error",
      message = conditionMessage(e),
      result = NULL
    )
  }
)

# ═══════════════════════════════════════════════════════════════════════════════
# Schema evolution through pipelines
# ═══════════════════════════════════════════════════════════════════════════════

# 4a: Accessing dropped column
results[[length(results) + 1]] <- capture_outcome({
  encounters %>%
    select(encounter_id, patient_id, department) %>%
    mutate(doc = attending_physician) %>%
    nrow()
})

# 4b: Accessing original columns after summarise
results[[length(results) + 1]] <- capture_outcome({
  encounters %>%
    group_by(department) %>%
    summarise(count = n()) %>%
    filter(encounter_type == "Inpatient") %>%
    nrow()
})

# 4c: Sorting by dropped column
results[[length(results) + 1]] <- capture_outcome({
  encounters %>%
    select(-attending_physician) %>%
    arrange(attending_physician) %>%
    nrow()
})

# ═══════════════════════════════════════════════════════════════════════════════
# Pipeline composition errors
# ═══════════════════════════════════════════════════════════════════════════════

# 7a: Using old column name after rename
results[[length(results) + 1]] <- capture_outcome({
  encounters %>%
    rename(dept = department) %>%
    filter(department == "ICU") %>%
    nrow()
})

# 7b: Accessing column removed by groupby/summarise
results[[length(results) + 1]] <- capture_outcome({
  encounters %>%
    left_join(labs, by = c("encounter_id", "patient_id")) %>%
    select(patient_id, department, test_name, result_value) %>%
    group_by(patient_id) %>%
    summarise(max_lab = max(result_value, na.rm = TRUE)) %>%
    mutate(dept = department) %>%
    nrow()
})

# ═══════════════════════════════════════════════════════════════════════════════
# Pivot type safety
# ═══════════════════════════════════════════════════════════════════════════════

vitals <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  metric = c("systolic", "diastolic", "systolic", "diastolic"),
  value = c(130, 85, 145, 92)
)

wide <- vitals %>% pivot_wider(names_from = metric, values_from = value)

# 14a: Accessing non-existent pivot column
results[[length(results) + 1]] <- capture_outcome({
  wide %>% mutate(fever = temperature > 100.4) %>% nrow()
})

# 14b: Pre-pivot column gone
results[[length(results) + 1]] <- capture_outcome({
  wide %>% filter(metric == "systolic") %>% nrow()
})

# ═══════════════════════════════════════════════════════════════════════════════
# Distinct column narrowing
# ═══════════════════════════════════════════════════════════════════════════════

enc_distinct <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  department = c("Cardiology", "Cardiology", "Emergency", "Primary Care"),
  encounter_type = c("Outpatient", "Inpatient", "ED", "Outpatient"),
  physician = c("Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez")
)

# 15a: distinct drops non-specified columns — but no type tracking
results[[length(results) + 1]] <- capture_outcome({
  unique_depts <- enc_distinct %>% distinct(patient_id, department)
  has_physician <- "physician" %in% colnames(unique_depts)
  "physician col dropped"
})

# 15b: distinct with .keep_all keeps arbitrary values — silent
results[[length(results) + 1]] <- capture_outcome({
  unique_all <- enc_distinct %>% distinct(patient_id, department, .keep_all = TRUE)
  has_physician <- "physician" %in% colnames(unique_all)
  "all cols kept, arbitrary vals"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Reorder vs select schema preservation
# ═══════════════════════════════════════════════════════════════════════════════

patients_28 <- tibble(
  patient_id = "P001",
  name = "Alice",
  age = 30,
  insurance = "Medicare"
)

# 28a: select() silently drops unmentioned columns
results[[length(results) + 1]] <- capture_outcome({
  patients_28 %>% select(name, patient_id)
  "Silently dropped 2 columns"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Column existence error messages
# ═══════════════════════════════════════════════════════════════════════════════

patients_36 <- tibble(
  patient_id = "P001",
  name = "Alice",
  department = "ED"
)

# 36a: group_by with wrong column — error message quality
results[[length(results) + 1]] <- capture_outcome({
  patients_36 %>% group_by(dept)
})

# 36b: select with wrong column — error message quality
results[[length(results) + 1]] <- capture_outcome({
  patients_36 %>% select(dept)
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
