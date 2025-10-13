# Simulate what happens in GLM IRLS with single non-zero weight
x_full <- cbind(1, c(1,2,3,4,5))  # Design matrix with intercept
y <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights <- c(0, 0, 0, 0, 1)

# After first iteration, only row 5 has weight > 0
good <- weights > 0
x_good <- x_full[good, , drop=FALSE]
y_good <- y[good]
w_good <- weights[good]

cat("X (good rows only):\n")
print(x_good)
cat("\ny (good rows only):", y_good, "\n")
cat("weights (good):", w_good, "\n\n")

# For Gaussian with identity link, working weights are just the prior weights
# and working response z = eta + (y - mu) = y initially

z <- y_good
w <- sqrt(w_good)

# Weighted least squares
X_weighted <- x_good * w
z_weighted <- z * w

cat("X * w:\n")
print(X_weighted)
cat("\nz * w:", z_weighted, "\n\n")

# Solve using QR
fit <- lm.wfit(x_good, y_good, w_good)
cat("Coefficients from lm.wfit:", fit$coefficients, "\n")
cat("Rank:", fit$rank, "\n")

# What should happen: with only 1 observation and 2 parameters,
# the system is underdetermined. R sets the intercept to match
# the observation and slope to NA.
