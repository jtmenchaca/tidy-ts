#!/usr/bin/env python3
"""
GLM Logistic Regression Comparison - scikit-learn
"""
import numpy as np
from sklearn.linear_model import LogisticRegression
import pandas as pd

# Same data as R and TypeScript tests
data = pd.DataFrame({
    'y': [0, 1, 0, 1, 1, 0],
    'x1': [1.2, 2.5, 1.8, 3.2, 2.9, 1.5],
    'x2': [3, 5, 2, 7, 6, 3]
})

print("=== Logistic Regression - scikit-learn ===\n")

X = data[['x1', 'x2']].values
y = data['y'].values

# Use 'lbfgs' solver (similar to R's IRLS)
# Set very high C (low regularization) to match R's unpenalized regression
# Set tol to 1e-8 to match R
model = LogisticRegression(
    penalty=None,  # No regularization like R
    solver='lbfgs',
    max_iter=1000,
    tol=1e-8,
    fit_intercept=True,
    verbose=1
)

result = model.fit(X, y)

print("\nCoefficients (full precision):")
print(f"  Intercept: {model.intercept_[0]:.20f}")
print(f"  x1: {model.coef_[0][0]:.20f}")
print(f"  x2: {model.coef_[0][1]:.20f}")

# Compute deviance manually
y_pred = model.predict_proba(X)[:, 1]
epsilon = 1e-15
y_pred_clipped = np.clip(y_pred, epsilon, 1 - epsilon)
deviance = -2 * np.sum(y * np.log(y_pred_clipped) + (1 - y) * np.log(1 - y_pred_clipped))
print(f"\nDeviance (computed): {deviance:.6e}")

print("\nFitted probabilities:")
for i, val in enumerate(y_pred):
    print(f"  {i}: {val:.20e}")

print("\n=== Comparison Summary ===")
print("R coefficients:")
print("  (Intercept): -91.79706220812821016")
print("  x1: 27.25357550868459100")
print("  x2: 9.25300446184715497")
print("\nRust coefficients:")
print("  (Intercept): -91.80410704778988")
print("  x1: 27.26109961701328")
print("  x2: 9.250692652262135")
print("\nPython statsmodels coefficients:")
print("  const: -83.79859754342862743215")
print("  x1: 24.75522017579536893095")
print("  x2: 8.50249772193398989373")
print("\nscikit-learn coefficients:")
print(f"  Intercept: {model.intercept_[0]:.20f}")
print(f"  x1: {model.coef_[0][0]:.20f}")
print(f"  x2: {model.coef_[0][1]:.20f}")

print("\nR deviance: 5.406093e-10")
print(f"Rust deviance: 1.468571e-9")
print(f"Python statsmodels deviance: 3.994677e-09")
print(f"scikit-learn deviance: {deviance:.6e}")
