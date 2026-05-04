//! GLM fit core functionality
//!
//! This file contains the main glm_fit function and core fitting logic.

use super::chol2inv::chol2inv;
use super::glm_aic::calculate_aic;
use super::glm_fit_core_calculation::*;
use super::glm_fit_core_initialization::*;
use super::glm_fit_core_validation::*;
use super::glm_fit_core_warnings::*;

use super::glm_fit_irls_core::run_irls_iteration;
use super::types::{
    GlmControl, GlmFamilyInfo, GlmResult, ModelFrame, ModelMatrix, QrDecomposition, TermsObject,
};
use crate::stats::regression::family::GlmFamily;
use std::collections::HashMap;

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
    column_names: Option<Vec<String>>,
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
    })?;
    let mut boundary = false;
    let mut conv = false;
    let mut iter = 0;

    let mut coef = if empty {
        vec![]
    } else {
        start.unwrap_or_else(|| vec![0.0; p])
    };

    // Track rank and QR from IRLS
    let mut irls_rank: Option<usize> = None;
    let mut irls_qr_result: Option<super::qr_decomposition::QrLsResult> = None;
    let mut irls_w: Vec<f64> = vec![0.0; n];

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
        coef = irls_result.coef;
        let rank = irls_result.rank;

        // Recompute eta and mu from final coefficients (before setting NaN).
        // Beyond-rank coefficients are 0 at this point, matching R's IRLS.
        eta = (0..n).map(|i| {
            offset[i] + x[i].iter().zip(coef.iter()).map(|(x_ij, &c_j)| x_ij * c_j).sum::<f64>()
        }).collect();
        mu = linkinv(&eta);
        // R: if (fit$rank < nvars) coef[fit$pivot][seq.int(fit$rank+1, nvars)] <- NA
        // Set beyond-rank coefficients to NaN after eta/mu computation
        if let Some(ref qr) = irls_result.qr_result {
            if rank < p {
                let pivot = &qr.pivot;
                for i in rank..p {
                    let pivot_idx = pivot[i] as usize - 1;
                    if pivot_idx < p {
                        coef[pivot_idx] = f64::NAN;
                    }
                }
            }
        }

        // Update convergence and boundary status from IRLS result
        conv = irls_result.converged;
        boundary = irls_result.boundary;
        irls_rank = Some(rank);
        irls_qr_result = irls_result.qr_result;
        // Save IRLS working weights for R-compatible dispersion computation
        irls_w = irls_result.w;

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

    // Use IRLS last-iteration weights (R stores w from the last iteration,
    // NOT recomputed from converged mu — these differ slightly because mu
    // is updated after the last QR solve but w was computed before it).
    let w = irls_w.clone();
    let good: Vec<bool> = w.iter().map(|&wi| wi > 0.0).collect();

    // Calculate deviance residuals: sign(y - mu) * sqrt(dev_resids(y, mu, wts))
    let dev_resids_fn = family.dev_resids();
    let dev_contributions = dev_resids_fn(&y, &mu, &weights);
    let deviance_residuals: Vec<f64> = y.iter()
        .zip(mu.iter())
        .zip(dev_contributions.iter())
        .map(|((&y_i, &mu_i), &dev_i)| {
            let sign = if y_i > mu_i { 1.0 } else { -1.0 };
            sign * dev_i.max(0.0).sqrt()
        })
        .collect();

    // Calculate Pearson residuals: (y - mu) * sqrt(wts) / sqrt(variance(mu))
    let pearson_residuals: Vec<f64> = y.iter()
        .zip(mu.iter())
        .zip(weights.iter())
        .map(|((&y_i, &mu_i), &w_i)| {
            let var_i = variance.variance(mu_i).unwrap_or(1.0);
            if var_i > 0.0 {
                (y_i - mu_i) * w_i.sqrt() / var_i.sqrt()
            } else {
                0.0
            }
        })
        .collect();

    // Calculate null deviance
    let nulldev = calculate_null_deviance(&y, &weights, &offset, intercept, &linkinv, &|y, mu, w| {
        deviance_fn.deviance(y, mu, w)
    })?;

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

    // Clone coef before moving it into the struct so we can use it for calculations
    let coef_for_stats = coef.clone();

    // ── Covariance matrix via chol2inv (matches R's summary.glm) ────────────
    // R computes: cov.unscaled = chol2inv(Qr$qr[1:p, 1:p])
    //             cov.scaled   = dispersion * cov.unscaled
    // Dispersion is fixed at 1.0 for binomial/poisson, estimated for others.
    let sigma_squared = match family.name() {
        "binomial" | "poisson" => 1.0,
        _ => {
            if resdf > 0 {
                // R computes: sum(object$weights * object$residuals^2) / df.residual
                // where object$weights = w^2 (IRLS weights from last iteration)
                // and object$residuals = working residuals = (y - mu) / mu.eta(eta)
                // This equals Pearson chi-sq when using the IRLS loop's w.
                let irls_wt_resid_sq: f64 = irls_w.iter()
                    .zip(residuals.iter())
                    .enumerate()
                    .filter(|&(_, (w_i, _))| *w_i > 0.0)
                    .map(|(_, (w_i, r_i))| w_i * w_i * r_i * r_i)
                    .sum();

                irls_wt_resid_sq / resdf as f64
            } else {
                // R: df.r == 0 → dispersion = NaN (line 704 of summary.glm)
                f64::NAN
            }
        }
    };

    // Extract upper triangular R from QR result, respecting rank.
    // R does: p1 <- 1L:p; chol2inv(Qr$qr[p1, p1, drop=FALSE])
    // where p is rank, not nvars. Only the rank×rank upper-left is inverted.
    let pivot: Vec<usize> = irls_qr_result
        .as_ref()
        .map(|qr| qr.pivot.iter().map(|&x| (x - 1) as usize).collect())
        .unwrap_or_else(|| (0..p).collect());

    let r_rank_matrix: Vec<Vec<f64>> = irls_qr_result
        .as_ref()
        .map(|qr| {
            let mut r_mat = vec![vec![0.0; rank]; rank];
            let n_qr = qr.qr.len() / p;
            for i in 0..rank {
                for j in i..rank {
                    let idx = j * n_qr + i;
                    if idx < qr.qr.len() {
                        r_mat[i][j] = qr.qr[idx];
                    }
                }
            }
            r_mat
        })
        .unwrap_or_else(|| vec![vec![0.0; rank]; rank]);

    // cov.unscaled = chol2inv(R[1:rank, 1:rank]) — rank×rank matrix
    let cov_unscaled_rank = chol2inv(&r_rank_matrix)
        .unwrap_or_else(|_| vec![vec![0.0; rank]; rank]);

    // Expand to p×p via .vcov.aliased: NaN for aliased (rank-deficient) entries.
    // R: aliased <- is.na(coef); VC <- matrix(NA, p, p); j <- which(!aliased); VC[j,j] <- vc
    // The non-aliased positions correspond to pivot[0..rank] in original column order.
    let cov_unscaled = {
        let mut full = vec![vec![f64::NAN; p]; p];
        for ri in 0..rank {
            for rj in 0..rank {
                let oi = pivot[ri];
                let oj = pivot[rj];
                full[oi][oj] = cov_unscaled_rank[ri][rj];
            }
        }
        full
    };

    // cov.scaled = dispersion * cov.unscaled
    let cov_scaled: Vec<Vec<f64>> = cov_unscaled
        .iter()
        .map(|row| row.iter().map(|&v| v * sigma_squared).collect())
        .collect();

    // SE = sqrt(diag(cov.scaled)) — NaN for aliased coefficients
    let std_errors_vec: Vec<f64> = (0..p).map(|i| cov_scaled[i][i].sqrt()).collect();

    // t-statistics = coef / SE — NaN for aliased
    let t_stats_vec: Vec<f64> = coef_for_stats
        .iter()
        .zip(std_errors_vec.iter())
        .map(|(&c, &se)| if se > 0.0 && se.is_finite() { c / se } else { f64::NAN })
        .collect();

    // p-values from t-distribution (or z for known dispersion)
    let p_values_vec: Vec<f64> = {
        use crate::stats::distributions::students_t;
        t_stats_vec
            .iter()
            .map(|&t| {
                if resdf > 0 && t.is_finite() {
                    2.0 * students_t::pt(t.abs(), resdf as f64, false, false)
                } else {
                    f64::NAN
                }
            })
            .collect()
    };

    let mut glm_result = GlmResult {
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
        pearson_residuals: pearson_residuals.clone(),
        effects: irls_qr_result
            .as_ref()
            .map(|qr| qr.effects.clone())
            .unwrap_or_default(),
        r: irls_qr_result
            .as_ref()
            .map(|qr| {
                // Convert QR matrix to R matrix format (upper triangular)
                // QR decomposition stores R in upper triangle of qr matrix (column-major)
                let mut r_matrix = vec![vec![0.0; p]; p];
                let n = qr.qr.len() / p; // number of rows
                for i in 0..p {
                    for j in i..p {
                        // Column-major indexing: element at (row=i, col=j) is at index j*n + i
                        let idx = j * n + i;
                        if idx < qr.qr.len() {
                            r_matrix[i][j] = qr.qr[idx];
                        }
                    }
                }
                r_matrix
            })
            .unwrap_or_default(),
        qr: QrDecomposition {
            qr: irls_qr_result
                .as_ref()
                .map(|qr| {
                    // Convert 1D QR matrix (column-major) to 2D format (row-major)
                    // QR decomposition stores data column-major: qr[i + j*n]
                    let mut qr_2d = vec![vec![0.0; p]; y.len()];
                    for i in 0..y.len() {
                        for j in 0..p {
                            let idx = i + j * y.len(); // column-major indexing
                            if idx < qr.qr.len() {
                                qr_2d[i][j] = qr.qr[idx];
                            }
                        }
                    }
                    qr_2d
                })
                .unwrap_or_default(),
            rank: rank,
            qraux: irls_qr_result
                .as_ref()
                .map(|qr| qr.qraux.clone())
                .unwrap_or_default(),
            pivot: irls_qr_result
                .as_ref()
                .map(|qr| qr.pivot.iter().map(|&x| x as usize).collect())
                .unwrap_or_else(|| (0..p).collect()),
            tol: control.epsilon,
        },
        rank,
        qr_rank: rank,
        pivot: (0..p as i32).collect(),
        tol: control.epsilon,
        pivoted: 0,
        family: GlmFamilyInfo::from_glm_family(family.as_ref()),
        deviance: devold,
        aic: aic_model,
        null_deviance: nulldev,
        iter,
        weights: wt,
        prior_weights: weights,
        df_residual: resdf,
        df_null: nulldf,
        y: y.clone(),
        converged: conv as u8,
        boundary: boundary as u8,
        model: ModelFrame {
            y: y.clone(),
            predictors: (0..p)
                .map(|i| (format!("x{}", i), x.iter().map(|row| row[i]).collect()))
                .collect(),
            factors: HashMap::new(),
        },
        x: Some(ModelMatrix {
            matrix: x.iter().flatten().cloned().collect(), // Flatten 2D to 1D
            n_rows: y.len(),
            n_cols: p,
            column_names: (0..p).map(|i| format!("x{}", i)).collect(),
            term_assignments: (0..p as i32).collect(),
            row_names: None,
        }),
        call: format!(
            "glm(formula = y ~ x, family = {}, data = data)",
            family.name()
        ),
        formula: "y ~ x".to_string(),
        terms: TermsObject {
            variables: vec!["y".to_string(), "x".to_string()],
            factors: vec![vec![1]], // Factor matrix - x variable
            term_labels: vec!["(Intercept)".to_string(), "x".to_string()],
            order: vec![0, 1],
            intercept: 1,
            response: 0,
            data_classes: HashMap::new(),
        },
        data: "data".to_string(),
        offset: Some(offset),
        control,
        method: "glm.fit".to_string(),
        contrasts: HashMap::new(),
        xlevels: HashMap::new(),
        na_action: None,
        dispersion: 1.0, // Default dispersion value

        // Additional derived information (31-50)
        model_matrix: x.clone(),
        model_matrix_dimensions: (y.len(), p),
        model_matrix_column_names: column_names.as_ref().map_or_else(|| (0..p).map(|i| format!("x{}", i)).collect(), |names| names.clone()),
        residual_standard_error: if resdf > 0 {
            (devold / resdf as f64).sqrt()
        } else {
            0.0
        },
        r_squared: if nulldev > 0.0 {
            1.0 - (devold / nulldev)
        } else {
            0.0
        },
        adjusted_r_squared: if nulldev > 0.0 && y.len() > p {
            let n = y.len() as f64;
            let k = p as f64;
            1.0 - (1.0 - (devold / nulldev)) * (n - 1.0) / (n - k)
        } else {
            0.0
        },
        deviance_explained_percent: if nulldev > 0.0 {
            (1.0 - (devold / nulldev)) * 100.0
        } else {
            0.0
        },
        f_statistic: if resdf > 0 && nulldev > devold {
            ((nulldev - devold) / (nulldf - resdf) as f64) / (devold / resdf as f64)
        } else {
            0.0
        },
        f_p_value: 0.0, // TODO: Calculate F-test p-value
        n_observations: y.len(),
        response_variable_name: "y".to_string(),
        predictor_variable_names: (0..p).map(|i| format!("x{}", i)).collect(),
        factor_levels: HashMap::new(),
        reference_levels: HashMap::new(),
        dispersion_parameter: sigma_squared,
        deviance_residuals: deviance_residuals.clone(),
        covariance_matrix: cov_scaled,
        standard_errors: std_errors_vec,
        t_statistics: t_stats_vec,
        p_values: p_values_vec,
        leverage: {
            // Calculate leverage (hat values) following R's lminfl.f algorithm:
            // For each column j=1..k: compute Q*e_j and accumulate squared values
            // hat[i] = sum_j (Q*e_j)[i]^2 where e_j is the j-th unit vector
            // This is equivalent to computing row sums of Q^2

            use super::qr_decomposition::apply_qy;

            if let Some(ref qr) = irls_qr_result {
                let n_obs = y.len();
                let mut hat_values = vec![0.0; n_obs];
                let qr_rank = qr.rank;  // Use rank, not p

                // For each column j of the rank (matching R's loop over k)
                for j in 0..qr_rank {
                    // Create unit vector e_j
                    let mut e_j = vec![0.0; n_obs];
                    if j < n_obs {
                        e_j[j] = 1.0;
                    }

                    // Compute Q * e_j using the QR decomposition
                    let q_ej = apply_qy(&qr.qr, &qr.qraux, &e_j, n_obs, qr_rank);

                    // Accumulate squared values: hat[i] += (Q*e_j)[i]^2
                    for i in 0..n_obs {
                        hat_values[i] += q_ej[i] * q_ej[i];
                    }
                }

                // Cap hat values following R's two-stage approach:
                // 1. lminfl.f line 94: if hat >= 1 - qr_tol, set to 1
                // 2. lm.influence.R line 118: if hat > 1 - 10*eps, set to 1
                //
                // The second capping is critical for preventing massive Cook's D values
                // when hat is numerically very close to 1 (e.g., 0.999999998)
                let qr_tol = qr.tol;
                let eps_tol = 10.0 * f64::EPSILON; // 10 * 2.22e-16 ≈ 2.22e-15
                for i in 0..n_obs {
                    if hat_values[i] >= 1.0 - qr_tol || hat_values[i] > 1.0 - eps_tol {
                        hat_values[i] = 1.0;
                    }
                }

                hat_values
            } else {
                vec![0.0; y.len()]
            }
        },
        cooks_distance: {
            // Calculate Cook's distance: D_i = (r_i^2 / (p * dispersion)) * (h_i / (1 - h_i)^2)
            // where r_i is the Pearson residual, h_i is leverage, p is number of parameters

            // First calculate leverage (same formula as above)
            use super::qr_decomposition::apply_qy;

            let hat_values = if let Some(ref qr) = irls_qr_result {
                let n_obs = y.len();
                let mut hat_vals = vec![0.0; n_obs];
                let qr_rank = qr.rank;  // Use rank, not p

                // For each column j of the rank (matching R's loop over k)
                for j in 0..qr_rank {
                    // Create unit vector e_j
                    let mut e_j = vec![0.0; n_obs];
                    if j < n_obs {
                        e_j[j] = 1.0;
                    }

                    // Compute Q * e_j using the QR decomposition
                    let q_ej = apply_qy(&qr.qr, &qr.qraux, &e_j, n_obs, qr_rank);

                    // Accumulate squared values: hat[i] += (Q*e_j)[i]^2
                    for i in 0..n_obs {
                        hat_vals[i] += q_ej[i] * q_ej[i];
                    }
                }

                hat_vals
            } else {
                vec![0.0; y.len()]
            };

            // Calculate Cook's distance for each observation
            // Formula from R: (pearson_res/(1-hat))^2 * hat/(dispersion * p)
            // Dispersion is 1.0 for binomial and poisson, estimated for others
            // R uses Pearson chi-squared / df_resid for estimated dispersion
            let dispersion = match family.name() {
                "binomial" | "poisson" | "quasibinomial" | "quasipoisson" => 1.0,
                _ => {
                    if resdf > 0 {
                        let pearson_chisq: f64 = pearson_residuals.iter().map(|r| r * r).sum();
                        pearson_chisq / resdf as f64
                    } else {
                        1.0
                    }
                }
            };

            // Use Pearson residuals already computed
            let mut cooks_d = Vec::with_capacity(y.len());
            for i in 0..y.len() {
                let h_i = hat_values[i];
                let pr = pearson_residuals[i];

                // Cook's distance formula from R
                let denominator = 1.0 - h_i;
                let cooks_di = if denominator.abs() > 1e-10 && p > 0 {
                    (pr / denominator).powi(2) * h_i / (dispersion * p as f64)
                } else {
                    0.0
                };
                cooks_d.push(cooks_di);
            }
            cooks_d
        },
        confint_lower: Vec::new(),
        confint_upper: Vec::new(),
    };

    // Pre-compute 95% confidence intervals at fit time to avoid serde_wasm_bindgen round-trip issues
    // (serde_wasm_bindgen corrupts Option<String> fields, making from_value() fail on GlmResult)
    // Only do this for top-level fits (with column_names), not for constrained fits inside profiling
    if column_names.is_some() {
        if let Ok(ci) = glm_result.confint(0.95) {
            glm_result.confint_lower = ci.lower;
            glm_result.confint_upper = ci.upper;
        }
    }

    Ok(glm_result)
}
