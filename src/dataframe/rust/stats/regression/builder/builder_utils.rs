//! Model builder utility functions

use crate::stats::regression::model::c::formula::parse_formula;
use crate::stats::regression::model::c::model_frame::create_model_frame;
use crate::stats::regression::model::c::model_matrix::{ModelMatrixResult, create_model_matrix};
use crate::stats::regression::contrasts::create_contrasts;
use crate::stats::regression::contrasts::{ContrastMatrix, ContrastType};
use crate::stats::regression::model::{ModelFrame, ModelMatrix, NaAction, Terms, Variable};
use crate::stats::regression::ModelBuilder;

/// Quick function to create a model matrix without using the builder
///
/// This is a convenience function for simple cases where you don't need
/// the full flexibility of the ModelBuilder.
pub fn quick_model_matrix(
    formula: &str,
    variables: Vec<Variable>,
    variable_names: Vec<String>,
    contrasts: Option<Vec<ContrastType>>,
) -> Result<ModelMatrixResult, &'static str> {
    let mut builder = ModelBuilder::new(formula).data(variables, variable_names);
    
    if let Some(contrasts) = contrasts {
        builder = builder.contrasts(contrasts);
    }
    
    builder.build()
}

/// Extract the response variable from a model matrix and model frame
pub fn extract_response(
    model_matrix: &ModelMatrix,
    model_frame: &ModelFrame,
    terms: &Terms,
) -> Result<Variable, &'static str> {
    if !terms.response {
        return Err("No response variable in formula");
    }

    // Find the response variable (first variable in the formula)
    if terms.variables.is_empty() {
        return Err("No variables in formula");
    }

    let response_name = &terms.variables[0];
    if let Some(var_idx) = model_frame.variable_names.iter().position(|n| n == response_name) {
        Ok(model_frame.variables[var_idx].clone())
    } else {
        Err("Response variable not found in model frame")
    }
}

/// Extract predictor variables from a model matrix and model frame
pub fn extract_predictors(
    model_matrix: &ModelMatrix,
    model_frame: &ModelFrame,
    terms: &Terms,
) -> Result<Vec<Variable>, &'static str> {
    let mut predictors = Vec::new();
    
    // Get predictor variable names (exclude response if present)
    let predictor_names = if terms.response && !terms.variables.is_empty() {
        &terms.variables[1..]
    } else {
        &terms.variables
    };

    for var_name in predictor_names {
        if let Some(var_idx) = model_frame.variable_names.iter().position(|n| n == var_name) {
            predictors.push(model_frame.variables[var_idx].clone());
        }
    }

    Ok(predictors)
}

/// Validate a model matrix for common issues
pub fn validate_model_matrix(model_matrix: &ModelMatrix) -> Result<(), &'static str> {
    // Check dimensions
    if model_matrix.n_rows == 0 || model_matrix.n_cols == 0 {
        return Err("Model matrix has zero dimensions");
    }

    // Check matrix size matches dimensions
    let expected_size = model_matrix.n_rows * model_matrix.n_cols;
    if model_matrix.matrix.len() != expected_size {
        return Err("Matrix size does not match dimensions");
    }

    // Check for NaN or infinite values
    for &value in &model_matrix.matrix {
        if value.is_nan() {
            return Err("Model matrix contains NaN values");
        }
        if value.is_infinite() {
            return Err("Model matrix contains infinite values");
        }
    }

    // Check column names length
    if model_matrix.column_names.len() != model_matrix.n_cols {
        return Err("Number of column names does not match number of columns");
    }

    // Check term assignments length
    if model_matrix.term_assignments.len() != model_matrix.n_cols {
        return Err("Number of term assignments does not match number of columns");
    }

    // Check row names if provided
    if let Some(ref row_names) = model_matrix.row_names {
        if row_names.len() != model_matrix.n_rows {
            return Err("Number of row names does not match number of rows");
        }
    }

    Ok(())
}
