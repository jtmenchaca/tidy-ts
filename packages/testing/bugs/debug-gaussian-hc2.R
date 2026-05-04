# Debug script: Gaussian HC2 clustered sandwich estimator
# Goal: understand exactly how R computes HC2 for Gaussian family
# and identify where our Rust implementation diverges.
#
# Known issue: our Gaussian clustered HC2 has ~35% relative error vs R.
# Hypothesis: the hat matrix H_ij should use bread/n (which includes dispersion)
# but our code uses (X'WX)^{-1} directly (missing the dispersion factor).

library(sandwich)

cat("=" |> rep(70) |> paste(collapse=""), "\n")
cat("GAUSSIAN HC2 CLUSTERED SANDWICH - DIAGNOSTIC TRACE\n")
cat("=" |> rep(70) |> paste(collapse=""), "\n\n")

# Use the exact same data as our test (from gap-refs.json generation)
set.seed(42)
n <- 30
x1 <- rnorm(n)
x2 <- rnorm(n)
y <- 2 + 0.5*x1 - 0.3*x2 + rnorm(n, sd=2)
cluster <- rep(1:10, each=3)

fit <- glm(y ~ x1 + x2, family=gaussian())

cat("--- Model Summary ---\n")
cat("Coefficients:", coef(fit), "\n")
cat("Dispersion (sigma^2):", summary(fit)$dispersion, "\n")
cat("df.residual:", fit$df.residual, "\n")
cat("n:", n, "\n")
cat("rank:", fit$rank, "\n\n")

# ============================================================
# STEP 1: bread computation
# ============================================================
cat("--- STEP 1: bread ---\n")
b <- bread(fit)
cat("bread(fit):\n")
print(b)

# R's bread.glm source:
# function(x, ...) {
#   sx <- summary(x)
#   return(vcov(x) * sx$df[1] + sx$df[2])   # NO! that's wrong
#   # Actually: bread.glm returns:
#   #   vcov(x) * nobs(x)   for some versions
#   # Let's check directly
# }
cat("\nvcov(fit) * n:\n")
print(vcov(fit) * n)
cat("\nDoes bread == vcov(fit) * n?", all.equal(b, vcov(fit) * n, check.attributes=FALSE), "\n")

# bread = n * cov.unscaled * dispersion
# where cov.unscaled = (X'WX)^{-1}
X <- model.matrix(fit)
w <- weights(fit, "working")
cat("\nWorking weights (should all be 1 for Gaussian):", unique(w), "\n")

XtWX <- t(X) %*% diag(w) %*% X
XtWX_inv <- solve(XtWX)
cat("\n(X'WX)^{-1}:\n")
print(XtWX_inv)

disp <- summary(fit)$dispersion
cat("\nn * (X'WX)^{-1} * dispersion:\n")
print(n * XtWX_inv * disp)
cat("\nDoes bread == n * (X'WX)^{-1} * disp?",
    all.equal(b, n * XtWX_inv * disp, check.attributes=FALSE), "\n")

# ============================================================
# STEP 2: estfun computation
# ============================================================
cat("\n--- STEP 2: estfun ---\n")
ef <- estfun(fit)
cat("estfun(fit)[1:5,]:\n")
print(head(ef, 5))

# Manual: X * working_residuals * working_weights / dispersion
wres <- residuals(fit, "working")
manual_ef <- X * (wres * w / disp)
cat("\nManual ef[1:5,]:\n")
print(head(manual_ef, 5))
cat("Match?", all.equal(ef, manual_ef, check.attributes=FALSE), "\n")

# ============================================================
# STEP 3: meatCL HC2 internals
# ============================================================
cat("\n--- STEP 3: meatCL HC2 internals ---\n")

# R source for meatCL with type="HC2":
# 1. Compute ef = estfun(x)
# 2. Compute res = rowMeans(ef/X, na.rm=TRUE)
# 3. For each cluster j:
#    H_ij = X[ij,] %*% bread(x)/nobs(x) %*% t(X[ij,] * w[ij])
#    efi[ij,] = (I - H_ij)^{-1/2} %*% res[ij] * X[ij,]
# 4. Aggregate by cluster and compute outer product

cat("\nbread/n (used in H_ij computation):\n")
bread_over_n <- b / n
print(bread_over_n)

cat("\n(X'WX)^{-1} (what our code uses):\n")
print(XtWX_inv)

cat("\nRatio (bread/n) / (X'WX)^{-1}):\n")
ratio <- bread_over_n / XtWX_inv
print(ratio)
cat("\nAll ratios equal dispersion?", all.equal(ratio, matrix(disp, 3, 3)), "\n")

cat("\n*** KEY FINDING ***\n")
cat("bread/n = (X'WX)^{-1} * dispersion\n")
cat("For Gaussian with dispersion =", disp, ", our H_ij is MISSING a factor of", disp, "\n")
cat("For Poisson/Binomial, dispersion = 1, so there's no discrepancy.\n\n")

# ============================================================
# STEP 4: Trace H_ij for cluster 1
# ============================================================
cat("--- STEP 4: H_ij for cluster 1 ---\n")
idx <- which(cluster == 1)
cat("Cluster 1 indices:", idx, "\n")

Xi <- X[idx, , drop=FALSE]
wi <- w[idx]
cat("X[cluster1,]:\n")
print(Xi)
cat("weights[cluster1]:", wi, "\n")

# R's computation: H_ij = Xi %*% (bread/n) %*% t(Xi * wi)
# Note: Xi * wi in R means each row of Xi scaled by corresponding wi element
Xi_w <- Xi * wi  # row-wise scaling
H_ij_R <- Xi %*% bread_over_n %*% t(Xi_w)
cat("\nH_ij (R's way, using bread/n):\n")
print(H_ij_R)

# Our computation: H_ij = Xi %*% (X'WX)^{-1} %*% t(Xi) %*% diag(wi)
H_ij_ours <- Xi %*% XtWX_inv %*% t(Xi) %*% diag(wi)
cat("\nH_ij (our way, using (X'WX)^{-1}):\n")
print(H_ij_ours)

cat("\nRatio H_ij_R / H_ij_ours:\n")
print(H_ij_R / H_ij_ours)

cat("\nH_ij_R == H_ij_ours * dispersion?",
    all.equal(H_ij_R, H_ij_ours * disp, check.attributes=FALSE), "\n")

# ============================================================
# STEP 5: Impact on (I - H_ij)^{-1/2}
# ============================================================
cat("\n--- STEP 5: Impact on adjustment matrix ---\n")

I_minus_H_R <- diag(length(idx)) - H_ij_R
I_minus_H_ours <- diag(length(idx)) - H_ij_ours

cat("I - H_ij (R):\n")
print(I_minus_H_R)
cat("\nI - H_ij (ours):\n")
print(I_minus_H_ours)

# matrixpower for HC2
mp_R <- sandwich:::matrixpower(I_minus_H_R, -0.5)
mp_ours <- sandwich:::matrixpower(I_minus_H_ours, -0.5)

cat("\n(I - H_ij)^{-1/2} (R):\n")
print(mp_R)
cat("\n(I - H_ij)^{-1/2} (ours):\n")
print(mp_ours)

# ============================================================
# STEP 6: Full vcovCL comparison
# ============================================================
cat("\n--- STEP 6: Final vcovCL results ---\n")
v_hc0 <- vcovCL(fit, cluster=cluster, type="HC0", cadjust=TRUE)
v_hc1 <- vcovCL(fit, cluster=cluster, type="HC1", cadjust=TRUE)
v_hc2 <- vcovCL(fit, cluster=cluster, type="HC2", cadjust=TRUE)
v_hc3 <- vcovCL(fit, cluster=cluster, type="HC3", cadjust=TRUE)

cat("HC0:\n"); print(v_hc0)
cat("\nHC1:\n"); print(v_hc1)
cat("\nHC2:\n"); print(v_hc2)
cat("\nHC3:\n"); print(v_hc3)

# ============================================================
# STEP 7: What the fix should produce
# ============================================================
cat("\n--- STEP 7: Verification of fix ---\n")
cat("The fix: in compute_xwx_inv for HC2/HC3, multiply by dispersion.\n")
cat("i.e., use (X'WX)^{-1} * dispersion instead of (X'WX)^{-1}\n")
cat("This makes our H_ij = Xi %*% ((X'WX)^{-1} * disp) %*% t(Xi) %*% diag(wi)\n")
cat("         = Xi %*% (bread/n) %*% t(Xi * wi)  [matches R]\n\n")

# Verify: does our H_ij formula match R's when we include dispersion?
H_ij_fixed <- Xi %*% (XtWX_inv * disp) %*% t(Xi) %*% diag(wi)
cat("H_ij_fixed == H_ij_R?", all.equal(H_ij_fixed, H_ij_R, check.attributes=FALSE), "\n")

# But wait - R does t(Xi * wi), not t(Xi) %*% diag(wi). Are these the same?
H_ij_R_alt <- Xi %*% bread_over_n %*% t(Xi) %*% diag(wi)
cat("t(Xi * wi) vs t(Xi) %*% diag(wi) same?",
    all.equal(H_ij_R, H_ij_R_alt, check.attributes=FALSE), "\n")

cat("\n=== SUMMARY ===\n")
cat("Bug: in vcov_cl_from_input (sandwich.rs), the HC2/HC3 hat matrix\n")
cat("computation uses (X'WX)^{-1} but should use (X'WX)^{-1} * dispersion\n")
cat("(equivalently, bread/n).\n")
cat("For unit-dispersion families (Poisson, Binomial), this doesn't matter.\n")
cat("For Gaussian (dispersion =", disp, "), it causes ~35% error.\n")
