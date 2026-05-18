# ID: SO#35560433
# Language: R
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: geom_smooth fails silently on character dates. String column where temporal/numeric expected for regression.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

library(ggplot2)

b <- data.frame(
  day = c(
    "05/22", "05/23", "05/24", "05/25", "05/26", "05/27", "05/28",
    "05/29", "05/30", "05/31", "06/01", "06/02"
  ),
  temp = c(10.1, 8.7, 11.4, 11.4, 11.6, 10.7, 9.6, 11.0, 10.0, 10.7, 9.5, 10.3)
)

gg2 <- ggplot(b, aes(x = day, y = temp, color = temp)) +
  geom_point(stat = "identity", aes(colour = temp), size = 3) +
  geom_smooth(method = "lm") +
  scale_colour_gradient(low = "yellow", high = "#de2d26")

print(gg2)
message("geom_smooth on character x may produce no visible line (IF)")
