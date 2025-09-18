//! GLM IRLS core algorithm
//!
//! This file contains the core IRLS algorithm implementation.

// Removed solve_weighted_ls import - now using cdqrls from LM
use super::types_control::GlmControl;
use crate::stats::regression::family::GlmFamily;

#[cfg(feature = "wasm")]
use web_sys::console;

/// Result of IRLS iteration
#[derive(Debug)]
pub struct IrlsResult {
    pub eta: Vec<f64>,
    pub mu: Vec<f64>,
    pub coef: Vec<f64>,
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
    let p = x[0].len();
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
    for iter_count in 1..=control.maxit {
        *iter = iter_count;
        
        #[cfg(feature = "wasm")]
        console::log_1(&format!("GLM IRLS iteration {}", iter_count).into());

        // Check for valid observations
        let good: Vec<bool> = weights.iter().map(|&w| w > 0.0).collect();
        let mut varmu: Vec<f64> = mu
            .iter()
            .map(|&mu_i| variance.variance(mu_i).unwrap_or(1.0))
            .collect();

        // Check for NAs in variance
        if varmu.iter().any(|&v| !v.is_finite()) {
            #[cfg(feature = "wasm")]
            console::log_1(&"Error: NAs in V(mu)".into());
            return Err("NAs in V(mu)".to_string());
        }

        // Clamp very small variances to tolerance for numerical stability
        let variance_tolerance = 1e-10;
        let has_small_variance = varmu.iter().any(|&v| v < variance_tolerance);
        if has_small_variance {
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Warning: Very small variances in V(mu), min = {}", varmu.iter().fold(f64::INFINITY, |a, &b| a.min(b))).into());
            
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

        // Create weighted design matrix and response
        let mut x_weighted = Vec::new();
        let mut z_weighted = Vec::new();

        for (i, &is_good) in good.iter().enumerate() {
            if is_good {
                let row: Vec<f64> = x[i].iter().map(|&x_ij| x_ij * w[i]).collect();
                x_weighted.push(row);
                z_weighted.push(z[i] * w[i]);
            }
        }

        // Solve weighted least squares using the same QR approach as LM
        use crate::stats::regression::lm::lm_qr::cdqrls;
        
        // Convert to the format expected by cdqrls (column-major)
        let n_weighted = x_weighted.len();
        let p_weighted = if n_weighted > 0 { x_weighted[0].len() } else { 0 };
        let mut x_flat = vec![0.0; n_weighted * p_weighted];
        for i in 0..n_weighted {
            for j in 0..p_weighted {
                x_flat[i + j * n_weighted] = x_weighted[i][j];
            }
        }
        
        let qr_result = cdqrls(&x_flat, &z_weighted, n_weighted, p_weighted, 1, Some(control.epsilon / 1000.0))?;

        if qr_result.coefficients.iter().any(|&c| !c.is_finite()) {
            *conv = false;
            return Err(format!(
                "non-finite coefficients at iteration {}",
                iter_count
            ));
        }

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
        
        // Update coefficients directly (no pivot permutation needed)
        *coef = qr_result.coefficients.clone();

        // Update eta and mu
        *eta = if p == 1 {
            offset
                .iter()
                .zip(coef.iter())
                .map(|(o, &c)| o + x[0][0] * c)
                .collect()
        } else {
            offset
                .iter()
                .enumerate()
                .map(|(i, &o)| {
                    o + x[i]
                        .iter()
                        .zip(coef.iter())
                        .map(|(x_ij, &c_j)| x_ij * c_j)
                        .sum::<f64>()
                })
                .collect()
        };
        *mu = linkinv(eta);

        // Calculate new deviance using the family-specific deviance
        let dev = deviance_fn.deviance(y, mu, weights).unwrap_or(0.0);

        #[cfg(feature = "wasm")]
        console::log_1(&format!("Deviance = {} Iterations - {}", dev, iter_count).into());

        if control.trace {
            println!("Deviance = {} Iterations - {}", dev, iter_count);
        }

        // Check for divergence - step halving
        *boundary = false;
        if !dev.is_finite() {
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Divergence detected: dev = {}", dev).into());
            
            if coefold.is_none() {
                #[cfg(feature = "wasm")]
                console::log_1(&"Error: no valid set of coefficients has been found".into());
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
                #[cfg(feature = "wasm")]
                console::log_1(&format!("Step halving attempt {}, current_dev = {}", ii, current_dev).into());
                
                if ii > control.maxit {
                    #[cfg(feature = "wasm")]
                    console::log_1(&format!("Error: inner loop 1; cannot correct step size after {} attempts", ii).into());
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
                current_eta = if p == 1 {
                    offset
                        .iter()
                        .zip(current_coef.iter())
                        .map(|(o, &c)| o + x[0][0] * c)
                        .collect()
                } else {
                    offset
                        .iter()
                        .enumerate()
                        .map(|(i, &o)| {
                            o + x[i]
                                .iter()
                                .zip(current_coef.iter())
                                .map(|(x_ij, &c_j)| x_ij * c_j)
                                .sum::<f64>()
                        })
                        .collect()
                };
                current_mu = linkinv(&current_eta);
                current_dev = dev_resids(y, &current_mu, weights).iter().sum::<f64>();
            }

            *boundary = true;
            *coef = current_coef;
            *eta = current_eta;
            *mu = current_mu;

            if control.trace {
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
                current_eta = if p == 1 {
                    offset
                        .iter()
                        .zip(current_coef.iter())
                        .map(|(o, &c)| o + x[0][0] * c)
                        .collect()
                } else {
                    offset
                        .iter()
                        .enumerate()
                        .map(|(i, &o)| {
                            o + x[i]
                                .iter()
                                .zip(current_coef.iter())
                                .map(|(x_ij, &c_j)| x_ij * c_j)
                                .sum::<f64>()
                        })
                        .collect()
                };
                current_mu = linkinv(&current_eta);
            }

            *boundary = true;
            *coef = current_coef;
            *eta = current_eta;
            *mu = current_mu;
            let current_dev = dev_resids(y, mu, weights).iter().sum::<f64>();

            if control.trace {
                println!("Step halved: new deviance = {}", current_dev);
            }
        }

        // Check for convergence
        if (dev - *devold).abs() / (0.1 + dev.abs()) < control.epsilon {
            *conv = true;
            break;
        } else {
            *devold = dev;
        }
    }

    if !*conv {
        return Err("glm.fit: algorithm did not converge".to_string());
    }

    if *boundary {
        // Note: In R, this would be a warning, but we'll include it in the result
    }

    Ok(IrlsResult {
        eta: eta.clone(),
        mu: mu.clone(),
        coef: coef.clone(),
    })
}
