//! Anderson-Gill (counting process) Cox regression fitter
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/agfit4.c`
//!
//! Newton-Raphson Cox regression for start-stop (counting process) data.
//! Supports Breslow and Efron tie handling, covariate centering/scaling,
//! step halving, and numerical recentering for overflow prevention.

use super::cholesky::{chinv2, cholesky2, chsolve2};

/// Result of AG Cox regression fitting.
pub struct AgfitResult {
    /// Final coefficients (on original scale).
    pub coef: Vec<f64>,
    /// Score vector u at final iteration.
    pub u: Vec<f64>,
    /// Variance-covariance matrix (inverse information), nvar × nvar.
    pub imat: Vec<Vec<f64>>,
    /// Log partial likelihood: [initial, final].
    pub loglik: [f64; 2],
    /// Score test statistic (computed at initial beta).
    pub sctest: f64,
    /// Flag vector [rank, recenter_count, halving_count, convergence_fail].
    pub flag: [i32; 4],
    /// Number of iterations performed.
    pub iter: i32,
}

/// Configuration for AG Cox regression.
pub struct AgfitConfig {
    pub maxiter: i32,
    pub eps: f64,
    pub toler: f64,
    /// Method: 0=Breslow, 1=Efron.
    pub method: i32,
    /// Per-covariate scaling flags (1=scale, 0=don't).
    pub doscale: Vec<i32>,
}

/// Fit a Cox proportional hazards model to counting process (start-stop) data.
///
/// Direct port of `agfit4()` from `survival-ref/survival-master/src/agfit4.c`.
///
/// # Arguments
///
/// * `start` - Entry times
/// * `tstop` - Exit times
/// * `event` - Event indicator (1.0=event, 0.0=censored)
/// * `covar` - Covariate matrix covar[j][i] (nvar × nused), will be modified
/// * `weights` - Case weights
/// * `offset` - Offset terms
/// * `ibeta` - Initial coefficient estimates
/// * `sort1` - Sort index: descending (strata, start), 0-based
/// * `sort2` - Sort index: descending (strata, stop), 0-based
/// * `strata` - Stratum assignments (0-based integers)
/// * `config` - Fitting configuration
///
/// # Returns
///
/// `AgfitResult` with fitted coefficients, variance, log-likelihood, etc.
#[allow(clippy::too_many_arguments)]
pub fn agfit4(
    start: &[f64],
    tstop: &[f64],
    event: &[f64],
    covar: &mut [Vec<f64>],
    weights: &[f64],
    offset: &[f64],
    ibeta: &[f64],
    sort1: &[i32],
    sort2: &[i32],
    strata: &[i32],
    config: &AgfitConfig,
) -> AgfitResult {
    let nused = start.len();
    let nvar = covar.len();
    let method = config.method as f64; // C stores as double for arithmetic
    let eps = config.eps;
    let tol_chol = config.toler;
    let maxiter = config.maxiter;

    // Scratch
    let mut eta = vec![0.0_f64; nused];
    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut scale = vec![1.0_f64; nvar];
    let mut oldbeta = vec![0.0_f64; nvar];
    let mut cmat = vec![vec![0.0_f64; nvar]; nvar];
    let mut cmat2 = vec![vec![0.0_f64; nvar]; nvar];

    // Outputs
    let mut beta: Vec<f64> = ibeta.to_vec();
    let mut u = vec![0.0_f64; nvar];
    let mut imat = vec![vec![0.0_f64; nvar]; nvar];
    let mut loglik = [0.0_f64; 2];
    let mut sctest = 0.0_f64;
    let mut flag = [0_i32; 4];
    let mut iter_out = 0_i32;

    // --- Centering and scaling (lines 130-169) ---
    for i in 0..nvar {
        if config.doscale[i] == 0 {
            scale[i] = 1.0;
        } else {
            // Subtract weighted mean per stratum
            let mut istrat = strata[sort2[0] as usize];
            let mut k = 0_usize;
            let mut temp = 0.0_f64;
            let mut temp2 = 0.0_f64;
            for person in 0..nused {
                let p = sort2[person] as usize;
                if strata[p] == istrat {
                    temp += weights[p] * covar[i][p];
                    temp2 += weights[p];
                } else {
                    // New stratum: center the previous one
                    temp /= temp2;
                    while k < person {
                        covar[i][sort2[k] as usize] -= temp;
                        k += 1;
                    }
                    temp = 0.0;
                    temp2 = 0.0;
                    istrat = strata[p];
                }
            }
            // Center the last stratum (C lines 148-149, noweb indentation artifact)
            temp /= temp2;
            while k < nused {
                covar[i][sort2[k] as usize] -= temp;
                k += 1;
            }

            // Compute overall scale (lines 153-166)
            temp = 0.0;
            temp2 = 0.0;
            for person in 0..nused {
                let p = sort2[person] as usize;
                temp += weights[p] * covar[i][p].abs();
                temp2 += weights[p];
            }
            if temp > 0.0 {
                temp = temp2 / temp; // 1/scale
            } else {
                temp = 1.0; // constant covariate
            }
            scale[i] = temp;
            for person in 0..nused {
                covar[i][sort2[person] as usize] *= temp;
            }
        }
    }

    // Rescale initial betas (line 169)
    for i in 0..nvar {
        beta[i] /= scale[i];
    }

    // --- Main Newton-Raphson loop (lines 172-632) ---
    let mut halving = 0_i32;
    let mut fail;
    let mut rank = 0_i32;
    let mut newlk = 0.0_f64; // C: function-scoped, persists across iterations

    for iteration in 0..=maxiter {
        iter_out = iteration;

        // Compute eta = X*beta + offset (lines 176-182)
        for person in 0..nused {
            let p = sort2[person] as usize;
            let mut zbeta = 0.0_f64;
            for i in 0..nvar {
                zbeta += beta[i] * covar[i][p];
            }
            eta[p] = zbeta + offset[p];
        }

        // Initialize accumulators (lines 190-206)
        newlk = 0.0;
        for i in 0..nvar {
            u[i] = 0.0;
            for j in 0..nvar {
                imat[i][j] = 0.0;
            }
        }

        let mut recenter = 0.0_f64;
        let mut denom = 0.0_f64;
        let mut nrisk: i32 = 0;
        let mut etasum = 0.0_f64;
        for i in 0..nvar {
            a[i] = 0.0;
            for j in 0..nvar {
                cmat[i][j] = 0.0;
            }
        }

        let mut person: usize = 0;
        let mut indx1: usize = 0;
        let mut istrat = strata[sort2[0] as usize];

        // --- Inner accumulation loop (lines 210-368) ---
        while person < nused {
            // Find next death time (lines 212-232)
            let mut k = person;
            let mut dtime = 0.0_f64;
            let mut found_death = false;
            while k < nused {
                let p = sort2[k] as usize;
                if strata[p] != istrat {
                    istrat = strata[p];
                    denom = 0.0;
                    nrisk = 0;
                    etasum = 0.0;
                    for i in 0..nvar {
                        a[i] = 0.0;
                        for j in 0..nvar {
                            cmat[i][j] = 0.0;
                        }
                    }
                    person = k;
                    indx1 = k;
                }
                if event[p] == 1.0 {
                    dtime = tstop[p];
                    found_death = true;
                    break;
                }
                k += 1;
            }
            if !found_death {
                break; // no more deaths (line 233)
            }

            // Remove subjects no longer at risk (lines 241-263)
            while indx1 < nused {
                let p1 = sort1[indx1] as usize;
                if start[p1] < dtime || strata[p1] != istrat {
                    break;
                }
                nrisk -= 1;
                if nrisk == 0 {
                    etasum = 0.0;
                    denom = 0.0;
                    for i in 0..nvar {
                        a[i] = 0.0;
                        for j in 0..=i {
                            cmat[i][j] = 0.0;
                        }
                    }
                } else {
                    etasum -= eta[p1];
                    let risk = (eta[p1] - recenter).exp() * weights[p1];
                    denom -= risk;
                    for i in 0..nvar {
                        a[i] -= risk * covar[i][p1];
                        for j in 0..=i {
                            cmat[i][j] -= risk * covar[i][p1] * covar[j][p1];
                        }
                    }
                }
                indx1 += 1;
            }

            // Add new subjects at risk (lines 269-335)
            let mut denom2 = 0.0_f64;
            let mut meanwt = 0.0_f64;
            let mut deaths = 0_i32;
            for i in 0..nvar {
                a2[i] = 0.0;
                for j in 0..nvar {
                    cmat2[i][j] = 0.0;
                }
            }

            while person < nused {
                let p = sort2[person] as usize;
                if strata[p] != istrat || tstop[p] < dtime {
                    break;
                }
                nrisk += 1;
                etasum += eta[p];

                // Recenter check (lines 294-312)
                if (etasum / nrisk as f64 - recenter).abs() > 200.0 {
                    flag[1] += 1;
                    let temp = etasum / nrisk as f64 - recenter;
                    recenter = etasum / nrisk as f64;

                    if denom > 0.0 {
                        if temp.abs() > 709.0 {
                            panic!("exp overflow due to covariates");
                        }
                        let temp = (-temp).exp();
                        denom *= temp;
                        for i in 0..nvar {
                            a[i] *= temp;
                            for j in 0..nvar {
                                cmat[i][j] *= temp;
                            }
                        }
                    }
                }

                let risk = (eta[p] - recenter).exp() * weights[p];

                if event[p] == 1.0 {
                    deaths += 1;
                    denom2 += risk;
                    meanwt += weights[p];
                    newlk += weights[p] * (eta[p] - recenter);
                    for i in 0..nvar {
                        u[i] += weights[p] * covar[i][p];
                        a2[i] += risk * covar[i][p];
                        for j in 0..=i {
                            cmat2[i][j] += risk * covar[i][p] * covar[j][p];
                        }
                    }
                } else {
                    denom += risk;
                    for i in 0..nvar {
                        a[i] += risk * covar[i][p];
                        for j in 0..=i {
                            cmat[i][j] += risk * covar[i][p] * covar[j][p];
                        }
                    }
                }
                person += 1;
            }

            // Accumulate into u and imat (lines 339-367)
            if method == 0.0 || deaths == 1 {
                // Breslow
                denom += denom2;
                newlk -= meanwt * denom.ln();
                for i in 0..nvar {
                    a[i] += a2[i];
                    let temp = a[i] / denom;
                    u[i] -= meanwt * temp;
                    for j in 0..=i {
                        cmat[i][j] += cmat2[i][j];
                        imat[j][i] +=
                            meanwt * ((cmat[i][j] - temp * a[j]) / denom);
                    }
                }
            } else {
                // Efron
                meanwt /= deaths as f64;
                for k in 0..deaths {
                    denom += denom2 / deaths as f64;
                    newlk -= meanwt * denom.ln();
                    for i in 0..nvar {
                        a[i] += a2[i] / deaths as f64;
                        let temp = a[i] / denom;
                        u[i] -= meanwt * temp;
                        for j in 0..=i {
                            cmat[i][j] += cmat2[i][j] / deaths as f64;
                            imat[j][i] += meanwt
                                * ((cmat[i][j] - temp * a[j]) / denom);
                        }
                    }
                    let _ = k; // suppress unused warning
                }
            }
        } // end of accumulation loop

        // --- Post-iteration logic (lines 370-631) ---
        if iteration == 0 {
            loglik[0] = newlk;
            loglik[1] = newlk;

            // Score test (lines 374-380)
            for i in 0..nvar {
                a[i] = u[i];
            }
            rank = cholesky2(&mut imat, nvar, tol_chol);
            chsolve2(&imat, nvar, &mut a);
            sctest = 0.0;
            for i in 0..nvar {
                sctest += u[i] * a[i];
            }

            if maxiter == 0 {
                break;
            }

            fail = if newlk.is_nan() || newlk.is_infinite() {
                1
            } else {
                0
            };
            if fail > 0 {
                break;
            }

            for i in 0..nvar {
                oldbeta[i] = beta[i];
                beta[i] += a[i];
            }
        } else {
            fail = 0;
            for i in 0..nvar {
                if !imat[i][i].is_finite() {
                    fail += 1;
                }
            }
            let rank2 = cholesky2(&mut imat, nvar, tol_chol);
            if newlk.is_nan() {
                fail += 1;
            }
            if newlk.is_infinite() {
                fail += 1;
            }
            if rank != rank2 {
                fail += 1;
            }

            // Convergence check (line 400)
            if fail == 0
                && halving == 0
                && (1.0 - (loglik[1] / newlk)).abs() <= eps
            {
                break; // success
            }

            if iteration == maxiter {
                // Failed to converge (lines 402-612)
                flag[3] = 1;
                if maxiter > 1
                    && ((newlk - loglik[1]) / loglik[1].abs()) < -eps
                {
                    // Recompute at last good beta (lines 415-610)
                    for i in 0..nvar {
                        beta[i] = oldbeta[i];
                    }
                    // Recompute eta
                    for person_idx in 0..nused {
                        let p = sort2[person_idx] as usize;
                        let mut zbeta = 0.0_f64;
                        for i in 0..nvar {
                            zbeta += beta[i] * covar[i][p];
                        }
                        eta[p] = zbeta + offset[p];
                    }

                    // Re-run the full accumulation loop (duplicate of above)
                    let mut newlk2 = 0.0_f64;
                    for i in 0..nvar {
                        u[i] = 0.0;
                        for j in 0..nvar {
                            imat[i][j] = 0.0;
                        }
                    }
                    let mut recenter2 = 0.0_f64;
                    let mut denom2_re = 0.0_f64;
                    let mut nrisk2: i32 = 0;
                    let mut etasum2 = 0.0_f64;
                    for i in 0..nvar {
                        a[i] = 0.0;
                        for j in 0..nvar {
                            cmat[i][j] = 0.0;
                        }
                    }
                    let mut person2: usize = 0;
                    let mut indx1_2: usize = 0;
                    let mut istrat2 = strata[sort2[0] as usize];

                    while person2 < nused {
                        let mut k = person2;
                        let mut dtime2 = 0.0_f64;
                        let mut found = false;
                        while k < nused {
                            let p = sort2[k] as usize;
                            if strata[p] != istrat2 {
                                istrat2 = strata[p];
                                denom2_re = 0.0;
                                nrisk2 = 0;
                                etasum2 = 0.0;
                                for i in 0..nvar {
                                    a[i] = 0.0;
                                    for j in 0..nvar {
                                        cmat[i][j] = 0.0;
                                    }
                                }
                                person2 = k;
                                indx1_2 = k;
                            }
                            if event[p] == 1.0 {
                                dtime2 = tstop[p];
                                found = true;
                                break;
                            }
                            k += 1;
                        }
                        if !found {
                            break;
                        }

                        while indx1_2 < nused {
                            let p1 = sort1[indx1_2] as usize;
                            if start[p1] < dtime2 || strata[p1] != istrat2 {
                                break;
                            }
                            nrisk2 -= 1;
                            if nrisk2 == 0 {
                                etasum2 = 0.0;
                                denom2_re = 0.0;
                                for i in 0..nvar {
                                    a[i] = 0.0;
                                    for j in 0..=i {
                                        cmat[i][j] = 0.0;
                                    }
                                }
                            } else {
                                etasum2 -= eta[p1];
                                let risk =
                                    (eta[p1] - recenter2).exp() * weights[p1];
                                denom2_re -= risk;
                                for i in 0..nvar {
                                    a[i] -= risk * covar[i][p1];
                                    for j in 0..=i {
                                        cmat[i][j] -=
                                            risk * covar[i][p1] * covar[j][p1];
                                    }
                                }
                            }
                            indx1_2 += 1;
                        }

                        let mut denom2_d = 0.0_f64;
                        let mut meanwt2 = 0.0_f64;
                        let mut deaths2 = 0_i32;
                        for i in 0..nvar {
                            a2[i] = 0.0;
                            for j in 0..nvar {
                                cmat2[i][j] = 0.0;
                            }
                        }

                        while person2 < nused {
                            let p = sort2[person2] as usize;
                            if strata[p] != istrat2 || tstop[p] < dtime2 {
                                break;
                            }
                            nrisk2 += 1;
                            etasum2 += eta[p];

                            if (etasum2 / nrisk2 as f64 - recenter2).abs()
                                > 200.0
                            {
                                flag[1] += 1;
                                let temp =
                                    etasum2 / nrisk2 as f64 - recenter2;
                                recenter2 = etasum2 / nrisk2 as f64;
                                if denom2_re > 0.0 {
                                    if temp.abs() > 709.0 {
                                        panic!(
                                            "exp overflow due to covariates"
                                        );
                                    }
                                    let temp = (-temp).exp();
                                    denom2_re *= temp;
                                    for i in 0..nvar {
                                        a[i] *= temp;
                                        for j in 0..nvar {
                                            cmat[i][j] *= temp;
                                        }
                                    }
                                }
                            }

                            let risk =
                                (eta[p] - recenter2).exp() * weights[p];

                            if event[p] == 1.0 {
                                deaths2 += 1;
                                denom2_d += risk;
                                meanwt2 += weights[p];
                                newlk2 +=
                                    weights[p] * (eta[p] - recenter2);
                                for i in 0..nvar {
                                    u[i] += weights[p] * covar[i][p];
                                    a2[i] += risk * covar[i][p];
                                    for j in 0..=i {
                                        cmat2[i][j] +=
                                            risk * covar[i][p] * covar[j][p];
                                    }
                                }
                            } else {
                                denom2_re += risk;
                                for i in 0..nvar {
                                    a[i] += risk * covar[i][p];
                                    for j in 0..=i {
                                        cmat[i][j] +=
                                            risk * covar[i][p] * covar[j][p];
                                    }
                                }
                            }
                            person2 += 1;
                        }

                        if method == 0.0 || deaths2 == 1 {
                            denom2_re += denom2_d;
                            newlk2 -= meanwt2 * denom2_re.ln();
                            for i in 0..nvar {
                                a[i] += a2[i];
                                let temp = a[i] / denom2_re;
                                u[i] -= meanwt2 * temp;
                                for j in 0..=i {
                                    cmat[i][j] += cmat2[i][j];
                                    imat[j][i] += meanwt2
                                        * ((cmat[i][j] - temp * a[j])
                                            / denom2_re);
                                }
                            }
                        } else {
                            meanwt2 /= deaths2 as f64;
                            for kk in 0..deaths2 {
                                denom2_re += denom2_d / deaths2 as f64;
                                newlk2 -= meanwt2 * denom2_re.ln();
                                for i in 0..nvar {
                                    a[i] += a2[i] / deaths2 as f64;
                                    let temp = a[i] / denom2_re;
                                    u[i] -= meanwt2 * temp;
                                    for j in 0..=i {
                                        cmat[i][j] +=
                                            cmat2[i][j] / deaths2 as f64;
                                        imat[j][i] += meanwt2
                                            * ((cmat[i][j] - temp * a[j])
                                                / denom2_re);
                                    }
                                }
                                let _ = kk;
                            }
                        }
                    } // end recomputation loop

                    cholesky2(&mut imat, nvar, tol_chol);
                    newlk = newlk2;
                }
                break;
            }

            if fail > 0 || newlk < loglik[1] {
                // Step halving (lines 614-621)
                halving += 1;
                flag[2] += 1;
                for i in 0..nvar {
                    beta[i] = (oldbeta[i] * halving as f64 + beta[i])
                        / (halving as f64 + 1.0);
                }
            } else {
                // Good step (lines 622-630)
                halving = 0;
                loglik[1] = newlk;
                chsolve2(&imat, nvar, &mut u);
                for i in 0..nvar {
                    oldbeta[i] = beta[i];
                    beta[i] += u[i];
                }
            }
        }
    } // end Newton-Raphson

    // --- Post-processing (lines 634-645) ---
    flag[0] = rank;
    loglik[1] = newlk; // C line 635: unconditional

    chinv2(&mut imat, nvar);
    for i in 0..nvar {
        beta[i] *= scale[i]; // return to original scale
        u[i] /= scale[i];
        imat[i][i] *= scale[i] * scale[i];
        for j in 0..i {
            imat[j][i] *= scale[i] * scale[j];
            imat[i][j] = imat[j][i];
        }
    }

    AgfitResult {
        coef: beta,
        u,
        imat,
        loglik,
        sctest,
        flag,
        iter: iter_out,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Shared test data: counting process format, 12 observations, no ties
    fn test_data_1cov() -> (Vec<f64>, Vec<f64>, Vec<f64>, Vec<f64>) {
        let start = vec![0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0, 8.0];
        let stop = vec![5.0, 3.0, 8.0, 10.0, 6.0, 12.0, 15.0, 4.0, 7.0, 9.0, 11.0, 14.0];
        let event = vec![1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0];
        let x = vec![1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        (start, stop, event, x)
    }

    fn sort_orders() -> (Vec<i32>, Vec<i32>) {
        // sort1: order(-strata, -start) - 1  (descending start)
        let sort1 = vec![11_i32, 3, 6, 0, 1, 2, 4, 5, 7, 8, 9, 10];
        // sort2: order(-strata, -stop) - 1  (descending stop)
        let sort2 = vec![6_i32, 11, 5, 10, 3, 9, 2, 8, 4, 0, 7, 1];
        (sort1, sort2)
    }

    #[test]
    fn test_agfit4_efron_1cov() {
        let (start, stop, event, x) = test_data_1cov();
        let (sort1, sort2) = sort_orders();
        let n = start.len();
        let mut covar = vec![x];

        let config = AgfitConfig {
            maxiter: 20,
            eps: 1e-9,
            toler: 1.490116119384766e-08,
            method: 1, // Efron
            doscale: vec![1],
        };

        let result = agfit4(
            &start, &stop, &event, &mut covar,
            &vec![1.0; n], &vec![0.0; n], &vec![0.0],
            &sort1, &sort2, &vec![0_i32; n], &config,
        );

        // R reference: coef = 1.186529009989266e+00
        assert!(
            (result.coef[0] - 1.186529009989266).abs() < 1e-6,
            "coef: {:.15e}", result.coef[0]
        );
        // R: loglik = -1.199089726386514e+01, -1.087780004617699e+01
        assert!(
            (result.loglik[0] - (-1.199089726386514e+01)).abs() < 1e-6,
            "loglik[0]: {:.15e}", result.loglik[0]
        );
        assert!(
            (result.loglik[1] - (-1.087780004617699e+01)).abs() < 1e-6,
            "loglik[1]: {:.15e}", result.loglik[1]
        );
        // R: var = 6.338786011017070e-01
        assert!(
            (result.imat[0][0] - 6.338786011017070e-01).abs() < 1e-6,
            "var: {:.15e}", result.imat[0][0]
        );
        // R: score = 2.431802490044550e+00
        assert!(
            (result.sctest - 2.431802490044550e+00).abs() < 1e-6,
            "sctest: {:.15e}", result.sctest
        );
        // R: iter = 4
        assert_eq!(result.iter, 4, "iter: {}", result.iter);
    }

    #[test]
    fn test_agfit4_breslow_1cov() {
        let (start, stop, event, x) = test_data_1cov();
        let (sort1, sort2) = sort_orders();
        let n = start.len();
        let mut covar = vec![x];

        let config = AgfitConfig {
            maxiter: 20,
            eps: 1e-9,
            toler: 1.490116119384766e-08,
            method: 0, // Breslow
            doscale: vec![1],
        };

        let result = agfit4(
            &start, &stop, &event, &mut covar,
            &vec![1.0; n], &vec![0.0; n], &vec![0.0],
            &sort1, &sort2, &vec![0_i32; n], &config,
        );

        // No ties → identical to Efron
        assert!(
            (result.coef[0] - 1.186529009989266).abs() < 1e-6,
            "coef: {:.15e}", result.coef[0]
        );
        assert!(
            (result.loglik[1] - (-1.087780004617699e+01)).abs() < 1e-6,
            "loglik[1]: {:.15e}", result.loglik[1]
        );
    }

    #[test]
    fn test_agfit4_efron_2cov() {
        let (start, stop, event, x) = test_data_1cov();
        let (sort1, sort2) = sort_orders();
        let n = start.len();
        let x2 = vec![25.0, 30.0, 45.0, 50.0, 35.0, 60.0, 55.0, 28.0, 40.0, 32.0, 48.0, 52.0];
        let mut covar = vec![x, x2];

        let config = AgfitConfig {
            maxiter: 20,
            eps: 1e-9,
            toler: 1.490116119384766e-08,
            method: 1, // Efron
            doscale: vec![1, 1],
        };

        let result = agfit4(
            &start, &stop, &event, &mut covar,
            &vec![1.0; n], &vec![0.0; n], &vec![0.0, 0.0],
            &sort1, &sort2, &vec![0_i32; n], &config,
        );

        // R: coef = -9.333268999244660e-01, -2.651286315114846e-01
        assert!(
            (result.coef[0] - (-9.333268999244660e-01)).abs() < 1e-6,
            "coef[0]: {:.15e}", result.coef[0]
        );
        assert!(
            (result.coef[1] - (-2.651286315114846e-01)).abs() < 1e-6,
            "coef[1]: {:.15e}", result.coef[1]
        );
        // R: loglik = -1.199089726386514e+01, -6.845449733812658e+00
        assert!(
            (result.loglik[0] - (-1.199089726386514e+01)).abs() < 1e-6,
            "loglik[0]: {:.15e}", result.loglik[0]
        );
        assert!(
            (result.loglik[1] - (-6.845449733812658e+00)).abs() < 1e-6,
            "loglik[1]: {:.15e}", result.loglik[1]
        );
        // R: var matrix
        assert!(
            (result.imat[0][0] - 1.698206993245333e+00).abs() < 1e-6,
            "var[0][0]: {:.15e}", result.imat[0][0]
        );
        assert!(
            (result.imat[0][1] - 9.145431775386667e-02).abs() < 1e-6,
            "var[0][1]: {:.15e}", result.imat[0][1]
        );
        assert!(
            (result.imat[1][1] - 1.463089475719852e-02).abs() < 1e-6,
            "var[1][1]: {:.15e}", result.imat[1][1]
        );
        // R: score = 7.710884426126567e+00
        assert!(
            (result.sctest - 7.710884426126567e+00).abs() < 1e-6,
            "sctest: {:.15e}", result.sctest
        );
        // R: iter = 6
        assert_eq!(result.iter, 6, "iter: {}", result.iter);
    }
}
