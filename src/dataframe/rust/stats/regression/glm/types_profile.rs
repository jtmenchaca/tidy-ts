//! GLM profile types
//!
//! This file contains types related to profile likelihood analysis for GLM.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::types_results::{GlmResult, GlmSummary};

/// GLM profile result
#[derive(Debug)]
pub struct GlmProfile {
    /// Profile data for each parameter
    pub profiles: HashMap<String, ParameterProfile>,
    /// Original fit
    pub original_fit: GlmResult,
    /// Summary
    pub summary: GlmSummary,
    /// Test type used
    pub test: String,
}

/// Profile data for a single parameter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterProfile {
    /// Profile values (z or tau)
    pub values: Vec<f64>,
    /// Parameter values
    pub parameter_values: Vec<Vec<f64>>,
}
