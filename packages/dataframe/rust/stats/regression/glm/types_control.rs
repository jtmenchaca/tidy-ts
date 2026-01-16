//! GLM control and options types
//!
//! This file contains control parameters and options for GLM fitting.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// GLM control parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmControl {
    /// Convergence tolerance for the IRLS algorithm
    pub epsilon: f64,
    /// Maximum number of iterations
    pub maxit: usize,
    /// Whether to print iteration information
    pub trace: bool,
}

impl Default for GlmControl {
    fn default() -> Self {
        Self {
            epsilon: 1e-8,
            maxit: 25,
            trace: false,
        }
    }
}

impl GlmControl {
    /// Create a new GLM control with default parameters
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a new GLM control with custom parameters
    pub fn with_params(epsilon: f64, maxit: usize, trace: bool) -> Self {
        Self {
            epsilon,
            maxit,
            trace,
        }
    }

    /// Validate control parameters
    pub fn validate(&self) -> Result<(), String> {
        if self.epsilon <= 0.0 {
            return Err("epsilon must be > 0".to_string());
        }
        if self.maxit <= 0 {
            return Err("maxit must be > 0".to_string());
        }
        Ok(())
    }
}

/// GLM fit options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmOptions {
    /// Whether to include the model frame in the result
    pub model: bool,
    /// Whether to include the design matrix in the result
    pub x: bool,
    /// Whether to include the response vector in the result
    pub y: bool,
    /// Whether to include QR decomposition in the result
    pub qr: bool,
    /// Whether to allow singular fits
    pub singular_ok: bool,
    /// Contrast matrices for factors
    pub contrasts: Option<HashMap<String, String>>,
    /// Offset vector
    pub offset: Option<Vec<f64>>,
    /// Prior weights
    pub weights: Option<Vec<f64>>,
    /// Subset of observations to use
    pub subset: Option<Vec<bool>>,
    /// NA action to take
    pub na_action: String,
}

impl Default for GlmOptions {
    fn default() -> Self {
        Self {
            model: true,
            x: false,
            y: true,
            qr: true,
            singular_ok: true,
            contrasts: None,
            offset: None,
            weights: None,
            subset: None,
            na_action: "na.omit".to_string(),
        }
    }
}
