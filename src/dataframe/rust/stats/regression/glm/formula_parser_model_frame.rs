//! Formula parser model frame functionality
//!
//! This file contains model frame creation functions.

use super::formula_parser_core::ParsedFormula;
use super::formula_parser_matrix::create_design_matrix;
use std::collections::HashMap;

/// Model frame structure
#[derive(Debug, Clone)]
pub struct ModelFrame {
    /// Variables in the model
    pub variables: HashMap<String, Vec<f64>>,
    /// Terms string
    pub terms: Option<String>,
    /// NA action
    pub na_action: String,
    /// Weights
    pub weights: Option<Vec<f64>>,
    /// Offset
    pub offset: Option<Vec<f64>>,
    /// Response variable name
    pub response_name: Option<String>,
    /// Predictor variable names
    pub predictor_names: Option<Vec<String>>,
}

/// Create a simple model frame
///
/// This function creates a basic model frame from data and formula.
///
/// # Arguments
///
/// * `formula` - Parsed formula
/// * `data` - Data containing the variables
/// * `weights` - Optional weights
/// * `offset` - Optional offset
///
/// # Returns
///
/// A `ModelFrame` containing the model information.
pub fn create_model_frame(
    formula: &ParsedFormula,
    data: &HashMap<String, Vec<f64>>,
    weights: Option<Vec<f64>>,
    offset: Option<Vec<f64>>,
) -> Result<ModelFrame, String> {
    let (x, y, variable_names) = create_design_matrix(formula, data)?;

    let mut variables = HashMap::new();
    variables.insert(formula.response.clone(), y);

    for (i, name) in variable_names.iter().enumerate() {
        if name != "(Intercept)" {
            let values: Vec<f64> = x.iter().map(|row| row[i]).collect();
            variables.insert(name.clone(), values);
        }
    }

    Ok(ModelFrame {
        variables,
        terms: Some(formula.formula.clone()),
        na_action: "na.omit".to_string(),
        weights,
        offset,
        response_name: Some(formula.response.clone()),
        predictor_names: Some(formula.predictors.clone()),
    })
}
