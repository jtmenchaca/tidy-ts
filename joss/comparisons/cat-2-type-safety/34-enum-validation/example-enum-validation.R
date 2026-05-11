# Error Class 34: Enum/Categorical Validation
#
# R's factors with explicit levels produce NA for unknown values —
# with a warning. But read_csv doesn't validate factor levels at all.

library(tidyverse)

# read_csv accepts any value — no factor validation
df <- read_csv(I("patient_id,sex,insurance\nP001,M,Medicare\nP002,X,Unknown\n"),
               show_col_types = FALSE)
print(df)  # X and Unknown silently accepted

# Converting to factor with levels — unknown values become NA (warning)
df$sex <- factor(df$sex, levels = c("M", "F"))
print(df$sex)  # M, NA — X silently became NA
