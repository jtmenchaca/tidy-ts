# ID: SO#28730083
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: geom_area fails with categorical x-axis. Wrong type for continuous operation.
# Reproduction status: Fixed (modern ggplot2 handles categorical x in geom_area)
# Type system catch: Continuous x-axis mapping requires `number` or `Temporal`; `factor` rejected

library(ggplot2)

data <- data.frame(
  def.percent = c(6.4827843, 5.8232425, -2.4003260, -3.5994399),
  period = factor(c("1984-1985", "1985-1986", "1986-1987", "1987-1988")),
  valence = c("neg", "neg", "pos", "pos")
)

ggplot(data, aes(x = period, y = def.percent, group = 1)) +
  geom_area(aes(fill = valence)) +
  geom_line() +
  geom_point() +
  geom_hline(yintercept = 0)
