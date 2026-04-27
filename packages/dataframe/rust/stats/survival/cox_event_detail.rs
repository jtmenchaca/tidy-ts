//! Per-event-time internal components of a Cox model
//!
//! Line-for-line port of `coxdetail.c` from R's survival package (Terry Therneau).
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/coxdetail.c`
//!
//! ## Overview
//!
//! Returns per-event-time internal components:
//! - Weighted means of covariates at each death time
//! - Score vector components (u) at each death time
//! - Information matrix components (var) at each death time
//! - Hazard increments, variance of hazard, number at risk, number of deaths
//!
//! Data must be sorted ascending by time within strata, events before
//! censored observations at tied times.

/// Method for handling tied event times.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CoxDetailMethod {
    /// Breslow approximation (method=0)
    Breslow = 0,
    /// Efron approximation (method=1)
    Efron = 1,
}

use serde::Serialize;

/// Result of coxdetail computation — one entry per unique death time.
#[derive(Debug, Clone, Serialize)]
pub struct CoxDetailResult {
    /// Number of unique death times
    pub n_death_times: usize,
    /// Weighted means of covariates at each death time: means[var][death_time]
    pub means: Vec<Vec<f64>>,
    /// Score vector components at each death time: u[var][death_time]
    pub u: Vec<Vec<f64>>,
    /// Information matrix components at each death time: var[death_time][i][j] (symmetric)
    pub imat: Vec<Vec<Vec<f64>>>,
    /// Hazard increment at each death time
    pub hazard: Vec<f64>,
    /// Variance of hazard increment at each death time
    pub varhaz: Vec<f64>,
    /// Number of deaths at each death time
    pub nevent: Vec<f64>,
    /// Number at risk at each death time
    pub nrisk: Vec<f64>,
    /// Weighted number of events at each death time
    pub weighted_events: Vec<f64>,
    /// Weighted number at risk at each death time
    pub weighted_nrisk: Vec<f64>,
}

/// Compute per-event-time internal components of a Cox model.
///
/// Direct port of `coxdetail()` from `coxdetail.c`.
///
/// # Arguments
///
/// * `start` - Start times (counting process format; 0 for right-censored data)
/// * `stop` - Stop times
/// * `event` - Event indicator (1.0 = event, 0.0 = censored)
/// * `covar` - Covariates: covar[var_index][person_index] (column-major like C)
/// * `strata` - Stratum markers: strata[k]==1 means person k is last in stratum
/// * `score` - Risk scores exp(X*beta) for each person
/// * `weights` - Case weights for each person
/// * `center` - Centering constants for each covariate (one per nvar)
/// * `method` - Tie handling method (Breslow or Efron)
pub(crate) fn cox_event_detail(
    start: &[f64],
    stop: &[f64],
    event: &[f64],
    covar: &[Vec<f64>],
    strata: &[i32],
    score: &[f64],
    weights: &[f64],
    center: &[f64],
    method: CoxDetailMethod,
) -> CoxDetailResult {
    let nused = start.len();
    let nvar = covar.len();
    let method_val: f64 = method as i32 as f64;

    // Count total deaths to pre-allocate (this is ndead in C — the total number of deaths,
    // which is an upper bound on unique death times)
    let total_deaths: usize = event.iter().filter(|&&e| e == 1.0).count();

    // Make mutable copy of covariates and subtract centering values
    // C line: for (i=0; i<nvar; i++) for (person=0; person<nused; person++) covar[i][person] -= center[i];
    let mut covar_centered: Vec<Vec<f64>> = covar.to_vec();
    for i in 0..nvar {
        for person in 0..nused {
            covar_centered[i][person] -= center[i];
        }
    }

    // Pre-allocate output arrays (sized to total_deaths as upper bound)
    // C lines: means2, u2, var zeroed out
    let mut means_out: Vec<Vec<f64>> = vec![vec![0.0; total_deaths]; nvar];
    let mut u_out: Vec<Vec<f64>> = vec![vec![0.0; total_deaths]; nvar];
    // var is stored as var[i + j*nvar + ideath*nvar*nvar] in C — we'll use [ideath][i][j]
    let mut var_out: Vec<Vec<Vec<f64>>> = vec![vec![vec![0.0; nvar]; nvar]; total_deaths];

    let mut hazard_out: Vec<f64> = vec![0.0; total_deaths];
    let mut varhaz_out: Vec<f64> = vec![0.0; total_deaths];
    let mut nevent_out: Vec<f64> = vec![0.0; total_deaths];
    let mut nrisk_out: Vec<f64> = vec![0.0; total_deaths];
    let mut weighted_events_out: Vec<f64> = vec![0.0; total_deaths];
    let mut weighted_nrisk_out: Vec<f64> = vec![0.0; total_deaths];

    // Work arrays
    // C: a(nvar), a2(nvar), cmat(nvar,nvar), cmat2(nvar,nvar)
    let mut a = vec![0.0; nvar];
    let mut a2 = vec![0.0; nvar];
    let mut cmat = vec![vec![0.0; nvar]; nvar];
    let mut cmat2 = vec![vec![0.0; nvar]; nvar];

    // C: ideath=0;
    let mut ideath: usize = 0;
    // C: for (person=0; person<nused;)
    let mut person: usize = 0;

    while person < nused {
        // C: if (event[person]==0) person++;
        if event[person] == 0.0 {
            person += 1;
        } else {
            // Compute the mean and covariance over the risk set (a and c)
            // C: denom=0; efron_wt=0; meanwt=0;
            let mut denom: f64 = 0.0;
            let mut efron_wt: f64 = 0.0;
            let mut meanwt: f64 = 0.0;

            // C: zero out a, a2, cmat, cmat2
            for i in 0..nvar {
                a[i] = 0.0;
                a2[i] = 0.0;
                for j in 0..nvar {
                    cmat[i][j] = 0.0;
                    cmat2[i][j] = 0.0;
                }
            }

            // C: time = stop[person];
            let time = stop[person];
            // C: deaths=0; wdeath=0; nrisk=0;
            let mut deaths: i32 = 0;
            let mut wdeath: f64 = 0.0;
            let mut nrisk_count: i32 = 0;

            // C: for (k=person; k<nused; k++)
            let mut k = person;
            while k < nused {
                // C: if (start[k] < time)
                if start[k] < time {
                    nrisk_count += 1;
                    let risk = score[k] * weights[k];
                    denom += risk;
                    for i in 0..nvar {
                        a[i] += risk * covar_centered[i][k];
                        for j in 0..=i {
                            cmat[i][j] += risk * covar_centered[i][k] * covar_centered[j][k];
                        }
                    }
                    // C: if (stop[k]==time && event[k]==1)
                    if stop[k] == time && event[k] == 1.0 {
                        deaths += 1;
                        wdeath += weights[k];
                        efron_wt += risk * event[k];
                        meanwt += weights[k];
                        for i in 0..nvar {
                            a2[i] += risk * covar_centered[i][k];
                            for j in 0..=i {
                                cmat2[i][j] +=
                                    risk * covar_centered[i][k] * covar_centered[j][k];
                            }
                        }
                    }
                }
                // C: if (strata[k]==1) break;
                if strata[k] == 1 {
                    break;
                }
                k += 1;
            }

            // Add results into u and var for all events at this time point
            // C: itemp = -1; hazard=0; varhaz=0;
            let mut itemp: i32 = -1;
            let mut hazard: f64 = 0.0;
            let mut varhaz: f64 = 0.0;
            // C: meanwt /= deaths;
            meanwt /= deaths as f64;

            // C: for (k=person; k<nused && stop[k]==time; k++)
            k = person;
            while k < nused && stop[k] == time {
                // C: if (event[k]==1)
                if event[k] == 1.0 {
                    itemp += 1;
                    // C: temp = itemp*method/deaths;
                    let temp = (itemp as f64) * method_val / (deaths as f64);
                    // C: d2 = denom - temp*efron_wt;
                    let d2 = denom - temp * efron_wt;
                    // C: hazard += meanwt/d2;
                    hazard += meanwt / d2;
                    // C: varhaz += meanwt*meanwt/(d2*d2);
                    varhaz += meanwt * meanwt / (d2 * d2);

                    for i in 0..nvar {
                        // C: temp2 = (a[i] - temp*a2[i])/d2;
                        let temp2 = (a[i] - temp * a2[i]) / d2;
                        // C: means[i][ideath] += (center[i] + temp2)/deaths;
                        means_out[i][ideath] += (center[i] + temp2) / (deaths as f64);
                        // C: u[i][ideath] += weights[k]*covar[i][k] - meanwt*temp2;
                        u_out[i][ideath] +=
                            weights[k] * covar_centered[i][k] - meanwt * temp2;

                        for j in 0..=i {
                            // C: temp3 = ((cmat[i][j] - temp*cmat2[i][j]) -
                            //             temp2*(a[j]-temp*a2[j]))/d2;
                            let temp3 = ((cmat[i][j] - temp * cmat2[i][j])
                                - temp2 * (a[j] - temp * a2[j]))
                                / d2;
                            // C: temp3 *= meanwt;
                            let temp3 = temp3 * meanwt;
                            // C: var[i + j*nvar + ideath*nvar*nvar] += temp3;
                            var_out[ideath][i][j] += temp3;
                            // C: if (j<i) var[j + i*nvar + ideath*nvar*nvar] += temp3;
                            if j < i {
                                var_out[ideath][j][i] += temp3;
                            }
                        }
                    }
                }
                // C: person++;
                person += 1;
                // C: if (strata[k]==1) break;
                if strata[k] == 1 {
                    break;
                }
                k += 1;
            }

            // Store per-death-time outputs
            // C: score[ideath] = wdeath;
            weighted_events_out[ideath] = wdeath;
            // C: start[ideath] = deaths;
            nevent_out[ideath] = deaths as f64;
            // C: stop[ideath] = nrisk;
            nrisk_out[ideath] = nrisk_count as f64;
            // C: event[ideath] = hazard;
            hazard_out[ideath] = hazard;
            // C: weights[ideath] = varhaz;
            varhaz_out[ideath] = varhaz;
            // C: nrisk2[ideath] = denom;
            weighted_nrisk_out[ideath] = denom;

            ideath += 1;
        }
    }

    // C: *ndeadx = ideath;
    let n_death_times = ideath;

    // Truncate output arrays to actual number of unique death times
    for i in 0..nvar {
        means_out[i].truncate(n_death_times);
        u_out[i].truncate(n_death_times);
    }
    var_out.truncate(n_death_times);
    hazard_out.truncate(n_death_times);
    varhaz_out.truncate(n_death_times);
    nevent_out.truncate(n_death_times);
    nrisk_out.truncate(n_death_times);
    weighted_events_out.truncate(n_death_times);
    weighted_nrisk_out.truncate(n_death_times);

    CoxDetailResult {
        n_death_times,
        means: means_out,
        u: u_out,
        imat: var_out,
        hazard: hazard_out,
        varhaz: varhaz_out,
        nevent: nevent_out,
        nrisk: nrisk_out,
        weighted_events: weighted_events_out,
        weighted_nrisk: weighted_nrisk_out,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper: assert within tolerance
    fn assert_close(actual: f64, expected: f64, tol: f64, label: &str) {
        let diff = (actual - expected).abs();
        assert!(
            diff < tol,
            "{}: actual={:.15}, expected={:.15}, diff={:.2e}, tol={:.2e}",
            label,
            actual,
            expected,
            diff,
            tol
        );
    }

    /// Test with the provided right-censored dataset, Efron method.
    /// Reference values from R:
    ///   library(survival)
    ///   fit <- coxph(Surv(time,status)~x, ties="efron")
    ///   d <- coxph.detail(fit)
    ///
    /// R output:
    ///   coef: -0.0305269219826352
    ///   mean_x (center): 0
    ///   nevent: 2, 1, 1, 1, 1
    ///   nrisk: 21, 19, 17, 16, 14
    ///   hazard: 0.0991828661529518, 0.0534778141538566, 0.0596677417791660, 0.0634538922359858, 0.0725187339839838
    ///   varhaz: 0.00492155083946916, 0.00285987660667442, 0.00356023940902523, 0.00402639643989610, 0.00525896677863980
    ///   means: 0.516786139586487, 0.518699672615291, 0.462990323987506, 0.492368862112114, 0.492368862112114
    ///   score(u): -0.0335722791729742, 0.4813003273847089, -0.4629903239875063, 0.5076311378878864, -0.4923688621121137
    ///   imat: 0.499435740634400, 0.249650322244081, 0.248630283881450, 0.249941765734536, 0.249941765734536
    #[test]
    fn test_cox_event_detail_efron() {
        // Dataset (sorted ascending by time, events before censored at ties)
        let time: Vec<f64> = vec![
            1.0, 1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 8.0, 8.0, 8.0, 8.0, 11.0, 11.0,
            12.0, 12.0, 15.0, 17.0, 22.0, 23.0,
        ];
        let status: Vec<f64> = vec![
            1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let x: Vec<f64> = vec![
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 1.0,
        ];

        // Counting process: start=0 for all
        let start_times: Vec<f64> = vec![0.0; 21];

        // R's coxph gives: coef = -0.0305269219826352, center (means) = 0
        let beta = -0.0305269219826352_f64;
        let center_val = 0.0_f64;

        // score = exp((x - center) * beta) = exp(x * beta) since center=0
        let scores: Vec<f64> = x.iter().map(|&xi| ((xi - center_val) * beta).exp()).collect();

        let weights: Vec<f64> = vec![1.0; 21];
        let strata: Vec<i32> = {
            let mut s = vec![0_i32; 21];
            s[20] = 1; // last person is end of stratum
            s
        };
        let center_vec = vec![center_val];
        let covar_matrix = vec![x.clone()]; // covar[0] = x values

        let result = cox_event_detail(
            &start_times,
            &time,
            &status,
            &covar_matrix,
            &strata,
            &scores,
            &weights,
            &center_vec,
            CoxDetailMethod::Efron,
        );

        // Verify structure
        assert_eq!(result.n_death_times, 5, "Should have 5 unique death times");

        // Verify nevent counts
        let r_nevent = [2.0, 1.0, 1.0, 1.0, 1.0];
        for (i, &expected) in r_nevent.iter().enumerate() {
            assert_eq!(result.nevent[i], expected, "nevent[{}]", i);
        }

        // Verify nrisk counts
        let r_nrisk = [21.0, 19.0, 17.0, 16.0, 14.0];
        for (i, &expected) in r_nrisk.iter().enumerate() {
            assert_eq!(result.nrisk[i], expected, "nrisk[{}]", i);
        }

        let tol = 1e-6;

        // Verify hazard increments
        let r_hazard = [
            0.0991828661529518,
            0.0534778141538566,
            0.0596677417791660,
            0.0634538922359858,
            0.0725187339839838,
        ];
        for (i, &expected) in r_hazard.iter().enumerate() {
            assert_close(result.hazard[i], expected, tol, &format!("hazard[{}]", i));
        }

        // Verify variance of hazard
        let r_varhaz = [
            0.00492155083946916,
            0.00285987660667442,
            0.00356023940902523,
            0.00402639643989610,
            0.00525896677863980,
        ];
        for (i, &expected) in r_varhaz.iter().enumerate() {
            assert_close(result.varhaz[i], expected, tol, &format!("varhaz[{}]", i));
        }

        // Verify means
        let r_means = [
            0.516786139586487,
            0.518699672615291,
            0.462990323987506,
            0.492368862112114,
            0.492368862112114,
        ];
        for (i, &expected) in r_means.iter().enumerate() {
            assert_close(result.means[0][i], expected, tol, &format!("means[{}]", i));
        }

        // Verify score vector (u)
        let r_score = [
            -0.0335722791729742,
            0.4813003273847089,
            -0.4629903239875063,
            0.5076311378878864,
            -0.4923688621121137,
        ];
        for (i, &expected) in r_score.iter().enumerate() {
            assert_close(result.u[0][i], expected, tol, &format!("u[{}]", i));
        }

        // Verify information matrix components
        let r_imat = [
            0.499435740634400,
            0.249650322244081,
            0.248630283881450,
            0.249941765734536,
            0.249941765734536,
        ];
        for (i, &expected) in r_imat.iter().enumerate() {
            assert_close(
                result.imat[i][0][0],
                expected,
                tol,
                &format!("imat[{}]", i),
            );
        }
    }
}
