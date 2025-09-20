//! WASM bindings for GLM functions

#![cfg(feature = "wasm")]

use super::glm_main_core::glm;
use super::types::GlmResult;
use crate::stats::regression::shared::formula_parser::parse_formula;
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
    // Parse data from JSON
    let (data, categorical_vars) = match parse_data_json(data_json) {
        Ok((d, c)) => (d, c),
        Err(e) => {
            console::log_1(&format!("[WASM] Data parsing error: {}", e).into());
            return format_error(&e);
        }
    };

    // Parse formula using existing parser and handle categorical variables
    let parsed_formula = match parse_formula(formula) {
        Ok(pf) => pf,
        Err(e) => {
            console::log_1(&format!("[WASM] Formula parsing error: {}", e).into());
            return format_error(&e);
        }
    };

    // Update the formula to replace categorical variables with dummy variable names
    let updated_formula = if !categorical_vars.is_empty() {
        update_formula_with_dummy_names(&parsed_formula.formula, &categorical_vars)
    } else {
        parsed_formula.formula.clone()
    };

    // Log formula transformation if categorical variables are present
    if !categorical_vars.is_empty() {
        console::log_1(
            &format!(
                "[WASM] Formula updated for categorical vars: {}",
                updated_formula
            )
            .into(),
        );
    }

    // Create family object
    let family = match create_family(family_name, link_name) {
        Ok(f) => f,
        Err(e) => {
            console::log_1(&format!("[WASM] Family creation error: {}", e).into());
            return format_error(&e);
        }
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
        updated_formula,
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
        Err(e) => {
            console::log_1(&format!("[WASM] GLM fit error: {}", e).into());
            format_error(&e)
        }
    }
}

/// Update formula to replace categorical variable names with dummy variable names.
///
/// This function takes a formula that may contain categorical variables and expands it
/// to use dummy variables instead. For each categorical variable, dummy variables are
/// created for all levels except the first (which serves as the reference category).
///
/// # Arguments
/// * `formula` - The original formula string (e.g., "y ~ x1 + x2 * x3")
/// * `categorical_vars` - Map of variable names to their categorical levels
///
/// # Returns
/// A new formula string with categorical variables replaced by dummy variables
///
/// # Examples
/// - `x2` with levels ["A", "B", "C"] becomes `x2B + x2C`
/// - `x1 * x2` with categorical `x2` becomes `x1 * x2B + x1 * x2C`
fn update_formula_with_dummy_names(
    formula: &str,
    categorical_vars: &HashMap<String, Vec<String>>,
) -> String {
    let parsed = match parse_formula(formula) {
        Ok(p) => p,
        Err(_) => return formula.to_string(),
    };

    let mut updated_predictors = Vec::new();

    for predictor in &parsed.predictors {
        if predictor == "(Intercept)" {
            continue; // Skip intercept - handled automatically by GLM core
        }

        if predictor.contains(':') {
            // Handle interaction terms
            let interaction_vars: Vec<&str> = predictor.split(':').collect();
            let var_expansions: Vec<Vec<String>> = interaction_vars
                .iter()
                .map(|&var| {
                    if let Some(categories) = categorical_vars.get(var) {
                        categories
                            .iter()
                            .skip(1)
                            .map(|cat| format!("{}{}", var, cat))
                            .collect()
                    } else {
                        vec![var.to_string()]
                    }
                })
                .collect();

            let combinations = generate_interaction_combinations(&var_expansions);
            updated_predictors.extend(combinations);
        } else {
            // Handle simple terms
            if let Some(categories) = categorical_vars.get(predictor) {
                let dummies: Vec<String> = categories
                    .iter()
                    .skip(1)
                    .map(|cat| format!("{}{}", predictor, cat))
                    .collect();
                updated_predictors.extend(dummies);
            } else {
                updated_predictors.push(predictor.clone());
            }
        }
    }

    format!("{} ~ {}", parsed.response, updated_predictors.join(" + "))
}

/// Generate all combinations for interaction terms with dummy variables.
///
/// Takes a list of variable expansions (each variable may expand to multiple dummy variables)
/// and generates all possible interaction combinations.
///
/// # Arguments
/// * `var_expansions` - Vector where each element is a list of dummy variables for one original variable
///
/// # Returns
/// Vector of all possible interaction combinations joined with ":"
///
/// # Examples
/// Input: `[["x1"], ["x2B", "x2C"]]` → Output: `["x1:x2B", "x1:x2C"]`
fn generate_interaction_combinations(var_expansions: &[Vec<String>]) -> Vec<String> {
    match var_expansions.len() {
        0 => vec![],
        1 => var_expansions[0].clone(),
        _ => {
            let first = &var_expansions[0];
            let rest_combinations = generate_interaction_combinations(&var_expansions[1..]);

            first
                .iter()
                .flat_map(|item| {
                    if rest_combinations.is_empty() {
                        vec![item.clone()]
                    } else {
                        rest_combinations
                            .iter()
                            .map(|combo| format!("{}:{}", item, combo))
                            .collect()
                    }
                })
                .collect()
        }
    }
}

/// Parse data from JSON string into numeric data and categorical variable information.
///
/// Processes JSON data to identify categorical variables (string arrays) and converts them
/// to dummy variables, while preserving numeric variables as-is.
///
/// # Arguments
/// * `json` - JSON string containing data as object with column names as keys
///
/// # Returns
/// Tuple of:
/// - HashMap of numeric data (including dummy variables for categoricals)
/// - HashMap mapping original categorical variable names to their levels
///
/// # Examples
/// Input: `{"x": [1,2,3], "y": ["A","B","A"]}`
/// Output: `({"x": [1,2,3], "yB": [0,1,0]}, {"y": ["A","B"]})`
fn parse_data_json(
    json: &str,
) -> Result<(HashMap<String, Vec<f64>>, HashMap<String, Vec<String>>), String> {
    use serde_json::Value;

    // Parse JSON properly using serde_json
    let parsed: Value =
        serde_json::from_str(json).map_err(|e| format!("JSON parsing error: {}", e))?;

    let obj = parsed
        .as_object()
        .ok_or_else(|| format!("Expected JSON object, got: {:?}", parsed))?;

    let mut data = HashMap::new();
    let mut categorical_vars = HashMap::new();

    // First pass: identify categorical variables and collect unique values
    for (key, value) in obj.iter() {
        if let Some(array) = value.as_array() {
            if !array.is_empty() {
                if array[0].is_string() {
                    // This is a categorical variable
                    let mut unique_values = std::collections::HashSet::new();
                    for item in array.iter() {
                        if let Some(s) = item.as_str() {
                            unique_values.insert(s.to_string());
                        }
                    }
                    let mut sorted_values: Vec<String> = unique_values.into_iter().collect();
                    sorted_values.sort();
                    categorical_vars.insert(key.clone(), sorted_values);
                }
            }
        }
    }

    // Second pass: convert data to numeric, creating dummy variables for categoricals
    for (key, value) in obj.iter() {
        if let Some(array) = value.as_array() {
            if let Some(categories) = categorical_vars.get(key) {
                // Convert categorical to dummy variables (exclude first category as reference)
                for (_i, category) in categories.iter().enumerate().skip(1) {
                    let dummy_name = format!("{}{}", key, category);
                    let dummy_values: Vec<f64> = array
                        .iter()
                        .map(|item| {
                            if let Some(s) = item.as_str() {
                                if s == category { 1.0 } else { 0.0 }
                            } else {
                                0.0
                            }
                        })
                        .collect();
                    data.insert(dummy_name, dummy_values);
                }
            } else {
                // Convert numeric array
                let values: Result<Vec<f64>, String> = array
                    .iter()
                    .map(|item| {
                        item.as_f64().ok_or_else(|| {
                            format!("Non-numeric value in column '{}': {:?}", key, item)
                        })
                    })
                    .collect();
                data.insert(key.clone(), values?);
            }
        }
    }

    Ok((data, categorical_vars))
}

/// Parse options from JSON string
fn parse_options_json(
    _json: &str,
) -> Result<
    (
        Option<Vec<f64>>,
        Option<String>,
        Option<(Option<f64>, Option<usize>, Option<bool>)>,
    ),
    String,
> {
    // Simple parsing for options - currently returns defaults
    // TODO: Implement full options parsing when needed
    // Expected format: {"weights": [1,1,1], "na_action": "na.omit", "epsilon": 1e-8, "max_iter": 25, "trace": false}

    let weights = None;
    let na_action = Some("na.omit".to_string());
    let control_params = Some((Some(1e-8), Some(25), Some(false)));

    Ok((weights, na_action, control_params))
}

/// Create a family object from name and link
fn create_family(
    family_name: &str,
    link_name: &str,
) -> Result<Box<dyn crate::stats::regression::family::GlmFamily>, String> {
    use crate::stats::regression::family::{binomial, gamma, gaussian, inverse_gaussian, poisson};

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
            // "log" => Ok(Box::new(gamma::GammaFamily::log())),
            _ => Err(format!("Unknown link '{}' for gamma family", link_name)),
        },
        "inverse_gaussian" => match link_name {
            "inverse_squared" => Ok(Box::new(
                inverse_gaussian::InverseGaussianFamily::mu_squared(),
            )),
            "log" => Ok(Box::new(inverse_gaussian::InverseGaussianFamily::log())),
            "identity" => Ok(Box::new(inverse_gaussian::InverseGaussianFamily::identity())),
            "inverse" => Ok(Box::new(inverse_gaussian::InverseGaussianFamily::inverse())),
            _ => Err(format!(
                "Unknown link '{}' for inverse_gaussian family",
                link_name
            )),
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
