# ID: SO#30063190
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: POSIXlt date column incompatible with dplyr. Tidy-ts uses single consistent Temporal type.
# Reproduction status: Live
# Type system catch: Single `Temporal` type; no POSIXlt/POSIXct ambiguity

library(dplyr)

df <- data.frame(
  transaction_date = c("01.01.2010", "15.01.2010", "01.02.2010"),
  install_date = c("01.01.2010", "01.01.2010", "01.02.2010"),
  value = c(10, 20, 15)
)

df$transaction_date <- strptime(df$transaction_date, "%d.%m.%Y")
df$install_date <- strptime(df$install_date, "%d.%m.%Y")
df$days <- as.numeric(difftime(df$transaction_date, df$install_date, units = "days"))

df %>%
  group_by(transaction_date) %>%
  summarise(total = sum(value))
