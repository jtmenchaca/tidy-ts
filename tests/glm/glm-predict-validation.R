# Validate GLM predictions against R

# Test 1: Gaussian model predictions
cat("\n=== Test 1: Gaussian GLM predictions ===\n")
x <- c(1, 2, 3, 4, 5)
y <- c(2, 4, 6, 8, 10)

model <- glm(y ~ x, family = gaussian(link = "identity"))
cat("Coefficients:\n")
print(model$coefficients)

# Predict on new data
newdata <- data.frame(x = c(6, 7, 8))
predictions <- predict(model, newdata, type = "response")
cat("\nPredictions on x=[6,7,8]:\n")
print(predictions)

link_preds <- predict(model, newdata, type = "link")
cat("\nLink predictions on x=[6,7,8]:\n")
print(link_preds)

# Test 2: Binomial model predictions
cat("\n=== Test 2: Binomial GLM predictions ===\n")
x2 <- c(1, 2, 3, 4, 5)
y2 <- c(0.2, 0.4, 0.6, 0.8, 0.9)

model2 <- glm(y2 ~ x2, family = binomial(link = "logit"))
cat("Coefficients:\n")
print(model2$coefficients)

# Predict on new data
newdata2 <- data.frame(x2 = c(0, 3, 6))
predictions2 <- predict(model2, newdata2, type = "response")
cat("\nPredictions on x=[0,3,6]:\n")
print(predictions2)

link_preds2 <- predict(model2, newdata2, type = "link")
cat("\nLink predictions on x=[0,3,6]:\n")
print(link_preds2)
