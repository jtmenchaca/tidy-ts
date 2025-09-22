//! GLM fit core functionality
//!
//! This file contains the main glm_fit function and core fitting logic.

use super::glm_aic::calculate_aic;
use super::glm_fit_core_calculation::*;
use super::glm_fit_core_initialization::*;
use super::glm_fit_core_validation::*;
use super::glm_fit_core_warnings::*;

use super::glm_fit_irls_core::run_irls_iteration;
use super::types::{GlmControl, GlmResult};
use crate::stats::regression::family::GlmFamily;

#[cfg(feature = "wasm")]
use web_sys::console;

/// GLM fit function
///
/// This function fits a generalized linear model via iteratively reweighted least squares.
/// It is the core fitting algorithm for GLM.
///
/// # Arguments
///
/// * `x` - Design matrix (n × p)
/// * `y` - Response vector (n × 1) or matrix (n × ny)
/// * `weights` - Prior weights (default: all 1s)
/// * `start` - Starting values for coefficients (optional)
/// * `etastart` - Starting values for linear predictor (optional)
/// * `mustart` - Starting values for fitted values (optional)
/// * `offset` - Offset vector (default: all 0s)
/// * `family` - GLM family object
/// * `control` - Control parameters for fitting
/// * `intercept` - Whether model has intercept
/// * `singular_ok` - Whether to allow singular fits
///
/// # Returns
///
/// A `GlmResult` containing the fitted model results.
///
/// # Errors
///
/// Returns an error if fitting fails due to various reasons:
/// - Invalid family object
/// - Non-finite coefficients
/// - Insufficient observations
/// - Singular fit (if not allowed)
/// - Convergence failure
pub fn glm_fit(
    x: Vec<Vec<f64>>,
    y: Vec<f64>,
    weights: Option<Vec<f64>>,
    start: Option<Vec<f64>>,
    _etastart: Option<Vec<f64>>,
    mustart: Option<Vec<f64>>,
    offset: Option<Vec<f64>>,
    family: Box<dyn GlmFamily>,
    control: GlmControl,
    intercept: bool,
) -> Result<GlmResult, String> {
    // Validate control parameters
    validate_control(&control)?;

    let n = y.len();
    let p = if !x.is_empty() { x[0].len() } else { 0 };
    let empty = p == 0;

    // Set up weights and offset
    let weights = weights.unwrap_or_else(|| vec![1.0; n]);
    let offset = offset.unwrap_or_else(|| vec![0.0; n]);

    // Validate weights and offset
    validate_weights(&weights, n)?;
    validate_offset(&offset, n)?;

    // Get family functions
    let variance = family.variance();
    let linkinv = family.linkinv();
    let dev_resids = family.dev_resids();
    let deviance_fn = family.deviance();
    let aic = family.aic();
    let mu_eta = family.mu_eta();
    let valideta = family.valideta();
    let validmu = family.validmu();

    // Initialize starting values
    let starting_values = initialize_starting_values(
        &x,
        &y,
        &weights,
        &offset,
        start.as_deref(),
        mustart.as_deref(),
        family.as_ref(),
    )?;

    let mut eta = starting_values.eta;
    let mut mu = starting_values.mu;

    // Validate starting values
    validate_family_start_values(&eta, &mu, &|eta| valideta(eta).is_ok(), &|mu| {
        validmu(mu).is_ok()
    })?;

    // Calculate initial deviance
    let mut devold = calculate_initial_deviance(&y, &mu, &weights, &|y, mu, w| {
        deviance_fn.deviance(y, mu, w)
    });
    let mut boundary = false;
    let mut conv = false;
    let mut iter = 0;

    let mut coef = if empty {
        vec![]
    } else {
        start.unwrap_or_else(|| vec![0.0; p])
    };

    // Track rank from IRLS
    let mut irls_rank: Option<usize> = None;

    if !empty {
        // Run IRLS iteration
        let irls_result = run_irls_iteration(
            &x,
            &y,
            &weights,
            &offset,
            &mut coef,
            &mut eta,
            &mut mu,
            family.as_ref(),
            &control,
            &mut devold,
            &mut boundary,
            &mut conv,
            &mut iter,
        )?;

        // Update values from IRLS result
        eta = irls_result.eta;
        mu = irls_result.mu;
        coef = irls_result.coef;

        // Update convergence and boundary status from IRLS result
        conv = irls_result.converged;
        boundary = irls_result.boundary;
        irls_rank = Some(irls_result.rank);

        // Handle convergence and boundary warnings (matching R's behavior)
        if !conv {
            // In R: warning("glm.fit: algorithm did not converge", call. = FALSE)
            println!("Warning: glm.fit: algorithm did not converge");
        }
        if boundary {
            // In R: warning("glm.fit: algorithm stopped at boundary value", call. = FALSE)
            println!("Warning: glm.fit: algorithm stopped at boundary value");
        }

        // R's boundary checking for binomial family (lines 198-201)
        let eps = 10.0 * f64::EPSILON; // R: eps <- 10*.Machine$double.eps
        if family.name() == "binomial" {
            if mu.iter().any(|&mu_val| mu_val > 1.0 - eps || mu_val < eps) {
                println!("Warning: glm.fit: fitted probabilities numerically 0 or 1 occurred");
            }
        }
    }

    // Check for family-specific warnings
    let warnings = check_family_warnings(&mu, family.as_ref());
    log_family_warnings(&warnings);

    // Handle non-estimable parameters (set to NaN)
    if !empty {
        // TODO: Implement proper rank checking and coefficient setting
        // For now, we'll keep the current behavior
    }

    // Calculate residuals
    let residuals = calculate_residuals(&y, &mu, &eta, &mu_eta);

    // Calculate working weights for final result
    let variance_fn = |mu: &[f64]| {
        mu.iter()
            .map(|&mu_i| variance.variance(mu_i).unwrap_or(1.0))
            .collect()
    };
    let (w, good) = calculate_working_weights(&weights, &mu, &eta, &variance_fn, &mu_eta);

    // Calculate null deviance
    let nulldev = calculate_null_deviance(&y, &weights, &offset, intercept, &linkinv, &dev_resids);

    // Calculate degrees of freedom
    // Use the rank returned by the IRLS weighted least squares solve when available
    let (_, nulldf, mut rank, mut resdf) =
        calculate_degrees_of_freedom(n, p, &weights, intercept, empty);

    // If we have a rank estimate from IRLS, prefer it over the naive p
    if let Some(r) = irls_rank {
        let n_ok = n - weights.iter().filter(|&&w| w == 0.0).count();
        rank = r;
        resdf = n_ok.saturating_sub(rank);
    }

    // Check for fitted values at boundaries (R's behavior)
    if family.name() == "binomial" {
        let eps = 10.0 * f64::EPSILON; // R's definition: 10*.Machine$double.eps
        let has_boundary_values = mu.iter().any(|&m| m > 1.0 - eps || m < eps);
        if has_boundary_values {
            #[cfg(feature = "wasm")]
            console::log_1(
                &"[GLM Fit Core] Warning: fitted probabilities numerically 0 or 1 occurred".into(),
            );
        }
    }

    // Calculate AIC
    // R uses: aic(y, n, mu, weights, dev) + 2*rank
    let aic_model = calculate_aic(&y, &mu, &weights, devold, rank, &aic);

    // Create working weights
    let wt = create_final_working_weights(&w, &good);

    Ok(GlmResult {
        coefficients: coef,
        residuals: residuals.clone(),
        fitted_values: mu.clone(),
        linear_predictors: eta,
        working_residuals: residuals.clone(),
        response_residuals: y
            .iter()
            .zip(mu.iter())
            .map(|(&y_i, &mu_i)| y_i - mu_i)
            .collect(),
        deviance_residuals: residuals.clone(),
        pearson_residuals: residuals.clone(),
        effects: None,  // TODO: Calculate from QR
        r_matrix: None, // TODO: Calculate from QR
        qr: None,       // TODO: Store QR result
        rank,
        qr_rank: rank,
        pivot: (0..p as i32).collect(),
        tol: control.epsilon,
        pivoted: false,
        family: family.clone_box(),
        deviance: devold,
        aic: aic_model,
        null_deviance: nulldev,
        iter,
        weights: wt,
        prior_weights: weights,
        df_residual: resdf,
        df_null: nulldf,
        y,
        converged: conv,
        boundary,
        model: None,
        x: None,
        call: None,
        formula: None,
        terms: None,
        data: None,
        offset: Some(offset),
        control,
        method: "glm.fit".to_string(),
        contrasts: None,
        xlevels: None,
        na_action: None,
        dispersion: 1.0, // Default dispersion value
    })
}
