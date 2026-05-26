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

/// Build the actionable error returned when a non-numeric column reaches the
/// GLM data-parsing path. The TypeScript layer's branded type rejects this at
/// compile time; this runtime guard is defense-in-depth for callers that bypass
/// the type system (e.g. `as any`, no-type readers, dynamic frames).
///
/// We deliberately do NOT auto-encode categoricals here: silently picking the
/// alphabetically-first level as the reference is a foot-gun (the user thinks
/// they are modeling "species effect" and ends up modeling "species effect
/// relative to Adelie"). The user must encode reference levels explicitly.
fn non_numeric_column_error(column_name: &str) -> String {
    format!(
        "[tidy-ts] Column \"{name}\" is non-numeric. s.glm requires numeric \
         columns only — encode categoricals explicitly, e.g.\n  \
         df.mutate({{ {name}<LevelName>: r => r.{name} === \"<LevelName>\" ? 1 : 0 }})\n\
         You must choose the reference level yourself; tidy-ts will not pick one.",
        name = column_name
    )
}

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
    // Parse data from JSON. Errors out with an actionable message if any
    // column is non-numeric — see non_numeric_column_error.
    let data = parse_data_json(data_json)
        .map_err(|e| {
            console::log_1(&format!("[WASM] Data parsing error: {}", e).into());
            JsValue::from_str(&e)
        })?;

    // Parse formula. Predictors must already match numeric column names; the
    // GLM does not synthesize dummies from string columns.
    let parsed_formula = parse_formula(formula)
        .map_err(|e| {
            console::log_1(&format!("[WASM] Formula parsing error: {}", e).into());
            JsValue::from_str(&e)
        })?;
    let updated_formula = parsed_formula.formula.clone();

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
    // Parse data from JSON. Errors out with an actionable message if any
    // column is non-numeric — see non_numeric_column_error.
    let data = parse_data_json(&data_json)
        .map_err(|e| {
            eprintln!("[NAPI] Data parsing error: {}", e);
            napi::Error::from_reason(e)
        })?;

    // Parse formula. Predictors must already match numeric column names; the
    // GLM does not synthesize dummies from string columns.
    let parsed_formula = parse_formula(&formula)
        .map_err(|e| {
            eprintln!("[NAPI] Formula parsing error: {}", e);
            napi::Error::from_reason(e)
        })?;
    let updated_formula = parsed_formula.formula.clone();

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

/// Parse data from JSON string into a numeric column map.
///
/// Every column must be a numeric array. String columns (or any non-finite,
/// non-numeric value) trigger the actionable error from
/// `non_numeric_column_error`. The user is expected to encode categoricals
/// explicitly with their own choice of reference level before calling GLM —
/// tidy-ts does not auto-encode.
///
/// # Arguments
/// * `json` - JSON string containing data as object with column names as keys
///
/// # Returns
/// HashMap of column name → f64 vector, or an error message describing the
/// first non-numeric column encountered.
///
/// # Examples
/// Input: `{"x": [1,2,3], "y": [4,5,6]}` → `{"x": [1,2,3], "y": [4,5,6]}`
/// Input: `{"x": [1,2,3], "y": ["A","B","A"]}` → Err(non_numeric_column_error("y"))
fn parse_data_json(json: &str) -> Result<HashMap<String, Vec<f64>>, String> {
    use serde_json::Value;

    let parsed: Value =
        serde_json::from_str(json).map_err(|e| format!("JSON parsing error: {}", e))?;

    let obj = parsed
        .as_object()
        .ok_or_else(|| format!("Expected JSON object, got: {:?}", parsed))?;

    let mut data = HashMap::new();

    for (key, value) in obj.iter() {
        let array = value
            .as_array()
            .ok_or_else(|| format!("Column \"{}\" is not an array", key))?;

        // Detect string columns up-front so we surface the actionable
        // categorical guidance, not a generic "non-numeric value" error.
        if array.iter().any(|item| item.is_string()) {
            return Err(non_numeric_column_error(key));
        }

        let values: Result<Vec<f64>, String> = array
            .iter()
            .map(|item| {
                item.as_f64().ok_or_else(|| {
                    // Booleans / nulls / objects also hit this path. Same
                    // remedy applies in spirit (encode explicitly), but we
                    // keep the message specific to "non-numeric value" so
                    // the user can debug nulls separately from strings.
                    format!(
                        "[tidy-ts] Column \"{}\" contains a non-numeric value: {:?}. \
                         s.glm requires numeric columns only.",
                        key, item
                    )
                })
            })
            .collect();
        data.insert(key.clone(), values?);
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
