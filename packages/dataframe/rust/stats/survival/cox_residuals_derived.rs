//! Derived Cox residuals: deviance and dfbeta
//!
//! ## Source
//!
//! `survival-ref/survival-master/R/residuals.coxph.R`
//!
//! These residuals are computed from martingale and score residuals,
//! not from separate C functions.

/// Compute deviance residuals from martingale residuals and event status.
///
/// From R's `residuals.coxph.R`:
/// ```r
/// sign(rr) * sqrt(-2 * (rr + ifelse(status==0, 0, status * log(status - rr))))
/// ```
///
/// # Arguments
///
/// * `martingale` - Martingale residuals
/// * `status` - Event indicator (1=event, 0=censored)
///
/// # Returns
///
/// Deviance residuals
pub fn deviance_residuals(martingale: &[f64], status: &[f64]) -> Vec<f64> {
    martingale
        .iter()
        .zip(status.iter())
        .map(|(&m, &s)| {
            let inner = if s == 0.0 {
                m
            } else {
                m + s * (s - m).ln()
            };
            let sign = if m >= 0.0 { 1.0 } else { -1.0 };
            sign * (-2.0 * inner).sqrt()
        })
        .collect()
}

/// Compute dfbeta residuals from score residuals and variance matrix.
///
/// dfbeta[i] = score_resid[i] * var(beta)
///
/// These give the approximate change in beta when observation i is deleted.
///
/// # Arguments
///
/// * `score_resid` - Score residuals, score_resid[j][i] (nvar × n)
/// * `var` - Variance-covariance matrix of coefficients (nvar × nvar)
///
/// # Returns
///
/// dfbeta[j][i] (nvar × n)
pub fn dfbeta_residuals(score_resid: &[Vec<f64>], var: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let nvar = score_resid.len();
    let n = score_resid[0].len();
    let mut dfbeta = vec![vec![0.0_f64; n]; nvar];

    for i in 0..n {
        for j in 0..nvar {
            let mut sum = 0.0;
            for k in 0..nvar {
                sum += var[j][k] * score_resid[k][i];
            }
            dfbeta[j][i] = sum;
        }
    }

    dfbeta
}

/// Compute dfbetas residuals (standardized dfbeta).
///
/// dfbetas[j][i] = dfbeta[j][i] / se(beta[j])
///
/// # Arguments
///
/// * `dfbeta` - dfbeta residuals (nvar × n)
/// * `var` - Variance-covariance matrix (nvar × nvar), diagonal gives se²
///
/// # Returns
///
/// dfbetas[j][i] (nvar × n)
pub fn dfbetas_residuals(dfbeta: &[Vec<f64>], var: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let nvar = dfbeta.len();
    let n = dfbeta[0].len();
    let mut dfbetas = vec![vec![0.0_f64; n]; nvar];

    for j in 0..nvar {
        let se = var[j][j].sqrt();
        if se > 0.0 {
            for i in 0..n {
                dfbetas[j][i] = dfbeta[j][i] / se;
            }
        }
    }

    dfbetas
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deviance_residuals() {
        // status=1, martingale=0.5 → sign(0.5) * sqrt(-2*(0.5 + 1*ln(1-0.5)))
        //   = sqrt(-2*(0.5 + ln(0.5))) = sqrt(-2*(0.5 - 0.6931)) = sqrt(0.3863)
        let m = vec![0.5];
        let s = vec![1.0];
        let dev = deviance_residuals(&m, &s);

        let expected = (-2.0 * (0.5 + (0.5_f64).ln())).sqrt();
        assert!(
            (dev[0] - expected).abs() < 1e-10,
            "{:.10} vs {:.10}",
            dev[0],
            expected
        );
    }

    #[test]
    fn test_deviance_residuals_censored() {
        // status=0, martingale=-0.3 → sign(-0.3) * sqrt(-2*(-0.3)) = -sqrt(0.6)
        let m = vec![-0.3];
        let s = vec![0.0];
        let dev = deviance_residuals(&m, &s);

        let expected = -(0.6_f64).sqrt();
        assert!(
            (dev[0] - expected).abs() < 1e-10,
            "{:.10} vs {:.10}",
            dev[0],
            expected
        );
    }

    #[test]
    fn test_dfbeta() {
        // 1 var, 2 obs
        let score = vec![vec![0.5, -0.3]];
        let var = vec![vec![2.0]];
        let dfb = dfbeta_residuals(&score, &var);
        assert!((dfb[0][0] - 1.0).abs() < 1e-12);
        assert!((dfb[0][1] - -0.6).abs() < 1e-12);
    }

    #[test]
    fn test_dfbetas() {
        let dfb = vec![vec![1.0, -0.6]];
        let var = vec![vec![4.0]]; // se = 2.0
        let dfbs = dfbetas_residuals(&dfb, &var);
        assert!((dfbs[0][0] - 0.5).abs() < 1e-12);
        assert!((dfbs[0][1] - -0.3).abs() < 1e-12);
    }
}
