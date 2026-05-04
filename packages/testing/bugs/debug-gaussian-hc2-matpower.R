# Directly compute (I - H_ij)^{-1/2} for each cluster and output the values
# so we can compare with our Rust implementation.

library(sandwich)

# Load the exact same data our test uses
ref <- jsonlite::fromJSON("packages/testing/glm/gap-refs.json")
sg <- ref$sandwich_gaussian

x1 <- sg$x1
x2 <- sg$x2
y <- sg$y
cluster <- sg$cluster
n <- length(y)

cat("n:", n, "\n")
cat("unique clusters:", length(unique(cluster)), "\n")

fit <- glm(y ~ x1 + x2, family=gaussian())
cat("Coefficients:", coef(fit), "\n")

X <- model.matrix(fit)
w <- weights(fit, "working")
cat("All weights = 1?", all(w == 1), "\n")

XX1 <- chol2inv(qr.R(qr(X * sqrt(w))))
cat("\nXX1 = (X'WX)^{-1}:\n")
print(XX1)

# estfun
ef <- estfun(fit)
res <- rowMeans(ef / X, na.rm = TRUE)
res[apply(abs(ef) < .Machine$double.eps, 1L, all)] <- 0

cat("\n=== Per-cluster H_ij and matrixpower ===\n")
for (j in unique(cluster)) {
  ij <- which(cluster == j)
  m <- length(ij)
  cat("\n--- Cluster", j, "(indices:", ij, ", size:", m, ") ---\n")

  Xi <- X[ij, , drop=FALSE]
  wi <- w[ij]

  Hij <- Xi %*% XX1 %*% t(Xi) %*% diag(wi, nrow=m, ncol=m)
  cat("H_ij:\n")
  print(Hij)

  I_minus_H <- diag(m) - Hij
  cat("I - H_ij:\n")
  print(I_minus_H)

  cat("isSymmetric(I - H_ij):", isSymmetric(I_minus_H), "\n")

  eig <- eigen(I_minus_H, symmetric=TRUE)
  cat("eigenvalues:", eig$values, "\n")

  mp <- sandwich:::matrixpower(I_minus_H, -0.5)
  cat("(I - H_ij)^{-1/2}:\n")
  print(mp)

  # Verify: mp %*% mp should equal (I - H_ij)^{-1}
  mp_sq <- mp %*% mp
  inv_direct <- solve(I_minus_H)
  cat("mp %*% mp == solve(I-H)?", all.equal(mp_sq, inv_direct, check.attributes=FALSE), "\n")

  # What does our code produce for adjusted_res?
  res_ij <- res[ij]
  adjusted_res <- drop(mp %*% res_ij)
  cat("res[ij]:", res_ij, "\n")
  cat("adjusted_res:", adjusted_res, "\n")
  cat("efi = adjusted_res * X:\n")
  print(adjusted_res * Xi)
}

# Final vcovCL
cat("\n=== Final Result ===\n")
v <- vcovCL(fit, cluster=cluster, type="HC2", cadjust=TRUE)
cat("vcovCL HC2:\n")
print(v)

# Also verify HC3 works with solve
v3 <- vcovCL(fit, cluster=cluster, type="HC3", cadjust=TRUE)
cat("\nvcovCL HC3:\n")
print(v3)
