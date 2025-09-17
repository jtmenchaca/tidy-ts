//! Formula parser core functionality
//!
//! This file contains the core formula parsing functions.

/// Parsed formula information
#[derive(Debug, Clone)]
pub struct ParsedFormula {
    /// Response variable name
    pub response: String,
    /// Predictor variable names
    pub predictors: Vec<String>,
    /// Whether the model has an intercept
    pub has_intercept: bool,
    /// Original formula string
    pub formula: String,
}

/// Parse a formula string
///
/// This function parses a formula string like "y ~ x1 + x2" into its components.
///
/// # Arguments
///
/// * `formula` - Formula string (e.g., "y ~ x1 + x2")
///
/// # Returns
///
/// A `ParsedFormula` containing the parsed information.
///
/// # Errors
///
/// Returns an error if the formula cannot be parsed.
pub fn parse_formula(formula: &str) -> Result<ParsedFormula, String> {
    let formula = formula.trim();

    // Split on ~ to separate response and predictors
    let parts: Vec<&str> = formula.split('~').collect();
    if parts.len() != 2 {
        return Err("Formula must contain exactly one '~'".to_string());
    }

    let response = parts[0].trim().to_string();
    let predictor_str = parts[1].trim();

    if response.is_empty() {
        return Err("Response variable cannot be empty".to_string());
    }

    // Parse predictors
    let mut predictors = Vec::new();
    let mut has_intercept = true;

    // Check for intercept removal
    if predictor_str.starts_with("0 +") || predictor_str.starts_with("-1 +") {
        has_intercept = false;
    }

    // Split predictors by + and clean up
    let predictor_parts: Vec<&str> = predictor_str
        .split('+')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty() && *s != "0" && *s != "-1")
        .collect();

    for part in predictor_parts {
        // Handle interactions (for now, just split on *)
        let interaction_parts: Vec<&str> = part
            .split('*')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect();

        for var in interaction_parts {
            if !var.is_empty() {
                predictors.push(var.to_string());
            }
        }
    }

    // If no predictors and no intercept removal, add intercept
    if predictors.is_empty() && has_intercept {
        predictors.push("(Intercept)".to_string());
    }

    Ok(ParsedFormula {
        response,
        predictors,
        has_intercept,
        formula: formula.to_string(),
    })
}
