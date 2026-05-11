# Probe: Category 5 — Schema Composition Errors in R/tidyverse
#
# Consolidates error classes 06, 13, 20, 27, 33.
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
# Schema validation at data boundaries
# ═══════════════════════════════════════════════════════════════════════════════

# a: Non-numeric value in numeric column
tmp <- tempfile(fileext = ".csv")
writeLines(c("lab_id,result_value", "L1,100", "L2,pending", "L3,200"), tmp)

results[[length(results) + 1]] <- capture_outcome({
  df <- read_csv(tmp, col_types = cols(lab_id = col_character(), result_value = col_double()))
  has_na <- any(is.na(df$result_value))
  "non-numeric coerced to NA"
})

# b: Missing column — accessed after load
results[[length(results) + 1]] <- capture_outcome({
  df <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)
  df %>% mutate(x = nonexistent_column) %>% nrow()
})

# c: Empty cell in column that should be non-null
results[[length(results) + 1]] <- capture_outcome({
  df <- read_csv("../fixtures/lab_results.csv", show_col_types = FALSE)
  na_count <- sum(is.na(df$reference_high))
  paste0(na_count, " cells silently became NA")
})

invisible(file.remove(tmp))

# ═══════════════════════════════════════════════════════════════════════════════
# Bind rows schema mismatch
# ═══════════════════════════════════════════════════════════════════════════════

labs_a <- tibble(
  patient_id = c("P001", "P002"),
  test_name = c("BNP", "WBC"),
  result_value = c(1250, 15.2),
  lab_site = c("Main", "Main")
)

labs_b <- tibble(
  patient_id = c("P003", "P004"),
  test_name = c("HbA1c", "Glucose"),
  result_value = c(8.9, 210),
  reference_range = c("4.0-5.6", "70-100")
)

# d: bind_rows with different schemas — fills NA silently
results[[length(results) + 1]] <- capture_outcome({
  combined <- bind_rows(labs_a, labs_b)
  na_lab_site <- sum(is.na(combined$lab_site))
  na_ref_range <- sum(is.na(combined$reference_range))
  "NA-filled 2 missing cols"
})

# e: String op on NA column after bind — silent propagation
results[[length(results) + 1]] <- capture_outcome({
  combined <- bind_rows(labs_a, labs_b)
  combined <- combined %>% mutate(site_upper = toupper(lab_site))
  na_count <- sum(is.na(combined$site_upper))
  "NA propagated to 2 rows"
})

# ═══════════════════════════════════════════════════════════════════════════════
# Implicit type coercion in row binding
# ═══════════════════════════════════════════════════════════════════════════════

# f: bind_rows with double + character — R errors (stricter than Python)
results[[length(results) + 1]] <- capture_outcome({
  numeric_doses <- tibble(drug = c("Aspirin"), dose = c(325))
  text_doses <- tibble(drug = c("Insulin"), dose = c("sliding scale"))
  bind_rows(numeric_doses, text_doses)
})

# g: bind_rows with logical + numeric — silent coercion (TRUE -> 1)
results[[length(results) + 1]] <- capture_outcome({
  a <- tibble(patient = "P001", critical = TRUE)
  b <- tibble(patient = "P002", critical = 2)
  combined <- bind_rows(a, b)
  col_class <- class(combined$critical)
  paste0("logical coerced to ", col_class)
})

# ═══════════════════════════════════════════════════════════════════════════════
# Append row type mismatch
# ═══════════════════════════════════════════════════════════════════════════════

patients <- tibble(
  patient_id = "P001",
  name = "Alice",
  age = 30
)

# h: Missing column silently filled with NA
results[[length(results) + 1]] <- capture_outcome({
  new_row <- tibble(patient_id = "P002", name = "Bob")
  combined <- bind_rows(patients, new_row)
  "Missing col filled with NA"
})

# i: Wrong type — R errors on double + character
results[[length(results) + 1]] <- capture_outcome({
  bad_row <- tibble(patient_id = "P003", name = "Carol", age = "thirty")
  bind_rows(patients, bad_row)
})

# ═══════════════════════════════════════════════════════════════════════════════
# Duplicate column names
# ═══════════════════════════════════════════════════════════════════════════════

# j: tibble with duplicate names, then toupper() — errors at creation
results[[length(results) + 1]] <- capture_outcome({
  df <- tibble(id = 1, name = "Alice", name = "ED")
  df %>% mutate(upper = toupper(name))
  "toupper() on duplicate col"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
