# Export sandwich package datasets as CSV
# Usage: Rscript export_datasets.R

library(sandwich)

data("PetersenCL", package = "sandwich")
write.csv(PetersenCL, "PetersenCL.csv", row.names = FALSE)
cat("Wrote PetersenCL.csv:", nrow(PetersenCL), "rows\n")

data("InstInnovation", package = "sandwich")
write.csv(InstInnovation, "InstInnovation.csv", row.names = FALSE)
cat("Wrote InstInnovation.csv:", nrow(InstInnovation), "rows\n")
