# Test what R does with binomial GLM when mu approaches boundaries

set.seed(42)
n <- 20

# Create data that might produce extreme predictions
x1 <- rnorm(n)
x2 <- rnorm(n)

# Create y with some separation that might cause extreme predictions
y <- c(rep(0, 10), rep(1, 10))

# Try to fit a model that might have issues
tryCatch({
  model <- glm(y ~ x1 + x2, family = binomial())
  print("Model converged:")
  print(model$converged)
  print("Boundary:")
  print(model$boundary)
  print("Fitted values range:")
  print(range(model$fitted.values))
}, error = function(e) {
  print(paste("Error:", e$message))
}, warning = function(w) {
  print(paste("Warning:", w$message))
})

# Now let's create a case with perfect separation
x_sep <- c(rep(-1, 10), rep(1, 10))
y_sep <- c(rep(0, 10), rep(1, 10))

print("\n\nPerfect separation case:")
tryCatch({
  model2 <- suppressWarnings(glm(y_sep ~ x_sep, family = binomial()))
  print("Model converged:")
  print(model2$converged)
  print("Boundary:")
  print(model2$boundary)
  print("Fitted values range:")
  print(range(model2$fitted.values))
}, error = function(e) {
  print(paste("Error:", e$message))
})
