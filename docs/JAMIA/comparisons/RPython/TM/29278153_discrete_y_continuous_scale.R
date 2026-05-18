# ID: SO#29278153
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: String/factor column passed to continuous y-axis. Typed y mapping requires `number \| null \| undefined`.
# Reproduction status: Live
# Type system catch: Continuous y-axis requires `number`; `string | factor` rejected

library(ggplot2)

meltDF <- data.frame(
  MW = c(3.9, 6.4, 7.4, 8.1, 9, 9.4, 3.9, 6.4),
  variable = factor(
    c("10", "10", "33.95", "33.95", "58.66", "58.66", "84.42", "84.42"),
    levels = c("10", "33.95", "58.66", "84.42")
  ),
  value = c(1, 1, 1, 1, 0, 0, 0, 0)
)

ggplot(meltDF[meltDF$value == 1, ], aes(x = MW, y = variable)) +
  geom_point() +
  scale_x_continuous(limits = c(0, 1200), breaks = c(0, 400, 800, 1200)) +
  scale_y_continuous(limits = c(0, 1200), breaks = c(0, 400, 800, 1200))
