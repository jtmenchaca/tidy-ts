# ID: SO#29224719
# Language: R
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: All-NA group makes ifelse return logical instead of numeric; type conflict across groups
# Reproduction status: Fixed (dplyr 1.1+ handles NA type coercion)
# Type system catch: `number` rejects `number | null`

library(dplyr)

df1 <- data.frame(
  crawl.id = c(1, 1, 2, 1, 1, 1),
  group.id = factor(c("1", "2", "2", "3", "3", "3")),
  hits.diff = c(NA, NA, 0, NA, NA, NA)
)

cat("Input data:\n")
print(df1)
cat("\n")

# The bug: when all hits.diff in a group are NA, ifelse returns logical NA
# instead of numeric 0. dplyr crashes on type mismatch between groups.
tryCatch({
  result <- df1 %>%
    group_by(group.id) %>%
    mutate(hits.consumed = ifelse(hits.diff <= 0, -hits.diff, 0))
  print(result)
}, error = function(e) {
  cat(paste("Crash:", e$message, "\n"))
})
