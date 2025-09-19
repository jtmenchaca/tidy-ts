//! WASM bindings for LM functions

#![cfg(feature = "wasm")]

use super::lm_fit::lm;
use super::lm_types::{LmOptions, LmResult};
use crate::stats::regression::shared::formula_parser::{build_design_matrix, parse_formula};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::console;

/// WASM export for LM fitting
///
/// Fits a linear model using the provided formula and data.
///
/// # Arguments
/// * `formula` - Model formula as string (e.g., "y ~ x1 + x2")
/// * `data_json` - JSON string containing the data as an object with column names as keys
/// * `options_json` - JSON string containing optional parameters
///
/// # Returns
/// JSON string containing the fitted LM result
#[wasm_bindgen]
pub fn lm_fit_wasm(formula: &str, data_json: &str, options_json: Option<String>) -> String {
    // Parse data from JSON
    let data = match parse_data_json(data_json) {
        Ok(d) => d,
        Err(e) => {
            return format_error(&e);
        }
    };

    // Parse formula to extract response and predictors
    let parsed_formula = match parse_formula(formula) {
        Ok(pf) => pf,
        Err(e) => {
            return format_error(&e);
        }
    };

    let response_name = parsed_formula.response;
    let predictor_names = parsed_formula.predictors;

    // Get response variable
    let y = match data.get(&response_name) {
        Some(values) => values.clone(),
        None => {
            return format_error(&format!(
                "Response variable '{}' not found in data",
                response_name
            ));
        }
    };

    let n = y.len();
    let ny = 1; // For now, assume univariate response

    // Build design matrix
    let (x, p) = match build_design_matrix(&data, &predictor_names, n) {
        Ok((x_matrix, num_predictors)) => (x_matrix, num_predictors),
        Err(e) => return format_error(&e),
    };

    // Parse options if provided
    let options = if let Some(ref opts_json) = options_json {
        match parse_options_json(opts_json) {
            Ok(opts) => Some(opts),
            Err(e) => return format_error(&e),
        }
    } else {
        None
    };

    // Fit the model
    match lm(&x, &y, n, p, ny, options) {
        Ok(result) => format_lm_result(&result, formula),
        Err(e) => format_error(e),
    }
}

/// Parse data from JSON string into HashMap
fn parse_data_json(json: &str) -> Result<HashMap<String, Vec<f64>>, String> {
    // Use serde_json for robust parsing
    match serde_json::from_str::<HashMap<String, Vec<f64>>>(json) {
        Ok(data) => Ok(data),
        Err(e) => Err(format!("Failed to parse data JSON: {}", e)),
    }
}

/// Parse options from JSON string
fn parse_options_json(json: &str) -> Result<LmOptions, String> {
    // Parse JSON to extract options
    match serde_json::from_str::<serde_json::Value>(json) {
        Ok(value) => {
            let mut options = LmOptions::default();

            // Parse weights if present
            if let Some(weights_value) = value.get("weights") {
                if let Some(weights_array) = weights_value.as_array() {
                    let weights: Result<Vec<f64>, _> = weights_array
                        .iter()
                        .map(|v| v.as_f64().ok_or_else(|| "Invalid weight value".to_string()))
                        .collect();
                    options.weights = Some(weights?);
                }
            }

            // Parse other options
            if let Some(qr_value) = value.get("qr") {
                options.qr = qr_value.as_bool().unwrap_or(false);
            }

            if let Some(singular_ok) = value.get("singular_ok") {
                options.singular_ok = singular_ok.as_bool().unwrap_or(true);
            }

            // Note: tol is not a field in LmOptions, it's used internally by QR decomposition

            Ok(options)
        }
        Err(e) => Err(format!("Failed to parse options JSON: {}", e)),
    }
}

/// Format LM result as JSON string
fn format_lm_result(result: &LmResult, formula: &str) -> String {
    let mut json = String::new();
    json.push('{');

    // Add coefficients
    json.push_str(r#""coefficients":["#);
    for (i, coef) in result.coefficients.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*coef));
    }
    json.push(']');

    // Add residuals
    json.push_str(r#","residuals":["#);
    for (i, res) in result.residuals.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*res));
    }
    json.push(']');

    // Add fitted values
    json.push_str(r#","fitted_values":["#);
    for (i, fit) in result.fitted_values.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*fit));
    }
    json.push(']');

    // Add effects
    json.push_str(r#","effects":["#);
    for (i, eff) in result.effects.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*eff));
    }
    json.push(']');

    // Add scalar values
    json.push_str(&format!(r#","rank":{}"#, result.rank));
    json.push_str(&format!(r#","df_residual":{}"#, result.df_residual));
    json.push_str(&format!(r#","qr_rank":{}"#, result.qr_rank));
    json.push_str(&format!(r#","tol":{}"#, format_json_number(result.tol)));
    json.push_str(&format!(r#","pivoted":{}"#, result.pivoted));
    json.push_str(&format!(
        r#","deviance":{}"#,
        format_json_number(result.deviance)
    ));

    // Add pivot
    json.push_str(r#","pivot":["#);
    for (i, p) in result.pivot.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&p.to_string());
    }
    json.push(']');

    // Add formula
    json.push_str(&format!(r#","formula":"{}""#, formula));

    // Add method
    json.push_str(r#","method":"lm""#);

    // Calculate R-squared (weighted or unweighted)
    let r_squared = if let Some(ref weights) = result.weights {
        // Weighted R-squared calculation
        let n = result.residuals.len();
        let y_values: Vec<f64> = result
            .residuals
            .iter()
            .zip(result.fitted_values.iter())
            .map(|(r, f)| r + f)
            .collect();

        // Calculate weighted mean
        let sum_weights: f64 = weights.iter().sum();
        let weighted_y_mean = y_values
            .iter()
            .zip(weights.iter())
            .map(|(y, w)| y * w)
            .sum::<f64>()
            / sum_weights;

        // Calculate weighted total sum of squares
        let weighted_ss_tot = y_values
            .iter()
            .zip(weights.iter())
            .map(|(y, w)| w * (y - weighted_y_mean).powi(2))
            .sum::<f64>();

        // Calculate weighted residual sum of squares
        let weighted_ss_res = result
            .residuals
            .iter()
            .zip(weights.iter())
            .map(|(r, w)| w * r.powi(2))
            .sum::<f64>();

        if weighted_ss_tot > 0.0 {
            1.0 - weighted_ss_res / weighted_ss_tot
        } else {
            0.0
        }
    } else {
        // Unweighted R-squared calculation
        let y_mean = result
            .residuals
            .iter()
            .zip(result.fitted_values.iter())
            .map(|(r, f)| r + f)
            .sum::<f64>()
            / result.residuals.len() as f64;

        let ss_tot = result
            .residuals
            .iter()
            .zip(result.fitted_values.iter())
            .map(|(r, f)| {
                let y = r + f;
                (y - y_mean).powi(2)
            })
            .sum::<f64>();

        let ss_res = result.residuals.iter().map(|r| r.powi(2)).sum::<f64>();
        if ss_tot > 0.0 {
            1.0 - ss_res / ss_tot
        } else {
            0.0
        }
    };

    json.push_str(&format!(
        r#","r_squared":{}"#,
        format_json_number(r_squared)
    ));

    // Add adjusted R-squared
    let n = result.residuals.len() as f64;
    let p = result.rank as f64;
    let adj_r_squared = if n > p && p > 1.0 {
        1.0 - (1.0 - r_squared) * (n - 1.0) / (n - p)
    } else {
        r_squared
    };
    json.push_str(&format!(
        r#","adj_r_squared":{}"#,
        format_json_number(adj_r_squared)
    ));

    json.push('}');
    json
}

/// Format an error message as JSON
fn format_error(error: &str) -> String {
    format!(r#"{{"error":"{}"}}"#, error.replace('"', r#"\""#))
}

/// Safe JSON number formatting to handle inf/NaN
fn format_json_number(value: f64) -> String {
    if value.is_infinite() {
        if value.is_sign_positive() {
            "1e308".to_string()
        } else {
            "-1e308".to_string()
        }
    } else if value.is_nan() {
        "null".to_string()
    } else {
        value.to_string()
    }
}

/// Simplified LM fit for testing
/// Takes vectors directly instead of JSON
#[wasm_bindgen]
pub fn lm_fit_simple_wasm(y: &[f64], x: &[f64], n_predictors: usize) -> String {
    let n = y.len();
    let ny = 1;

    // Check dimensions
    if x.len() != n * n_predictors {
        return format_error("Mismatch between x dimensions and y length");
    }

    // Fit model
    match lm(x, y, n, n_predictors, ny, None) {
        Ok(result) => {
            let formula = if n_predictors == 1 {
                "y ~ 1".to_string()
            } else {
                let mut f = "y ~ ".to_string();
                for i in 1..n_predictors {
                    if i > 1 {
                        f.push_str(" + ");
                    }
                    f.push_str(&format!("x{}", i));
                }
                f
            };
            format_lm_result(&result, &formula)
        }
        Err(e) => format_error(e),
    }
}
