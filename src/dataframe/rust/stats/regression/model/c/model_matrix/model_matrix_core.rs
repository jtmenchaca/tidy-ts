//! Core model matrix construction logic

use super::model_matrix_types::{ModelMatrix, ModelMatrixResult};
use crate::stats::regression::contrasts::ContrastMatrix;
use crate::stats::regression::{ModelFrame, Term, Terms, Variable};

/// Creates a model matrix from terms and model frame
///
/// This function constructs the design matrix by applying contrasts to factors
/// and combining all predictor variables according to the model formula.
///
/// # Arguments
///
/// * `terms` - Parsed model formula terms
/// * `model_frame` - Prepared model frame with variables
/// * `contrasts` - Contrast specifications for factors
///
/// # Returns
///
/// * `ModelMatrixResult` - The constructed design matrix with metadata
///
/// # Errors
///
/// * Returns error if variables are missing or incompatible
/// * Returns error if contrast matrices are invalid
pub fn create_model_matrix(
    terms: &Terms,
    model_frame: &ModelFrame,
    contrasts: &[Option<ContrastMatrix>],
) -> Result<ModelMatrixResult, &'static str> {
    if model_frame.variables.is_empty() {
        return Err("Empty model frame");
    }

    let n_rows = model_frame.n_rows;
    let mut matrix_data = Vec::new();
    let mut column_names = Vec::new();
    let mut term_assignments = Vec::new();
    let mut columns_per_term = Vec::new();
    let mut used_contrasts = Vec::new();

    // Process each term
    for (term_idx, term) in terms.terms.iter().enumerate() {
        let mut term_columns = 0;
        let mut term_contrasts = Vec::new();

        // Handle intercept term
        if term.variables.is_empty() && terms.intercept {
            // Add intercept column
            matrix_data.extend(vec![1.0; n_rows]);
            column_names.push("(Intercept)".to_string());
            term_assignments.push(term_idx as i32);
            term_columns += 1;
        } else {
            // Process variables in this term
            for var_name in &term.variables {
                if let Some(var_idx) = model_frame.variable_names.iter().position(|n| n == var_name) {
                    let variable = &model_frame.variables[var_idx];
                    let contrast = if var_idx < contrasts.len() {
                        contrasts[var_idx].clone()
                    } else {
                        None
                    };

                    match variable {
                        Variable::Numeric(values) => {
                            // Numeric variable - add as-is
                            matrix_data.extend(values.clone());
                            column_names.push(var_name.clone());
                            term_assignments.push(term_idx as i32);
                            term_columns += 1;
                        }
                        Variable::Logical(values) => {
                            // Logical variable - convert to numeric
                            let numeric_values: Vec<f64> = values.iter().map(|&b| if b { 1.0 } else { 0.0 }).collect();
                            matrix_data.extend(numeric_values);
                            column_names.push(var_name.clone());
                            term_assignments.push(term_idx as i32);
                            term_columns += 1;
                        }
                        Variable::Factor { values, levels, .. } => {
                            // Factor variable - apply contrasts
                            if let Some(contrast_matrix) = contrast {
                                let factor_columns = apply_factor_contrasts(
                                    values, levels, &contrast_matrix, n_rows, &mut matrix_data, &mut column_names, &mut term_assignments, term_idx
                                )?;
                                term_columns += factor_columns;
                                term_contrasts.push(Some(contrast_matrix));
                            } else {
                                // Default treatment contrasts
                                let factor_columns = apply_default_contrasts(
                                    values, levels, n_rows, &mut matrix_data, &mut column_names, &mut term_assignments, term_idx
                                )?;
                                term_columns += factor_columns;
                                term_contrasts.push(None);
                            }
                        }
                        Variable::Character(_) => {
                            return Err("Character variables must be converted to factors first");
                        }
                    }
                } else {
                    return Err("Variable not found in model frame");
                }
            }
        }

        columns_per_term.push(term_columns);
        used_contrasts.push(term_contrasts);
    }

    // Flatten contrasts
    let mut flat_contrasts = Vec::new();
    for term_contrasts in used_contrasts {
        flat_contrasts.extend(term_contrasts);
    }

    Ok(ModelMatrixResult {
        matrix: ModelMatrix {
            matrix: matrix_data,
            n_rows,
            n_cols: column_names.len(),
            column_names,
            term_assignments,
            row_names: model_frame.row_names.clone(),
        },
        columns_per_term,
        contrasts: flat_contrasts,
    })
}

/// Apply contrast matrix to factor variable
fn apply_factor_contrasts(
    values: &[i32],
    levels: &[String],
    contrast_matrix: &ContrastMatrix,
    n_rows: usize,
    matrix_data: &mut Vec<f64>,
    column_names: &mut Vec<String>,
    term_assignments: &mut Vec<i32>,
    term_idx: usize,
) -> Result<usize, &'static str> {
    let n_levels = levels.len();
    let n_contrasts = contrast_matrix.matrix.len() / n_levels;
    let mut columns_added = 0;

    // Apply each contrast
    for contrast_idx in 0..n_contrasts {
        let mut contrast_values = vec![0.0; n_rows];
        
        for (row_idx, &factor_value) in values.iter().enumerate() {
            if factor_value > 0 && factor_value <= n_levels as i32 {
                let level_idx = (factor_value - 1) as usize;
                let contrast_coeff = contrast_matrix.matrix[level_idx * n_contrasts + contrast_idx];
                contrast_values[row_idx] = contrast_coeff;
            }
        }

        matrix_data.extend(contrast_values);
        column_names.push(format!("{}{}", levels[0], contrast_idx + 1));
        term_assignments.push(term_idx as i32);
        columns_added += 1;
    }

    Ok(columns_added)
}

/// Apply default treatment contrasts to factor variable
fn apply_default_contrasts(
    values: &[i32],
    levels: &[String],
    n_rows: usize,
    matrix_data: &mut Vec<f64>,
    column_names: &mut Vec<String>,
    term_assignments: &mut Vec<i32>,
    term_idx: usize,
) -> Result<usize, &'static str> {
    let n_levels = levels.len();
    let mut columns_added = 0;

    // Create treatment contrasts (reference level is first level)
    for level_idx in 1..n_levels {
        let mut contrast_values = vec![0.0; n_rows];
        
        for (row_idx, &factor_value) in values.iter().enumerate() {
            if factor_value == (level_idx + 1) as i32 {
                contrast_values[row_idx] = 1.0;
            }
        }

        matrix_data.extend(contrast_values);
        column_names.push(levels[level_idx].clone());
        term_assignments.push(term_idx as i32);
        columns_added += 1;
    }

    Ok(columns_added)
}
