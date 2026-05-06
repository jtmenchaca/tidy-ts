# Distribution tests from reg-tests-1a.R L792-796
# dwilcox symmetry and pwilcox == cumsum(dwilcox)
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../../statistical_tests/source-tests/r-json-emit.R"))

# -- L792-796: dwilcox(x, 4, 6) == dwilcox(x, 6, 4); pwilcox == cumsum(dwilcox) --
x <- -1:(4*6 + 1)
fx_46 <- dwilcox(x, 4, 6)
fx_64 <- dwilcox(x, 6, 4)
Fx <- pwilcox(x, 4, 6)
cumFx <- cumsum(fx_46)

emit_reference(list(
  x = as.vector(x),
  dwilcox_46 = as.vector(fx_46),
  dwilcox_64 = as.vector(fx_64),
  pwilcox = as.vector(Fx),
  cumsum_dwilcox = as.vector(cumFx)
))
