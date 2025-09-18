//! GLM summary print functions
//!
//! This file contains the print functions for GLM summary.

// Unused import removed
use super::glm_summary::summary_glm;
use super::types::GlmSummary;

/// Print GLM summary
///
/// This function prints a GLM summary in a formatted way.
///
/// # Arguments
///
/// * `x` - GLM summary to print
/// * `digits` - Number of digits to display (default: 3)
/// * `symbolic_cor` - Whether to use symbolic correlation (default: false)
/// * `signif_stars` - Whether to show significance stars (default: true)
/// * `show_residuals` - Whether to show residual summary (default: false)
pub fn print_summary_glm(
    x: &GlmSummary,
    _digits: Option<usize>,
    symbolic_cor: Option<bool>,
    signif_stars: Option<bool>,
    show_residuals: Option<bool>,
) {
    let symbolic_cor = symbolic_cor.unwrap_or(false);
    let signif_stars = signif_stars.unwrap_or(true);
    let show_residuals = show_residuals.unwrap_or(false);

    // Print call
    print_call(x);

    // Print residuals if requested
    if show_residuals {
        print_residuals(x);
    }

    // Print coefficients
    print_coefficients(x, signif_stars);

    // Print dispersion parameter
    print_dispersion(x);

    // Print deviance information
    print_deviance_info(x);

    // Print NA action if available
    print_na_action(x);

    // Print AIC and iterations
    print_aic_and_iterations(x);

    // Print correlation matrix if available
    print_correlation_matrix(x, symbolic_cor);

    println!();
}

/// Print call information
fn print_call(x: &GlmSummary) {
    if let Some(ref call) = x.call {
        println!("\nCall:\n{}\n", call);
    } else {
        println!("\nCall:\nglm(formula = ..., family = ..., data = ...)\n");
    }
}

/// Print residuals summary
fn print_residuals(x: &GlmSummary) {
    println!("Deviance Residuals: ");
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
        println!(
            "{:>8} {:>8} {:>8} {:>8} {:>8}",
            "Min", "1Q", "Median", "3Q", "Max"
        );
        println!(
            "{:>8.3} {:>8.3} {:>8.3} {:>8.3} {:>8.3}",
            quantiles[0], quantiles[1], quantiles[2], quantiles[3], quantiles[4]
        );
    } else {
        for (i, &resid) in x.deviance_residuals.iter().enumerate() {
            if i > 0 {
                print!(" ");
            }
            print!("{:8.3}", resid);
        }
        println!();
    }
}

/// Print coefficients table
fn print_coefficients(x: &GlmSummary, signif_stars: bool) {
    if x.aliased.is_empty() {
        println!("\nNo Coefficients\n");
    } else {
        let n_singular = x.df.2 - x.df.0;
        if n_singular > 0 {
            println!(
                "\nCoefficients: ({} not defined because of singularities)\n",
                n_singular
            );
        } else {
            println!("\nCoefficients:\n");
        }

        // Print coefficient table
        println!(
            "{:>12} {:>12} {:>12} {:>12} {:>12}",
            "", "Estimate", "Std. Error", "t value", "Pr(>|t|)"
        );

        for coef in &x.coefficients {
            let stars = if signif_stars {
                get_significance_stars(coef.p_value)
            } else {
                " "
            };

            println!(
                "{:>12} {:>12.3} {:>12.3} {:>12.3} {:>12.3}{}",
                coef.name, coef.estimate, coef.std_error, coef.test_statistic, coef.p_value, stars
            );
        }
    }
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

/// Print dispersion parameter
fn print_dispersion(x: &GlmSummary) {
    println!(
        "\n(Dispersion parameter for {} family taken to be {:.3})\n",
        x.family.family_name(),
        x.dispersion
    );
}

/// Print deviance information
fn print_deviance_info(x: &GlmSummary) {
    println!(
        "{:>12} deviance: {:>12.3} on {:>3} degrees of freedom",
        "Null", x.null_deviance, x.df_null
    );
    println!(
        "{:>12} deviance: {:>12.3} on {:>3} degrees of freedom",
        "Residual", x.deviance, x.df_residual
    );
}

/// Print NA action if available
fn print_na_action(x: &GlmSummary) {
    if let Some(ref na_action) = x.na_action {
        if !na_action.is_empty() && na_action != "na.omit" {
            println!("  ({})", na_action);
        }
    }
}

/// Print AIC and iterations
fn print_aic_and_iterations(x: &GlmSummary) {
    println!("AIC: {:.1}\n", x.aic);
    println!("Number of Fisher Scoring iterations: {}\n", x.iter);
}

/// Print correlation matrix if available
fn print_correlation_matrix(x: &GlmSummary, _symbolic_cor: bool) {
    if let Some(ref correl) = x.correlation {
        let p = correl.len();
        if p > 1 {
            println!("\nCorrelation of Coefficients:\n");
            if let Some(true) = x.symbolic_cor {
                // TODO: Implement symbolic correlation printing
                println!("(symbolic correlation matrix)");
            } else {
                // Print numeric correlation matrix
                for i in 0..p {
                    for j in 0..p {
                        if j < i {
                            print!("{:>8.2}", correl[i][j]);
                        } else {
                            print!("{:>8}", "");
                        }
                    }
                    println!();
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::gaussian::GaussianFamily;
    use crate::stats::regression::glm::glm_control::glm_control;
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
            dispersion: 1.0,
        }
    }

    #[test]
    fn test_print_summary_glm() {
        let result = create_test_glm_result();
        let summary = summary_glm(&result).unwrap();
        // This test just ensures the function doesn't panic
        print_summary_glm(&summary, None, None, None, None);
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
