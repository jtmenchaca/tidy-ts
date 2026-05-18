# ID: SO#21714867
# Language: R
# Bug class: Nullable
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: ifelse with NA_integer_ reinterprets double bits as integer; silent corruption
# Reproduction status: Fixed (dplyr 1.1+ coerces correctly; original produced garbage like 1074266112)
# Type system catch: `number` rejects `number | null`

library(dplyr)

# Simplified version of the SO data
df <- data.frame(
  yearID = c(2004L, 2006L, 2007L, 2008L, 2012L),
  teamID = c("SFN", "CHN", "CHA", "BOS", "NYA"),
  G = c(11L, 43L, 2L, 5L, NA_integer_)
)

cat("Input data:\n")
print(df)
cat(paste("\nG column class:", class(df$G), "\n"))
cat(paste("mean(G, na.rm=TRUE):", mean(df$G, na.rm = TRUE), "\n"))
cat(paste("class of mean:", class(mean(df$G, na.rm = TRUE)), "\n\n"))

# The original bug produced garbage like 1074266112 because double was
# reinterpreted as integer bits. Modern dplyr coerces correctly.
result <- df %>%
  mutate(G = ifelse(is.na(G), mean(G, na.rm = TRUE), G))

print(result)
