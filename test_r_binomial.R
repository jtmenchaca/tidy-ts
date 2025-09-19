# Test R's handling of edge cases in binomial deviance

# Create test cases with extreme mu values
y <- c(0, 0, 1, 1, 0.5, 0.5)
mu <- c(0, 1e-10, 1-1e-10, 1, 0.5, 0.99999)
weights <- rep(1, length(y))

# Get binomial family object
fam <- binomial()

# Calculate deviance residuals
dev_resids <- fam$dev.resids(y, mu, weights)
print("Deviance residuals:")
print(dev_resids)

# Look at the actual R source for binomial deviance
print("\nR's binomial dev.resids function:")
print(fam$dev.resids)

# Test what happens with exact 0 and 1
mu_extreme <- c(0, 1)
y_test <- c(0.5, 0.5)
print("\nTesting mu=0 and mu=1:")
tryCatch({
  dev_extreme <- fam$dev.resids(y_test, mu_extreme, c(1,1))
  print(dev_extreme)
}, error = function(e) {
  print(paste("Error:", e$message))
})
