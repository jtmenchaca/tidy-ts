# Convert all .rda files in this directory to .csv files
# Usage: Rscript convert_rda_to_csv.R

args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
dir <- dirname(normalizePath(script_path))
setwd(dir)

rda_files <- list.files(pattern = "\\.rda$")

for (f in rda_files) {
  env <- new.env()
  load(f, envir = env)
  objects <- ls(envir = env)

  for (obj_name in objects) {
    obj <- get(obj_name, envir = env)
    if (is.data.frame(obj)) {
      csv_name <- if (length(objects) == 1) {
        sub("\\.rda$", ".csv", f)
      } else {
        paste0(sub("\\.rda$", "", f), "_", obj_name, ".csv")
      }
      write.csv(obj, file = csv_name, row.names = FALSE)
      cat("Wrote", csv_name, "\n")
    } else {
      cat("Skipping non-data.frame object '", obj_name, "' in", f, "\n")
    }
  }
}
