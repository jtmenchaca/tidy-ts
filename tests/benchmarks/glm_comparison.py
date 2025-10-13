#!/usr/bin/env python3
"""
GLM Logistic Regression Comparison - Python statsmodels
"""
import numpy as np
import statsmodels.api as sm
import pandas as pd

# Same data as R and TypeScript tests
data = pd.DataFrame({
    'y': [0, 1, 0, 1, 1, 0],
    'x1': [1.2, 2.5, 1.8, 3.2, 2.9, 1.5],
    'x2': [3, 5, 2, 7, 6, 3]
})

print("=== Logistic Regression - Python statsmodels ===\n")

# Prepare X matrix with intercept
X = sm.add_constant(data[['x1', 'x2']])
y = data['y']

# Fit GLM with binomial family and logit link
model = sm.GLM(y, X, family=sm.families.Binomial())

# Fit with same tolerance as R (1e-8) and max iterations (25)
result = model.fit()

print("Converged:", result.converged)
print("Iterations:", result.fit_history['iteration'] if 'iteration' in result.fit_history else "N/A")
print("Deviance:", result.deviance)
print("AIC:", result.aic)

print("\nCoefficients (full precision):")
for name, coef in zip(result.params.index, result.params.values):
    print(f"  {name}: {coef:.20f}")

print("\nStandard errors:")
for name, se in zip(result.bse.index, result.bse.values):
    print(f"  {name}: {se:.20f}")

print("\nFitted values:")
for i, val in enumerate(result.fittedvalues):
    print(f"  {i}: {val:.20e}")

print("\nLinear predictors:")
for i, val in enumerate(result.predict(X)):
    print(f"  {i}: {val:.20f}")

print("\n=== Comparison Summary ===")
print("R coefficients:")
print("  (Intercept): -91.79706220812821016")
print("  x1: 27.25357550868459100")
print("  x2: 9.25300446184715497")
print("\nRust coefficients:")
print("  (Intercept): -91.80410704778988")
print("  x1: 27.26109961701328")
print("  x2: 9.250692652262135")
print("\nPython coefficients:")
for name, coef in zip(result.params.index, result.params.values):
    print(f"  {name}: {coef:.20f}")

print("\nR deviance: 5.406093e-10")
print(f"Rust deviance: 1.468571e-9")
print(f"Python deviance: {result.deviance:.6e}")
