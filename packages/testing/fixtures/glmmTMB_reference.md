# glmmTMB Reference Values

These are reference values from glmmTMB for validating our Rust GLMM implementation.

## Owls Dataset - Gaussian Random Intercept

Model: `SiblingNegotiation ~ FoodTreatment + (1 | Nest)`
Family: gaussian, Link: identity, REML: FALSE

### Variance Components
- Nest (Intercept) SD: **2.4025**
- Residual SD: **6.0409**

### Fixed Effects
- (Intercept): **8.1195** (SE: 0.5927)
- FoodTreatmentSatiated: **-3.5477** (SE: 0.5211)

### Model Fit
- AIC: 3901.2
- logLik: -1946.6
- n = 599, groups: Nest = 27

---

## Salamanders Dataset - Poisson Random Intercept

Model: `count ~ mined + (1 | site)`
Family: poisson, Link: log, REML: FALSE

### Variance Components
- site (Intercept) SD: **0.5759**

### Fixed Effects
- (Intercept): **-1.5053** (SE: 0.2230)
- minedno: **2.2644** (SE: 0.2803)

### Model Fit
- AIC: 2215.7
- logLik: -1104.8
- n = 644, groups: site = 23

---

## Test Tolerances

Based on PRD targets:
- Coefficient tolerance: 1e-4 (relative)
- Variance component tolerance: 1e-3 (relative)
- Log-likelihood tolerance: 1e-2 (absolute)
