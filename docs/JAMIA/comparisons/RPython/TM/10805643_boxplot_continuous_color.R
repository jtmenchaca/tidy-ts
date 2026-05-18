# ID: SO#10805643
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Numeric column passed to discrete color aesthetic. Typed graph API enforces `color: ColumnSpec<T, string \| number>` with explicit scale mapping.
# Reproduction status: Live
# Type system catch: Discrete scale requires categorical column; continuous `number` rejected

library(ggplot2)

MYdata <- data.frame(
  Age = rep(c(0, 1, 3, 6, 9, 12), each = 20),
  Richness = rnorm(120, 10000, 2500)
)

ggplot(data = MYdata, aes(x = Age, y = Richness)) +
  geom_boxplot(aes(group = Age)) +
  geom_point(aes(color = Age)) +
  scale_colour_manual(
    values = c(
      "#E69F00", "#56B4E9", "#009E73",
      "#F0E442", "#0072B2", "#D55E00"
    )
  )
