# ID: SO#23997475
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Character date value for geom_vline position. Typed position spec requires numeric/temporal.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

library(lubridate)
library(ggplot2)

df <- data.frame(
  date = dmy(c("2/6/2014", "3/6/2014", "4/6/2014", "5/6/2014")),
  value = 1:4
)

ggplot(data = df, aes(x = date, y = value)) +
  geom_vline(xintercept = as.numeric(dmy("3/6/2014")), linetype = 4) +
  geom_line()
