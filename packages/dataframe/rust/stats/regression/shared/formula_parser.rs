//! Shared formula parser for GLM and LM
//!
//! This module provides a unified formula parsing implementation that both
//! GLM and LM can use to ensure consistency.

use std::collections::HashMap;

/// Parsed formula information
#[derive(Debug, Clone)]
pub struct ParsedFormula {
    /// Response variable name
    pub response: String,
    /// Predictor variable names (including interactions)
    pub predictors: Vec<String>,
    /// Whether the model has an intercept
    pub has_intercept: bool,
    /// Original formula string
    pub formula: String,
}

/// Parse a formula string
///
/// This function parses a formula string like "y ~ x1 + x2" into its components.
/// Properly handles interaction terms like "x1 * x2 * x3" which expand to all
/// combinations: "x1 + x2 + x3 + x1:x2 + x1:x3 + x2:x3 + x1:x2:x3".
///
/// # Arguments
///
/// * `formula` - Formula string (e.g., "y ~ x1 + x2", "y ~ x1 * x2 * x3")
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

    // Handle intercept-only model
    if predictor_str == "1" {
        return Ok(ParsedFormula {
            response,
            predictors: vec!["(Intercept)".to_string()],
            has_intercept: true,
            formula: formula.to_string(),
        });
    }

    // Always include intercept first if present
    if has_intercept {
        predictors.push("(Intercept)".to_string());
    }

    // Split predictors by + and clean up
    let predictor_parts: Vec<&str> = predictor_str
        .split('+')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty() && *s != "0" && *s != "-1" && *s != "1")
        .collect();

    // First pass: collect all main effects in order
    let mut main_effects = Vec::new();
    let mut interaction_specs = Vec::new();

    for part in &predictor_parts {
        if part.contains('*') {
            // Store interaction spec for later processing
            let interaction_vars: Vec<&str> = part
                .split('*')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();

            if interaction_vars.len() >= 2 {
                // Add main effects from this interaction to the list
                for var in &interaction_vars {
                    if !main_effects.contains(&var.to_string()) {
                        main_effects.push(var.to_string());
                    }
                }
                interaction_specs.push(interaction_vars);
            }
        } else {
            // Simple main effect
            if !main_effects.contains(&part.to_string()) {
                main_effects.push(part.to_string());
            }
        }
    }

    // Add all main effects to predictors first
    for main_effect in main_effects {
        predictors.push(main_effect);
    }

    // Second pass: add interactions per part, preserving part order (R-like)
    for interaction_vars in interaction_specs {
        let m = interaction_vars.len();
        if m >= 2 {
            // 2-way interactions (by increasing second index)
            for b in 1..m {
                for a in 0..b {
                    let interaction = format!("{}:{}", interaction_vars[a], interaction_vars[b]);
                    if !predictors.contains(&interaction) {
                        predictors.push(interaction);
                    }
                }
            }
            // 3-way
            if m >= 3 {
                for i in 0..m {
                    for j in (i + 1)..m {
                        for k in (j + 1)..m {
                            let interaction = format!(
                                "{}:{}:{}",
                                interaction_vars[i], interaction_vars[j], interaction_vars[k]
                            );
                            if !predictors.contains(&interaction) {
                                predictors.push(interaction);
                            }
                        }
                    }
                }
            }
            // 4-way
            if m >= 4 {
                for i in 0..m {
                    for j in (i + 1)..m {
                        for k in (j + 1)..m {
                            for l in (k + 1)..m {
                                let interaction = format!(
                                    "{}:{}:{}:{}",
                                    interaction_vars[i],
                                    interaction_vars[j],
                                    interaction_vars[k],
                                    interaction_vars[l]
                                );
                                if !predictors.contains(&interaction) {
                                    predictors.push(interaction);
                                }
                            }
                        }
                    }
                }
            }
            // 5-way
            if m >= 5 {
                for i in 0..m {
                    for j in (i + 1)..m {
                        for k in (j + 1)..m {
                            for l in (k + 1)..m {
                                for r in (l + 1)..m {
                                    let interaction = format!(
                                        "{}:{}:{}:{}:{}",
                                        interaction_vars[i],
                                        interaction_vars[j],
                                        interaction_vars[k],
                                        interaction_vars[l],
                                        interaction_vars[r]
                                    );
                                    if !predictors.contains(&interaction) {
                                        predictors.push(interaction);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(ParsedFormula {
        response,
        predictors,
        has_intercept,
        formula: formula.to_string(),
    })
}

/// Generate all k-length combinations from a slice of items
#[allow(dead_code)]
fn generate_combinations<T: Clone>(items: &[T], k: usize) -> Vec<Vec<T>> {
    if k == 0 || k > items.len() {
        return vec![];
    }

    if k == 1 {
        return items.iter().map(|item| vec![item.clone()]).collect();
    }

    let mut result = vec![];

    // Use indices to generate combinations
    let indices = generate_combination_indices(items.len(), k);
    for idx_combo in indices {
        let combo = idx_combo.iter().map(|&i| items[i].clone()).collect();
        result.push(combo);
    }

    result
}

/// Generate all k-length combinations of indices from 0..n
#[allow(dead_code)]
fn generate_combination_indices(n: usize, k: usize) -> Vec<Vec<usize>> {
    if k == 0 || k > n {
        return vec![];
    }

    if k == 1 {
        return (0..n).map(|i| vec![i]).collect();
    }

    let mut result = vec![];
    generate_combinations_recursive(n, k, 0, &mut vec![], &mut result);
    result
}

/// Recursive helper for generating combinations
#[allow(dead_code)]
fn generate_combinations_recursive(
    n: usize,
    k: usize,
    start: usize,
    current: &mut Vec<usize>,
    result: &mut Vec<Vec<usize>>,
) {
    if current.len() == k {
        result.push(current.clone());
        return;
    }

    for i in start..n {
        current.push(i);
        generate_combinations_recursive(n, k, i + 1, current, result);
        current.pop();
    }
}

/// Build design matrix from data and predictor names
pub fn build_design_matrix(
    data: &HashMap<String, Vec<f64>>,
    predictor_names: &[String],
    n: usize,
) -> Result<(Vec<f64>, usize), String> {
    let p = predictor_names.len();
    let mut x = Vec::with_capacity(n * p);

    // Column-major order for Fortran compatibility
    for predictor in predictor_names {
        if predictor == "(Intercept)" {
            // Add intercept column of ones
            for _ in 0..n {
                x.push(1.0);
            }
        } else if predictor.contains(':') {
            // Handle interaction terms
            let interaction_vars: Vec<&str> = predictor.split(':').collect();
            let mut interaction_values = vec![1.0; n];

            // Multiply all variables in the interaction
            for var in interaction_vars {
                let var_values = data
                    .get(var)
                    .ok_or_else(|| format!("Interaction variable '{}' not found in data", var))?;

                if var_values.len() != n {
                    return Err(format!(
                        "Interaction variable '{}' has {} observations, expected {}",
                        var,
                        var_values.len(),
                        n
                    ));
                }

                for i in 0..n {
                    interaction_values[i] *= var_values[i];
                }
            }

            x.extend_from_slice(&interaction_values);
        } else {
            // Get predictor values from data
            match data.get(predictor) {
                Some(values) => {
                    if values.len() != n {
                        return Err(format!(
                            "Predictor '{}' has {} values, expected {}",
                            predictor,
                            values.len(),
                            n
                        ));
                    }
                    x.extend_from_slice(values);
                }
                None => {
                    return Err(format!("Predictor '{}' not found in data", predictor));
                }
            }
        }
    }

    Ok((x, p))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_formula() {
        let result = parse_formula("y ~ x1 + x2").unwrap();
        assert_eq!(result.response, "y");
        assert_eq!(result.predictors, vec!["(Intercept)", "x1", "x2"]);
        assert!(result.has_intercept);
    }

    #[test]
    fn test_interaction_formula() {
        let result = parse_formula("y ~ x1 * x2").unwrap();
        assert_eq!(result.response, "y");
        assert_eq!(result.predictors, vec!["(Intercept)", "x1", "x2", "x1:x2"]);
        assert!(result.has_intercept);
    }

    #[test]
    fn test_three_way_interaction() {
        let result = parse_formula("y ~ x1 * x2 * x3").unwrap();
        assert_eq!(result.response, "y");
        let expected = vec![
            "(Intercept)",
            "x1",
            "x2",
            "x3",
            "x1:x2",
            "x1:x3",
            "x2:x3",
            "x1:x2:x3",
        ];
        assert_eq!(result.predictors, expected);
        assert!(result.has_intercept);
    }

    #[test]
    fn test_combinations() {
        let items = vec!["a", "b", "c"];
        let combos = generate_combinations(&items, 2);
        assert_eq!(combos.len(), 3);
        assert!(combos.contains(&vec!["a", "b"]));
        assert!(combos.contains(&vec!["a", "c"]));
        assert!(combos.contains(&vec!["b", "c"]));
    }
}
