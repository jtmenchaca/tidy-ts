//! GLM ANOVA multiple models functions
//!
//! This file contains ANOVA calculation logic for multiple GLM objects.

use super::glm_anova_core_single::anova_glm;
use super::types::{AnovaRow, GlmAnova, GlmResult};

/// GLM ANOVA for multiple models
///
/// This function performs analysis of deviance for multiple GLM objects.
///
/// # Arguments
///
/// * `objects` - Vector of GLM result objects
/// * `dispersion` - Dispersion parameter (optional)
/// * `test` - Test statistic to use ("Chisq", "F", "Rao", or None)
///
/// # Returns
///
/// A `GlmAnova` containing the analysis of deviance table.
///
/// # Errors
///
/// Returns an error if the ANOVA calculation fails.
pub fn anova_glmlist(
    objects: &[GlmResult],
    dispersion: Option<f64>,
    test: Option<String>,
) -> Result<GlmAnova, String> {
    if objects.is_empty() {
        return Err("no objects provided".to_string());
    }

    if objects.len() == 1 {
        return anova_glm(&objects[0], dispersion, test);
    }

    // Check that all models have the same response
    let first_response = &objects[0].y;
    for obj in objects.iter() {
        if obj.y != *first_response {
            return Err(format!(
                "models with response {:?} removed because response differs from model 1",
                obj.y
            ));
        }
    }

    // Check that all models have the same number of observations
    let first_n = objects[0].y.len();
    for obj in objects.iter() {
        if obj.y.len() != first_n {
            return Err("models were not all fitted to the same size of dataset".to_string());
        }
    }

    // Extract statistics
    let resdf: Vec<f64> = objects.iter().map(|obj| obj.df_residual as f64).collect();
    let resdev: Vec<f64> = objects.iter().map(|obj| obj.deviance).collect();

    // Calculate score statistics if requested
    let mut score = Vec::new();
    if let Some(ref test_type) = test {
        if test_type == "Rao" {
            score = vec![f64::NAN; objects.len()];
            // TODO: Calculate Rao score statistics for each model
        }
    }

    // Construct table
    let mut table = Vec::new();
    let mut column_names = vec![
        "Resid. Df".to_string(),
        "Resid. Dev".to_string(),
        "Df".to_string(),
        "Deviance".to_string(),
    ];
    let mut row_names = Vec::new();

    for i in 0..objects.len() {
        let df = if i == 0 {
            None
        } else {
            Some(resdf[i - 1] - resdf[i])
        };
        let deviance = if i == 0 {
            None
        } else {
            Some(resdev[i - 1] - resdev[i])
        };

        table.push(AnovaRow {
            df,
            deviance,
            resid_df: resdf[i],
            resid_deviance: resdev[i],
            rao: if score.is_empty() {
                None
            } else {
                Some(score[i])
            },
            f_statistic: None,
            p_value: None,
        });

        row_names.push(format!("{}", i + 1));
    }

    // Add score column if requested
    if !score.is_empty() {
        column_names.push("Rao".to_string());
    }

    // Create variables list
    let variables: Vec<String> = objects
        .iter()
        .map(|obj| obj.formula.clone().unwrap_or_else(|| "y ~ x".to_string()))
        .collect();

    let title = "Analysis of Deviance Table\n".to_string();
    let topnote = (1..=objects.len())
        .zip(variables.iter())
        .map(|(i, var)| format!("Model {}: {}", i, var))
        .collect::<Vec<String>>()
        .join("\n");

    // Calculate test statistics if needed
    if let Some(ref test_type) = test {
        if test_type == "Chisq" || test_type == "F" {
            // TODO: Calculate chi-square or F statistics
            for row in table.iter_mut() {
                if let Some(df) = row.df {
                    if df > 0.0 {
                        // Placeholder for test statistic calculation
                        row.f_statistic = Some(row.deviance.unwrap_or(0.0) / df);
                        row.p_value = Some(0.05); // Placeholder
                    }
                }
            }
        }
    }

    Ok(GlmAnova {
        table,
        column_names,
        row_names,
        heading: vec![title, topnote],
        class: vec!["anova".to_string(), "data.frame".to_string()],
    })
}
