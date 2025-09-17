//! Formula parser design matrix functionality
//!
//! This file contains design matrix creation functions.

use super::formula_parser_core::ParsedFormula;
use std::collections::HashMap;

/// Create a design matrix from data and formula
///
/// This function creates a design matrix based on the parsed formula and data.
///
/// # Arguments
///
/// * `formula` - Parsed formula
/// * `data` - Data containing the variables
///
/// # Returns
///
/// A tuple containing (design_matrix, response_vector, variable_names).
///
/// # Errors
///
/// Returns an error if the design matrix cannot be created.
pub fn create_design_matrix(
    formula: &ParsedFormula,
    data: &HashMap<String, Vec<f64>>,
) -> Result<(Vec<Vec<f64>>, Vec<f64>, Vec<String>), String> {
    // Get response variable
    let response = data
        .get(&formula.response)
        .ok_or_else(|| format!("Response variable '{}' not found in data", formula.response))?;

    let n = response.len();
    if n == 0 {
        return Err("No observations in data".to_string());
    }

    // Create design matrix
    let mut design_matrix = Vec::new();
    let mut variable_names = Vec::new();

    // Add intercept if present
    if formula.has_intercept {
        design_matrix.push(vec![1.0; n]);
        variable_names.push("(Intercept)".to_string());
    }

    // Add predictor variables
    for predictor in &formula.predictors {
        if predictor == "(Intercept)" {
            continue; // Already added
        }

        let values = data
            .get(predictor)
            .ok_or_else(|| format!("Predictor variable '{}' not found in data", predictor))?;

        if values.len() != n {
            return Err(format!(
                "Predictor variable '{}' has {} observations, expected {}",
                predictor,
                values.len(),
                n
            ));
        }

        design_matrix.push(values.clone());
        variable_names.push(predictor.clone());
    }

    // Transpose the design matrix to get the correct shape (n x p)
    let p = design_matrix.len();
    let mut x = vec![vec![0.0; p]; n];

    for i in 0..n {
        for j in 0..p {
            x[i][j] = design_matrix[j][i];
        }
    }

    Ok((x, response.clone(), variable_names))
}
