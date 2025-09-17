//! GLM IRLS core algorithm
//!
//! This file contains the core IRLS algorithm implementation.

use super::glm_fit_utils::solve_weighted_ls;
use super::types_control::GlmControl;
use crate::stats::regression::family::GlmFamily;

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

    // Get family functions
    let variance = family.variance();
    let linkinv = family.linkinv();
    let dev_resids = family.dev_resids();
    let mu_eta = family.mu_eta();
    let valideta = family.valideta();
    let validmu = family.validmu();

    let mut coefold: Option<Vec<f64>> = None;

    // Main IRLS iteration
    for iter_count in 1..=control.maxit {
        *iter = iter_count;

        // Check for valid observations
        let good: Vec<bool> = weights.iter().map(|&w| w > 0.0).collect();
        let varmu = variance(mu);

        // Check for NAs in variance
        if varmu.iter().any(|&v| !v.is_finite()) {
            return Err("NAs in V(mu)".to_string());
        }

        // Check for zeros in variance
        if varmu.iter().any(|&v| v == 0.0) {
            return Err("0s in V(mu)".to_string());
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

        // Solve weighted least squares
        let qr_result = solve_weighted_ls(&x_weighted, &z_weighted, control.epsilon / 1000.0)?;

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

        // Update coefficients using pivot
        let mut new_coef = vec![0.0; p];
        for (i, &pivot) in qr_result.pivot.iter().enumerate() {
            if i < qr_result.coefficients.len() {
                new_coef[pivot as usize] = qr_result.coefficients[i];
            }
        }

        // Store old coefficients for step halving
        coefold = Some(coef.clone());
        *coef = new_coef;

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

        // Calculate new deviance
        let dev = dev_resids(y, mu, weights).iter().sum::<f64>();

        if control.trace {
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
        if !valideta(eta) || !validmu(mu) {
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

            while !valideta(&current_eta) || !validmu(&current_mu) {
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
