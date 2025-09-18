//! Model frame expansion
//!
//! This module provides functionality equivalent to R's `expand.model.frame()` function,
//! which expands a model frame to include additional variables.

use crate::stats::regression::model::c::{
    formula::formula_utils::formula_variables,
    model_frame::{ModelFrame, ModelFrameResult, NaAction, Variable},
};

/// Expands a model frame to include additional variables
///
/// This is equivalent to R's `expand.model.frame()` function.
///
/// # Arguments
///
/// * `model_frame` - The original model frame
/// * `extras` - Additional variables to include
/// * `na_expand` - Whether to expand missing values
///
/// # Returns
///
/// An expanded model frame with the additional variables
pub fn expand_model_frame(
    model_frame: &ModelFrame,
    extras: Vec<(String, Variable)>,
    na_expand: bool,
) -> Result<ModelFrameResult, &'static str> {
    let mut new_variables = model_frame.variables.clone();
    let mut new_variable_names = model_frame.variable_names.clone();

    // Add the extra variables
    for (name, variable) in extras.iter() {
        // Check if variable already exists
        if new_variable_names.contains(&name) {
            return Err("variable already exists in model frame");
        }

        // Check length compatibility
        if get_variable_length(&variable) != model_frame.n_rows {
            return Err("extra variable has incompatible length");
        }

        new_variables.push(variable.clone());
        new_variable_names.push(name.clone());
    }

    // Create new model frame
    let expanded_frame = ModelFrame {
        variables: new_variables,
        variable_names: new_variable_names,
        row_names: model_frame.row_names.clone(),
        n_rows: model_frame.n_rows,
        n_cols: model_frame.n_cols + extras.len(),
    };

    // Apply NA action if needed
    let result = if na_expand {
        // Keep all rows, including those with missing values
        ModelFrameResult {
            frame: expanded_frame,
            removed_rows: Vec::new(),
            n_missing: 0,
            has_missing: false,
        }
    } else {
        // Apply the same NA action as the original model frame
        // For now, we'll assume the original frame was already processed
        ModelFrameResult {
            frame: expanded_frame,
            removed_rows: Vec::new(),
            n_missing: 0,
            has_missing: false,
        }
    };

    Ok(result)
}

/// Expands a model frame with a formula
///
/// This creates a new model frame based on a formula that may include
/// additional variables not in the original frame.
pub fn expand_model_frame_formula(
    model_frame: &ModelFrame,
    formula: &str,
    _na_expand: bool,
) -> Result<ModelFrameResult, String> {
    // Parse the formula to get variable names
    let formula = crate::stats::regression::model::c::formula::parse_formula(formula)?;

    // Find variables that are not in the original model frame
    let formula_vars = formula_variables(&formula);
    let missing_vars: Vec<String> = formula_vars
        .iter()
        .filter(|var| !model_frame.variable_names.contains(var))
        .cloned()
        .collect();

    if missing_vars.is_empty() {
        // No new variables needed
        return Ok(ModelFrameResult {
            frame: model_frame.clone(),
            removed_rows: Vec::new(),
            n_missing: 0,
            has_missing: false,
        });
    }

    // For now, we can't create variables from thin air
    // In a full implementation, this would need access to the original data
    Err("cannot expand model frame with variables not in original data".to_string())
}

/// Gets the length of a variable
fn get_variable_length(var: &Variable) -> usize {
    match var {
        Variable::Numeric(values) => values.len(),
        Variable::Factor { values, .. } => values.len(),
        Variable::Logical(values) => values.len(),
        Variable::Character(values) => values.len(),
    }
}

/// Updates a model frame with new data
///
/// This is useful when you have new observations for the same variables.
pub fn update_model_frame(
    model_frame: &ModelFrame,
    new_data: Vec<(String, Variable)>,
) -> Result<ModelFrameResult, &'static str> {
    let mut updated_variables = Vec::new();
    let mut updated_variable_names = Vec::new();

    // Process each variable in the original model frame
    for (i, var_name) in model_frame.variable_names.iter().enumerate() {
        // Look for updated data for this variable
        if let Some((_, new_var)) = new_data.iter().find(|(name, _)| name == var_name) {
            // Check length compatibility
            if get_variable_length(new_var) != model_frame.n_rows {
                return Err("updated variable has incompatible length");
            }
            updated_variables.push(new_var.clone());
        } else {
            // Keep original variable
            updated_variables.push(model_frame.variables[i].clone());
        }
        updated_variable_names.push(var_name.clone());
    }

    // Add any new variables
    for (name, variable) in new_data {
        if !updated_variable_names.contains(&name) {
            if get_variable_length(&variable) != model_frame.n_rows {
                return Err("new variable has incompatible length");
            }
            updated_variables.push(variable);
            updated_variable_names.push(name);
        }
    }

    let updated_frame = ModelFrame {
        variables: updated_variables,
        variable_names: updated_variable_names.clone(),
        row_names: model_frame.row_names.clone(),
        n_rows: model_frame.n_rows,
        n_cols: updated_variable_names.len(),
    };

    Ok(ModelFrameResult {
        frame: updated_frame,
        removed_rows: Vec::new(),
        n_missing: 0,
        has_missing: false,
    })
}

/// Subsets a model frame to include only specified variables
///
/// This is useful for creating a smaller model frame with only the variables
/// you need for a particular analysis.
pub fn subset_model_frame(
    model_frame: &ModelFrame,
    variable_names: &[String],
) -> Result<ModelFrameResult, &'static str> {
    let mut subset_variables = Vec::new();
    let mut subset_variable_names = Vec::new();

    for var_name in variable_names {
        if let Some(index) = model_frame
            .variable_names
            .iter()
            .position(|name| name == var_name)
        {
            subset_variables.push(model_frame.variables[index].clone());
            subset_variable_names.push(var_name.clone());
        } else {
            return Err("variable not found in model frame");
        }
    }

    let subset_frame = ModelFrame {
        variables: subset_variables,
        variable_names: subset_variable_names,
        row_names: model_frame.row_names.clone(),
        n_rows: model_frame.n_rows,
        n_cols: variable_names.len(),
    };

    Ok(ModelFrameResult {
        frame: subset_frame,
        removed_rows: Vec::new(),
        n_missing: 0,
        has_missing: false,
    })
}

/// Merges two model frames
///
/// This combines two model frames, handling variable name conflicts.
pub fn merge_model_frames(
    frame1: &ModelFrame,
    frame2: &ModelFrame,
    by: Option<&[String]>,
) -> Result<ModelFrameResult, &'static str> {
    if frame1.n_rows != frame2.n_rows {
        return Err("model frames must have the same number of rows");
    }

    let mut merged_variables = frame1.variables.clone();
    let mut merged_variable_names = frame1.variable_names.clone();

    // Add variables from frame2 that don't exist in frame1
    for (i, var_name) in frame2.variable_names.iter().enumerate() {
        if !merged_variable_names.contains(var_name) {
            merged_variables.push(frame2.variables[i].clone());
            merged_variable_names.push(var_name.clone());
        }
    }

    let merged_frame = ModelFrame {
        variables: merged_variables,
        variable_names: merged_variable_names.clone(),
        row_names: frame1.row_names.clone(),
        n_rows: frame1.n_rows,
        n_cols: merged_variable_names.len(),
    };

    Ok(ModelFrameResult {
        frame: merged_frame,
        removed_rows: Vec::new(),
        n_missing: 0,
        has_missing: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::model::c::model_frame::create_model_frame;

    #[test]
    fn test_expand_model_frame_basic() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
        ];
        let names = vec!["x1".to_string(), "x2".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let extras = vec![("x3".to_string(), Variable::Numeric(vec![7.0, 8.0, 9.0]))];

        let result = expand_model_frame(&model_frame, extras, false).unwrap();

        assert_eq!(result.frame.n_cols, 3);
        assert_eq!(result.frame.variable_names, vec!["x1", "x2", "x3"]);
    }

    #[test]
    fn test_expand_model_frame_multiple_vars() {
        let variables = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names = vec!["x1".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let extras = vec![
            ("x2".to_string(), Variable::Numeric(vec![4.0, 5.0, 6.0])),
            ("x3".to_string(), Variable::Logical(vec![true, false, true])),
        ];

        let result = expand_model_frame(&model_frame, extras, false).unwrap();

        assert_eq!(result.frame.n_cols, 3);
        assert_eq!(result.frame.variable_names, vec!["x1", "x2", "x3"]);
    }

    #[test]
    fn test_expand_model_frame_duplicate_var() {
        let variables = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names = vec!["x1".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let extras = vec![("x1".to_string(), Variable::Numeric(vec![4.0, 5.0, 6.0]))];

        assert!(expand_model_frame(&model_frame, extras, false).is_err());
    }

    #[test]
    fn test_expand_model_frame_wrong_length() {
        let variables = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names = vec!["x1".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let extras = vec![
            ("x2".to_string(), Variable::Numeric(vec![4.0, 5.0])), // Wrong length
        ];

        assert!(expand_model_frame(&model_frame, extras, false).is_err());
    }

    #[test]
    fn test_subset_model_frame() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
            Variable::Numeric(vec![7.0, 8.0, 9.0]),
        ];
        let names = vec!["x1".to_string(), "x2".to_string(), "x3".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let subset_names = vec!["x1".to_string(), "x3".to_string()];
        let result = subset_model_frame(&model_frame, &subset_names).unwrap();

        assert_eq!(result.frame.n_cols, 2);
        assert_eq!(result.frame.variable_names, vec!["x1", "x3"]);
    }

    #[test]
    fn test_subset_model_frame_missing_var() {
        let variables = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names = vec!["x1".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let subset_names = vec!["x1".to_string(), "x2".to_string()];
        assert!(subset_model_frame(&model_frame, &subset_names).is_err());
    }

    #[test]
    fn test_merge_model_frames() {
        let variables1 = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names1 = vec!["x1".to_string()];

        let variables2 = vec![Variable::Numeric(vec![4.0, 5.0, 6.0])];
        let names2 = vec!["x2".to_string()];

        let frame1 = create_model_frame(variables1, names1, None, None, NaAction::Pass)
            .unwrap()
            .frame;
        let frame2 = create_model_frame(variables2, names2, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let result = merge_model_frames(&frame1, &frame2, None).unwrap();

        assert_eq!(result.frame.n_cols, 2);
        assert_eq!(result.frame.variable_names, vec!["x1", "x2"]);
    }

    #[test]
    fn test_merge_model_frames_different_lengths() {
        let variables1 = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names1 = vec!["x1".to_string()];

        let variables2 = vec![
            Variable::Numeric(vec![4.0, 5.0]), // Different length
        ];
        let names2 = vec!["x2".to_string()];

        let frame1 = create_model_frame(variables1, names1, None, None, NaAction::Pass)
            .unwrap()
            .frame;
        let frame2 = create_model_frame(variables2, names2, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        assert!(merge_model_frames(&frame1, &frame2, None).is_err());
    }
}
