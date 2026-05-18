# ID: SO#41815365
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: date_trans requires Date class, got character. String where date expected.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

library(ggplot2)
library(scales)

Data <- data.frame(
  Date = c("2002-05-23", "2002-05-29", "2002-05-31"),
  Well = c("MW-3", "MW-3", "MW-3"),
  Elev = c(929.04, 929.39, 929.37),
  stringsAsFactors = FALSE
)
Data$Date <- as.Date(Data$Date, format = "%Y-%m-%d")
Data$Well <- as.factor(Data$Well)
Data$Elev <- as.numeric(Data$Elev)

ggplot(data = Data, aes(x = Date, y = Elev, group = Well, colour = Well)) +
  geom_line(linewidth = 0.75) +
  xlab("") +
  ylab("Elevation (ft.)") +
  scale_color_brewer(palette = "Spectral") +
  scale_x_date(
    breaks = date_breaks("2 year"),
    labels = date_format("%Y")
  ) +
  theme_bw() +
  geom_rect(
    data = Data,
    aes(
      xmin = "2004-04-29",
      xmax = "2004-12-20",
      ymin = -Inf,
      ymax = Inf
    ),
    fill = "gray",
    alpha = 0.5
  )
