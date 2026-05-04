# Step-by-step trace of R's meatCL HC2 for Gaussian
# Comparing with what our Rust code does to find the divergence point.
#
# R source (from survival-ref/sandwich-master/R/vcovCL.R):
# 1. ef = estfun(x)  -- scores divided by dispersion
# 2. XX1 = (X'WX)^{-1}  via chol2inv(qr.R(qr(X * sqrt(w))))
# 3. res = rowMeans(ef/X, na.rm=TRUE)
# 4. For each cluster j:
#    Hij = X[ij,] %*% XX1 %*% t(X[ij,]) %*% diag(w[ij])
#    efi[ij,] = (I - Hij)^{-1/2} %*% res[ij] * X[ij,]
# 5. efi *= sqrt((g-1)/g)   [Bell & McCaffrey]
# 6. Aggregate efi by cluster, compute outer product
# 7. meat = adj * crossprod(cluster_sums) / n
# 8. sandwich = bread %*% meat %*% bread / n^2  [via sandwich()]

library(sandwich)

set.seed(42)
n <- 30
x1 <- rnorm(n)
x2 <- rnorm(n)
y <- 2 + 0.5*x1 - 0.3*x2 + rnorm(n, sd=2)
cluster <- rep(1:10, each=3)

fit <- glm(y ~ x1 + x2, family=gaussian())

cat("=" |> rep(70) |> paste(collapse=""), "\n")
cat("STEP-BY-STEP TRACE OF R's meatCL HC2 (Gaussian)\n")
cat("=" |> rep(70) |> paste(collapse=""), "\n\n")

# ============================================================
# STEP 1: estfun
# ============================================================
cat("--- STEP 1: estfun(fit) ---\n")
ef <- estfun(fit)
cat("dim(ef):", dim(ef), "\n")
cat("ef[1:5,]:\n")
print(ef[1:5,])

# R's estfun.glm: X * working_residuals * working_weights / dispersion
# Our code: ef[i][j] = (wres[i] / dispersion) * model_matrix[i][j]
# where wres[i] = working_residuals[i] * weights[i]
X <- model.matrix(fit)
w <- weights(fit, "working")
wres_raw <- residuals(fit, "working")
disp_bread <- {
  wres2 <- wres_raw * w
  sum(wres2^2) / sum(w)
}
cat("\nDispersion (bread.glm way: sum(wres^2)/sum(w)):", disp_bread, "\n")
cat("Dispersion (summary way: deviance/df.residual):", summary(fit)$dispersion, "\n")
cat("These differ! bread.glm uses sum(wres^2)/sum(w), not deviance/df.residual\n")
cat("sum(w):", sum(w), "\n")
cat("df.residual:", fit$df.residual, "\n")
cat("Ratio:", sum(w) / fit$df.residual, "\n\n")

# Check which dispersion estfun uses
manual_ef_summary_disp <- X * (wres_raw * w / summary(fit)$dispersion)
manual_ef_bread_disp <- X * (wres_raw * w / disp_bread)
cat("estfun matches summary$dispersion?", all.equal(ef, manual_ef_summary_disp, check.attributes=FALSE), "\n")
cat("estfun matches bread dispersion?", all.equal(ef, manual_ef_bread_disp, check.attributes=FALSE), "\n")

# Check actual estfun.glm source
cat("\nestfun.glm source:\n")
print(getAnywhere("estfun.glm")$objs[[1]])

# ============================================================
# STEP 2: XX1 = (X'WX)^{-1}
# ============================================================
cat("\n--- STEP 2: XX1 = (X'WX)^{-1} ---\n")
XX1 <- chol2inv(qr.R(qr(X * sqrt(w))))
cat("XX1 (via chol2inv):\n")
print(XX1)

XX1_alt <- solve(t(X) %*% diag(w) %*% X)
cat("\n(X'WX)^{-1} (via solve):\n")
print(XX1_alt)
cat("Match?", all.equal(XX1, XX1_alt, check.attributes=FALSE), "\n")

# ============================================================
# STEP 3: working residuals from ef
# ============================================================
cat("\n--- STEP 3: res = rowMeans(ef/X, na.rm=TRUE) ---\n")
ef_over_X <- ef / X
cat("ef/X [1:5,]:\n")
print(ef_over_X[1:5,])
cat("\nAll columns of ef/X identical?",
    all.equal(ef_over_X[,1], ef_over_X[,2]),
    all.equal(ef_over_X[,1], ef_over_X[,3]), "\n")

res <- rowMeans(ef / X, na.rm = TRUE)
res[apply(abs(ef) < .Machine$double.eps, 1L, all)] <- 0
cat("\nres[1:10]:", res[1:10], "\n")

# What is res? It should be wres/dispersion
manual_res <- wres_raw * w / disp_bread
cat("wres*w/disp_bread [1:10]:", manual_res[1:10], "\n")
cat("res == wres*w/disp?", all.equal(res, manual_res), "\n")

# ============================================================
# STEP 4: H_ij for cluster 1
# ============================================================
cat("\n--- STEP 4: H_ij for cluster 1 ---\n")
ij <- which(cluster == 1)
cat("Cluster 1 indices:", ij, "\n")

Xi <- X[ij, , drop=FALSE]
wi <- w[ij]

Hij <- Xi %*% XX1 %*% t(Xi) %*% diag(wi, nrow=length(ij), ncol=length(ij))
cat("\nHij (R's formula: X_j %*% XX1 %*% t(X_j) %*% diag(w_j)):\n")
print(Hij)

cat("\nEigenvalues of I - Hij:", eigen(diag(length(ij)) - Hij)$values, "\n")

# ============================================================
# STEP 5: (I - Hij)^{-1/2} %*% res[ij]
# ============================================================
cat("\n--- STEP 5: Adjustment for cluster 1 ---\n")
I_minus_H <- diag(length(ij)) - Hij
cat("I - Hij:\n")
print(I_minus_H)

adj_matrix <- sandwich:::matrixpower(I_minus_H, -0.5)
cat("\n(I - Hij)^{-1/2}:\n")
print(adj_matrix)

res_ij <- res[ij]
cat("\nres[cluster1]:", res_ij, "\n")

adjusted_res <- drop(adj_matrix %*% res_ij)
cat("adjusted_res:", adjusted_res, "\n")

# efi[ij,] = adjusted_res * X[ij,]
efi_cluster1 <- adjusted_res * Xi
cat("\nefi[cluster1,]:\n")
print(efi_cluster1)

# ============================================================
# STEP 6: Bell & McCaffrey adjustment
# ============================================================
cat("\n--- STEP 6: Bell & McCaffrey sqrt((g-1)/g) ---\n")
g <- 10  # number of clusters
bm <- sqrt((g-1)/g)
cat("sqrt((g-1)/g) =", bm, "\n")
efi_cluster1_bm <- efi_cluster1 * bm
cat("efi after B&M [cluster1]:\n")
print(efi_cluster1_bm)

# ============================================================
# STEP 7: Full meatCL computation manually
# ============================================================
cat("\n--- STEP 7: Full manual meatCL HC2 ---\n")

# Replicate the full loop
efi_full <- ef  # start with original ef
for(j in unique(cluster)) {
  ij <- which(cluster == j)
  Xi <- X[ij, , drop=FALSE]
  wi <- w[ij]
  Hij <- Xi %*% XX1 %*% t(Xi) %*% diag(wi, nrow=length(ij), ncol=length(ij))
  adj_mat <- sandwich:::matrixpower(diag(length(ij)) - Hij, -0.5)
  efi_full[ij, ] <- drop(adj_mat %*% res[ij]) * Xi
}
efi_full <- sqrt((g-1)/g) * efi_full

# Aggregate by cluster
adj_factor <- g / (g - 1)  # cadjust=TRUE
cluster_sums <- apply(efi_full, 2L, rowsum, cluster)
cat("cluster_sums (10 x 3):\n")
print(cluster_sums)

meat_manual <- adj_factor * crossprod(cluster_sums) / n
cat("\nmeat (manual):\n")
print(meat_manual)

# Compare with R's meatCL
meat_R <- meatCL(fit, cluster=cluster, type="HC2", cadjust=TRUE)
cat("\nmeat (R's meatCL):\n")
print(meat_R)
cat("\nMatch?", all.equal(meat_manual, meat_R, check.attributes=FALSE), "\n")

# ============================================================
# STEP 8: Full sandwich
# ============================================================
cat("\n--- STEP 8: Full sandwich ---\n")
b <- bread(fit)
cat("bread:\n")
print(b)

# sandwich() does: (1/n) * bread %*% meat %*% bread
# Wait no - sandwich(x, meat.) does: bread(x)/nobs(x) %*% meat. %*% bread(x)/nobs(x)
# Which is: (bread/n) %*% meat %*% (bread/n) ... no that's wrong
# Let me check
cat("\nsandwich source:\n")
print(getAnywhere("sandwich")$objs[[1]])

# ============================================================
# STEP 9: Output our reference values
# ============================================================
cat("\n--- STEP 9: Final vcovCL values (what tests compare against) ---\n")
v <- vcovCL(fit, cluster=cluster, type="HC2", cadjust=TRUE)
cat("vcovCL HC2:\n")
print(v)
cat("\nas vector:", as.vector(v), "\n")

# ============================================================
# STEP 10: What our Rust code computes (simulating)
# ============================================================
cat("\n--- STEP 10: Simulating our Rust code ---\n")

# Our code's dispersion for Gaussian:
# dispersion_parameter from GlmResult (which is deviance/df.residual)
our_disp <- summary(fit)$dispersion
cat("Our dispersion_parameter:", our_disp, "\n")

# Our estfun: wres[i] / dispersion * X[i,j]
# But R's estfun uses a DIFFERENT dispersion!
cat("\nR's bread.glm dispersion:", disp_bread, "\n")
cat("Our dispersion_parameter:", our_disp, "\n")
cat("Ratio:", our_disp / disp_bread, "\n")
cat("This is n/df.residual =", n/fit$df.residual, "\n\n")

# This means our ef is different from R's ef!
our_ef <- X * (wres_raw * w / our_disp)
cat("Our ef[1:5,]:\n")
print(our_ef[1:5,])
cat("\nR's ef[1:5,]:\n")
print(ef[1:5,])
cat("\nRatio our/R:", our_ef[1,1] / ef[1,1], "\n")
cat("This is disp_bread / our_disp =", disp_bread / our_disp, "= df.residual/n =", fit$df.residual/n, "\n")

cat("\n*** ROOT CAUSE ***\n")
cat("R's bread.glm computes dispersion as: sum(wres^2)/sum(w) =", disp_bread, "\n")
cat("Our code uses dispersion_parameter = deviance/df.residual =", our_disp, "\n")
cat("These differ by a factor of n/df.residual =", n/fit$df.residual, "\n")
cat("For this model: n=30, k=3, df.residual=27, so ratio = 30/27 = 10/9\n")
cat("\nThe fix: use sum(wres^2)/sum(w) instead of dispersion_parameter\n")
cat("when computing estfun (score contributions).\n")
cat("Equivalently: use sum((working_residuals * weights)^2) / sum(weights)\n")
