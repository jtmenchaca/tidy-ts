//! GLM print core functionality
//!
//! This file contains the core print and format functions for GLM results.

use super::types_results::GlmResult;

/// Print GLM result
///
/// This function prints a summary of a GLM fit result.
///
/// # Arguments
///
/// * `x` - GLM result to print
/// * `digits` - Number of digits to display (default: 3)
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_print_core::print_glm;
/// use tidy_ts::stats::regression::glm::types::GlmResult;
///
/// // Assuming you have a GLM result
/// // print_glm(&result, Some(3));
/// ```
pub fn print_glm(x: &GlmResult, digits: Option<usize>) {
    let digits = digits.unwrap_or(3);

    // Print call information
    if let Some(ref call) = x.call {
        println!("\nCall:  {}\n", call);
    } else {
        println!("\nCall:  glm(formula = ..., family = ..., data = ...)\n");
    }

    // Print coefficients
    if !x.coefficients.is_empty() {
        println!("Coefficients");

        // TODO: Print contrasts information if available
        if let Some(ref contrasts) = x.contrasts {
            if !contrasts.is_empty() {
                print!("  [contrasts: ");
                let contrast_strs: Vec<String> = contrasts
                    .iter()
                    .map(|(name, value)| format!("{}={}", name, value))
                    .collect();
                print!("{}", contrast_strs.join(", "));
                print!("]");
            }
        }
        println!(":");

        // Print coefficient values
        for (i, &coef) in x.coefficients.iter().enumerate() {
            let coef_name = if i == 0 {
                "(Intercept)"
            } else {
                &format!("x{}", i)
            };
            println!("{:>12} {:>12}", coef_name, format!("{:.1$}", coef, digits));
        }
    } else {
        println!("No coefficients\n");
    }

    // Print degrees of freedom
    println!(
        "\nDegrees of Freedom: {} Total (i.e. Null); {} Residual",
        x.df_null, x.df_residual
    );

    // Print NA action if available
    if let Some(ref na_action) = x.na_action {
        if !na_action.is_empty() && na_action != "na.omit" {
            println!("  ({})", na_action);
        }
    }

    // Print deviance and AIC
    println!(
        "Null Deviance:      {:>12}",
        format!("{:.1$}", x.null_deviance, digits)
    );
    println!(
        "Residual Deviance: {:>12}    AIC: {:>12}",
        format!("{:.1$}", x.deviance, digits),
        format!("{:.1$}", x.aic, digits)
    );
    println!();
}

/// Format GLM result as string
///
/// This function formats a GLM result as a string without printing it.
///
/// # Arguments
///
/// * `x` - GLM result to format
/// * `digits` - Number of digits to display (default: 3)
///
/// # Returns
///
/// A formatted string representation of the GLM result.
pub fn format_glm(x: &GlmResult, digits: Option<usize>) -> String {
    let digits = digits.unwrap_or(3);
    let mut output = String::new();

    // Format call information
    if let Some(ref call) = x.call {
        output.push_str(&format!("\nCall:  {}\n\n", call));
    } else {
        output.push_str("\nCall:  glm(formula = ..., family = ..., data = ...)\n\n");
    }

    // Format coefficients
    if !x.coefficients.is_empty() {
        output.push_str("Coefficients");

        // TODO: Format contrasts information if available
        if let Some(ref contrasts) = x.contrasts {
            if !contrasts.is_empty() {
                output.push_str("  [contrasts: ");
                let contrast_strs: Vec<String> = contrasts
                    .iter()
                    .map(|(name, value)| format!("{}={}", name, value))
                    .collect();
                output.push_str(&contrast_strs.join(", "));
                output.push_str("]");
            }
        }
        output.push_str(":\n");

        // Format coefficient values
        for (i, &coef) in x.coefficients.iter().enumerate() {
            let coef_name = if i == 0 {
                "(Intercept)"
            } else {
                &format!("x{}", i)
            };
            output.push_str(&format!(
                "{:>12} {:>12}\n",
                coef_name,
                format!("{:.1$}", coef, digits)
            ));
        }
    } else {
        output.push_str("No coefficients\n\n");
    }

    // Format degrees of freedom
    output.push_str(&format!(
        "\nDegrees of Freedom: {} Total (i.e. Null); {} Residual\n",
        x.df_null, x.df_residual
    ));

    // Format NA action if available
    if let Some(ref na_action) = x.na_action {
        if !na_action.is_empty() && na_action != "na.omit" {
            output.push_str(&format!("  ({})\n", na_action));
        }
    }

    // Format deviance and AIC
    output.push_str(&format!(
        "Null Deviance:      {:>12}\n",
        format!("{:.1$}", x.null_deviance, digits)
    ));
    output.push_str(&format!(
        "Residual Deviance: {:>12}    AIC: {:>12}\n",
        format!("{:.1$}", x.deviance, digits),
        format!("{:.1$}", x.aic, digits)
    ));
    output.push_str("\n");

    output
}
