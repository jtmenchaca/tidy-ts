# ID: SO#22906804
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Matrix multiply on data.frame requires as.matrix. Type not suitable for math operations.
# Reproduction status: Live
# Type system catch: `Matrix` type required for `%*%`; `DataFrame` rejected

da <- data.frame(
  V1 = c(0.46, 0.25, 0.82),
  V2 = c(2.36, 1.52, 1.50),
  V3 = c(-1.54, -0.59, 0.34)
)

# BUG: %*% requires matrix, not data.frame
tryCatch(
  t(da) %*% da,
  error = function(e) cat("Crash:", conditionMessage(e), "\n")
)
# Error: requires numeric/complex matrix/vector arguments

# Fix: convert to matrix first
ma <- diag(3) + t(as.matrix(da)) %*% as.matrix(da)
print(ma)
