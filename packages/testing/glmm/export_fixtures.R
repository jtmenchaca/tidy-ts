# Export glmmTMB example datasets to CSV and get reference values
library(glmmTMB)

fixtures_dir <- "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures"

# Load and export each dataset
load(file.path(fixtures_dir, "Owls.rda"))
load(file.path(fixtures_dir, "Salamanders.rda"))
load(file.path(fixtures_dir, "epil2.rda"))

# Export to CSV
write.csv(Owls, file.path(fixtures_dir, "Owls.csv"), row.names = FALSE)
write.csv(Salamanders, file.path(fixtures_dir, "Salamanders.csv"), row.names = FALSE)
write.csv(epil2, file.path(fixtures_dir, "epil2.csv"), row.names = FALSE)

cat("=== Owls Dataset ===\n")
print(head(Owls))
cat("Dimensions:", dim(Owls), "\n\n")

cat("=== Salamanders Dataset ===\n")
print(head(Salamanders))
cat("Dimensions:", dim(Salamanders), "\n\n")

cat("=== Epil2 Dataset (sleepstudy-like) ===\n")
print(head(epil2))
cat("Dimensions:", dim(epil2), "\n\n")

# Fit a simple Gaussian random intercept model on Owls (SiblingNegotiation)
cat("\n=== glmmTMB Reference: Owls - Gaussian Random Intercept ===\n")
# Note: SiblingNegotiation is count data, but we can still fit Gaussian for testing
fit_owls <- glmmTMB(SiblingNegotiation ~ FoodTreatment + (1 | Nest),
                    data = Owls, family = gaussian(), REML = FALSE)
print(summary(fit_owls))
cat("\nVariance Components:\n")
print(VarCorr(fit_owls))
cat("\nResidual SD:", sigma(fit_owls), "\n")

# Fit on Salamanders - Poisson
cat("\n=== glmmTMB Reference: Salamanders - Poisson Random Intercept ===\n")
fit_sal <- glmmTMB(count ~ mined + (1 | site),
                   data = Salamanders, family = poisson(), REML = FALSE)
print(summary(fit_sal))
cat("\nVariance Components:\n")
print(VarCorr(fit_sal))
