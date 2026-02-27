# Export Salamanders data as Rust arrays
library(glmmTMB)

data(Salamanders)

cat("// count (", nrow(Salamanders), " elements)\n", sep="")
cat("let y: Vec<f64> = vec![\n    ")
cat(paste(Salamanders$count, collapse=", "))
cat("\n];\n\n")

cat("// mined: 1 = mined=\"yes\", 0 = mined=\"no\" (", nrow(Salamanders), " elements)\n", sep="")
mined_numeric <- as.numeric(Salamanders$mined == "yes")
cat("let mined: Vec<f64> = vec![\n    ")
cat(paste(sprintf("%.1f", mined_numeric), collapse=", "))
cat("\n];\n\n")

cat("// site as numeric index (", nrow(Salamanders), " elements, ", length(unique(Salamanders$site)), " sites)\n", sep="")
site_numeric <- as.numeric(factor(Salamanders$site)) - 1  # 0-indexed
cat("let site_idx: Vec<usize> = vec![\n    ")
cat(paste(site_numeric, collapse=", "))
cat("\n];\n\n")

cat("// Verify site-mined consistency\n")
cat("// Each site should have a single mined status:\n")
site_mined <- tapply(Salamanders$mined, Salamanders$site, unique)
for (s in names(site_mined)) {
    cat("// Site ", s, ": mined=", as.character(site_mined[[s]]), "\n", sep="")
}

cat("\n// glmmTMB reference fit:\n")
fit <- glmmTMB(count ~ mined + (1 | site), data = Salamanders, family = poisson())
cat("// Intercept: ", fixef(fit)$cond["(Intercept)"], "\n", sep="")
cat("// minedyes: ", fixef(fit)$cond["minedyes"], "\n", sep="")
cat("// site SD: ", attr(VarCorr(fit)$cond$site, "stddev"), "\n", sep="")
cat("// logLik: ", as.numeric(logLik(fit)), "\n", sep="")
cat("// AIC: ", AIC(fit), "\n", sep="")
