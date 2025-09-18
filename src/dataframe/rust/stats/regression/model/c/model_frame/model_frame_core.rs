//! Core model frame construction logic

use super::model_frame_types::{ModelFrame, ModelFrameResult, NaAction, Variable};

/// Creates a model frame from variables and names
///
/// This function prepares data for statistical modeling by validating variables,
/// handling missing values, and applying subsetting if specified.
///
/// # Arguments
///
/// * `variables` - Vector of variables to include in the model frame
/// * `variable_names` - Names for the variables
/// * `row_names` - Optional row names
/// * `subset` - Optional subset of rows to include
/// * `na_action` - How to handle missing values
///
/// # Returns
///
/// * `ModelFrameResult` - The created model frame with metadata
///
/// # Errors
///
/// * Returns error if variables have mismatched lengths
/// * Returns error if variable names don't match variable count
/// * Returns error if subset indices are out of bounds
/// * Returns error if missing values are found and na_action is Fail
pub fn create_model_frame(
    variables: Vec<Variable>,
    variable_names: Vec<String>,
    row_names: Option<Vec<String>>,
    subset: Option<Vec<usize>>,
    na_action: NaAction,
) -> Result<ModelFrameResult, &'static str> {
    // Validate inputs
    if variables.is_empty() {
        return Err("No variables provided");
    }

    if variables.len() != variable_names.len() {
        return Err("Number of variables does not match number of variable names");
    }

    // Check that all variables have the same length
    let n_obs = get_variable_length(&variables[0])?;
    for (_i, variable) in variables.iter().enumerate() {
        let var_length = get_variable_length(variable)?;
        if var_length != n_obs {
            return Err("All variables must have the same length");
        }
    }

    // Validate row names if provided
    if let Some(ref names) = row_names {
        if names.len() != n_obs {
            return Err("Number of row names does not match number of observations");
        }
    }

    // Apply subsetting if specified
    let (subset_variables, subset_row_names, subset_indices) = if let Some(subset) = subset {
        apply_subset(variables, row_names, subset, n_obs)?
    } else {
        (variables, row_names, (0..n_obs).collect::<Vec<usize>>())
    };

    // Handle missing values
    let (final_variables, final_row_names, removed_rows, n_missing, has_missing) =
        handle_missing_values(
            subset_variables,
            subset_row_names,
            subset_indices,
            &na_action,
        )?;

    // Get dimensions before moving final_variables
    let n_rows = if final_variables.is_empty() {
        0
    } else {
        final_variables[0].len()
    };
    let n_cols = final_variables.len();

    // Create the model frame
    let model_frame = ModelFrame {
        variables: final_variables,
        variable_names,
        row_names: final_row_names,
        n_rows,
        n_cols,
    };

    Ok(ModelFrameResult {
        frame: model_frame,
        removed_rows,
        n_missing,
        has_missing,
    })
}

/// Get the length of a variable
fn get_variable_length(variable: &Variable) -> Result<usize, &'static str> {
    match variable {
        Variable::Numeric(values) => Ok(values.len()),
        Variable::Factor { values, .. } => Ok(values.len()),
        Variable::Logical(values) => Ok(values.len()),
        Variable::Character(values) => Ok(values.len()),
    }
}

/// Apply subsetting to variables and row names
fn apply_subset(
    variables: Vec<Variable>,
    row_names: Option<Vec<String>>,
    subset: Vec<usize>,
    n_obs: usize,
) -> Result<(Vec<Variable>, Option<Vec<String>>, Vec<usize>), &'static str> {
    // Validate subset indices
    for &idx in &subset {
        if idx >= n_obs {
            return Err("Subset index out of bounds");
        }
    }

    // Apply subset to variables
    let mut subset_variables = Vec::new();
    for variable in variables {
        let subset_variable = match variable {
            Variable::Numeric(values) => {
                Variable::Numeric(subset.iter().map(|&i| values[i]).collect())
            }
            Variable::Factor {
                values,
                levels,
                ordered,
            } => Variable::Factor {
                values: subset.iter().map(|&i| values[i]).collect(),
                levels,
                ordered,
            },
            Variable::Logical(values) => {
                Variable::Logical(subset.iter().map(|&i| values[i]).collect())
            }
            Variable::Character(values) => {
                Variable::Character(subset.iter().map(|&i| values[i].clone()).collect())
            }
        };
        subset_variables.push(subset_variable);
    }

    // Apply subset to row names
    let subset_row_names = if let Some(names) = row_names {
        Some(subset.iter().map(|&i| names[i].clone()).collect())
    } else {
        None
    };

    Ok((subset_variables, subset_row_names, subset))
}

/// Handle missing values according to na_action
fn handle_missing_values(
    variables: Vec<Variable>,
    row_names: Option<Vec<String>>,
    subset_indices: Vec<usize>,
    na_action: &NaAction,
) -> Result<(Vec<Variable>, Option<Vec<String>>, Vec<usize>, usize, bool), &'static str> {
    let n_obs = get_variable_length(&variables[0])?;
    let mut missing_rows = Vec::new();
    let mut n_missing = 0;

    // Find rows with missing values
    for row_idx in 0..n_obs {
        let mut has_missing = false;
        let mut row_missing_count = 0;

        for variable in &variables {
            match variable {
                Variable::Numeric(values) => {
                    if values[row_idx].is_nan() || values[row_idx].is_infinite() {
                        has_missing = true;
                        row_missing_count += 1;
                    }
                }
                Variable::Factor { values, .. } => {
                    if values[row_idx] <= 0 {
                        has_missing = true;
                        row_missing_count += 1;
                    }
                }
                Variable::Logical(_) => {
                    // Logical values are never missing
                }
                Variable::Character(values) => {
                    if values[row_idx].is_empty() {
                        has_missing = true;
                        row_missing_count += 1;
                    }
                }
            }
        }

        if has_missing {
            missing_rows.push(row_idx);
            n_missing += row_missing_count;
        }
    }

    let has_missing = !missing_rows.is_empty();

    // Handle missing values according to na_action
    match na_action {
        NaAction::Fail => {
            if has_missing {
                return Err("Missing values found and na_action is Fail");
            }
            Ok((variables, row_names, Vec::new(), n_missing, has_missing))
        }
        NaAction::Omit => {
            if missing_rows.is_empty() {
                Ok((variables, row_names, Vec::new(), n_missing, has_missing))
            } else {
                // Remove rows with missing values
                let keep_rows: Vec<usize> =
                    (0..n_obs).filter(|&i| !missing_rows.contains(&i)).collect();

                let mut filtered_variables = Vec::new();
                for variable in variables {
                    let filtered_variable = match variable {
                        Variable::Numeric(values) => {
                            Variable::Numeric(keep_rows.iter().map(|&i| values[i]).collect())
                        }
                        Variable::Factor {
                            values,
                            levels,
                            ordered,
                        } => Variable::Factor {
                            values: keep_rows.iter().map(|&i| values[i]).collect(),
                            levels,
                            ordered,
                        },
                        Variable::Logical(values) => {
                            Variable::Logical(keep_rows.iter().map(|&i| values[i]).collect())
                        }
                        Variable::Character(values) => Variable::Character(
                            keep_rows.iter().map(|&i| values[i].clone()).collect(),
                        ),
                    };
                    filtered_variables.push(filtered_variable);
                }

                let filtered_row_names = if let Some(names) = row_names {
                    Some(keep_rows.iter().map(|&i| names[i].clone()).collect())
                } else {
                    None
                };

                let removed_rows: Vec<usize> =
                    missing_rows.iter().map(|&i| subset_indices[i]).collect();

                Ok((
                    filtered_variables,
                    filtered_row_names,
                    removed_rows,
                    n_missing,
                    has_missing,
                ))
            }
        }
        NaAction::Pass => Ok((variables, row_names, Vec::new(), n_missing, has_missing)),
    }
}
