//! GLM fit warning functions
//!
//! This module contains warning logic for GLM fitting.

use crate::stats::regression::family::GlmFamily;

/// GLM family warnings
#[derive(Debug, Clone)]
pub struct FamilyWarnings {
    pub binomial_boundary: bool,
    pub poisson_zero: bool,
}

/// Checks for family-specific warnings
pub fn check_family_warnings(mu: &[f64], family: &dyn GlmFamily) -> FamilyWarnings {
    let eps = 10.0 * f64::EPSILON;
    let family_name = family.family_name();

    let binomial_boundary = if family_name == "binomial" {
        mu.iter().any(|&m| m > 1.0 - eps || m < eps)
    } else {
        false
    };

    let poisson_zero = if family_name == "poisson" {
        mu.iter().any(|&m| m < eps)
    } else {
        false
    };

    FamilyWarnings {
        binomial_boundary,
        poisson_zero,
    }
}

/// Logs family warnings (placeholder for now)
pub fn log_family_warnings(warnings: &FamilyWarnings) {
    if warnings.binomial_boundary {
        // Note: In R, this would be a warning
        // For now, we'll just note it in the result
    }

    if warnings.poisson_zero {
        // Note: In R, this would be a warning
        // For now, we'll just note it in the result
    }
}
