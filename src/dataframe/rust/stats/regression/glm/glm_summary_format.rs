//! GLM summary format functions
//!
//! This file contains the format functions for GLM summary.

use super::types::GlmSummary;

/// Format GLM summary as string
///
/// This function formats a GLM summary as a string without printing it.
///
/// # Arguments
///
/// * `x` - GLM summary to format
/// * `digits` - Number of digits to display (default: 3)
/// * `symbolic_cor` - Whether to use symbolic correlation (default: false)
/// * `signif_stars` - Whether to show significance stars (default: true)
/// * `show_residuals` - Whether to show residual summary (default: false)
///
/// # Returns
///
/// A formatted string representation of the GLM summary.
pub fn format_summary_glm(
    x: &GlmSummary,
    digits: Option<usize>,
    symbolic_cor: Option<bool>,
    signif_stars: Option<bool>,
    show_residuals: Option<bool>,
) -> String {
    let mut output = String::new();

    let digits = digits.unwrap_or(3);
    let symbolic_cor = symbolic_cor.unwrap_or(false);
    let signif_stars = signif_stars.unwrap_or(true);
    let show_residuals = show_residuals.unwrap_or(false);

    // Format call
    output.push_str(&format_call(x));

    // Format residuals if requested
    if show_residuals {
        output.push_str(&format_residuals(x));
    }

    // Format coefficients
    output.push_str(&format_coefficients(x, signif_stars));

    // Format dispersion parameter
    output.push_str(&format_dispersion(x));

    // Format deviance information
    output.push_str(&format_deviance_info(x));

    // Format NA action if available
    output.push_str(&format_na_action(x));

    // Format AIC and iterations
    output.push_str(&format_aic_and_iterations(x));

    // Format correlation matrix if available
    output.push_str(&format_correlation_matrix(x, symbolic_cor));

    output.push_str("\n");
    output
}

/// Format call information
fn format_call(x: &GlmSummary) -> String {
    if let Some(ref call) = x.call {
        format!("\nCall:\n{}\n\n", call)
    } else {
        "\nCall:\nglm(formula = ..., family = ..., data = ...)\n\n".to_string()
    }
}

/// Format residuals summary
fn format_residuals(x: &GlmSummary) -> String {
    let mut output = String::new();
    output.push_str("Deviance Residuals: \n");

    if x.df_residual > 5 {
        // Calculate quantiles
        let mut sorted_resid = x.deviance_residuals.clone();
        sorted_resid.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let n = sorted_resid.len();
        let quantiles = vec![
            sorted_resid[0],         // Min
            sorted_resid[n / 4],     // 1Q
            sorted_resid[n / 2],     // Median
            sorted_resid[3 * n / 4], // 3Q
            sorted_resid[n - 1],     // Max
        ];
        output.push_str(&format!(
            "{:>8} {:>8} {:>8} {:>8} {:>8}\n",
            "Min", "1Q", "Median", "3Q", "Max"
        ));
        output.push_str(&format!(
            "{:>8.3} {:>8.3} {:>8.3} {:>8.3} {:>8.3}\n",
            quantiles[0], quantiles[1], quantiles[2], quantiles[3], quantiles[4]
        ));
    } else {
        for (i, &resid) in x.deviance_residuals.iter().enumerate() {
            if i > 0 {
                output.push_str(" ");
            }
            output.push_str(&format!("{:8.3}", resid));
        }
        output.push_str("\n");
    }

    output
}

/// Format coefficients table
fn format_coefficients(x: &GlmSummary, signif_stars: bool) -> String {
    let mut output = String::new();

    if x.aliased.is_empty() {
        output.push_str("\nNo Coefficients\n\n");
    } else {
        let n_singular = x.df.2 - x.df.0;
        if n_singular > 0 {
            output.push_str(&format!(
                "\nCoefficients: ({} not defined because of singularities)\n\n",
                n_singular
            ));
        } else {
            output.push_str("\nCoefficients:\n\n");
        }

        // Format coefficient table
        output.push_str(&format!(
            "{:>12} {:>12} {:>12} {:>12} {:>12}\n",
            "", "Estimate", "Std. Error", "t value", "Pr(>|t|)"
        ));

        for coef in &x.coefficients {
            let stars = if signif_stars {
                get_significance_stars(coef.p_value)
            } else {
                " "
            };

            output.push_str(&format!(
                "{:>12} {:>12.3} {:>12.3} {:>12.3} {:>12.3}{}\n",
                coef.name, coef.estimate, coef.std_error, coef.test_statistic, coef.p_value, stars
            ));
        }
    }

    output
}

/// Get significance stars for p-value
fn get_significance_stars(p_value: f64) -> &'static str {
    if p_value < 0.001 {
        "***"
    } else if p_value < 0.01 {
        "**"
    } else if p_value < 0.05 {
        "*"
    } else if p_value < 0.1 {
        "."
    } else {
        " "
    }
}

/// Format dispersion parameter
fn format_dispersion(x: &GlmSummary) -> String {
    format!(
        "\n(Dispersion parameter for {} family taken to be {:.3})\n\n",
        x.family.family_name(),
        x.dispersion
    )
}

/// Format deviance information
fn format_deviance_info(x: &GlmSummary) -> String {
    format!(
        "{:>12} deviance: {:>12.3} on {:>3} degrees of freedom\n",
        "Null", x.null_deviance, x.df_null
    ) + &format!(
        "{:>12} deviance: {:>12.3} on {:>3} degrees of freedom\n",
        "Residual", x.deviance, x.df_residual
    )
}

/// Format NA action if available
fn format_na_action(x: &GlmSummary) -> String {
    if let Some(ref na_action) = x.na_action {
        if !na_action.is_empty() && na_action != "na.omit" {
            format!("  ({})\n", na_action)
        } else {
            String::new()
        }
    } else {
        String::new()
    }
}

/// Format AIC and iterations
fn format_aic_and_iterations(x: &GlmSummary) -> String {
    format!("AIC: {:.1}\n\n", x.aic)
        + &format!("Number of Fisher Scoring iterations: {}\n\n", x.iter)
}

/// Format correlation matrix if available
fn format_correlation_matrix(x: &GlmSummary, symbolic_cor: bool) -> String {
    if let Some(ref correl) = x.correlation {
        let p = correl.len();
        if p > 1 {
            let mut output = String::new();
            output.push_str("\nCorrelation of Coefficients:\n\n");
            if let Some(true) = x.symbolic_cor {
                // TODO: Implement symbolic correlation formatting
                output.push_str("(symbolic correlation matrix)\n");
            } else {
                // Format numeric correlation matrix
                for i in 0..p {
                    for j in 0..p {
                        if j < i {
                            output.push_str(&format!("{:>8.2}", correl[i][j]));
                        } else {
                            output.push_str(&format!("{:>8}", ""));
                        }
                    }
                    output.push_str("\n");
                }
            }
            output
        } else {
            String::new()
        }
    } else {
        String::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::gaussian::GaussianFamily;
    use crate::stats::regression::glm::glm_control::glm_control;
    use crate::stats::regression::glm::glm_summary_core::summary_glm;
    use crate::stats::regression::glm::types::GlmResult;

    fn create_test_glm_result() -> GlmResult {
        let family = Box::new(GaussianFamily::identity());
        let control = glm_control(None, None, None).unwrap();

        GlmResult {
            coefficients: vec![1.0, 2.0],
            residuals: vec![0.1, -0.1, 0.0],
            fitted_values: vec![1.0, 2.0, 3.0],
            linear_predictors: vec![1.0, 2.0, 3.0],
            working_residuals: vec![0.1, -0.1, 0.0],
            response_residuals: vec![0.1, -0.1, 0.0],
            deviance_residuals: vec![0.1, -0.1, 0.0],
            pearson_residuals: vec![0.1, -0.1, 0.0],
            effects: None,
            r_matrix: None,
            qr: None,
            rank: 2,
            qr_rank: 2,
            pivot: vec![0, 1],
            tol: 1e-8,
            pivoted: false,
            family,
            deviance: 0.02,
            aic: 10.0,
            null_deviance: 2.0,
            iter: 3,
            weights: vec![1.0, 1.0, 1.0],
            prior_weights: vec![1.0, 1.0, 1.0],
            df_residual: 1,
            df_null: 2,
            y: vec![1.1, 1.9, 3.0],
            converged: true,
            boundary: false,
            model: None,
            x: None,
            call: Some("glm(formula = y ~ x, family = gaussian, data = data)".to_string()),
            formula: Some("y ~ x".to_string()),
            terms: Some("y ~ x".to_string()),
            data: Some("data".to_string()),
            offset: None,
            control,
            method: "glm.fit".to_string(),
            contrasts: None,
            xlevels: None,
            na_action: Some("na.omit".to_string()),
        }
    }

    #[test]
    fn test_format_summary_glm() {
        let result = create_test_glm_result();
        let summary = summary_glm(&result, None, false, false).unwrap();
        let formatted = format_summary_glm(&summary, None, None, None, None);

        assert!(formatted.contains("Call:"));
        assert!(formatted.contains("Coefficients"));
        assert!(formatted.contains("(Intercept)"));
        assert!(formatted.contains("AIC"));
    }

    #[test]
    fn test_get_significance_stars() {
        assert_eq!(get_significance_stars(0.0001), "***");
        assert_eq!(get_significance_stars(0.005), "**");
        assert_eq!(get_significance_stars(0.02), "*");
        assert_eq!(get_significance_stars(0.08), ".");
        assert_eq!(get_significance_stars(0.2), " ");
    }
}
