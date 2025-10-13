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
    let parsed: Value = serde_json::from_str(json)
        .map_err(|e| format!("Failed to parse options JSON: {}", e))?;

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
    let na_action = parsed.get("na_action")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(|| Some("na.omit".to_string()));

    // Extract control parameters
    let epsilon = parsed.get("epsilon").and_then(|v| v.as_f64());
    let max_iter = parsed.get("max_iter").and_then(|v| v.as_u64()).map(|v| v as usize);
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
    // Use serde_json to properly handle NaN/Infinity
    match serde_json::to_string(result) {
        Ok(json) => json,
        Err(e) => format!(r#"{{"error":"Failed to serialize GLM result: {}"}}"#, e),
    }
}

fn format_glm_result_manual_DEPRECATED(result: &GlmResult) -> String {
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

    // Add working residuals
    json.push_str(r#","working_residuals":["#);
    for (i, res) in result.working_residuals.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*res));
    }
    json.push(']');

    // Add response residuals
    json.push_str(r#","response_residuals":["#);
    for (i, res) in result.response_residuals.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*res));
    }
    json.push(']');

    // Add pearson residuals
    json.push_str(r#","pearson_residuals":["#);
    for (i, res) in result.pearson_residuals.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*res));
    }
    json.push(']');

    // Add deviance residuals
    json.push_str(r#","deviance_residuals":["#);
    for (i, res) in result.deviance_residuals.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*res));
    }
    json.push(']');

    // Add effects if present
    if !result.effects.is_empty() {
        json.push_str(r#","effects":["#);
        for (i, eff) in result.effects.iter().enumerate() {
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

    // Add R matrix if present
    if !result.r.is_empty() {
        json.push_str(r#","r":[["#);
        for (i, row) in result.r.iter().enumerate() {
            if i > 0 {
                json.push_str("],[");
            }
            for (j, val) in row.iter().enumerate() {
                if j > 0 {
                    json.push(',');
                }
                json.push_str(&format_json_number(*val));
            }
        }
        json.push_str("]]");
    }

    // Add qr if present (QR is now always present as a struct)
    if !result.qr.qr.is_empty() {
        json.push_str(r#","qr":{"#);
        json.push_str(r#""qr":[["#);
        for (i, row) in result.qr.qr.iter().enumerate() {
            if i > 0 {
                json.push_str("],[");
            }
            for (j, val) in row.iter().enumerate() {
                if j > 0 {
                    json.push(',');
                }
                json.push_str(&format_json_number(*val));
            }
        }
        json.push_str("]]");
        json.push_str(&format!(r#","rank":{}"#, result.qr.rank));
        json.push_str(r#","qraux":["#);
        for (i, val) in result.qr.qraux.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
        json.push(']');
        json.push_str(r#","pivot":["#);
        for (i, p) in result.qr.pivot.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&p.to_string());
        }
        json.push(']');
        json.push_str(&format!(r#","tol":{}"#, result.qr.tol));
        json.push('}');
    }

    // Add df.residual
    json.push_str(&format!(r#","df_residual":{}"#, result.df_residual));

    // Add df.null
    json.push_str(&format!(r#","df_null":{}"#, result.df_null));

    // Add weights
    json.push_str(r#","weights":["#);
    for (i, val) in result.weights.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add prior_weights
    json.push_str(r#","prior_weights":["#);
    for (i, val) in result.prior_weights.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add y
    json.push_str(r#","y":["#);
    for (i, val) in result.y.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add linear_predictors
    json.push_str(r#","linear_predictors":["#);
    for (i, pred) in result.linear_predictors.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*pred));
    }
    json.push(']');

    // Add family info
    json.push_str(&format!(
        r#","family":{{"family":"{}","link":"{}"}}"#,
        result.family.family,
        result.family.link
    ));

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
    if !result.call.is_empty() {
        json.push_str(&format!(r#","call":"{}""#, result.call));
    }

    // Add formula
    if !result.formula.is_empty() {
        json.push_str(&format!(r#","formula":"{}""#, result.formula));
    }

    // Add x field if present
    if let Some(x) = &result.x {
        json.push_str(r#","x":{"#);
        json.push_str(r#""matrix":["#);
        for (i, val) in x.matrix.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
        json.push(']');
        json.push_str(&format!(r#","n_rows":{}"#, x.n_rows));
        json.push_str(&format!(r#","n_cols":{}"#, x.n_cols));
        json.push_str(r#","column_names":["#);
        for (i, name) in x.column_names.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(r#""{}""#, name));
        }
        json.push(']');
        json.push_str(r#","term_assignments":["#);
        for (i, assign) in x.term_assignments.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&assign.to_string());
        }
        json.push(']');
        json.push_str(r#","row_names":null"#);
        json.push('}');
    }

    // Add model frame if present
    if !result.model.predictors.is_empty() {
        json.push_str(r#","model":{"#);
        json.push_str(r#""y":["#);
        for (i, val) in result.model.y.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
        json.push(']');
        json.push_str(r#","predictors":{"#);
        for (i, (name, values)) in result.model.predictors.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(r#""{}":["#, name));
            for (j, val) in values.iter().enumerate() {
                if j > 0 {
                    json.push(',');
                }
                json.push_str(&format_json_number(*val));
            }
            json.push(']');
        }
        json.push('}');
        json.push_str(r#","factors":{}"#);
        json.push('}');
    }

    // Add terms if present (terms is now always present as a struct)
    if !result.terms.variables.is_empty() {
        json.push_str(r#","terms":{"#);
        json.push_str(r#""variables":["#);
        for (i, var) in result.terms.variables.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(r#""{}""#, var));
        }
        json.push(']');
        json.push_str(r#","factors":[["#);
        for (i, factor_row) in result.terms.factors.iter().enumerate() {
            if i > 0 {
                json.push_str("],[");
            }
            for (j, val) in factor_row.iter().enumerate() {
                if j > 0 {
                    json.push(',');
                }
                json.push_str(&val.to_string());
            }
        }
        json.push_str("]]");
        json.push_str(r#","term_labels":["#);
        for (i, label) in result.terms.term_labels.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(r#""{}""#, label));
        }
        json.push(']');
        json.push_str(r#","order":["#);
        for (i, order) in result.terms.order.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&order.to_string());
        }
        json.push(']');
        json.push_str(&format!(r#","intercept":{}"#, result.terms.intercept));
        json.push_str(&format!(r#","response":{}"#, result.terms.response));
        json.push_str(r#","data_classes":{}"#);
        json.push('}');
    }

    // Add additional diagnostic fields
    json.push_str(&format!(
        r#","r_squared":{}"#,
        format_json_number(result.r_squared)
    ));
    json.push_str(&format!(
        r#","adjusted_r_squared":{}"#,
        format_json_number(result.adjusted_r_squared)
    ));
    json.push_str(&format!(
        r#","f_statistic":{}"#,
        format_json_number(result.f_statistic)
    ));
    json.push_str(&format!(
        r#","residual_standard_error":{}"#,
        format_json_number(result.residual_standard_error)
    ));
    json.push_str(&format!(r#","n_observations":{}"#, result.n_observations));
    json.push_str(&format!(
        r#","dispersion_parameter":{}"#,
        format_json_number(result.dispersion_parameter)
    ));

    // Add model matrix info
    json.push_str(r#","model_matrix":[["#);
    for (i, row) in result.model_matrix.iter().enumerate() {
        if i > 0 {
            json.push_str("],[");
        }
        for (j, val) in row.iter().enumerate() {
            if j > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
    }
    json.push_str("]]");
    json.push_str(&format!(
        r#","model_matrix_dimensions":[{},{}]"#,
        result.model_matrix_dimensions.0, result.model_matrix_dimensions.1
    ));
    json.push_str(r#","model_matrix_column_names":["#);
    for (i, name) in result.model_matrix_column_names.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format!(r#""{}""#, name));
    }
    json.push(']');

    // Add standard errors
    json.push_str(r#","standard_errors":["#);
    for (i, val) in result.standard_errors.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add t_statistics
    json.push_str(r#","t_statistics":["#);
    for (i, val) in result.t_statistics.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add p_values
    json.push_str(r#","p_values":["#);
    for (i, val) in result.p_values.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add covariance matrix
    json.push_str(r#","covariance_matrix":[["#);
    for (i, row) in result.covariance_matrix.iter().enumerate() {
        if i > 0 {
            json.push_str("],[");
        }
        for (j, val) in row.iter().enumerate() {
            if j > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
    }
    json.push_str("]]");

    // Add leverage (hat values)
    json.push_str(r#","leverage":["#);
    for (i, val) in result.leverage.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add Cook's distance
    json.push_str(r#","cooks_distance":["#);
    for (i, val) in result.cooks_distance.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add additional required fields for deserialization
    // Add control
    json.push_str(&format!(
        r#","control":{{"epsilon":{},"maxit":{},"trace":{}}}"#,
        result.control.epsilon,
        result.control.maxit,
        result.control.trace
    ));

    // Add method
    json.push_str(&format!(r#","method":"{}""#, result.method));

    // Add contrasts
    json.push_str(r#","contrasts":{"#);
    let mut first = true;
    for (key, val) in &result.contrasts {
        if !first {
            json.push(',');
        }
        first = false;
        json.push_str(&format!(r#""{}":"{}""#, key, val));
    }
    json.push('}');

    // Add xlevels
    json.push_str(r#","xlevels":{"#);
    first = true;
    for (key, vals) in &result.xlevels {
        if !first {
            json.push(',');
        }
        first = false;
        json.push_str(&format!(r#""{}":["#, key));
        for (i, v) in vals.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(r#""{}""#, v));
        }
        json.push(']');
    }
    json.push('}');

    // Add data
    json.push_str(&format!(r#","data":"{}""#, result.data));

    // Add offset
    if let Some(offset) = &result.offset {
        json.push_str(r#","offset":["#);
        for (i, val) in offset.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
        json.push(']');
    } else {
        json.push_str(r#","offset":null"#);
    }

    // Add backward compatibility fields
    json.push_str(&format!(r#","qr_rank":{}"#, result.qr_rank));
    json.push_str(&format!(r#","tol":{}"#, result.tol));
    json.push_str(&format!(r#","pivoted":{}"#, result.pivoted));
    json.push_str(&format!(r#","dispersion":{}"#, format_json_number(result.dispersion)));

    if let Some(na_action) = &result.na_action {
        json.push_str(&format!(r#","na_action":"{}""#, na_action));
    } else {
        json.push_str(r#","na_action":null"#);
    }

    // Add response_variable_name, predictor_variable_names, factor_levels, reference_levels
    json.push_str(&format!(r#","response_variable_name":"{}""#, result.response_variable_name));

    json.push_str(r#","predictor_variable_names":["#);
    for (i, name) in result.predictor_variable_names.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format!(r#""{}""#, name));
    }
    json.push(']');

    json.push_str(r#","factor_levels":{"#);
    first = true;
    for (key, vals) in &result.factor_levels {
        if !first {
            json.push(',');
        }
        first = false;
        json.push_str(&format!(r#""{}":["#, key));
        for (i, v) in vals.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(r#""{}""#, v));
        }
        json.push(']');
    }
    json.push('}');

    json.push_str(r#","reference_levels":{"#);
    first = true;
    for (key, val) in &result.reference_levels {
        if !first {
            json.push(',');
        }
        first = false;
        json.push_str(&format!(r#""{}":"{}""#, key, val));
    }
    json.push('}');

    // Add deviance_explained_percent
    json.push_str(&format!(
        r#","deviance_explained_percent":{}"#,
        format_json_number(result.deviance_explained_percent)
    ));

    // Add f_p_value
    json.push_str(&format!(
        r#","f_p_value":{}"#,
        format_json_number(result.f_p_value)
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

/// WASM export for GLM summary
///
/// Returns coefficient table with test statistics and p-values
#[wasm_bindgen]
pub fn glm_summary_wasm(result_json: &str) -> String {
    use super::glm_diagnostics::GlmSummaryTable;

    // Parse GLM result from JSON
    let result: GlmResult = match serde_json::from_str(result_json) {
        Ok(r) => r,
        Err(e) => return format_error(&format!("Failed to parse GLM result: {}", e)),
    };

    // Compute summary
    let summary = match result.summary() {
        Ok(s) => s,
        Err(e) => return format_error(&e),
    };

    // Format as JSON
    format_summary_table(&summary)
}

/// WASM export for standardized residuals
///
/// Returns rstandard() values
#[wasm_bindgen]
pub fn glm_rstandard_wasm(result_json: &str, residual_type: &str) -> String {
    // Parse GLM result from JSON
    let result: GlmResult = match serde_json::from_str(result_json) {
        Ok(r) => r,
        Err(e) => return format_error(&format!("Failed to parse GLM result: {}", e)),
    };

    // Compute rstandard
    let rstandard = match result.rstandard(residual_type) {
        Ok(r) => r,
        Err(e) => return format_error(&e),
    };

    // Format as JSON array
    format_vector(&rstandard)
}

/// WASM export for studentized residuals
///
/// Returns rstudent() values
#[wasm_bindgen]
pub fn glm_rstudent_wasm(result_json: &str) -> String {
    // Parse GLM result from JSON
    let result: GlmResult = match serde_json::from_str(result_json) {
        Ok(r) => r,
        Err(e) => return format_error(&format!("Failed to parse GLM result: {}", e)),
    };

    // Compute rstudent
    let rstudent = match result.rstudent() {
        Ok(r) => r,
        Err(e) => return format_error(&e),
    };

    // Format as JSON array
    format_vector(&rstudent)
}

/// WASM export for influence measures
///
/// Returns influence() measures (dfbeta, dfbetas, dffits, covratio, cook's distance)
#[wasm_bindgen]
pub fn glm_influence_wasm(result_json: &str) -> String {
    use super::glm_diagnostics::GlmInfluence;

    // Parse GLM result from JSON
    let result: GlmResult = match serde_json::from_str(result_json) {
        Ok(r) => r,
        Err(e) => return format_error(&format!("Failed to parse GLM result: {}", e)),
    };

    // Compute influence measures
    let influence = match result.influence() {
        Ok(i) => i,
        Err(e) => return format_error(&e),
    };

    // Format as JSON
    format_influence(&influence)
}

/// GLM confint() - Compute confidence intervals for coefficients
#[wasm_bindgen]
pub fn glm_confint_wasm(result_json: &str, level: f64) -> String {
    // Parse GLM result
    let result: super::types_results::GlmResult = match serde_json::from_str(result_json) {
        Ok(r) => r,
        Err(e) => {
            return format!(r#"{{"error":"Failed to parse GLM result: {}"}}"#, e);
        }
    };

    // Compute confint
    let confint = match result.confint(level) {
        Ok(ci) => ci,
        Err(e) => {
            return format!(r#"{{"error":"{}"}}"#, e);
        }
    };

    // Format as JSON
    format_confint(&confint)
}

/// GLM predict() - Make predictions on new data
#[wasm_bindgen]
pub fn glm_predict_wasm(result_json: &str, newdata_json: &str, pred_type: &str) -> String {
    // Parse GLM result
    let result: super::types_results::GlmResult = match serde_json::from_str(result_json) {
        Ok(r) => r,
        Err(e) => {
            return format!(r#"{{"error":"Failed to parse GLM result: {}"}}"#, e);
        }
    };

    // Parse newdata (expecting array of arrays: [[1, 2, 3], [4, 5, 6], ...])
    let newdata: Vec<Vec<f64>> = match serde_json::from_str(newdata_json) {
        Ok(d) => d,
        Err(e) => {
            return format!(r#"{{"error":"Failed to parse newdata: {}"}}"#, e);
        }
    };

    // Make predictions
    let predictions = match result.predict(&newdata, pred_type) {
        Ok(pred) => pred,
        Err(e) => {
            return format!(r#"{{"error":"{}"}}"#, e);
        }
    };

    // Format as JSON array
    let pred_str = predictions
        .iter()
        .map(|x| format_json_number(*x))
        .collect::<Vec<_>>()
        .join(",");
    format!("[{}]", pred_str)
}

/// Format confint as JSON
fn format_confint(confint: &super::glm_diagnostics::GlmConfint) -> String {
    let mut json = String::new();
    json.push('{');

    // Add names
    json.push_str(r#""names":["#);
    for (i, name) in confint.names.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format!(r#""{}""#, name));
    }
    json.push(']');

    // Add lower bounds
    json.push_str(r#","lower":["#);
    for (i, val) in confint.lower.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add upper bounds
    json.push_str(r#","upper":["#);
    for (i, val) in confint.upper.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    json.push('}');
    json
}

/// Format summary table as JSON
fn format_summary_table(summary: &super::glm_diagnostics::GlmSummaryTable) -> String {
    let mut json = String::new();
    json.push('{');

    // Add names
    json.push_str(r#""names":["#);
    for (i, name) in summary.names.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format!(r#""{}""#, name));
    }
    json.push(']');

    // Add estimate
    json.push_str(r#","estimate":["#);
    for (i, val) in summary.estimate.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add std_error
    json.push_str(r#","std_error":["#);
    for (i, val) in summary.std_error.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add statistic
    json.push_str(r#","statistic":["#);
    for (i, val) in summary.statistic.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add p_value
    json.push_str(r#","p_value":["#);
    for (i, val) in summary.p_value.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add dispersion
    json.push_str(&format!(
        r#","dispersion":{}"#,
        format_json_number(summary.dispersion)
    ));

    // Add is_fixed_dispersion
    json.push_str(&format!(
        r#","is_fixed_dispersion":{}"#,
        summary.is_fixed_dispersion
    ));

    json.push('}');
    json
}

/// Format influence measures as JSON
fn format_influence(influence: &super::glm_diagnostics::GlmInfluence) -> String {
    let mut json = String::new();
    json.push('{');

    // Add dfbeta (n x p matrix)
    json.push_str(r#""dfbeta":[["#);
    for (i, row) in influence.dfbeta.iter().enumerate() {
        if i > 0 {
            json.push_str("],[");
        }
        for (j, val) in row.iter().enumerate() {
            if j > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
    }
    json.push_str("]]");

    // Add dfbetas (n x p matrix)
    json.push_str(r#","dfbetas":[["#);
    for (i, row) in influence.dfbetas.iter().enumerate() {
        if i > 0 {
            json.push_str("],[");
        }
        for (j, val) in row.iter().enumerate() {
            if j > 0 {
                json.push(',');
            }
            json.push_str(&format_json_number(*val));
        }
    }
    json.push_str("]]");

    // Add dffits
    json.push_str(r#","dffits":["#);
    for (i, val) in influence.dffits.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add covratio
    json.push_str(r#","covratio":["#);
    for (i, val) in influence.covratio.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add cook's distance
    json.push_str(r#","cooks_distance":["#);
    for (i, val) in influence.cooks_distance.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    // Add hat values
    json.push_str(r#","hat":["#);
    for (i, val) in influence.hat.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');

    json.push('}');
    json
}

/// Format vector as JSON array
fn format_vector(vec: &[f64]) -> String {
    let mut json = String::from("[");
    for (i, val) in vec.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push_str(&format_json_number(*val));
    }
    json.push(']');
    json
}
