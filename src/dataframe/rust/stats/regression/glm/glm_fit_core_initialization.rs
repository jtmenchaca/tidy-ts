//! GLM fit initialization functions
//!
//! This module contains initialization logic for GLM fitting.

use crate::stats::regression::family::GlmFamily;

/// Starting values for GLM fitting
#[derive(Debug, Clone)]
pub struct StartingValues {
    pub eta: Vec<f64>,
    pub mu: Vec<f64>,
    pub mustart: Vec<f64>,
}

/// Initializes starting values for GLM fitting
pub fn initialize_starting_values(
    x: &[Vec<f64>],
    y: &[f64],
    weights: &[f64],
    offset: &[f64],
    start: Option<&[f64]>,
    mustart: Option<&[f64]>,
    family: &dyn GlmFamily,
) -> Result<StartingValues, String> {
    let n = y.len();
    let p = if !x.is_empty() { x[0].len() } else { 0 };

    if let Some(mustart) = mustart {
        // Use provided mustart
        let eta = family.linkfun(mustart);
        let mu = family.linkinv()(&eta);
        Ok(StartingValues {
            eta,
            mu,
            mustart: mustart.to_vec(),
        })
    } else if let Some(start) = start {
        // Use provided start values
        if start.len() != p {
            return Err(format!(
                "length of 'start' should equal {} and correspond to initial coefs",
                p
            ));
        }
        let eta: Vec<f64> = if p == 1 {
            offset
                .iter()
                .zip(start.iter())
                .map(|(o, s)| o + x[0][0] * s)
                .collect()
        } else {
            offset
                .iter()
                .enumerate()
                .map(|(i, &o)| {
                    o + x[i]
                        .iter()
                        .zip(start.iter())
                        .map(|(x_ij, s_j)| x_ij * s_j)
                        .sum::<f64>()
                })
                .collect()
        };
        let mu = family.linkinv()(&eta);
        Ok(StartingValues {
            eta,
            mu: mu.clone(),
            mustart: mu,
        })
    } else {
        // Use family initialization
        let mut mustart = vec![0.0; n];
        let mut weights_mut = weights.to_vec();
        family.initialize(y, &mut mustart, &mut weights_mut)?;
        let eta = family.linkfun(&mustart);
        let mu = family.linkinv()(&eta);
        Ok(StartingValues { eta, mu, mustart })
    }
}

/// Calculates initial deviance
pub fn calculate_initial_deviance(
    y: &[f64],
    mu: &[f64],
    weights: &[f64],
    deviance_fn: &dyn Fn(&[f64], &[f64], &[f64]) -> Result<f64, &'static str>,
) -> f64 {
    // Use the family's deviance, not the sum of deviance residual magnitudes
    deviance_fn(y, mu, weights).unwrap_or_else(|_| 0.0)
}
