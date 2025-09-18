//! GLM ANOVA print functions
//!
//! This file contains the print functions for GLM ANOVA.

use super::types::GlmAnova;

/// Print ANOVA result
///
/// This function prints an ANOVA result in a formatted way.
///
/// # Arguments
///
/// * `anova` - ANOVA result to print
pub fn print_anova(anova: &GlmAnova) {
    // Print heading
    for line in &anova.heading {
        println!("{}", line);
    }
    println!();

    // Print table header
    print!("{:>12}", "");
    for col in &anova.column_names {
        print!("{:>12}", col);
    }
    println!();

    // Print table rows
    for (row_name, row) in anova.row_names.iter().zip(anova.table.iter()) {
        print!("{:>12}", row_name);

        // Print df
        if let Some(df) = row.df {
            print!("{:>12.1}", df);
        } else {
            print!("{:>12}", "");
        }

        // Print deviance
        if let Some(dev) = row.deviance {
            print!("{:>12.3}", dev);
        } else {
            print!("{:>12}", "");
        }

        // Print residual df
        print!("{:>12.0}", row.resid_df);

        // Print residual deviance
        print!("{:>12.3}", row.resid_deviance);

        // Print additional columns if present
        if let Some(rao) = row.rao {
            print!("{:>12.3}", rao);
        }
        if let Some(f_stat) = row.f_statistic {
            print!("{:>12.3}", f_stat);
        }
        if let Some(p_val) = row.p_value {
            print!("{:>12.3}", p_val);
        }

        println!();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::gaussian::GaussianFamily;
    use crate::stats::regression::glm::glm_anova_core::anova_glm;
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
            dispersion: 1.0, // Default dispersion value
        }
    }

    #[test]
    fn test_print_anova() {
        let result = create_test_glm_result();
        let anova = anova_glm(&result, None, None).unwrap();
        // This test just ensures the function doesn't panic
        print_anova(&anova);
    }
}
