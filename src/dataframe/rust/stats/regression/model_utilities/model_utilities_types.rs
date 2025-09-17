//! Model utilities types and structures

use crate::stats::regression::{ModelFrame, Variable};
use std::collections::HashMap;

/// Model object structure for utility functions
#[derive(Debug, Clone)]
pub struct ModelObject {
    /// Model frame containing all variables
    pub model_frame: ModelFrame,
    /// Weights (optional)
    pub weights: Option<Vec<f64>>,
    /// Offset (optional)
    pub offset: Option<Vec<f64>>,
    /// Response variable
    pub response: Option<Variable>,
    /// Terms object
    pub terms: Option<TermsObject>,
    /// Additional attributes
    pub attributes: HashMap<String, String>,
}

/// Terms object for model utilities
#[derive(Debug, Clone)]
pub struct TermsObject {
    /// Variable names
    pub variables: Vec<String>,
    /// Response variable index
    pub response: Option<usize>,
    /// Intercept flag
    pub intercept: bool,
    /// Factor information
    pub factors: Vec<FactorInfo>,
    /// Offset information
    pub offset: Option<OffsetInfo>,
}

/// Factor information
#[derive(Debug, Clone)]
pub struct FactorInfo {
    /// Factor name
    pub name: String,
    /// Factor levels
    pub levels: Vec<String>,
    /// Whether factor is ordered
    pub ordered: bool,
    /// Contrast type
    pub contrast: Option<String>,
}

/// Offset information
#[derive(Debug, Clone)]
pub struct OffsetInfo {
    /// Offset variable name
    pub name: String,
    /// Offset values
    pub values: Vec<f64>,
}
