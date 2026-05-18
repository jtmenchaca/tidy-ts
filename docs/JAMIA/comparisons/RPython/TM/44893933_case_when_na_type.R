# ID: SO#44893933
# Language: R
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: bare NA is logical type; case_when crashes on type mismatch across branches
# Reproduction status: Fixed (dplyr 1.1+ coerces bare NA to dominant branch type)
# Type system catch: `number` rejects `number | null`

library(dplyr)

df <- data.frame(old = 1:3)

tryCatch({
  result <- df %>% mutate(new = case_when(
    old == 1 ~ 5,
    old == 2 ~ NA,
    TRUE ~ as.numeric(old)
  ))
  print(result)
}, error = function(e) {
  cat(paste("Crash:", e$message, "\n"))
})
