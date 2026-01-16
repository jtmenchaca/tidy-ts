# Test QR decomposition with single observation
x <- matrix(c(1), nrow=1, ncol=1)
y <- c(10.3)
w <- c(1)

# Weighted least squares: solve (X'W X) beta = X'W y
# With X = [1], W = 1, y = 10.3:
# This becomes: 1 * beta = 1 * 10.3
# So beta = 10.3

# Using R's QR
fit <- lm.wfit(x, y, w)
cat("lm.wfit coefficients:", fit$coefficients, "\n")
cat("lm.wfit fitted:", fit$fitted.values, "\n")

# Using qr
qr_result <- qr(x * sqrt(w))
z <- y * sqrt(w)
coef <- qr.coef(qr_result, z)
cat("qr.coef result:", coef, "\n")

# Using C_Cdqrls (what glm.fit uses)
# This is harder to call directly, but let's see what glm gives
df <- data.frame(y=10.3)
model <- glm(y ~ 1, data=df, family=gaussian(), weights=1)
cat("GLM intercept:", coef(model), "\n")
