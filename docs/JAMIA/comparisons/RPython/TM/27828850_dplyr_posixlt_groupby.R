# ID: SO#27828850
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: POSIXlt column breaks dplyr group_by. Same temporal type consistency pattern.
# Reproduction status: Live
# Type system catch: Single `Temporal` type; no POSIXlt/POSIXct ambiguity

library(dplyr)

setAs("character", "POSIXlt", function(from) {
  strptime(from, format = "%m/%d/%y %H:%M")
})

df <- data.frame(
  Start.Date = c("01/15/14 10:00", "01/15/14 11:00", "01/16/14 09:00"),
  BikeNo = c(1, 2, 1),
  stringsAsFactors = FALSE
)
df$Start.Date <- as(df$Start.Date, "POSIXlt")

d <- df %>%
  mutate(Weekday = factor(weekdays(Start.Date))) %>%
  group_by(Weekday) %>%
  summarise(Total = n())

print(d)
message("POSIXlt group_by may succeed on modern R; original bug was wrong date grouping")
