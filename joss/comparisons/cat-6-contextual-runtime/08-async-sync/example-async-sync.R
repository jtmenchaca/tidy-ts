# Error Class 8: Async/Sync Confusion
#
# R has no native async/await. All operations are synchronous.
# There is no type-level distinction between sync and async.
# External API calls require explicit HTTP libraries (httr2, curl).

library(tidyverse)

meds <- read_csv("fixtures/medications.csv")

# R does not have async DataFrame operations.
# To call an external API for each row, you must use map/lapply
# with blocking HTTP calls. There is no compile-time protection
# against mixing sync and async logic.

# Example: blocking API call per row (no async alternative)
# lookup_drug_interaction <- function(drug_name) {
#   response <- httr2::request("https://api.example.com/interactions") |>
#     httr2::req_url_query(drug = drug_name) |>
#     httr2::req_perform()
#   httr2::resp_body_json(response)$result
# }
#
# meds %>%
#   mutate(interaction = map_chr(medication_name, lookup_drug_interaction))
#
# No type checking on the return value. If the API returns NULL
# or a list instead of a string, R silently coerces or errors at runtime.
