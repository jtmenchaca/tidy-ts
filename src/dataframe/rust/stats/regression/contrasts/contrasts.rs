//! Factor contrast coding for model matrices - modularized
//!
//! This module provides functionality equivalent to R's `contrasts()` function,
//! which creates contrast matrices for factor variables in statistical models.
//!
//! Contrasts determine how factor levels are encoded in the design matrix,
//! affecting the interpretation of model coefficients.

// Module declarations
pub mod contrasts;

// Re-export everything from the contrasts module for backward compatibility
pub use contrasts::*;
