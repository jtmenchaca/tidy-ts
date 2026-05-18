# ID: SO#10495898
# Language: R
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: String column on x-axis for line chart causes wrong ordering. Typed line x mapping would flag non-ordinal type.
# Reproduction status: Live
# Type system catch: Continuous x-axis mapping requires `number` or `Temporal`; `string` rejected

library(ggplot2)

set.seed(1)
df_nok <- rbind(
  data.frame(x = c("four", "three", "two", "one"), y = rnorm(4), d = "d1"),
  data.frame(x = c("three", "two", "one"), y = rnorm(3), d = "d2")
)

ggplot(df_nok, aes(x, y)) + geom_line(aes(colour = d))
