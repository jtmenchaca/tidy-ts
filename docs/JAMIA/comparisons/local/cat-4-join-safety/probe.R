# Probe: Category 4 -- Join Safety Errors in R/tidyverse
#
# Consolidates error classes 03, 17, 18.
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
      },
      message = function(m) {
        invokeRestart("muffleMessage")
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

patients <- read_csv("../../fixtures/patients.csv", show_col_types = FALSE)
encounters <- read_csv("../../fixtures/encounters.csv", show_col_types = FALSE)
labs <- read_csv("../../fixtures/lab_results.csv", show_col_types = FALSE)

# ═══════════════════════════════════════════════════════════════════════════════
# Join key errors
# ═══════════════════════════════════════════════════════════════════════════════

# a: join on key not in left table
results[[length(results) + 1]] <- capture_outcome({
  out <- patients %>% left_join(labs, by = "encounter_id")
  nrow(out)
})

# b: join on misspelled key
results[[length(results) + 1]] <- capture_outcome({
  out <- patients %>% left_join(encounters, by = "patient_ID")
  nrow(out)
})

# c: access missing column post-join
results[[length(results) + 1]] <- capture_outcome({
  joined <- patients %>% left_join(encounters, by = "patient_id")
  joined %>% mutate(rx = prescription_id) %>% nrow()
})

# ═══════════════════════════════════════════════════════════════════════════════
# Join nullability
# ═══════════════════════════════════════════════════════════════════════════════

patients_17 <- tibble(
  patient_id = c("P001", "P002", "P003"),
  name = c("Alice Johnson", "Bob Smith", "Carol Davis")
)

encounters_17 <- tibble(
  patient_id = c("P001", "P001"),
  department = c("Emergency", "ICU"),
  los_days = c(3, 7)
)

joined <- patients_17 %>% left_join(encounters_17, by = "patient_id")

# d: string method on NA from left join
results[[length(results) + 1]] <- capture_outcome({
  out <- joined %>% mutate(dept_upper = toupper(department))
  na_count <- sum(is.na(out$dept_upper))
  paste0("produced ", na_count, " NA silently")
})

# e: arithmetic on NA from left join
results[[length(results) + 1]] <- capture_outcome({
  out <- joined %>% mutate(los_weeks = los_days / 7)
  na_count <- sum(is.na(out$los_weeks))
  paste0("produced ", na_count, " NA silently")
})

# f: filter silently drops NA rows
results[[length(results) + 1]] <- capture_outcome({
  long_stays <- joined %>% filter(los_days > 5)
  na_rows <- sum(is.na(joined$los_days))
  paste0("excluded ", na_rows, " NA rows")
})

# ═══════════════════════════════════════════════════════════════════════════════
# Column name collision
# ═══════════════════════════════════════════════════════════════════════════════

admissions <- tibble(
  patient_id = c("P001", "P002"),
  date = c("2024-01-15", "2024-02-20"),
  department = c("ED", "ICU")
)

discharges <- tibble(
  patient_id = c("P001", "P002"),
  date = c("2024-01-18", "2024-02-25"),
  disposition = c("Home", "SNF")
)

# g: explicit suffixes -- access original name
results[[length(results) + 1]] <- capture_outcome({
  joined <- admissions %>% inner_join(discharges, by = "patient_id", suffix = c("_admit", "_discharge"))
  joined %>% select(all_of("date"))
})

# h: no suffixes -- access ambiguous original name
results[[length(results) + 1]] <- capture_outcome({
  joined <- admissions %>% inner_join(discharges, by = "patient_id")
  joined %>% select(all_of("date"))
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
