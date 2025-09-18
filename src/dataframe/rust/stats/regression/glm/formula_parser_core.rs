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
/// Properly handles interaction terms like "x1 * x2" which expand to "x1 + x2 + x1:x2".
///
/// # Arguments
///
/// * `formula` - Formula string (e.g., "y ~ x1 + x2", "y ~ x1 * x2")
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

    // Pass 1: collect main effects across all parts in appearance order (R-like)
    for part in &predictor_parts {
        if part.contains('*') {
            let interaction_vars: Vec<&str> = part
                .split('*')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();
            for var in &interaction_vars {
                let v = var.to_string();
                if !predictors.contains(&v) {
                    predictors.push(v);
                }
            }
        } else {
            let v = part.to_string();
            if !predictors.contains(&v) {
                predictors.push(v);
            }
        }
    }

    // Pass 2: append interaction terms per part, preserving part order (R-like)
    for part in &predictor_parts {
        if part.contains('*') {
            let interaction_vars: Vec<&str> = part
                .split('*')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();

            let m = interaction_vars.len();
            if m >= 2 {
                // 2-way interactions (R-like order by increasing second index)
                for b in 1..m {
                    for a in 0..b {
                        let combo = format!("{}:{}", interaction_vars[a], interaction_vars[b]);
                        if !predictors.contains(&combo) {
                            predictors.push(combo);
                        }
                    }
                }
                // 3-way interactions
                if m >= 3 {
                    for i in 0..m {
                        for j in (i + 1)..m {
                            for k in (j + 1)..m {
                                let combo = format!(
                                    "{}:{}:{}",
                                    interaction_vars[i], interaction_vars[j], interaction_vars[k]
                                );
                                if !predictors.contains(&combo) {
                                    predictors.push(combo);
                                }
                            }
                        }
                    }
                }
                // 4-way interactions
                if m >= 4 {
                    for i in 0..m {
                        for j in (i + 1)..m {
                            for k in (j + 1)..m {
                                for l in (k + 1)..m {
                                    let combo = format!(
                                        "{}:{}:{}:{}",
                                        interaction_vars[i],
                                        interaction_vars[j],
                                        interaction_vars[k],
                                        interaction_vars[l]
                                    );
                                    if !predictors.contains(&combo) {
                                        predictors.push(combo);
                                    }
                                }
                            }
                        }
                    }
                }
                // 5-way interactions
                if m >= 5 {
                    for i in 0..m {
                        for j in (i + 1)..m {
                            for k in (j + 1)..m {
                                for l in (k + 1)..m {
                                    for r in (l + 1)..m {
                                        let combo = format!(
                                            "{}:{}:{}:{}:{}",
                                            interaction_vars[i],
                                            interaction_vars[j],
                                            interaction_vars[k],
                                            interaction_vars[l],
                                            interaction_vars[r]
                                        );
                                        if !predictors.contains(&combo) {
                                            predictors.push(combo);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
