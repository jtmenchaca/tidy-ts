//! Model utilities types and structures

use std::collections::HashMap;

/// Represents a variable in the model frame
#[derive(Debug, Clone)]
pub enum Variable {
    /// Numeric variable
    Numeric(Vec<f64>),
    /// Factor variable with levels and labels
    Factor {
        values: Vec<i32>,
        levels: Vec<String>,
        ordered: bool,
    },
    /// Logical/boolean variable
    Logical(Vec<bool>),
    /// Character variable
    Character(Vec<String>),
}

impl Variable {
    /// Get the length (number of observations) of the variable
    pub fn len(&self) -> usize {
        match self {
            Variable::Numeric(data) => data.len(),
            Variable::Factor { values, .. } => values.len(),
            Variable::Logical(data) => data.len(),
            Variable::Character(data) => data.len(),
        }
    }
}

/// Simplified model frame type
#[derive(Debug, Clone)]
pub struct ModelFrame {
    pub variables: Vec<Variable>,
    pub variable_names: Vec<String>,
    pub row_names: Option<Vec<String>>,
    pub n_rows: usize,
    pub n_cols: usize,
}

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
    /// Terms in the model
    pub terms: Vec<String>,
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
