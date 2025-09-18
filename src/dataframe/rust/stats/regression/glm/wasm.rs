//! WASM bindings for GLM functions

#![cfg(feature = "wasm")]

use super::glm_main_core::glm;
use super::types::GlmResult;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::console;

/// WASM export for GLM fitting
///
/// Fits a generalized linear model using the provided formula and data.
///
/// # Arguments
/// * `formula` - Model formula as string (e.g., "y ~ x1 + x2")
/// * `family_name` - Name of the family ("gaussian", "binomial", "poisson", etc.)
/// * `link_name` - Name of the link function ("identity", "logit", "log", etc.)
/// * `data_json` - JSON string containing the data as an object with column names as keys
/// * `options_json` - JSON string containing optional parameters
///
/// # Returns
/// JSON string containing the fitted GLM result
#[wasm_bindgen]
pub fn glm_fit_wasm(
    formula: &str,
    family_name: &str,
    link_name: &str,
    data_json: &str,
    options_json: Option<String>,
) -> String {
    console::log_1(&format!("GLM WASM: Starting with formula: {}, family: {}, link: {}", formula, family_name, link_name).into());
    console::log_1(&format!("GLM WASM: Data JSON length: {}", data_json.len()).into());
    
    // Parse data from JSON
    let data = match parse_data_json(data_json) {
        Ok(d) => d,
        Err(e) => {
            console::log_1(&format!("GLM WASM: Error parsing data JSON: {}", e).into());
            return format_error(&e);
        }
    };

    // Create family object
    let family = match create_family(family_name, link_name) {
        Ok(f) => f,
        Err(e) => return format_error(&e),
    };

    // Parse options if provided
    let (weights, na_action, control_params) = if let Some(ref opts) = options_json {
        match parse_options_json(opts) {
            Ok(o) => o,
            Err(e) => return format_error(&e),
        }
    } else {
        (None, None, None)
    };

    // Create control object
    let control = if let Some((epsilon, max_iter, trace)) = control_params {
        match super::glm_control::glm_control(epsilon, max_iter, trace) {
            Ok(c) => Some(c),
            Err(e) => return format_error(&e),
        }
    } else {
        None
    };

    // Fit the model
    match glm(
        formula.to_string(),
        Some(family),
        Some(data),
        weights,
        na_action,
        None, // start
        None, // etastart
        None, // mustart
        None, // offset
        control,
        Some(true),                  // model
        Some("glm.fit".to_string()), // method
        Some(true),                  // x
        Some(true),                  // y
        Some(true),                  // singular_ok
        None,                        // contrasts
    ) {
        Ok(result) => format_glm_result(&result),
        Err(e) => format_error(&e),
    }
}

/// Parse data from JSON string into HashMap
fn parse_data_json(json: &str) -> Result<HashMap<String, Vec<f64>>, String> {
    // Simple JSON parsing for data object
    // Format expected: {"col1": [1,2,3], "col2": [4,5,6]}
    let mut data = HashMap::new();

    // Remove outer braces and whitespace
    let json = json.trim();
    if !json.starts_with('{') || !json.ends_with('}') {
        return Err("Invalid JSON: expected object".to_string());
    }

    let json_inner = &json[1..json.len() - 1];

    // Split by columns (naive approach, works for simple cases)
    let parts: Vec<&str> = json_inner.split("],").collect();

    for part in parts {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        // Find the column name and values
        if let Some(colon_pos) = part.find(':') {
            let col_name = part[..colon_pos].trim().trim_matches('"');
            let values_str = part[colon_pos + 1..]
                .trim()
                .trim_end_matches(']')
                .trim_start_matches('[');

            // Parse values
            let values: Result<Vec<f64>, _> = values_str
                .split(',')
                .map(|v| v.trim().parse::<f64>())
                .collect();

            match values {
                Ok(v) => {
                    data.insert(col_name.to_string(), v);
                }
                Err(_) => {
                    return Err(format!("Failed to parse values for column '{}'", col_name));
                }
            }
        }
    }

    if data.is_empty() {
        return Err("No data columns found".to_string());
    }

    Ok(data)
}

/// Parse options from JSON string
fn parse_options_json(
    json: &str,
) -> Result<
    (
        Option<Vec<f64>>,
        Option<String>,
        Option<(Option<f64>, Option<usize>, Option<bool>)>,
    ),
    String,
> {
    // Simple parsing for options
    // Expected format: {"weights": [1,1,1], "na_action": "na.omit", "epsilon": 1e-8, "max_iter": 25, "trace": false}

    let weights = None; // TODO: Parse weights if needed
    let na_action = Some("na.omit".to_string());
    let control_params = Some((Some(1e-8), Some(25), Some(false)));

    Ok((weights, na_action, control_params))
}

/// Create a family object from name and link
fn create_family(
    family_name: &str,
    link_name: &str,
) -> Result<Box<dyn crate::stats::regression::family::GlmFamily>, String> {
    use crate::stats::regression::family::{binomial, gamma, gaussian, poisson};

    match family_name {
        "gaussian" => match link_name {
            "identity" => Ok(Box::new(gaussian::GaussianFamily::identity())),
            "log" => Ok(Box::new(gaussian::GaussianFamily::log())),
            "inverse" => Ok(Box::new(gaussian::GaussianFamily::inverse())),
            _ => Err(format!("Unknown link '{}' for gaussian family", link_name)),
        },
        "binomial" => match link_name {
            "logit" => Ok(Box::new(binomial::BinomialFamily::logit())),
            "probit" => Ok(Box::new(binomial::BinomialFamily::probit())),
            "cauchit" => Ok(Box::new(binomial::BinomialFamily::cauchit())),
            "log" => Ok(Box::new(binomial::BinomialFamily::log())),
            "cloglog" => Ok(Box::new(binomial::BinomialFamily::cloglog())),
            _ => Err(format!("Unknown link '{}' for binomial family", link_name)),
        },
        "poisson" => match link_name {
            "log" => Ok(Box::new(poisson::PoissonFamily::log())),
            "identity" => Ok(Box::new(poisson::PoissonFamily::identity())),
            "sqrt" => Ok(Box::new(poisson::PoissonFamily::sqrt())),
            _ => Err(format!("Unknown link '{}' for poisson family", link_name)),
        },
        "gamma" => match link_name {
            "inverse" => Ok(Box::new(gamma::GammaFamily::inverse())),
            "identity" => Ok(Box::new(gamma::GammaFamily::identity())),
            "log" => Ok(Box::new(gamma::GammaFamily::log())),
            _ => Err(format!("Unknown link '{}' for gamma family", link_name)),
        },
        _ => Err(format!("Unknown family '{}'", family_name)),
    }
}

/// Format GLM result as JSON string
fn format_glm_result(result: &GlmResult) -> String {
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

    // Add effects if present
    if let Some(ref effects) = result.effects {
        json.push_str(r#","effects":["#);
        for (i, eff) in effects.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*eff));
        }
        json.push(']');
    }

    // Add rank
    json.push_str(&format!(r#","rank":{}"#, result.rank));

    // Add pivot
    json.push_str(r#","pivot":["#);
    for (i, p) in result.pivot.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&p.to_string());
    }
    json.push(']');

    // Add qr if present
    if result.qr.is_some() {
        json.push_str(r#","qr":true"#);
    }

    // Add df.residual
    json.push_str(&format!(r#","df_residual":{}"#, result.df_residual));

    // Add df.null
    json.push_str(&format!(r#","df_null":{}"#, result.df_null));

    // Add family info
    json.push_str(&format!(r#","family":"{}""#, result.family.name()));

    // Add deviance
    json.push_str(&format!(
        r#","deviance":{}"#,
        format_json_number(result.deviance)
    ));

    // Add aic
    json.push_str(&format!(r#","aic":{}"#, format_json_number(result.aic)));

    // Add null.deviance
    json.push_str(&format!(
        r#","null_deviance":{}"#,
        format_json_number(result.null_deviance)
    ));

    // Add iter
    json.push_str(&format!(r#","iter":{}"#, result.iter));

    // Add converged flag
    json.push_str(&format!(r#","converged":{}"#, result.converged));

    // Add boundary flag
    json.push_str(&format!(r#","boundary":{}"#, result.boundary));

    // Add call
    if let Some(ref call) = result.call {
        json.push_str(&format!(r#","call":"{}""#, call));
    }

    // Add formula
    if let Some(ref formula) = result.formula {
        json.push_str(&format!(r#","formula":"{}""#, formula));
    }

    // Add terms if present
    if result.terms.is_some() {
        json.push_str(r#","terms":true"#);
    }

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
            "1e308".to_string() // Large positive number instead of inf
        } else {
            "-1e308".to_string() // Large negative number instead of -inf
        }
    } else if value.is_nan() {
        "null".to_string()
    } else {
        value.to_string()
    }
}

/// Simplified GLM fit for testing
/// Takes vectors directly instead of JSON
#[wasm_bindgen]
pub fn glm_fit_simple_wasm(
    y: &[f64],
    x: &[f64],
    n_predictors: usize,
    family_name: &str,
    link_name: &str,
) -> String {
    // Create data HashMap
    let mut data = HashMap::new();
    data.insert("y".to_string(), y.to_vec());

    // Reshape x into columns (assuming column-major order)
    let n_obs = y.len();
    if x.len() != n_obs * n_predictors {
        return format_error("Mismatch between x dimensions and y length");
    }

    for i in 0..n_predictors {
        let mut col = Vec::new();
        for j in 0..n_obs {
            col.push(x[j * n_predictors + i]);
        }
        data.insert(format!("x{}", i + 1), col);
    }

    // Create formula
    let mut formula = "y ~ ".to_string();
    for i in 0..n_predictors {
        if i > 0 {
            formula.push_str(" + ");
        }
        formula.push_str(&format!("x{}", i + 1));
    }

    // Create family
    let family = match create_family(family_name, link_name) {
        Ok(f) => f,
        Err(e) => return format_error(&e),
    };

    // Fit model
    match glm(
        formula,
        Some(family),
        Some(data),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(true),
        Some("glm.fit".to_string()),
        Some(true),
        Some(true),
        Some(true),
        None,
    ) {
        Ok(result) => format_glm_result(&result),
        Err(e) => format_error(&e),
    }
}
