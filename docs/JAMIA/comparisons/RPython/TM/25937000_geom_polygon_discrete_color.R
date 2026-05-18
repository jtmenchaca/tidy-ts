# ID: SO#25937000
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: String/factor value on continuous scale. Same pattern as 29278153.
# Reproduction status: Live
# Type system catch: Continuous scale requires `number`; `string | factor` rejected

library(ggplot2)

merged <- data.frame(
  pauseMedian = c(1, 2, 3, 4, 5),
  numTotalPauses = c(10, 12, 11, 13, 9),
  diff = c(0.1, 0.2, 0.3, 0.4, 0.5)
)

splineHull <- data.frame(
  pauseMedian = c(1, 2, 3, 1),
  numTotalPauses = c(8, 14, 10, 8),
  microstyle = factor(c("A", "A", "B", "B"))
)

ggplot(data = merged, aes(x = pauseMedian, y = numTotalPauses, color = diff)) +
  geom_point() +
  geom_polygon(
    data = splineHull,
    mapping = aes(
      x = pauseMedian,
      y = numTotalPauses,
      group = microstyle,
      color = microstyle
    ),
    alpha = 0
  )
