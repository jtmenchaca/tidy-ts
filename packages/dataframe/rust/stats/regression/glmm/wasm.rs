//! WASM bindings for GLMM functions

#![cfg(feature = "wasm")]

use super::fitting::glmm_fit;
use super::random_effects::{construct_combined_z_matrix, populate_random_effect};
use super::types::{CovarianceType, GlmmControl, GlmmResult, RandomEffect};
use crate::stats::regression::family::{
    binomial, gamma, gaussian, inverse_gaussian, negative_binomial, poisson, GlmFamily,
};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::console;

/// WASM export for GLMM fitting
///
/// Fits a generalized linear mixed model using the provided formula and data.
///
/// # Arguments
/// * `formula` - Fixed effects formula as string (e.g., "y ~ x1 + x2")
/// * `random_effects_json` - JSON array of random effect specifications
/// * `family_name` - Name of the family ("gaussian", "binomial", "poisson", etc.)
/// * `link_name` - Name of the link function ("identity", "logit", "log", etc.)
/// * `data_json` - JSON string containing the data as an object with column names as keys
/// * `options_json` - JSON string containing optional parameters
///
/// # Returns
/// JSON string containing the fitted GLMM result
#[wasm_bindgen]
pub fn glmm_fit_wasm(
    formula: &str,
    random_effects_json: &str,
    family_name: &str,
    link_name: &str,
    data_json: &str,
    options_json: Option<String>,
) -> String {
    // Parse data from JSON
    let data: HashMap<String, Vec<f64>> = match parse_data_json(data_json) {
        Ok(d) => d,
        Err(e) => {
            console::log_1(&format!("[WASM GLMM] Data parsing error: {}", e).into());
            return format_error(&e);
        }
    };

    // Parse random effects specification
    let random_effects_spec: Vec<RandomEffectSpec> = match serde_json::from_str(random_effects_json)
    {
        Ok(r) => r,
        Err(e) => {
            console::log_1(&format!("[WASM GLMM] Random effects parsing error: {}", e).into());
            return format_error(&format!("Failed to parse random effects: {}", e));
        }
    };

    // Parse fixed effects formula
    let parsed_formula = match parse_fixed_formula(formula) {
        Ok(pf) => pf,
        Err(e) => {
            console::log_1(&format!("[WASM GLMM] Formula parsing error: {}", e).into());
            return format_error(&e);
        }
    };

    // Create family object
    let family: Box<dyn GlmFamily> = match create_family(family_name, link_name) {
        Ok(f) => f,
        Err(e) => {
            console::log_1(&format!("[WASM GLMM] Family creation error: {}", e).into());
            return format_error(&e);
        }
    };

    // Parse options
    let control = if let Some(ref opts) = options_json {
        match parse_options_json(opts) {
            Ok(c) => c,
            Err(e) => return format_error(&e),
        }
    } else {
        GlmmControl::new()
    };

    // Extract response and predictors
    let n = match data.get(&parsed_formula.response) {
        Some(y) => y.len(),
        None => {
            return format_error(&format!(
                "Response variable '{}' not found in data",
                parsed_formula.response
            ))
        }
    };

    // Build y vector
    let y: Vec<f64> = data[&parsed_formula.response].clone();

    // Build X matrix (design matrix for fixed effects)
    let (x_matrix, x_names) =
        match build_design_matrix(&data, &parsed_formula.predictors, n, parsed_formula.intercept) {
            Ok((m, names)) => (m, names),
            Err(e) => return format_error(&e),
        };

    // Build random effects structures
    let mut random_effects: Vec<RandomEffect> = Vec::new();
    for spec in &random_effects_spec {
        let mut re = RandomEffect::intercept(spec.grouping_var.clone());

        // Handle different random effect specifications
        if spec.terms.len() > 1 {
            // Random slopes
            re.terms = spec.terms.clone();
            re.covariance = CovarianceType::Unstructured;
        }

        // Populate group information from data
        let group_values: Vec<String> = match data.get(&spec.grouping_var) {
            Some(vals) => vals.iter().map(|v| v.to_string()).collect(),
            None => {
                // Try to get it from string data
                return format_error(&format!(
                    "Grouping variable '{}' not found in data",
                    spec.grouping_var
                ));
            }
        };

        populate_random_effect(&mut re, &group_values);
        random_effects.push(re);
    }

    // Build Z matrix (design matrix for random effects)
    let term_values_list: Vec<Vec<Vec<f64>>> = random_effects_spec
        .iter()
        .map(|spec| {
            spec.terms
                .iter()
                .map(|term| {
                    if term == "1" {
                        vec![1.0; n]
                    } else {
                        // Get slope values from data
                        data.get(term).cloned().unwrap_or_else(|| vec![1.0; n])
                    }
                })
                .collect()
        })
        .collect();

    let z = match construct_combined_z_matrix(&random_effects, &term_values_list) {
        Ok(z) => z,
        Err(e) => {
            console::log_1(&format!("[WASM GLMM] Z matrix construction error: {}", e).into());
            return format_error(&e);
        }
    };

    // Fit the model
    match glmm_fit(
        &y,
        &x_matrix,
        &z,
        &random_effects,
        family.as_ref(),
        &control,
        None, // weights
        None, // offset
    ) {
        Ok(result) => {
            // Attach additional metadata
            let mut result_with_meta = result;
            result_with_meta.formula = formula.to_string();
            result_with_meta.glm_result.model_matrix_column_names = x_names;
            format_glmm_result(&result_with_meta)
        }
        Err(e) => {
            console::log_1(&format!("[WASM GLMM] Fit error: {}", e).into());
            format_error(&e)
        }
    }
}

/// Specification for a random effect from JSON
#[derive(Debug, Clone, serde::Deserialize)]
struct RandomEffectSpec {
    /// Grouping variable name (e.g., "patient", "clinic")
    grouping_var: String,
    /// Terms in the random effect (e.g., ["1"] for intercept, ["1", "time"] for slope)
    terms: Vec<String>,
    /// Covariance structure type (optional) - reserved for future use
    #[serde(default)]
    #[allow(dead_code)]
    covariance: Option<String>,
}

/// Parsed fixed effects formula
struct ParsedFormula {
    response: String,
    predictors: Vec<String>,
    intercept: bool,
}

/// Parse fixed effects formula
fn parse_fixed_formula(formula: &str) -> Result<ParsedFormula, String> {
    // Simple formula parser: "y ~ x1 + x2"
    let parts: Vec<&str> = formula.split('~').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid formula format: {}", formula));
    }

    let response = parts[0].trim().to_string();
    let rhs = parts[1].trim();

    // Check for intercept removal
    let intercept = !rhs.contains("- 1") && !rhs.contains("-1") && !rhs.starts_with("0 +");

    // Parse predictors
    let mut predictors: Vec<String> = Vec::new();
    for term in rhs.split('+') {
        let term = term.trim();
        if term == "1" || term == "0" || term == "-1" || term == "- 1" {
            continue;
        }
        if !term.is_empty() {
            predictors.push(term.to_string());
        }
    }

    Ok(ParsedFormula {
        response,
        predictors,
        intercept,
    })
}

/// Build design matrix from data
/// Returns a row-major matrix: x[i] is the i-th row (observation)
fn build_design_matrix(
    data: &HashMap<String, Vec<f64>>,
    predictors: &[String],
    n: usize,
    include_intercept: bool,
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    let mut ncol = if include_intercept { 1 } else { 0 };
    ncol += predictors.len();

    let mut names: Vec<String> = Vec::with_capacity(ncol);

    // Build column names
    if include_intercept {
        names.push("(Intercept)".to_string());
    }
    for pred in predictors {
        names.push(pred.clone());
    }

    // Build row-major matrix: x[i] is the i-th row
    let mut matrix: Vec<Vec<f64>> = Vec::with_capacity(n);

    for i in 0..n {
        let mut row = Vec::with_capacity(ncol);

        // Intercept
        if include_intercept {
            row.push(1.0);
        }

        // Predictor values
        for pred in predictors {
            let values = data
                .get(pred)
                .ok_or_else(|| format!("Predictor '{}' not found in data", pred))?;

            if values.len() != n {
                return Err(format!(
                    "Predictor '{}' has {} values, expected {}",
                    pred,
                    values.len(),
                    n
                ));
            }

            row.push(values[i]);
        }

        matrix.push(row);
    }

    Ok((matrix, names))
}

/// Parse data from JSON string
fn parse_data_json(json: &str) -> Result<HashMap<String, Vec<f64>>, String> {
    use serde_json::Value;

    let parsed: Value =
        serde_json::from_str(json).map_err(|e| format!("JSON parsing error: {}", e))?;

    let obj = parsed
        .as_object()
        .ok_or_else(|| format!("Expected JSON object, got: {:?}", parsed))?;

    let mut data = HashMap::new();

    for (key, value) in obj.iter() {
        if let Some(array) = value.as_array() {
            let values: Result<Vec<f64>, String> = array
                .iter()
                .map(|item| {
                    // Handle numeric values
                    if let Some(n) = item.as_f64() {
                        return Ok(n);
                    }
                    // Handle string values that are numeric
                    if let Some(s) = item.as_str() {
                        if let Ok(n) = s.parse::<f64>() {
                            return Ok(n);
                        }
                    }
                    Err(format!("Non-numeric value in column '{}': {:?}", key, item))
                })
                .collect();
            data.insert(key.clone(), values?);
        }
    }

    Ok(data)
}

/// Parse options from JSON string
fn parse_options_json(json: &str) -> Result<GlmmControl, String> {
    use serde_json::Value;

    let parsed: Value =
        serde_json::from_str(json).map_err(|e| format!("Failed to parse options JSON: {}", e))?;

    let mut control = GlmmControl::new();

    if let Some(max_iter) = parsed.get("max_iter").and_then(|v| v.as_u64()) {
        control.max_iter_outer = max_iter as usize;
    }

    if let Some(tol) = parsed.get("tolerance").and_then(|v| v.as_f64()) {
        control.tol_outer = tol;
    }

    if let Some(reml) = parsed.get("reml").and_then(|v| v.as_bool()) {
        control.reml = reml;
    }

    if let Some(verbose) = parsed.get("verbose").and_then(|v| v.as_bool()) {
        control.verbose = verbose;
    }

    Ok(control)
}

/// Create a family object from name and link
fn create_family(family_name: &str, link_name: &str) -> Result<Box<dyn GlmFamily>, String> {
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
        "nbinom2" => match link_name {
            "log" => Ok(Box::new(negative_binomial::Nbinom2Family::log(2.0))),
            _ => Err(format!("Unknown link '{}' for nbinom2 family", link_name)),
        },
        "nbinom1" => match link_name {
            "log" => Ok(Box::new(negative_binomial::Nbinom1Family::log(1.0))),
            _ => Err(format!("Unknown link '{}' for nbinom1 family", link_name)),
        },
        _ => Err(format!("Unknown family '{}'", family_name)),
    }
}

/// Format GLMM result as JSON string
fn format_glmm_result(result: &GlmmResult) -> String {
    match serde_json::to_string(result) {
        Ok(json) => json,
        Err(e) => format!(r#"{{"error":"Failed to serialize GLMM result: {}"}}"#, e),
    }
}

/// Format an error message as JSON
fn format_error(error: &str) -> String {
    format!(r#"{{"error":"{}"}}"#, error.replace('"', r#"\""#))
}
