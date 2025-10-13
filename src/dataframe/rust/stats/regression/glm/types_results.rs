//! GLM result types
//!
//! This file contains the main result structures for GLM fitting.
//! Based on comprehensive R GLM output analysis with all 50 components.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::types_control::GlmControl;

/// A design matrix for statistical modeling
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelMatrix {
    /// The design matrix (column-major order, n_rows x n_cols)
    pub matrix: Vec<f64>,
    /// Number of observations (rows)
    pub n_rows: usize,
    /// Number of predictor variables (columns)
    pub n_cols: usize,
    /// Names of the columns
    pub column_names: Vec<String>,
    /// Assignment of columns to model terms
    pub term_assignments: Vec<i32>,
    /// Row names (optional)
    pub row_names: Option<Vec<String>>,
}

/// GLM fit result - comprehensive structure matching R GLM output
///
/// This struct contains all 50 components from R's GLM output plus additional
/// derived statistics and diagnostic measures for complete GLM functionality.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmResult {
    // Core Components (1-7) - Direct R GLM components
    /// Fitted coefficients (1. coefficients)
    pub coefficients: Vec<f64>,
    /// Residuals (2. residuals)
    pub residuals: Vec<f64>,
    /// Fitted values (3. fitted.values)
    pub fitted_values: Vec<f64>,
    /// Effects from QR decomposition (4. effects)
    pub effects: Vec<f64>,
    /// Working residuals (additional)
    pub working_residuals: Vec<f64>,
    /// Response residuals (additional)
    pub response_residuals: Vec<f64>,
    /// Pearson residuals (additional)
    pub pearson_residuals: Vec<f64>,
    /// R matrix from QR decomposition (5. R)
    pub r: Vec<Vec<f64>>,
    /// Model rank (6. rank)
    pub rank: usize,
    /// QR decomposition result (7. qr)
    pub qr: QrDecomposition,

    // Model Information (8-13)
    /// Family used in the fit (8. family)
    pub family: GlmFamilyInfo,
    /// Linear predictors (9. linear.predictors)
    pub linear_predictors: Vec<f64>,
    /// Deviance (10. deviance)
    pub deviance: f64,
    /// AIC (11. aic)
    pub aic: f64,
    /// Null deviance (12. null.deviance)
    pub null_deviance: f64,
    /// Number of iterations (13. iter)
    pub iter: usize,

    // Weights and Data (14-18)
    /// Working weights (14. weights)
    pub weights: Vec<f64>,
    /// Prior weights (15. prior.weights)
    pub prior_weights: Vec<f64>,
    /// Degrees of freedom for residuals (16. df.residual)
    pub df_residual: usize,
    /// Degrees of freedom for null model (17. df.null)
    pub df_null: usize,
    /// Response variable (18. y)
    pub y: Vec<f64>,

    // Convergence and Control (19-21)
    /// Whether the algorithm converged (19. converged)
    pub converged: bool,
    /// Whether the algorithm stopped at boundary (20. boundary)
    pub boundary: bool,
    /// Model frame (21. model)
    pub model: ModelFrame,

    // Call and Formula (22-25)
    /// Call information (22. call)
    pub call: String,
    /// Formula (23. formula)
    pub formula: String,
    /// Terms object (24. terms)
    pub terms: TermsObject,
    /// Data environment reference (25. data)
    pub data: String,

    // Additional Parameters (26-30)
    /// Offset vector (26. offset)
    pub offset: Option<Vec<f64>>,
    /// Control parameters used (27. control)
    pub control: GlmControl,
    /// Method used (28. method)
    pub method: String,
    /// Contrasts used (29. contrasts)
    pub contrasts: HashMap<String, String>,
    /// X levels for factors (30. xlevels)
    pub xlevels: HashMap<String, Vec<String>>,

    // Additional Derived Information (31-50)
    /// Model design matrix (31. model_matrix)
    pub model_matrix: Vec<Vec<f64>>,
    /// Model matrix dimensions (32. model_matrix_dimensions)
    pub model_matrix_dimensions: (usize, usize),
    /// Parameter names (33. model_matrix_column_names)
    pub model_matrix_column_names: Vec<String>,
    /// Residual standard error (34. residual_standard_error)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_f64"
    )]
    pub residual_standard_error: f64,
    /// R-squared (35. r_squared)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_f64"
    )]
    pub r_squared: f64,
    /// Adjusted R-squared (36. adjusted_r_squared)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_f64"
    )]
    pub adjusted_r_squared: f64,
    /// Percentage of deviance explained (37. deviance_explained_percent)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_f64"
    )]
    pub deviance_explained_percent: f64,
    /// Overall F-statistic (38. f_statistic)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_f64"
    )]
    pub f_statistic: f64,
    /// F-test p-value (39. f_p_value)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_f64"
    )]
    pub f_p_value: f64,
    /// Sample size (40. n_observations)
    pub n_observations: usize,
    /// Name of response variable (41. response_variable_name)
    pub response_variable_name: String,
    /// Names of predictors (42. predictor_variable_names)
    pub predictor_variable_names: Vec<String>,
    /// Factor levels (43. factor_levels)
    pub factor_levels: HashMap<String, Vec<String>>,
    /// Reference levels (44. reference_levels)
    pub reference_levels: HashMap<String, String>,
    /// Dispersion parameter (45. dispersion_parameter)
    pub dispersion_parameter: f64,
    /// Individual deviance residuals (46. deviance_residuals)
    pub deviance_residuals: Vec<f64>,
    /// Parameter covariance matrix (47. covariance_matrix)
    pub covariance_matrix: Vec<Vec<f64>>,
    /// Standard errors for coefficients (48. standard_errors)
    pub standard_errors: Vec<f64>,
    /// T-statistics for coefficients (48a. t_statistics)
    pub t_statistics: Vec<f64>,
    /// P-values for coefficients (48b. p_values)
    pub p_values: Vec<f64>,
    /// Leverage values (49. leverage)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_vec_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_vec_f64"
    )]
    pub leverage: Vec<f64>,
    /// Cook's distance (50. cooks_distance)
    #[serde(
        serialize_with = "crate::stats::regression::glm::serde_special_floats::serialize_vec_f64",
        deserialize_with = "crate::stats::regression::glm::serde_special_floats::deserialize_vec_f64"
    )]
    pub cooks_distance: Vec<f64>,

    // Additional fields for backward compatibility
    /// QR rank (for backward compatibility)
    pub qr_rank: usize,
    /// Pivot indices (for backward compatibility)
    pub pivot: Vec<i32>,
    /// Tolerance used in QR decomposition (for backward compatibility)
    pub tol: f64,
    /// Whether pivoting was used (for backward compatibility)
    pub pivoted: bool,
    /// NA action (for backward compatibility)
    pub na_action: Option<String>,
    /// Dispersion parameter (for backward compatibility)
    pub dispersion: f64,
    /// Design matrix (for backward compatibility)
    pub x: Option<ModelMatrix>,
}

// GlmResult now derives Clone automatically via #[derive(Clone)]

impl GlmResult {
    /// Create a new empty GlmResult with default values
    pub fn new() -> Self {
        Self {
            // Core Components (1-7)
            coefficients: Vec::new(),
            residuals: Vec::new(),
            fitted_values: Vec::new(),
            effects: Vec::new(),
            working_residuals: Vec::new(),
            response_residuals: Vec::new(),
            pearson_residuals: Vec::new(),
            r: Vec::new(),
            rank: 0,
            qr: QrDecomposition {
                qr: Vec::new(),
                rank: 0,
                qraux: Vec::new(),
                pivot: Vec::new(),
                tol: 1e-11,
            },

            // Model Information (8-13)
            family: GlmFamilyInfo {
                family: "gaussian".to_string(),
                link: "identity".to_string(),
                linkfun: None,
                linkinv: None,
                variance: None,
                dev_resids: None,
                aic: None,
                mu_eta: None,
                initialize: None,
                validmu: None,
                valideta: None,
            },
            linear_predictors: Vec::new(),
            deviance: 0.0,
            aic: 0.0,
            null_deviance: 0.0,
            iter: 0,

            // Weights and Data (14-18)
            weights: Vec::new(),
            prior_weights: Vec::new(),
            df_residual: 0,
            df_null: 0,
            y: Vec::new(),

            // Convergence and Control (19-21)
            converged: false,
            boundary: false,
            model: ModelFrame {
                y: Vec::new(),
                predictors: HashMap::new(),
                factors: HashMap::new(),
            },

            // Call and Formula (22-25)
            call: String::new(),
            formula: String::new(),
            terms: TermsObject {
                variables: Vec::new(),
                factors: Vec::new(),
                term_labels: Vec::new(),
                order: Vec::new(),
                intercept: 0,
                response: 0,
                data_classes: HashMap::new(),
            },
            data: String::new(),

            // Additional Parameters (26-30)
            offset: None,
            control: GlmControl::new(),
            method: "glm.fit".to_string(),
            contrasts: HashMap::new(),
            xlevels: HashMap::new(),

            // Additional Derived Information (31-50)
            model_matrix: Vec::new(),
            model_matrix_dimensions: (0, 0),
            model_matrix_column_names: Vec::new(),
            residual_standard_error: 0.0,
            r_squared: 0.0,
            adjusted_r_squared: 0.0,
            deviance_explained_percent: 0.0,
            f_statistic: 0.0,
            f_p_value: 0.0,
            n_observations: 0,
            response_variable_name: String::new(),
            predictor_variable_names: Vec::new(),
            factor_levels: HashMap::new(),
            reference_levels: HashMap::new(),
            dispersion_parameter: 0.0,
            deviance_residuals: Vec::new(),
            covariance_matrix: Vec::new(),
            standard_errors: Vec::new(),
            t_statistics: Vec::new(),
            p_values: Vec::new(),
            leverage: Vec::new(),
            cooks_distance: Vec::new(),

            // Additional fields for backward compatibility
            qr_rank: 0,
            pivot: Vec::new(),
            tol: 1e-11,
            pivoted: false,
            na_action: None,
            dispersion: 1.0,
            x: None,
        }
    }

    // Core accessor methods
    pub fn get_coefficient(&self, index: usize) -> Option<f64> {
        self.coefficients.get(index).copied()
    }

    pub fn get_residual(&self, index: usize) -> Option<f64> {
        self.residuals.get(index).copied()
    }

    pub fn get_fitted_value(&self, index: usize) -> Option<f64> {
        self.fitted_values.get(index).copied()
    }

    pub fn is_converged(&self) -> bool {
        self.converged
    }

    // Derived statistics methods
    pub fn get_deviance_ratio(&self) -> f64 {
        if self.null_deviance > 0.0 {
            1.0 - (self.deviance / self.null_deviance)
        } else {
            0.0
        }
    }

    pub fn get_log_likelihood(&self) -> f64 {
        // For Gaussian family: -0.5 * (n * log(2π) + n * log(σ²) + n)
        // This is a simplified version - actual implementation would depend on family
        -0.5 * (self.y.len() as f64 * (2.0 * std::f64::consts::PI).ln()
            + self.y.len() as f64 * (self.deviance / self.df_residual as f64).ln()
            + self.y.len() as f64)
    }

    pub fn get_bic(&self) -> f64 {
        -2.0 * self.get_log_likelihood() + (self.rank as f64) * (self.y.len() as f64).ln()
    }

    pub fn get_residual_standard_error(&self) -> f64 {
        if self.df_residual > 0 {
            (self.deviance / self.df_residual as f64).sqrt()
        } else {
            0.0
        }
    }

    pub fn get_r_squared(&self) -> f64 {
        if self.null_deviance > 0.0 {
            1.0 - (self.deviance / self.null_deviance)
        } else {
            0.0
        }
    }

    pub fn get_adjusted_r_squared(&self) -> f64 {
        let r_squared = self.get_r_squared();
        if self.n_observations > self.rank {
            let n = self.n_observations as f64;
            let p = self.rank as f64;
            1.0 - (1.0 - r_squared) * (n - 1.0) / (n - p)
        } else {
            r_squared
        }
    }

    pub fn get_f_statistic(&self) -> f64 {
        if self.df_residual > 0 && self.df_null > self.df_residual {
            let model_df = self.df_null - self.df_residual;
            let model_ms = (self.null_deviance - self.deviance) / model_df as f64;
            let residual_ms = self.deviance / self.df_residual as f64;
            model_ms / residual_ms
        } else {
            0.0
        }
    }

    pub fn get_model_matrix_dimensions(&self) -> (usize, usize) {
        (self.n_observations, self.rank)
    }

    pub fn get_coefficient_names(&self) -> &Vec<String> {
        &self.model_matrix_column_names
    }

    pub fn get_response_name(&self) -> &str {
        &self.response_variable_name
    }

    pub fn get_predictor_names(&self) -> &Vec<String> {
        &self.predictor_variable_names
    }

    pub fn get_factor_levels(&self, factor_name: &str) -> Option<&Vec<String>> {
        self.factor_levels.get(factor_name)
    }

    pub fn get_reference_level(&self, factor_name: &str) -> Option<&String> {
        self.reference_levels.get(factor_name)
    }

    pub fn get_dispersion_parameter(&self) -> f64 {
        if self.df_residual > 0 {
            self.deviance / self.df_residual as f64
        } else {
            1.0
        }
    }

    pub fn get_standard_error(&self, index: usize) -> Option<f64> {
        self.standard_errors.get(index).copied()
    }

    pub fn get_leverage(&self, index: usize) -> Option<f64> {
        self.leverage.get(index).copied()
    }

    pub fn get_cooks_distance(&self, index: usize) -> Option<f64> {
        self.cooks_distance.get(index).copied()
    }

    /// Get the number of observations
    pub fn nobs(&self) -> usize {
        self.n_observations
    }

    /// Get the model rank
    pub fn model_rank(&self) -> usize {
        self.rank
    }

    /// Get residual degrees of freedom
    pub fn df_residual(&self) -> usize {
        self.df_residual
    }

    /// Get null degrees of freedom
    pub fn df_null(&self) -> usize {
        self.df_null
    }

    /// Check if model has converged
    pub fn converged(&self) -> bool {
        self.converged
    }

    /// Check if model hit boundary
    pub fn boundary(&self) -> bool {
        self.boundary
    }

    /// Get family name
    pub fn family_name(&self) -> &str {
        &self.family.family
    }

    /// Get link function name
    pub fn link_name(&self) -> &str {
        &self.family.link
    }

    /// Calculate AIC using the family-specific calculation
    pub fn calculate_aic(&self) -> f64 {
        use crate::stats::regression::glm::glm_aic::{
            calculate_aic, calculate_binomial_aic, calculate_gamma_aic, calculate_gaussian_aic,
            calculate_inverse_gaussian_aic, calculate_poisson_aic, calculate_quasi_aic,
        };

        // Get the appropriate family-specific AIC function
        let aic_fn: Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64> =
            match self.family.family.as_str() {
                "gaussian" => Box::new(calculate_gaussian_aic),
                "binomial" => Box::new(calculate_binomial_aic),
                "poisson" => Box::new(calculate_poisson_aic),
                "gamma" => Box::new(calculate_gamma_aic),
                "inverse.gaussian" | "inverse_gaussian" => Box::new(calculate_inverse_gaussian_aic),
                "quasi" | "quasibinomial" | "quasipoisson" => Box::new(calculate_quasi_aic),
                _ => {
                    // Fallback to stored AIC if family type is unknown
                    return self.aic;
                }
            };

        // Use the proper calculate_aic function which handles the penalty term
        calculate_aic(
            &self.y,
            &self.fitted_values,
            &self.prior_weights,
            self.deviance,
            self.rank,
            &aic_fn,
        )
    }
}

/// QR decomposition result - matches R's QR structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrDecomposition {
    /// QR matrix (8x2 matrix for n_obs x n_params)
    pub qr: Vec<Vec<f64>>,
    /// QR rank
    pub rank: usize,
    /// QR auxiliary information
    pub qraux: Vec<f64>,
    /// Pivot indices
    pub pivot: Vec<usize>,
    /// Tolerance used in QR decomposition
    pub tol: f64,
}

/// GLM family information - simplified structure for serialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmFamilyInfo {
    /// Family name (e.g., "gaussian", "binomial")
    pub family: String,
    /// Link function name (e.g., "identity", "logit")
    pub link: String,
    /// Link function (optional)
    pub linkfun: Option<String>,
    /// Inverse link function (optional)
    pub linkinv: Option<String>,
    /// Variance function (optional)
    pub variance: Option<String>,
    /// Deviance residuals function (optional)
    pub dev_resids: Option<String>,
    /// AIC function (optional)
    pub aic: Option<String>,
    /// Mu eta function (optional)
    pub mu_eta: Option<String>,
    /// Initialize function (optional)
    pub initialize: Option<String>,
    /// Valid mu function (optional)
    pub validmu: Option<String>,
    /// Valid eta function (optional)
    pub valideta: Option<String>,
}

impl GlmFamilyInfo {
    /// Get family name
    pub fn name(&self) -> &str {
        &self.family
    }

    /// Get link name
    pub fn link_name(&self) -> &str {
        &self.link
    }

    /// Create from a GlmFamily trait object
    pub fn from_glm_family(family: &dyn crate::stats::regression::family::GlmFamily) -> Self {
        Self {
            family: family.name().to_string(),
            link: family.link_name().to_string(),
            linkfun: None,
            linkinv: None,
            variance: None,
            dev_resids: None,
            aic: None,
            mu_eta: None,
            initialize: None,
            validmu: None,
            valideta: None,
        }
    }
}

/// Model frame structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelFrame {
    /// Response variable values
    pub y: Vec<f64>,
    /// Predictor variables
    pub predictors: HashMap<String, Vec<f64>>,
    /// Factor variables
    pub factors: HashMap<String, Vec<String>>,
}

/// Terms object structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TermsObject {
    /// Variable names
    pub variables: Vec<String>,
    /// Factor matrix
    pub factors: Vec<Vec<usize>>,
    /// Term labels
    pub term_labels: Vec<String>,
    /// Term order
    pub order: Vec<usize>,
    /// Intercept term
    pub intercept: usize,
    /// Response variable index
    pub response: usize,
    /// Data classes for each variable
    pub data_classes: HashMap<String, String>,
}

/// GLM summary result - comprehensive summary matching R's summary.glm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmSummary {
    /// Call information
    pub call: String,
    /// Terms object
    pub terms: TermsObject,
    /// Family information
    pub family: GlmFamilyInfo,
    /// Deviance
    pub deviance: f64,
    /// AIC
    pub aic: f64,
    /// Contrasts used
    pub contrasts: HashMap<String, String>,
    /// Degrees of freedom for residuals
    pub df_residual: usize,
    /// Null deviance
    pub null_deviance: f64,
    /// Degrees of freedom for null model
    pub df_null: usize,
    /// Number of iterations
    pub iter: usize,
    /// NA action
    pub na_action: Option<String>,
    /// Deviance residuals
    pub deviance_residuals: Vec<f64>,
    /// Coefficient table
    pub coefficients: Vec<CoefficientInfo>,
    /// Aliased coefficients
    pub aliased: Vec<bool>,
    /// Dispersion parameter
    pub dispersion: f64,
    /// Degrees of freedom (rank, df_residual, df_full)
    pub df: (usize, usize, usize),
    /// Unscaled covariance matrix
    pub cov_unscaled: Vec<Vec<f64>>,
    /// Scaled covariance matrix
    pub cov_scaled: Vec<Vec<f64>>,
    /// Correlation matrix (if requested)
    pub correlation: Option<Vec<Vec<f64>>>,
    /// Symbolic correlation (if requested)
    pub symbolic_cor: Option<bool>,
    /// Whether the algorithm converged
    pub converged: bool,
    /// Whether the algorithm stopped at boundary
    pub boundary: bool,
}

/// Information about a coefficient
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoefficientInfo {
    /// Coefficient name
    pub name: String,
    /// Estimate
    pub estimate: f64,
    /// Standard error
    pub std_error: f64,
    /// Test statistic (t or z value)
    pub test_statistic: f64,
    /// P-value
    pub p_value: f64,
}

// GlmResult now derives Debug automatically via #[derive(Debug)]

// GlmSummary now derives Debug and Clone automatically via #[derive(Debug, Clone)]
