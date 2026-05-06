# Companion R script for reg-tests-1c.R
# Extracts portable hypothesis test cases and emits reference values as JSON.
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../..", "r-json-emit.R"))

# -- L1390-1399: cor.test() with extremely small p values --
# Pearson correlation symmetry: cor.test(a, b)$p.value ~= cor.test(a, -b)$p.value
# Use a fixed seed and specific jitter round for reproducibility
b <- 1:10
set.seed(1)
# Pick one representative iteration (n=1 from the loop)
a <- round(jitter(b, factor = 1/8), 3)
p1 <- cor.test(a, b)$p.value
p2 <- cor.test(a, -b)$p.value
r1 <- as.numeric(cor.test(a, b)$estimate)
r2 <- as.numeric(cor.test(a, -b)$estimate)

emit_reference(list(
  a = a,
  b = as.vector(b),
  pearson_p1 = p1,
  pearson_p2 = p2,
  pearson_r1 = r1,
  pearson_r2 = r2
))
