# ID: SO#29974535
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Character date column on x-axis gives wrong ordering. Typed x-axis mapping expects temporal or numeric for ordered axes.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

library(ggplot2)
library(scales)

set.seed(12345)
Date <- seq(as.Date("2010/1/1"), as.Date("2014/1/1"), "week")
Y <- rnorm(length(Date), mean = 100, sd = 1)
df <- data.frame(Date, Y)

df$Year <- format(df$Date, "%Y")
df$MonthDay <- format(df$Date, "%d-%b")

p <- ggplot(data = df, mapping = aes(x = MonthDay, y = Y, color = Year)) +
  geom_point() +
  geom_line(aes(group = 1))

p + scale_x_date(labels = date_format("%d-%b"))
