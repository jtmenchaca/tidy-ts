# Export SEQTaRget package datasets as CSV
# Usage: Rscript export_datasets.R

# Load from local .rda files (not installed package)
data_dir <- file.path(
  dirname(normalizePath(commandArgs(trailingOnly = FALSE)[grep("--file=", commandArgs(trailingOnly = FALSE))]
    |> sub("--file=", "", x = _))),
  "../../../../survival-ref/SEQTaRget-main/SEQTaRget/data"
)

args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
dir <- dirname(normalizePath(script_path))
setwd(dir)

# SEQdata (binary treatment, 12180 rows)
env1 <- new.env()
load(file.path(data_dir, "SEQdata.rda"), envir = env1)
write.csv(env1$SEQdata, "SEQdata.csv", row.names = FALSE)
cat("Wrote SEQdata.csv:", nrow(env1$SEQdata), "rows\n")

# SEQdata.LTFU (with LTFU events, 54687 rows)
env2 <- new.env()
load(file.path(data_dir, "SEQdata.LTFU.rda"), envir = env2)
write.csv(env2$SEQdata.LTFU, "SEQdata_LTFU.csv", row.names = FALSE)
cat("Wrote SEQdata_LTFU.csv:", nrow(env2$SEQdata.LTFU), "rows\n")

# SEQdata.multitreatment (3-level treatment, 5976 rows)
env3 <- new.env()
load(file.path(data_dir, "SEQdata.multitreatment.rda"), envir = env3)
write.csv(env3$SEQdata.multitreatment, "SEQdata_multitreatment.csv", row.names = FALSE)
cat("Wrote SEQdata_multitreatment.csv:", nrow(env3$SEQdata.multitreatment), "rows\n")
