# Probe: Bind Rows Schema Mismatch in R
suppressPackageStartupMessages(library(tidyverse))

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

# 13a: bind_rows with different schemas — fills NA silently
results[[1]] <- capture_outcome({
  combined <- bind_rows(labs_a, labs_b)
  na_lab_site <- sum(is.na(combined$lab_site))
  na_ref_range <- sum(is.na(combined$reference_range))
  "NA-filled 2 missing cols"
})

# 13b: String op on NA column after bind — silent propagation
results[[2]] <- capture_outcome({
  combined <- bind_rows(labs_a, labs_b)
  combined <- combined %>% mutate(site_upper = toupper(lab_site))
  na_count <- sum(is.na(combined$site_upper))
  "NA propagated to 2 rows"
})

cat(jsonlite::toJSON(results, auto_unbox = TRUE))
