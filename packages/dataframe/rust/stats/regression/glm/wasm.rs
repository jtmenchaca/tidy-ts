//! WASM bindings for GLM functions

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::glm_main_core::glm;
use super::types::GlmResult;
use crate::stats::regression::shared::formula_parser::parse_formula;
use std::collections::HashMap;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "wasm")]
use web_sys::console;

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

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
/// JsValue containing the fitted GLM result
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_fit_wasm(
    formula: &str,
    family_name: &str,
    link_name: &str,
    data_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    // Parse data from JSON
    let (data, categorical_vars) = parse_data_json(data_json)
        .map_err(|e| {
            console::log_1(&format!("[WASM] Data parsing error: {}", e).into());
            JsValue::from_str(&e)
        })?;

    // Parse formula using existing parser and handle categorical variables
    let parsed_formula = parse_formula(formula)
        .map_err(|e| {
            console::log_1(&format!("[WASM] Formula parsing error: {}", e).into());
            JsValue::from_str(&e)
        })?;

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
    let family = create_family(family_name, link_name)
        .map_err(|e| {
            console::log_1(&format!("[WASM] Family creation error: {}", e).into());
            JsValue::from_str(&e)
        })?;

    // Parse options if provided
    let (weights, na_action, control_params) = if let Some(ref opts) = options_json {
        parse_options_json(opts).map_err(|e| JsValue::from_str(&e))?
    } else {
        (None, None, None)
    };

    // Create control object
    let control = if let Some((epsilon, max_iter, trace)) = control_params {
        Some(
            super::glm_control::glm_control(epsilon, max_iter, trace)
                .map_err(|e| JsValue::from_str(&e))?,
        )
    } else {
        None
    };

    // Fit the model
    let result = glm(
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
    )
    .map_err(|e| {
        console::log_1(&format!("[WASM] GLM fit error: {}", e).into());
        JsValue::from_str(&e)
    })?;

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// NAPI export for GLM fitting
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_fit_napi(
    formula: String,
    family_name: String,
    link_name: String,
    data_json: String,
    options_json: Option<String>,
) -> Result<String, napi::Error> {
    // Parse data from JSON
    let (data, categorical_vars) = parse_data_json(&data_json)
        .map_err(|e| {
            eprintln!("[NAPI] Data parsing error: {}", e);
            napi::Error::from_reason(e)
        })?;

    // Parse formula using existing parser and handle categorical variables
    let parsed_formula = parse_formula(&formula)
        .map_err(|e| {
            eprintln!("[NAPI] Formula parsing error: {}", e);
            napi::Error::from_reason(e)
        })?;

    // Update the formula to replace categorical variables with dummy variable names
    let updated_formula = if !categorical_vars.is_empty() {
        update_formula_with_dummy_names(&parsed_formula.formula, &categorical_vars)
    } else {
        parsed_formula.formula.clone()
    };

    // Log formula transformation if categorical variables are present
    if !categorical_vars.is_empty() {
        eprintln!(
            "[NAPI] Formula updated for categorical vars: {}",
            updated_formula
        );
    }

    // Create family object
    let family = create_family(&family_name, &link_name)
        .map_err(|e| {
            eprintln!("[NAPI] Family creation error: {}", e);
            napi::Error::from_reason(e)
        })?;

    // Parse options if provided
    let (weights, na_action, control_params) = if let Some(ref opts) = options_json {
        parse_options_json(opts).map_err(|e| napi::Error::from_reason(e))?
    } else {
        (None, None, None)
    };

    // Create control object
    let control = if let Some((epsilon, max_iter, trace)) = control_params {
        Some(
            super::glm_control::glm_control(epsilon, max_iter, trace)
                .map_err(|e| napi::Error::from_reason(e))?,
        )
    } else {
        None
    };

    // Fit the model
    let result = glm(
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
    )
    .map_err(|e| {
        eprintln!("[NAPI] GLM fit error: {}", e);
        napi::Error::from_reason(e)
    })?;

    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
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
    json: &str,
) -> Result<
    (
        Option<Vec<f64>>,
        Option<String>,
        Option<(Option<f64>, Option<usize>, Option<bool>)>,
    ),
    String,
> {
    use serde_json::Value;

    // Parse JSON
    let parsed: Value =
        serde_json::from_str(json).map_err(|e| format!("Failed to parse options JSON: {}", e))?;

    // Extract weights
    let weights = if let Some(w) = parsed.get("weights") {
        if let Some(arr) = w.as_array() {
            let weights_vec: Result<Vec<f64>, String> = arr
                .iter()
                .map(|v| {
                    v.as_f64()
                        .ok_or_else(|| "weights must be numeric".to_string())
                })
                .collect();
            Some(weights_vec?)
        } else {
            return Err("weights must be an array".to_string());
        }
    } else {
        None
    };

    // Validate weights if present (must be non-negative, matching R's behavior)
    if let Some(ref w) = weights {
        if w.iter().any(|&x| x < 0.0) {
            return Err("negative weights not allowed".to_string());
        }
    }

    // Extract na_action
    let na_action = parsed
        .get("na_action")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(|| Some("na.omit".to_string()));

    // Extract control parameters
    let epsilon = parsed.get("epsilon").and_then(|v| v.as_f64());
    let max_iter = parsed
        .get("max_iter")
        .and_then(|v| v.as_u64())
        .map(|v| v as usize);
    let trace = parsed.get("trace").and_then(|v| v.as_bool());

    let control_params = if epsilon.is_some() || max_iter.is_some() || trace.is_some() {
        Some((epsilon, max_iter, trace))
    } else {
        Some((Some(1e-8), Some(25), Some(false)))
    };

    Ok((weights, na_action, control_params))
}

/// Create a family object from name and link
fn create_family(
    family_name: &str,
    link_name: &str,
) -> Result<Box<dyn crate::stats::regression::family::GlmFamily>, String> {
    use crate::stats::regression::family::{binomial, gamma, gaussian, inverse_gaussian, poisson, quasibinomial, quasipoisson};

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
        "quasibinomial" => match link_name {
            "logit" => Ok(Box::new(quasibinomial::QuasiBinomialFamily::logit())),
            "probit" => Ok(Box::new(quasibinomial::QuasiBinomialFamily::probit())),
            "cauchit" => Ok(Box::new(quasibinomial::QuasiBinomialFamily::cauchit())),
            "log" => Ok(Box::new(quasibinomial::QuasiBinomialFamily::log())),
            "cloglog" => Ok(Box::new(quasibinomial::QuasiBinomialFamily::cloglog())),
            _ => Err(format!("Unknown link '{}' for quasibinomial family", link_name)),
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
        "quasipoisson" => match link_name {
            "log" => Ok(Box::new(quasipoisson::QuasiPoissonFamily::log())),
            "identity" => Ok(Box::new(quasipoisson::QuasiPoissonFamily::identity())),
            "sqrt" => Ok(Box::new(quasipoisson::QuasiPoissonFamily::sqrt())),
            _ => Err(format!("Unknown link '{}' for quasipoisson family", link_name)),
        },
        _ => Err(format!("Unknown family '{}'", family_name)),
    }
}

/// WASM export for GLM summary
///
/// Returns coefficient table with test statistics and p-values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_summary_wasm(result: &str) -> Result<JsValue, JsValue> {
    // Parse GLM result from JSON string
    let result: GlmResult = serde_json::from_str(result)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse GLM result: {}", e)))?;

    // Compute summary
    let summary = result.summary()
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&summary)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for standardized residuals
///
/// Returns rstandard() values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_rstandard_wasm(result: &str, residual_type: &str) -> Result<JsValue, JsValue> {
    let result: GlmResult = serde_json::from_str(result)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse GLM result: {}", e)))?;

    let rstandard = result.rstandard(residual_type)
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&rstandard)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for studentized residuals
///
/// Returns rstudent() values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_rstudent_wasm(result: &str) -> Result<JsValue, JsValue> {
    let result: GlmResult = serde_json::from_str(result)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse GLM result: {}", e)))?;

    let rstudent = result.rstudent()
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&rstudent)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for influence measures
///
/// Returns influence() measures (dfbeta, dfbetas, dffits, covratio, cook's distance)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_influence_wasm(result: &str) -> Result<JsValue, JsValue> {
    let result: GlmResult = serde_json::from_str(result)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse GLM result: {}", e)))?;

    let influence = result.influence()
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&influence)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// GLM confint() - Compute confidence intervals for coefficients
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_confint_wasm(result: &str, level: f64) -> Result<JsValue, JsValue> {
    let result: GlmResult = serde_json::from_str(result)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse GLM result: {}", e)))?;

    let confint = result.confint(level)
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&confint)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// GLM predict() - Make predictions on new data
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_predict_wasm(result: &str, newdata: JsValue, pred_type: &str) -> Result<JsValue, JsValue> {
    let result: GlmResult = serde_json::from_str(result)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse GLM result: {}", e)))?;

    // Parse newdata (expecting array of arrays: [[1, 2, 3], [4, 5, 6], ...])
    let newdata: Vec<Vec<f64>> = serde_wasm_bindgen::from_value(newdata)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse newdata: {}", e)))?;

    // Make predictions
    let predictions = result.predict(&newdata, pred_type)
        .map_err(|e| JsValue::from_str(&e))?;

    serde_wasm_bindgen::to_value(&predictions)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for clustered robust covariance matrix (sandwich::vcovCL)
///
/// Accepts a JSON string with the specific fields needed by the sandwich
/// estimator, avoiding circular reference issues in the full GlmResult.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn glm_vcov_cl_wasm(
    sandwich_input_json: &str,
    cluster: JsValue,
    hc_type: &str,
    cadjust: bool,
    fix: bool,
) -> Result<JsValue, JsValue> {
    let input: super::sandwich::SandwichInput =
        serde_json::from_str(sandwich_input_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse sandwich input: {}", e)))?;

    let cluster: Vec<i32> = serde_wasm_bindgen::from_value(cluster)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse cluster: {}", e)))?;

    let hc = super::sandwich::HCType::from_str(hc_type);
    let vcov = super::sandwich::vcov_cl_from_input(&input, &cluster, hc, cadjust, fix);

    serde_wasm_bindgen::to_value(&vcov)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// NAPI export for GLM summary
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_summary_napi(result: String) -> Result<String, napi::Error> {
    let result: GlmResult = serde_json::from_str(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse GLM result: {}", e)))?;

    let summary = result.summary()
        .map_err(|e| napi::Error::from_reason(e))?;

    serde_json::to_string(&summary)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// NAPI export for standardized residuals
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_rstandard_napi(result: String, residual_type: String) -> Result<String, napi::Error> {
    let result: GlmResult = serde_json::from_str(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse GLM result: {}", e)))?;

    let rstandard = result.rstandard(&residual_type)
        .map_err(|e| napi::Error::from_reason(e))?;

    serde_json::to_string(&rstandard)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// NAPI export for studentized residuals
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_rstudent_napi(result: String) -> Result<String, napi::Error> {
    let result: GlmResult = serde_json::from_str(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse GLM result: {}", e)))?;

    let rstudent = result.rstudent()
        .map_err(|e| napi::Error::from_reason(e))?;

    serde_json::to_string(&rstudent)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// NAPI export for influence measures
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_influence_napi(result: String) -> Result<String, napi::Error> {
    let result: GlmResult = serde_json::from_str(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse GLM result: {}", e)))?;

    let influence = result.influence()
        .map_err(|e| napi::Error::from_reason(e))?;

    serde_json::to_string(&influence)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// NAPI export for GLM confint
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_confint_napi(result: String, level: f64) -> Result<String, napi::Error> {
    let result: super::types_results::GlmResult = serde_json::from_str(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse GLM result: {}", e)))?;

    let confint = result.confint(level)
        .map_err(|e| napi::Error::from_reason(e))?;

    serde_json::to_string(&confint)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// NAPI export for GLM predict
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_predict_napi(result: String, newdata: String, pred_type: String) -> Result<String, napi::Error> {
    let result: super::types_results::GlmResult = serde_json::from_str(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse GLM result: {}", e)))?;

    let newdata: Vec<Vec<f64>> = serde_json::from_str(&newdata)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse newdata: {}", e)))?;

    let predictions = result.predict(&newdata, &pred_type)
        .map_err(|e| napi::Error::from_reason(e))?;

    serde_json::to_string(&predictions)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

/// NAPI export for clustered robust covariance matrix (sandwich::vcovCL)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn glm_vcov_cl_napi(
    sandwich_input_json: String,
    cluster: String,
    hc_type: String,
    cadjust: bool,
    fix: bool,
) -> Result<String, napi::Error> {
    let input: super::sandwich::SandwichInput =
        serde_json::from_str(&sandwich_input_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse sandwich input: {}", e)))?;

    let cluster: Vec<i32> = serde_json::from_str(&cluster)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse cluster: {}", e)))?;

    let hc = super::sandwich::HCType::from_str(&hc_type);
    let vcov = super::sandwich::vcov_cl_from_input(&input, &cluster, hc, cadjust, fix);

    serde_json::to_string(&vcov)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
