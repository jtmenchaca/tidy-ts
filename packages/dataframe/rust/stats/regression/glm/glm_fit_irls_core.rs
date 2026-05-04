//! GLM IRLS core algorithm
//!
//! This file contains the core IRLS algorithm implementation.

// Removed solve_weighted_ls import - now using cdqrls from LM
use super::types_control::GlmControl;
use crate::stats::regression::family::GlmFamily;

// Console logging removed for cleaner output

/// Result of IRLS iteration
#[derive(Debug)]
pub struct IrlsResult {
    pub eta: Vec<f64>,
    pub mu: Vec<f64>,
    pub coef: Vec<f64>,
    pub converged: bool,
    pub boundary: bool,
    /// Estimated rank of the design matrix from the final IRLS WLS solve
    pub rank: usize,
    /// QR decomposition result from the final iteration
    pub qr_result: Option<super::qr_decomposition::QrLsResult>,
    /// IRLS working weights (w) from the start of the final iteration.
    /// R stores wt = w^2 in object$weights; used for dispersion computation.
    pub w: Vec<f64>,
}

/// Run the IRLS iteration algorithm
///
/// This function implements the core IRLS algorithm with step halving
/// for divergence and boundary issues.
pub fn run_irls_iteration(
    x: &[Vec<f64>],
    y: &[f64],
    weights: &[f64],
    offset: &[f64],
    coef: &mut Vec<f64>,
    eta: &mut Vec<f64>,
    mu: &mut Vec<f64>,
    family: &dyn GlmFamily,
    control: &GlmControl,
    devold: &mut f64,
    boundary: &mut bool,
    conv: &mut bool,
    iter: &mut usize,
) -> Result<IrlsResult, String> {
    let n = y.len();
    let _p = x[0].len();
    #[allow(unused_assignments)]
    let mut coefold: Option<Vec<f64>> = None;

    // Get family functions
    let variance = family.variance();
    let linkinv = family.linkinv();
    let dev_resids = family.dev_resids();
    let deviance_fn = family.deviance();
    let mu_eta = family.mu_eta();
    let valideta = family.valideta();
    let validmu = family.validmu();

    // Main IRLS iteration
    // Track the estimated rank from the weighted least squares step
    let mut last_rank: usize = 0;
    let mut last_qr_result: Option<super::qr_decomposition::QrLsResult> = None;
    let mut last_w: Vec<f64> = Vec::new();
    let mut last_good: Vec<bool> = Vec::new();

    for iter_count in 1..=control.maxit {
        // Starting iteration {}/{}

        *iter = iter_count;

        // Check for valid observations
        let good: Vec<bool> = weights.iter().map(|&w| w > 0.0).collect();

        // Mu range check removed for cleaner output

        let mut varmu: Vec<f64> = mu
            .iter()
            .map(|&mu_i| variance.variance(mu_i).unwrap_or(1.0))
            .collect();

        // Check for NAs in variance
        if varmu.iter().any(|&v| !v.is_finite()) {
            return Err("NAs in V(mu)".to_string());
        }

        // Check for zeros in variance
        // With epsilon clamping in the variance function, this should no longer happen
        // But keep the check as a safeguard
        if varmu.iter().any(|&v| v == 0.0 || !v.is_finite()) {
            // Bad variance values detected - will return error
            return Err("Invalid variance values in V(mu)".to_string());
        }

        // Clamp very small variances to tolerance for numerical stability
        let variance_tolerance = 1e-10;
        let has_small_variance = varmu.iter().any(|&v| v < variance_tolerance);
        if has_small_variance {
            // Clamp small variances to tolerance
            for v in varmu.iter_mut() {
                if *v < variance_tolerance {
                    *v = variance_tolerance;
                }
            }
        }

        let mu_eta_val = mu_eta(eta);
        if mu_eta_val
            .iter()
            .enumerate()
            .any(|(i, &val)| good[i] && !val.is_finite())
        {
            return Err("NAs in d(mu)/d(eta)".to_string());
        }

        // Drop observations for which w will be zero
        let good: Vec<bool> = weights
            .iter()
            .zip(mu_eta_val.iter())
            .map(|(&w, &val)| w > 0.0 && val != 0.0)
            .collect();

        if good.iter().all(|&g| !g) {
            *conv = false;
            return Err(format!(
                "no observations informative at iteration {}",
                iter_count
            ));
        }

        // Calculate working response and weights
        let z: Vec<f64> = eta
            .iter()
            .zip(offset.iter())
            .zip(y.iter())
            .zip(mu.iter())
            .zip(mu_eta_val.iter())
            .enumerate()
            .filter(|(i, _)| good[*i])
            .map(|(_, ((((eta_i, offset_i), y_i), mu_i), mu_eta_i))| {
                (eta_i - offset_i) + (y_i - mu_i) / mu_eta_i
            })
            .collect();

        let w: Vec<f64> = weights
            .iter()
            .zip(mu_eta_val.iter())
            .zip(varmu.iter())
            .enumerate()
            .filter(|(i, _)| good[*i])
            .map(|(_, ((&weight_i, &mu_eta_i), &var_i))| {
                (weight_i * mu_eta_i * mu_eta_i / var_i).sqrt()
            })
            .collect();

        // Save w and good for the return value (R stores these from the last iteration)
        last_w = w.clone();
        last_good = good.clone();

        // Create weighted design matrix and response
        let mut x_weighted = Vec::new();
        let mut z_weighted = Vec::new();

        let mut good_idx = 0;
        for (i, &is_good) in good.iter().enumerate() {
            if is_good {
                let row: Vec<f64> = x[i].iter().map(|&x_ij| x_ij * w[good_idx]).collect();
                x_weighted.push(row);
                z_weighted.push(z[good_idx] * w[good_idx]);
                good_idx += 1;
            }
        }

        // Solve weighted least squares using QR decomposition
        use super::qr_decomposition::cdqrls;

        // Convert to the format expected by cdqrls (column-major)
        let n_weighted = x_weighted.len();
        let p_weighted = if n_weighted > 0 {
            x_weighted[0].len()
        } else {
            0
        };
        let mut x_flat = vec![0.0; n_weighted * p_weighted];
        for i in 0..n_weighted {
            for j in 0..p_weighted {
                x_flat[i + j * n_weighted] = x_weighted[i][j];
            }
        }

        // About to call cdqrls

        let qr_result = cdqrls(
            &x_flat,
            &z_weighted,
            n_weighted,
            p_weighted,
            1,
            Some(control.epsilon / 1000.0),
        )?;

        // Store QR result for final return
        last_qr_result = Some(qr_result.clone());

        // Checking coefficients

        if qr_result.coefficients.iter().any(|&c| !c.is_finite()) {
            *conv = false;
            return Err(format!(
                "non-finite coefficients at iteration {}",
                iter_count
            ));
        }

        // Coefficients are finite

        // Save the current rank estimate
        last_rank = qr_result.rank;

        // Check rank
        if n < qr_result.rank {
            return Err(format!(
                "X matrix has rank {}, but only {} observation{}",
                qr_result.rank,
                n,
                if n == 1 { "" } else { "s" }
            ));
        }

        // Store old coefficients for step halving
        coefold = Some(coef.clone());

        // R's glm.fit: start[fit$pivot] <- fit$coefficients
        // dqrls returns coefficients in pivoted order with zeros beyond rank.
        // During IRLS iterations, beyond-rank coefficients are 0 (not NaN)
        // so that eta = X %*% start works correctly.
        // NaN is only set in the final output (after convergence).

        let pivot = &qr_result.pivot;
        let p = coef.len();

        for i in 0..p.min(qr_result.coefficients.len()) {
            let pivot_idx = pivot[i] as usize - 1; // R uses 1-based indexing
            if pivot_idx < p {
                coef[pivot_idx] = qr_result.coefficients[i];
            }
        }
        // R: eta <- drop(x %*% start)
        *eta = offset
            .iter()
            .enumerate()
            .map(|(i, &o)| {
                o + x[i]
                    .iter()
                    .zip(coef.iter())
                    .map(|(x_ij, &c_j)| x_ij * c_j)
                    .sum::<f64>()
            })
            .collect();

        *mu = linkinv(eta);

        // linkinv completed

        // Validate mu values for family
        if let Err(e) = family.valid_mu(mu) {
            if coefold.is_none() {
                return Err(format!("Invalid fitted values: {}", e));
            }
            // Use step halving to find valid mu values
            *boundary = true;
        }

        // Calculating deviance

        // Calculate new deviance using the family-specific deviance
        let dev = deviance_fn.deviance(y, mu, weights)
            .map_err(|e| format!("Failed to calculate deviance at iteration {}: {}", iter_count, e))?;

        eprintln!("[IRLS] iter={} dev={} devold={}", iter_count, dev, *devold);

        if control.trace != 0 {
            println!("Deviance = {} Iterations - {}", dev, iter_count);
        }

        // Check for divergence - step halving
        *boundary = false;
        if !dev.is_finite() {
            if coefold.is_none() {
                return Err(
                    "no valid set of coefficients has been found: please supply starting values"
                        .to_string(),
                );
            }

            // Step halving for divergence
            let mut ii = 1;
            let mut current_coef = coef.clone();
            let mut current_eta = eta.clone();
            let mut current_mu = mu.clone();
            let mut current_dev = dev;

            while !current_dev.is_finite() {
                if ii > control.maxit {
                    return Err("inner loop 1; cannot correct step size".to_string());
                }
                ii += 1;

                // Halve the step size
                current_coef = coefold
                    .as_ref()
                    .unwrap()
                    .iter()
                    .zip(current_coef.iter())
                    .map(|(old, new)| (old + new) / 2.0)
                    .collect();

                // Recalculate eta and mu
                current_eta = offset
                    .iter()
                    .enumerate()
                    .map(|(i, &o)| {
                        o + x[i]
                            .iter()
                            .zip(current_coef.iter())
                            .map(|(x_ij, &c_j)| x_ij * c_j)
                            .sum::<f64>()
                    })
                    .collect();
                current_mu = linkinv(&current_eta);
                current_dev = dev_resids(y, &current_mu, weights).iter().sum::<f64>();
            }

            *boundary = true;
            *coef = current_coef;
            *eta = current_eta;
            *mu = current_mu;

            if control.trace != 0 {
                println!("Step halved: new deviance = {}", current_dev);
            }
        }

        // Check for fitted values outside domain - step halving
        if valideta(eta).is_err() || validmu(mu).is_err() {
            if coefold.is_none() {
                return Err(
                    "no valid set of coefficients has been found: please supply starting values"
                        .to_string(),
                );
            }

            // Step halving for boundary issues
            let mut ii = 1;
            let mut current_coef = coef.clone();
            let mut current_eta = eta.clone();
            let mut current_mu = mu.clone();

            while valideta(&current_eta).is_err() || validmu(&current_mu).is_err() {
                if ii > control.maxit {
                    return Err("inner loop 2; cannot correct step size".to_string());
                }
                ii += 1;

                // Halve the step size
                current_coef = coefold
                    .as_ref()
                    .unwrap()
                    .iter()
                    .zip(current_coef.iter())
                    .map(|(old, new)| (old + new) / 2.0)
                    .collect();

                // Recalculate eta and mu
                current_eta = offset
                    .iter()
                    .enumerate()
                    .map(|(i, &o)| {
                        o + x[i]
                            .iter()
                            .zip(current_coef.iter())
                            .map(|(x_ij, &c_j)| x_ij * c_j)
                            .sum::<f64>()
                    })
                    .collect();
                current_mu = linkinv(&current_eta);
            }

            *boundary = true;
            *coef = current_coef;
            *eta = current_eta;
            *mu = current_mu;
            let current_dev = dev_resids(y, mu, weights).iter().sum::<f64>();

            if control.trace != 0 {
                println!("Step halved: new deviance = {}", current_dev);
            }
        }

        // Recalculate deviance after any step-halving adjustments
        let dev = deviance_fn
            .deviance(y, mu, weights)
            .map_err(|e| format!("Failed to calculate deviance after step halving: {}", e))?;

        // Check for increasing deviance - step halving (inner loop 3)
        // This is the Marschner (2011) "glm2" approach: if deviance increased,
        // halve the step until it decreases or we hit the iteration limit.
        if iter_count > 1 && (dev - *devold) / (0.1 + dev.abs()) >= control.epsilon {
            if coefold.is_none() {
                return Err(
                    "no valid set of coefficients has been found: please supply starting values"
                        .to_string(),
                );
            }

            let mut ii = 1;
            let mut current_coef = coef.clone();
            let mut current_eta = eta.clone();
            let mut current_mu = mu.clone();
            let mut current_dev = dev;

            while (current_dev - *devold) / (0.1 + current_dev.abs()) >= -control.epsilon {
                if ii > control.maxit {
                    eprintln!("[IRLS] inner loop 3 FAILED: current_dev={} devold={}", current_dev, *devold);
                    return Err("inner loop 3; cannot correct step size".to_string());
                }
                ii += 1;

                // Halve the step size
                current_coef = coefold
                    .as_ref()
                    .unwrap()
                    .iter()
                    .zip(current_coef.iter())
                    .map(|(old, new)| {
                        let old_val = if old.is_nan() { 0.0 } else { *old };
                        let new_val = if new.is_nan() { 0.0 } else { *new };
                        (old_val + new_val) / 2.0
                    })
                    .collect();

                // Recalculate eta and mu
                current_eta = offset
                    .iter()
                    .enumerate()
                    .map(|(i, &o)| {
                        o + x[i]
                            .iter()
                            .zip(current_coef.iter())
                            .map(|(x_ij, &c_j)| {
                                if c_j.is_nan() {
                                    0.0
                                } else {
                                    x_ij * c_j
                                }
                            })
                            .sum::<f64>()
                    })
                    .collect();
                current_mu = linkinv(&current_eta);
                current_dev = deviance_fn.deviance(y, &current_mu, weights).unwrap_or(f64::INFINITY);
            }

            *boundary = true;
            *coef = current_coef;
            *eta = current_eta;
            *mu = current_mu;

            if control.trace != 0 {
                println!(
                    "Step halved (increasing deviance): new deviance = {}",
                    current_dev
                );
            }
        }

        // Check for convergence
        // Recalculate final deviance after all step-halving
        let dev = deviance_fn
            .deviance(y, mu, weights)
            .map_err(|e| format!("Failed to calculate final deviance: {}", e))?;

        let criterion = (dev - *devold).abs() / (0.1 + dev.abs());
        if criterion < control.epsilon {
            *conv = true;
            *devold = dev;
            break;
        } else {
            *devold = dev;
        }
    }

    // Note: R continues execution even if convergence fails, just sets converged = FALSE
    // We'll handle warnings in the calling code, not return errors here
    if !*conv {
        // In R, this would issue a warning: "glm.fit: algorithm did not converge"
        // We'll let the calling code handle this as a warning, not an error
    }

    if *boundary {
        // In R, this would issue a warning: "glm.fit: algorithm stopped at boundary value"
        // We'll let the calling code handle this as a warning, not an error
    }

    // Expand w back to full observation length (R: wt <- rep.int(0, nobs); wt[good] <- w^2)
    let n = eta.len();
    let mut w_full = vec![0.0; n];
    let mut good_idx = 0;
    for (i, &is_good) in last_good.iter().enumerate() {
        if is_good && good_idx < last_w.len() {
            w_full[i] = last_w[good_idx];
            good_idx += 1;
        }
    }

    Ok(IrlsResult {
        eta: eta.clone(),
        mu: mu.clone(),
        coef: coef.clone(),
        converged: *conv,
        boundary: *boundary,
        rank: last_rank,
        qr_result: last_qr_result,
        w: w_full,
    })
}
