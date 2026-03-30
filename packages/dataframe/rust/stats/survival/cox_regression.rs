//! Cox proportional hazards regression fitter
//!
//! Line-for-line port of `coxfit6.c` from R's survival package (Terry Therneau).
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/coxfit6.c`
//!
//! ## Overview
//!
//! Two-part structure:
//! - `coxfit6()`: Outer Newton-Raphson with covariate centering/scaling, step halving, convergence
//! - `coxfit6_iter()`: Single partial likelihood evaluation with Breslow and Efron tie methods
//!
//! Data must be sorted by ascending time within strata.

use serde::Serialize;

/// Tie-handling method for Cox regression.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub enum CoxMethod {
    /// Breslow approximation (method=0 in C)
    Breslow = 0,
    /// Efron approximation (method=1 in C)
    Efron = 1,
    /// Exact partial likelihood (method=2)
    Exact = 2,
}

/// Result of the Cox regression fit.
#[derive(Debug, Clone, Serialize)]
pub struct CoxfitResult {
    /// Final coefficient estimates (nvar), on the original covariate scale
    pub coef: Vec<f64>,
    /// Column means of the covariates (nvar)
    pub means: Vec<f64>,
    /// Score vector at final beta (nvar)
    pub u: Vec<f64>,
    /// Variance-covariance matrix (information matrix inverse), nvar x nvar
    pub imat: Vec<Vec<f64>>,
    /// Log-likelihood: [at initial beta, at final beta]
    pub loglik: [f64; 2],
    /// Score test statistic at initial beta
    pub sctest: f64,
    /// Number of iterations actually used
    pub iter: i32,
    /// Convergence flag:
    /// - 1000: did not converge
    /// - -2: converged during step halving
    /// - 1..nvar: rank of the solution
    pub flag: i32,
}

/// Configuration for the Cox fitter.
#[derive(Debug, Clone)]
pub struct CoxfitConfig {
    /// Maximum number of Newton-Raphson iterations
    pub maxiter: i32,
    /// Convergence tolerance (percent change in log-likelihood)
    pub eps: f64,
    /// Cholesky tolerance for singularity detection
    pub toler: f64,
    /// Tie-handling method
    pub method: CoxMethod,
    /// Which covariates to center and scale (true = do scale, per covariate)
    pub doscale: Vec<bool>,
}

impl Default for CoxfitConfig {
    fn default() -> Self {
        CoxfitConfig {
            maxiter: 25,
            eps: 1e-9,
            toler: 1e-12,
            method: CoxMethod::Efron,
            doscale: Vec::new(), // empty means scale all
        }
    }
}

/// Compute a single iteration of the Cox partial likelihood.
///
/// Direct port of `coxfit6_iter()` from `coxfit6.c`.
///
/// Returns the log partial likelihood. Updates `u` (score), `imat` (information matrix)
/// as side effects through the mutable references.
///
/// # Arguments
///
/// * `nvar` - Number of covariates
/// * `nused` - Number of observations
/// * `method` - Tie handling (Breslow or Efron)
/// * `beta` - Current coefficient estimates
/// * `covar` - Covariate matrix, covar[i][person] (nvar x nused, column-major like C)
/// * `xtime` - Event/censoring times
/// * `status` - Event indicator (1=event, 0=censored)
/// * `strata` - Strata indicator (1=last obs in stratum)
/// * `offset` - Offset for the linear predictor
/// * `weights` - Case weights
/// * `u` - Score vector (output, nvar)
/// * `imat` - Information matrix (output, nvar x nvar)
fn coxfit6_iter(
    nvar: usize,
    nused: usize,
    method: CoxMethod,
    beta: &[f64],
    covar: &[Vec<f64>],
    xtime: &[f64],
    status: &[i32],
    strata: &[i32],
    offset: &[f64],
    weights: &[f64],
    u: &mut [f64],
    imat: &mut [Vec<f64>],
) -> f64 {
    let mut loglik: f64 = 0.0;
    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut cmat = vec![vec![0.0_f64; nvar]; nvar];
    let mut cmat2 = vec![vec![0.0_f64; nvar]; nvar];

    for i in 0..nvar {
        u[i] = 0.0;
        a2[i] = 0.0;
        for j in 0..nvar {
            imat[i][j] = 0.0;
            cmat2[i][j] = 0.0;
        }
    }

    let mut denom: f64 = 0.0;
    let mut nrisk: i32 = 0;

    let mut person = nused as isize - 1;
    while person >= 0 {
        let p = person as usize;

        if strata[p] == 1 {
            nrisk = 0;
            denom = 0.0;
            for i in 0..nvar {
                a[i] = 0.0;
                for j in 0..nvar {
                    cmat[i][j] = 0.0;
                }
            }
        }

        let dtime = xtime[p];
        let mut ndead: i32 = 0;
        let mut deadwt: f64 = 0.0;
        let mut denom2: f64 = 0.0;

        while person >= 0 && xtime[person as usize] == dtime {
            let pp = person as usize;
            nrisk += 1;
            let mut zbeta = offset[pp];
            for i in 0..nvar {
                zbeta += beta[i] * covar[i][pp];
            }
            let risk = zbeta.exp() * weights[pp];

            if status[pp] == 0 {
                denom += risk;
                for i in 0..nvar {
                    a[i] += risk * covar[i][pp];
                    for j in 0..=i {
                        cmat[i][j] += risk * covar[i][pp] * covar[j][pp];
                    }
                }
            } else {
                ndead += 1;
                deadwt += weights[pp];
                denom2 += risk;
                loglik += weights[pp] * zbeta;

                for i in 0..nvar {
                    u[i] += weights[pp] * covar[i][pp];
                    a2[i] += risk * covar[i][pp];
                    for j in 0..=i {
                        cmat2[i][j] += risk * covar[i][pp] * covar[j][pp];
                    }
                }
            }
            person -= 1;
            if person >= 0 && strata[person as usize] == 1 {
                break; // ties don't cross strata
            }
        }

        if ndead > 0 {
            if method == CoxMethod::Breslow || ndead == 1 {
                // Breslow
                denom += denom2;
                loglik -= deadwt * denom.ln();

                for i in 0..nvar {
                    a[i] += a2[i];
                    let temp2 = a[i] / denom;
                    u[i] -= deadwt * temp2;
                    for j in 0..=i {
                        cmat[i][j] += cmat2[i][j];
                        imat[j][i] += deadwt * (cmat[i][j] - temp2 * a[j]) / denom;
                    }
                }
            } else {
                // Efron
                let wtave = deadwt / ndead as f64;
                for _k in 0..ndead {
                    denom += denom2 / ndead as f64;
                    loglik -= wtave * denom.ln();
                    for i in 0..nvar {
                        a[i] += a2[i] / ndead as f64;
                        let temp2 = a[i] / denom;
                        u[i] -= wtave * temp2;
                        for j in 0..=i {
                            cmat[i][j] += cmat2[i][j] / ndead as f64;
                            imat[j][i] += wtave * (cmat[i][j] - temp2 * a[j]) / denom;
                        }
                    }
                }
            }
            // Reset death accumulators
            for i in 0..nvar {
                a2[i] = 0.0;
                for j in 0..nvar {
                    cmat2[i][j] = 0.0;
                }
            }
        }
    }

    // Suppress unused variable warning (matches C code comment)
    let _ = nrisk;
    loglik
}

/// Fit a Cox proportional hazards model.
///
/// Direct port of `coxfit6()` from `coxfit6.c`.
///
/// # Arguments
///
/// * `xtime` - Event/censoring times, sorted ascending within strata
/// * `status` - Event indicator (1=event, 0=censored)
/// * `covar` - Covariate matrix, covar[i][person] (nvar x nused)
/// * `strata` - Strata indicator (1=last obs in stratum, 0 otherwise)
/// * `offset` - Offset for the linear predictor
/// * `weights` - Case weights
/// * `init` - Initial coefficient estimates
/// * `config` - Configuration (maxiter, eps, toler, method, doscale)
pub fn coxfit6(
    xtime: &[f64],
    status: &[i32],
    covar_in: &[Vec<f64>],
    strata_in: &[i32],
    offset: &[f64],
    weights: &[f64],
    init: &[f64],
    config: &CoxfitConfig,
) -> CoxfitResult {
    let nused = xtime.len();
    let nvar = covar_in.len();

    assert_eq!(status.len(), nused);
    assert_eq!(strata_in.len(), nused);
    assert_eq!(offset.len(), nused);
    assert_eq!(weights.len(), nused);
    assert_eq!(init.len(), nvar);
    for v in covar_in {
        assert_eq!(v.len(), nused);
    }

    // Make mutable copies (C code modifies covar in place)
    let mut covar: Vec<Vec<f64>> = covar_in.to_vec();
    let mut strata: Vec<i32> = strata_in.to_vec();
    let mut imat = vec![vec![0.0_f64; nvar]; nvar];
    let mut u_vec = vec![0.0_f64; nvar];
    let mut beta: Vec<f64> = init.to_vec();
    let mut means = vec![0.0_f64; nvar];
    let mut scale = vec![1.0_f64; nvar];
    let mut loglik = [0.0_f64; 2];

    // Determine which covariates to scale
    let doscale: Vec<bool> = if config.doscale.is_empty() {
        vec![true; nvar]
    } else {
        config.doscale.clone()
    };

    // Subtract the mean from each covar and scale (stabilizes the regression)
    let mut temp2: f64 = 0.0;
    for i in 0..nused {
        temp2 += weights[i];
    }
    for i in 0..nvar {
        if !doscale[i] {
            scale[i] = 1.0;
            means[i] = 0.0;
        } else {
            let mut temp: f64 = 0.0;
            for person in 0..nused {
                temp += weights[person] * covar[i][person];
            }
            temp /= temp2;
            means[i] = temp;
            for person in 0..nused {
                covar[i][person] -= temp;
            }

            temp = 0.0;
            for person in 0..nused {
                temp += weights[person] * covar[i][person].abs();
            }
            if temp > 0.0 {
                temp = temp2 / temp; // scaling
            } else {
                temp = 1.0; // rare case of a constant covariate
            }
            scale[i] = temp;
            for person in 0..nused {
                covar[i][person] *= temp;
            }
        }
    }

    // Rescale initial betas
    for i in 0..nvar {
        beta[i] /= scale[i];
    }

    // Ensure last observation is marked as end of stratum
    strata[nused - 1] = 1;

    // Initial iteration
    let mut iter: i32 = 0;
    loglik[0] = coxfit6_iter(
        nvar, nused, config.method, &beta, &covar, xtime, status, &strata, offset, weights,
        &mut u_vec, &mut imat,
    );
    loglik[1] = loglik[0];

    // Save u0 for score test
    let mut a_temp = u_vec.clone();

    let mut flag = super::cholesky::cholesky2(&mut imat, nvar, config.toler);
    super::cholesky::chsolve2(&imat, nvar, &mut a_temp);

    // Score test
    let mut sctest: f64 = 0.0;
    for i in 0..nvar {
        sctest += u_vec[i] * a_temp[i];
    }

    // Early exit if maxiter==0 or non-finite loglik
    if config.maxiter == 0 || !loglik[0].is_finite() {
        super::cholesky::chinv2(&mut imat, nvar);
        for i in 0..nvar {
            beta[i] *= scale[i];
            u_vec[i] /= scale[i];
            imat[i][i] *= scale[i] * scale[i];
            for j in 0..i {
                imat[j][i] *= scale[i] * scale[j];
                imat[i][j] = imat[j][i];
            }
        }
        return CoxfitResult {
            coef: beta,
            means,
            u: u_vec,
            imat,
            loglik,
            sctest,
            iter,
            flag,
        };
    }

    // Main Newton-Raphson loop
    loglik[1] = loglik[0];
    let mut newbeta = vec![0.0_f64; nvar];
    for i in 0..nvar {
        newbeta[i] = beta[i] + a_temp[i];
    }

    let mut halving: f64 = 0.0;
    iter = 1;
    while iter <= config.maxiter {
        let newlk = coxfit6_iter(
            nvar, nused, config.method, &newbeta, &covar, xtime, status, &strata, offset, weights,
            &mut u_vec, &mut imat,
        );

        flag = super::cholesky::cholesky2(&mut imat, nvar, config.toler);

        // Check for non-finite values
        let mut notfinite: i32 = 0;
        for i in 0..nvar {
            if !u_vec[i].is_finite() {
                notfinite = 2;
            }
            for j in 0..nvar {
                if !imat[i][j].is_finite() {
                    notfinite = 3;
                }
            }
        }
        if !newlk.is_finite() {
            notfinite = 4;
        }

        if notfinite == 0 && (1.0 - (loglik[1] / newlk)).abs() <= config.eps {
            // Converged
            loglik[1] = newlk;
            super::cholesky::chinv2(&mut imat, nvar);
            for i in 0..nvar {
                beta[i] = newbeta[i] * scale[i];
                u_vec[i] /= scale[i];
                imat[i][i] *= scale[i] * scale[i];
                for j in 0..i {
                    imat[j][i] *= scale[i] * scale[j];
                    imat[i][j] = imat[j][i];
                }
            }
            if halving > 0.0 {
                flag = -2;
            }
            return CoxfitResult {
                coef: beta,
                means,
                u: u_vec,
                imat,
                loglik,
                sctest,
                iter,
                flag,
            };
        }

        if notfinite > 0 || newlk < loglik[1] {
            // Not converging — step halving
            halving += 1.0;
            for i in 0..nvar {
                newbeta[i] = (newbeta[i] + halving * beta[i]) / (halving + 1.0);
            }
        } else {
            halving = 0.0;
            loglik[1] = newlk;
            super::cholesky::chsolve2(&imat, nvar, &mut u_vec);
            for i in 0..nvar {
                beta[i] = newbeta[i];
                newbeta[i] += u_vec[i];
            }
        }

        iter += 1;
    }

    // Did not converge — recompute at best beta
    if config.maxiter > 1 {
        loglik[1] = coxfit6_iter(
            nvar, nused, config.method, &beta, &covar, xtime, status, &strata, offset, weights,
            &mut u_vec, &mut imat,
        );
    }
    super::cholesky::chinv2(&mut imat, nvar);
    for i in 0..nvar {
        beta[i] *= scale[i];
        u_vec[i] /= scale[i];
        imat[i][i] *= scale[i] * scale[i];
        for j in 0..i {
            imat[j][i] *= scale[i] * scale[j];
            imat[i][j] = imat[j][i];
        }
    }
    flag = 1000;

    CoxfitResult {
        coef: beta,
        means,
        u: u_vec,
        imat,
        loglik,
        sctest,
        iter: iter - 1,
        flag,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper: AML data sorted by time, with model matrix (0/1 indicator for Nonmaintained)
    /// as R's coxph actually passes to coxfit6.c.
    fn aml_data() -> (Vec<f64>, Vec<i32>, Vec<f64>) {
        // R: aml[order(aml$time), ]
        let xtime = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 13.0, 16.0, 18.0, 23.0, 23.0, 27.0, 28.0,
            30.0, 31.0, 33.0, 34.0, 43.0, 45.0, 45.0, 48.0, 161.0,
        ];
        let status = vec![
            1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0,
        ];
        // R: model.matrix(coxph(Surv(time, status) ~ x, data=aml))
        // 0/1 indicator: 1=Nonmaintained, 0=Maintained
        let x_nonmaint = vec![
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0,
        ];
        (xtime, status, x_nonmaint)
    }

    #[test]
    fn test_coxfit6_aml_efron() {
        // R: coxph(Surv(time, status) ~ x, data=aml)  # default ties="efron"
        let (xtime, status, x) = aml_data();
        let n = xtime.len();
        let strata = vec![0_i32; n];
        let offset = vec![0.0_f64; n];
        let weights = vec![1.0_f64; n];
        let covar = vec![x];
        let init = vec![0.0_f64];

        let config = CoxfitConfig {
            maxiter: 25,
            eps: 1e-9,
            toler: 1e-12,
            method: CoxMethod::Efron,
            doscale: vec![true],
        };

        let result = coxfit6(&xtime, &status, &covar, &strata, &offset, &weights, &init, &config);

        // R exact output (15-digit precision):
        // coef: 0.915532575014718
        // var:  0.262076702095887
        // loglik: -42.724839262760220 -41.032615596458378
        // score: 3.416734395517303
        // iter: 3
        assert_eq!(result.coef.len(), 1);
        assert!(
            (result.coef[0] - 0.915532575014718).abs() < 1e-6,
            "coef: {:.15}",
            result.coef[0]
        );
        assert!(
            (result.imat[0][0] - 0.262076702095887).abs() < 1e-6,
            "var: {:.15}",
            result.imat[0][0]
        );
        let se = result.imat[0][0].sqrt();
        assert!(
            (se - 0.511934275172005).abs() < 1e-6,
            "se: {:.15}",
            se
        );
        assert!(
            (result.loglik[0] - (-42.724839262760220)).abs() < 1e-8,
            "loglik[0]: {:.15}",
            result.loglik[0]
        );
        assert!(
            (result.loglik[1] - (-41.032615596458378)).abs() < 1e-8,
            "loglik[1]: {:.15}",
            result.loglik[1]
        );
        assert!(
            (result.sctest - 3.416734395517303).abs() < 1e-6,
            "sctest: {:.15}",
            result.sctest
        );
        assert!(result.flag < 1000, "flag: {}", result.flag);
    }

    #[test]
    fn test_coxfit6_aml_breslow() {
        // R: coxph(Surv(time, status) ~ x, data=aml, ties="breslow")
        let (xtime, status, x) = aml_data();
        let n = xtime.len();
        let strata = vec![0_i32; n];
        let offset = vec![0.0_f64; n];
        let weights = vec![1.0_f64; n];
        let covar = vec![x];
        let init = vec![0.0_f64];

        let config = CoxfitConfig {
            maxiter: 25,
            eps: 1e-9,
            toler: 1e-12,
            method: CoxMethod::Breslow,
            doscale: vec![true],
        };

        let result = coxfit6(&xtime, &status, &covar, &strata, &offset, &weights, &init, &config);

        // R exact output (15-digit precision):
        // coef: 0.904219723685700
        // loglik: -42.898123897174031 -41.250114350068870
        // score: 3.322561416273065
        assert_eq!(result.coef.len(), 1);
        assert!(
            (result.coef[0] - 0.904219723685700).abs() < 1e-6,
            "coef: {:.15}",
            result.coef[0]
        );
        assert!(
            (result.loglik[0] - (-42.898123897174031)).abs() < 1e-8,
            "loglik[0]: {:.15}",
            result.loglik[0]
        );
        assert!(
            (result.loglik[1] - (-41.250114350068870)).abs() < 1e-8,
            "loglik[1]: {:.15}",
            result.loglik[1]
        );
        assert!(
            (result.sctest - 3.322561416273065).abs() < 1e-6,
            "sctest: {:.15}",
            result.sctest
        );
        assert!(result.flag < 1000, "flag: {}", result.flag);
    }

    #[test]
    fn test_coxfit6_maxiter_zero() {
        // maxiter=0 should return initial values without iterating
        let (xtime, status, x) = aml_data();
        let n = xtime.len();
        let strata = vec![0_i32; n];
        let offset = vec![0.0_f64; n];
        let weights = vec![1.0_f64; n];
        let covar = vec![x];
        let init = vec![0.0_f64];

        let config = CoxfitConfig {
            maxiter: 0,
            ..CoxfitConfig::default()
        };

        let result = coxfit6(&xtime, &status, &covar, &strata, &offset, &weights, &init, &config);

        assert_eq!(result.iter, 0);
        assert_eq!(result.loglik[0], result.loglik[1]);
    }
}
