//! GLM main core module
//!
//! This file contains the core GLM function implementation.

use super::glm_control::glm_control;
use super::glm_fit_core::glm_fit;
use super::types::{GlmControl, GlmResult};
use crate::stats::regression::family::GlmFamily;
use crate::stats::regression::shared::formula_parser::{
    build_design_matrix, parse_formula as parse_formula_shared,
};
use std::collections::HashMap;

/// Main GLM function
///
/// This function fits a generalized linear model via iteratively reweighted least squares.
/// It is the main entry point for GLM fitting.
///
/// # Arguments
///
/// * `formula` - Model formula as string (e.g., "y ~ x1 + x2")
/// * `family` - GLM family object (default: Gaussian with identity link)
/// * `data` - Data frame containing the variables
/// * `weights` - Prior weights (optional)
/// * `subset` - Subset of observations to use (optional)
/// * `na_action` - How to handle missing values (default: "na.omit")
/// * `start` - Starting values for coefficients (optional)
/// * `etastart` - Starting values for linear predictor (optional)
/// * `mustart` - Starting values for fitted values (optional)
/// * `offset` - Offset vector (optional)
/// * `control` - Control parameters for fitting (optional)
/// * `model` - Whether to include model frame in result (default: true)
/// * `method` - Fitting method (default: "glm.fit")
/// * `x` - Whether to include design matrix in result (default: false)
/// * `y` - Whether to include response vector in result (default: true)
/// * `singular_ok` - Whether to allow singular fits (default: true)
/// * `contrasts` - Contrast matrices for factors (optional)
///
/// # Returns
///
/// A `GlmResult` containing the fitted model results.
///
/// # Errors
///
/// Returns an error if fitting fails due to various reasons:
/// - Invalid formula
/// - Invalid family
/// - Data preparation errors
/// - Fitting algorithm failures
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_main::glm;
/// use tidy_ts::stats::regression::family::gaussian::GaussianFamily;
/// use std::collections::HashMap;
///
/// let data = HashMap::new(); // Your data here
/// let family = GaussianFamily::identity();
/// let result = glm(
///     "y ~ x1 + x2".to_string(),
///     Some(Box::new(family)),
///     Some(data),
///     None, None, None, None, None, None, None, None,
///     None, None, None, None, None, None
/// ).unwrap();
/// ```
pub fn glm(
    formula: String,
    family: Option<Box<dyn GlmFamily>>,
    data: Option<HashMap<String, Vec<f64>>>,
    weights: Option<Vec<f64>>,
    na_action: Option<String>,
    start: Option<Vec<f64>>,
    etastart: Option<Vec<f64>>,
    mustart: Option<Vec<f64>>,
    offset: Option<Vec<f64>>,
    control: Option<GlmControl>,
    model: Option<bool>,
    method: Option<String>,
    x: Option<bool>,
    y: Option<bool>,
    singular_ok: Option<bool>,
    contrasts: Option<HashMap<String, String>>,
) -> Result<GlmResult, String> {
    // Set defaults
    let family = family.unwrap_or_else(|| {
        Box::new(crate::stats::regression::family::gaussian::GaussianFamily::identity())
    });
    let na_action = na_action.unwrap_or_else(|| "na.omit".to_string());
    let control = control.unwrap_or_else(|| glm_control(None, None, None).unwrap());
    let _model = model.unwrap_or(true);
    let method = method.unwrap_or_else(|| "glm.fit".to_string());
    let _x = x.unwrap_or(false);
    let y = y.unwrap_or(true);
    let _singular_ok = singular_ok.unwrap_or(true);

    // Validate method
    if method != "glm.fit" {
        return Err("invalid 'method' argument".to_string());
    }

    // For back-compatibility in return result
    let control = if method == "glm.fit" {
        control
    } else {
        control
    };

    // Parse the formula (shared parser)
    let parsed_formula = parse_formula_shared(&formula)?;

    // Build response and design matrix using shared builder
    let (y_vec, x_mat) = if let Some(ref data) = data {
        // Response
        let y_vec = data
            .get(&parsed_formula.response)
            .ok_or_else(|| {
                format!(
                    "Response variable '{}' not found in data",
                    parsed_formula.response
                )
            })?
            .clone();
        let n = y_vec.len();

        // Design matrix (column-major) then reshape to Vec<Vec<f64>> (n x p)
        let (x_col_major, p) = build_design_matrix(data, &parsed_formula.predictors, n)?;
        let mut x_mat: Vec<Vec<f64>> = vec![vec![0.0; p]; n];
        for j in 0..p {
            for i in 0..n {
                x_mat[i][j] = x_col_major[i + j * n];
            }
        }
        (y_vec, x_mat)
    } else {
        return Err("Data must be provided".to_string());
    };

    // Validate weights
    if let Some(ref weights) = weights {
        if weights.iter().any(|&w| w < 0.0) {
            return Err("negative weights not allowed".to_string());
        }
    }

    // Validate offset
    if let Some(ref offset) = offset {
        if offset.len() != y_vec.len() {
            return Err(format!(
                "number of offsets is {} should equal {} (number of observations)",
                offset.len(),
                y_vec.len()
            ));
        }
    }

    // Call glm.fit
    let mut fit = glm_fit(
        x_mat,
        y_vec,
        weights,
        start,
        etastart,
        mustart,
        offset,
        family,
        control,
        parsed_formula.has_intercept, // Use intercept from formula
        Some(parsed_formula.predictors.clone()), // Pass predictor names as column names
    )?;

    // Add additional information to the result
    // fit.model is already set in glm_fit_core
    // fit.x is already set in glm_fit_core
    if !y {
        fit.y = vec![];
    }
    fit.call = format!("glm(formula = {}, family = ..., data = ...)", formula);
    fit.formula = formula;
    // fit.terms is already set in glm_fit_core
    // fit.data is already set in glm_fit_core
    fit.contrasts = contrasts.unwrap_or_default();
    // fit.xlevels is already set in glm_fit_core
    fit.na_action = Some(na_action);

    Ok(fit)
}
