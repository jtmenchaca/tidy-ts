//! Model component extraction functions

use super::model_utilities_types::{ModelObject, TermsObject};
use crate::stats::regression::{ModelFrame, Variable};
use std::collections::HashMap;

/// Extract model weights
pub fn model_weights(model: &ModelObject) -> Option<Vec<f64>> {
    model.weights.clone()
}

/// Extract model offset
pub fn model_offset(model: &ModelObject) -> Option<Vec<f64>> {
    model.offset.clone()
}

/// Extract model response variable
pub fn model_response(
    model: &ModelObject,
    terms: &TermsObject,
) -> Result<Option<Variable>, &'static str> {
    if let Some(response_idx) = terms.response {
        if response_idx < model.model_frame.variables.len() {
            Ok(Some(model.model_frame.variables[response_idx].clone()))
        } else {
            Err("Response index out of bounds")
        }
    } else {
        Ok(None)
    }
}

/// Generic model component extraction
pub fn model_extract(
    model: &ModelObject,
    component: &str,
) -> Result<Option<String>, &'static str> {
    match component {
        "weights" => {
            if let Some(weights) = &model.weights {
                Ok(Some(format!("{:?}", weights)))
            } else {
                Ok(None)
            }
        }
        "offset" => {
            if let Some(offset) = &model.offset {
                Ok(Some(format!("{:?}", offset)))
            } else {
                Ok(None)
            }
        }
        "response" => {
            if let Some(response) = &model.response {
                Ok(Some(format!("{:?}", response)))
            } else {
                Ok(None)
            }
        }
        "terms" => {
            if let Some(terms) = &model.terms {
                Ok(Some(format!("{:?}", terms)))
            } else {
                Ok(None)
            }
        }
        "model_frame" => {
            Ok(Some(format!("{:?}", model.model_frame)))
        }
        _ => Err("Unknown component")
    }
}

/// Check if model is empty
pub fn is_empty_model(model: &ModelObject) -> bool {
    if let Some(terms) = &model.terms {
        terms.variables.is_empty() && !terms.intercept
    } else {
        model.model_frame.variables.is_empty()
    }
}

/// Get all variables from formula
pub fn get_all_vars(formula: &str, _data: Option<&ModelFrame>) -> Result<Vec<String>, &'static str> {
    // Parse formula to extract variable names
    let mut variables = Vec::new();
    
    // Simple parsing - in practice would use proper formula parser
    let parts: Vec<&str> = formula.split("~").collect();
    if parts.len() != 2 {
        return Err("Invalid formula format");
    }
    
    let rhs = parts[1].trim();
    let terms: Vec<&str> = rhs.split('+').map(|s| s.trim()).collect();
    
    for term in terms {
        if !term.is_empty() && term != "1" {
            variables.push(term.to_string());
        }
    }
    
    // Add response variable if present
    let lhs = parts[0].trim();
    if !lhs.is_empty() {
        variables.insert(0, lhs.to_string());
    }
    
    Ok(variables)
}

/// Get factor levels from terms and model frame
pub fn get_xlevels(terms: &TermsObject, model_frame: &ModelFrame) -> HashMap<String, Vec<String>> {
    let mut xlevels = HashMap::new();
    
    for factor in &terms.factors {
        if let Some(var_idx) = model_frame.variable_names.iter().position(|n| n == &factor.name) {
            if let Variable::Factor { levels, .. } = &model_frame.variables[var_idx] {
                xlevels.insert(factor.name.clone(), levels.clone());
            }
        }
    }
    
    xlevels
}

/// Make predict call for variable
pub fn make_predict_call(var: &Variable, call: &str) -> Result<String, &'static str> {
    match var {
        Variable::Numeric(_) => Ok(format!("predict({})", call)),
        Variable::Factor { .. } => Ok(format!("predict({}, type='class')", call)),
        Variable::Logical(_) => Ok(format!("predict({}, type='response')", call)),
        Variable::Character(_) => Ok(format!("predict({}, type='class')", call)),
    }
}

/// Make default predict call
pub fn make_predict_call_default(var: &Variable, call: &str) -> Result<String, &'static str> {
    make_predict_call(var, call)
}
