//! Model validation and utility functions

use super::model_utilities_types::{ModelObject, TermsObject, Variable};
use std::collections::HashMap;

/// Check if model is empty
pub fn is_empty_model(terms: &Option<TermsObject>) -> bool {
    match terms {
        Some(t) => t.terms.is_empty(),
        None => true,
    }
}

/// Validate model object
pub fn validate_model_object(model: &ModelObject) -> Result<(), &'static str> {
    // Check model frame
    if model.model_frame.variables.len() != model.model_frame.variable_names.len() {
        return Err("Number of variables does not match number of variable names");
    }
    
    // Check weights if present
    if let Some(weights) = &model.weights {
        if weights.is_empty() {
            return Err("Weights cannot be empty");
        }
        if weights.iter().any(|&w| w < 0.0) {
            return Err("Weights must be non-negative");
        }
    }
    
    // Check offset if present
    if let Some(offset) = &model.offset {
        if offset.is_empty() {
            return Err("Offset cannot be empty");
        }
    }
    
    // Check terms if present
    if let Some(terms) = &model.terms {
        validate_terms_object(terms)?;
    }
    
    Ok(())
}

/// Validate terms object
pub fn validate_terms_object(terms: &TermsObject) -> Result<(), &'static str> {
    // Check response index if present
    if let Some(response_idx) = terms.response {
        if response_idx >= terms.variables.len() {
            return Err("Response index out of bounds");
        }
    }
    
    // Check factors
    for factor in &terms.factors {
        if factor.name.is_empty() {
            return Err("Factor name cannot be empty");
        }
        if factor.levels.is_empty() {
            return Err("Factor levels cannot be empty");
        }
    }
    
    Ok(())
}

/// Check if model has weights
pub fn has_weights(model: &ModelObject) -> bool {
    model.weights.is_some()
}

/// Check if model has offset
pub fn has_offset(model: &ModelObject) -> bool {
    model.offset.is_some()
}

/// Check if model has response
pub fn has_response(model: &ModelObject) -> bool {
    model.response.is_some()
}

/// Get model dimensions
pub fn get_model_dimensions(model: &ModelObject) -> (usize, usize) {
    (model.model_frame.n_rows, model.model_frame.n_cols)
}

/// Get number of observations
pub fn get_nobs(model: &ModelObject) -> usize {
    model.model_frame.n_rows
}

/// Get number of variables
pub fn get_nvars(model: &ModelObject) -> usize {
    model.model_frame.n_cols
}

/// Get variable names
pub fn get_variable_names(model: &ModelObject) -> &[String] {
    &model.model_frame.variable_names
}

/// Get row names if available
pub fn get_row_names(model: &ModelObject) -> Option<&[String]> {
    model.model_frame.row_names.as_deref()
}

/// Check if model is complete (no missing values)
pub fn is_complete_model(model: &ModelObject) -> bool {
    for variable in &model.model_frame.variables {
        match variable {
            Variable::Numeric(values) => {
                if values.iter().any(|&v| v.is_nan() || v.is_infinite()) {
                    return false;
                }
            }
            Variable::Logical(_values) => {
                // Logical values are always complete
            }
            Variable::Factor { values, .. } => {
                if values.iter().any(|&v| v <= 0) {
                    return false;
                }
            }
            Variable::Character(values) => {
                if values.iter().any(|v| v.is_empty()) {
                    return false;
                }
            }
        }
    }
    true
}

/// Get model summary information
pub fn get_model_summary(model: &ModelObject) -> HashMap<String, String> {
    let mut summary = HashMap::new();
    
    summary.insert("n_obs".to_string(), model.model_frame.n_rows.to_string());
    summary.insert("n_vars".to_string(), model.model_frame.n_cols.to_string());
    summary.insert("has_weights".to_string(), has_weights(model).to_string());
    summary.insert("has_offset".to_string(), has_offset(model).to_string());
    summary.insert("has_response".to_string(), has_response(model).to_string());
    summary.insert("is_complete".to_string(), is_complete_model(model).to_string());
    summary.insert("is_empty".to_string(), is_empty_model(&model.terms).to_string());
    
    summary
}
