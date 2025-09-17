//! GLM residuals function

use super::types::{GlmResult, ResidualType};

/// GLM residuals function
///
/// This function extracts residuals from a GLM object.
///
/// # Arguments
///
/// * `object` - GLM result object
/// * `type` - Type of residuals to extract (default: "deviance")
///
/// # Returns
///
/// A vector of residuals of the specified type.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_residuals::residuals_glm;
/// use tidy_ts::stats::regression::glm::types::{GlmResult, ResidualType};
///
/// // Assuming you have a GLM result
/// // let dev_residuals = residuals_glm(&result, ResidualType::Deviance);
/// // let pearson_residuals = residuals_glm(&result, ResidualType::Pearson);
/// ```
pub fn residuals_glm(object: &GlmResult, type_: ResidualType) -> Vec<f64> {
    let y = &object.y;
    let r = &object.residuals;
    let mu = &object.fitted_values;
    let wts = &object.prior_weights;

    // Reconstruct y if needed
    let y = if y.is_empty() {
        // Equivalent to: y <- mu + r * mu.eta(eta)
        let mu_eta = object.family.mu_eta();
        let eta = &object.linear_predictors;
        mu.iter()
            .zip(r.iter())
            .zip(eta.iter())
            .map(|((&mu_i, &r_i), &eta_i)| mu_i + r_i * mu_eta(eta_i))
            .collect()
    } else {
        y.clone()
    };

    match type_ {
        ResidualType::Deviance => {
            if object.df_residual > 0 {
                let dev_resids = object.family.dev_resids(&y, mu, wts);
                y.iter()
                    .zip(mu.iter())
                    .zip(dev_resids.iter())
                    .map(|((&y_i, &mu_i), &d_res)| {
                        let d_res_sqrt = d_res.max(0.0).sqrt();
                        if y_i > mu_i { d_res_sqrt } else { -d_res_sqrt }
                    })
                    .collect()
            } else {
                vec![0.0; mu.len()]
            }
        }
        ResidualType::Pearson => {
            let variance = object.family.variance();
            y.iter()
                .zip(mu.iter())
                .zip(wts.iter())
                .zip(variance(mu).iter())
                .map(|(((y_i, mu_i), &wt_i), &var_i)| (y_i - mu_i) * wt_i.sqrt() / var_i.sqrt())
                .collect()
        }
        ResidualType::Working => r.clone(),
        ResidualType::Response => y
            .iter()
            .zip(mu.iter())
            .map(|(&y_i, &mu_i)| y_i - mu_i)
            .collect(),
        ResidualType::Partial => {
            // For partial residuals, we need to add the terms from predict()
            // This is a simplified version - in practice, predict() would be called
            r.clone()
        }
    }
}

/// Extract deviance residuals - convenience function
pub fn residuals_glm_deviance(object: &GlmResult) -> Vec<f64> {
    residuals_glm(object, ResidualType::Deviance)
}

/// Extract Pearson residuals - convenience function
pub fn residuals_glm_pearson(object: &GlmResult) -> Vec<f64> {
    residuals_glm(object, ResidualType::Pearson)
}

/// Extract working residuals - convenience function
pub fn residuals_glm_working(object: &GlmResult) -> Vec<f64> {
    residuals_glm(object, ResidualType::Working)
}

/// Extract response residuals - convenience function
pub fn residuals_glm_response(object: &GlmResult) -> Vec<f64> {
    residuals_glm(object, ResidualType::Response)
}

/// Extract partial residuals - convenience function
pub fn residuals_glm_partial(object: &GlmResult) -> Vec<f64> {
    residuals_glm(object, ResidualType::Partial)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::gaussian::GaussianFamily;
    use crate::stats::regression::glm::glm_control::glm_control;

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
    fn test_residuals_glm_deviance() {
        let result = create_test_glm_result();
        let residuals = residuals_glm_deviance(&result);
        assert_eq!(residuals.len(), 3);
    }

    #[test]
    fn test_residuals_glm_pearson() {
        let result = create_test_glm_result();
        let residuals = residuals_glm_pearson(&result);
        assert_eq!(residuals.len(), 3);
    }

    #[test]
    fn test_residuals_glm_working() {
        let result = create_test_glm_result();
        let residuals = residuals_glm_working(&result);
        assert_eq!(residuals.len(), 3);
        assert_eq!(residuals, result.residuals);
    }

    #[test]
    fn test_residuals_glm_response() {
        let result = create_test_glm_result();
        let residuals = residuals_glm_response(&result);
        assert_eq!(residuals.len(), 3);
    }

    #[test]
    fn test_residuals_glm_partial() {
        let result = create_test_glm_result();
        let residuals = residuals_glm_partial(&result);
        assert_eq!(residuals.len(), 3);
    }
}
