//! Anderson-Gill (counting process) Cox residuals
//!
//! ## Source Files
//!
//! - `agmart.c`: Martingale residuals (slow, used by agexact.fit only)
//! - `agmart3.c`: Fast martingale residuals for counting process data
//! - `agscore2.c`: Score residuals (slow O(n²) version)
//! - `agscore3.c`: Fast score residuals with cumulative sums

/// Fast martingale residuals for counting process (start-stop) Cox model.
///
/// Direct port of `agmart3()` from `survival-ref/survival-master/src/agmart3.c`.
///
/// # Arguments
///
/// * `nused` - Number of observations to process (may be < total if some never at risk)
/// * `tstart` - Entry times
/// * `tstop` - Exit times
/// * `event` - Event indicator (1.0=event, 0.0=censored)
/// * `score` - Risk scores exp(beta*z)
/// * `weight` - Case weights
/// * `strata` - Stratum assignments (0-based integers)
/// * `sort1` - Sort index: descending (strata, start), 0-based
/// * `sort2` - Sort index: descending (strata, stop), 0-based
/// * `method` - 0=Breslow, 1=Efron
///
/// # Returns
///
/// Martingale residuals: status[i] - cumhaz_contribution[i]
#[allow(clippy::too_many_arguments)]
pub fn agmart3(
    nused: usize,
    tstart: &[f64],
    tstop: &[f64],
    event: &[f64],
    score: &[f64],
    weight: &[f64],
    strata: &[i32],
    sort1: &[i32],
    sort2: &[i32],
    method: i32,
) -> Vec<f64> {
    let nr = tstart.len();
    let mut resid = vec![0.0_f64; nr];
    let mut atrisk = vec![0_i32; nr];

    let mut person1: usize = 0;
    let mut denom = 0.0_f64;
    let mut cumhaz = 0.0_f64;
    let mut istrat = strata[sort2[0] as usize];

    let mut person2: usize = 0;
    while person2 < nused {
        // Find the next event time
        let mut k = person2;
        let mut dtime = 0.0_f64;
        let mut found = false;
        while k < nused {
            let p2 = sort2[k] as usize;
            if strata[p2] != istrat {
                // Start of a new stratum — finish prior stratum
                while person1 < nused {
                    let p1 = sort1[person1] as usize;
                    if strata[p1] != istrat {
                        break;
                    }
                    resid[p1] -= cumhaz * score[p1];
                    person1 += 1;
                }
                cumhaz = 0.0;
                denom = 0.0;
                istrat = strata[p2];
                person2 = person1;
            }
            if event[p2] > 0.0 {
                dtime = tstop[p2];
                found = true;
                break;
            }
            k += 1;
        }
        if !found {
            break;
        }

        // Remove subjects whose start time >= dtime
        while person1 < nused {
            let p1 = sort1[person1] as usize;
            if tstart[p1] < dtime || strata[p1] != istrat {
                break;
            }
            if atrisk[p1] == 1 {
                denom -= score[p1] * weight[p1];
                resid[p1] -= cumhaz * score[p1];
            }
            person1 += 1;
        }

        // Add new subjects (C line 148: k restarts from person2)
        let mut deaths = 0.0_f64;
        let mut e_denom = 0.0_f64;
        let mut wtsum = 0.0_f64;
        k = person2; // C: for (k=person2; k< nused; k++)
        while k < nused {
            let p2 = sort2[k] as usize;
            if tstop[p2] < dtime || strata[p2] != istrat {
                break;
            }

            if event[p2] == 1.0 {
                // stop[p2] == dtime for events
                atrisk[p2] = 1;
                resid[p2] = 1.0 + cumhaz * score[p2];
                deaths += 1.0;
                denom += score[p2] * weight[p2];
                e_denom += score[p2] * weight[p2];
                wtsum += weight[p2];
            } else if tstart[p2] < dtime {
                denom += score[p2] * weight[p2];
                atrisk[p2] = 1;
                resid[p2] = cumhaz * score[p2];
            }
            k += 1;
        }

        // Compute hazard increment
        if method == 0 || deaths as i32 == 1 {
            // Breslow
            let hazard = wtsum / denom;
            cumhaz += hazard;
            person2 = k;
        } else {
            // Efron
            let mut hazard = 0.0_f64;
            let mut e_hazard = 0.0_f64;
            let deaths_int = deaths as i32;
            wtsum /= deaths;
            for i in 0..deaths_int {
                let temp = i as f64 / deaths;
                hazard += wtsum / (denom - temp * e_denom);
                e_hazard += wtsum * (1.0 - temp) / (denom - temp * e_denom);
            }

            // Deaths don't get the full hazard increment
            let temp = hazard - e_hazard;
            while person2 < k {
                let p2 = sort2[person2] as usize;
                if event[p2] > 0.0 {
                    resid[p2] += temp * score[p2];
                }
                person2 += 1;
            }
            cumhaz += hazard;
        }
    }

    // Finish the last few
    while person1 < nused {
        let p1 = sort1[person1] as usize;
        if atrisk[p1] == 1 {
            resid[p1] -= cumhaz * score[p1];
        }
        person1 += 1;
    }

    resid
}

/// Slow martingale residuals for counting process Cox model.
///
/// Direct port of `agmart()` from `survival-ref/survival-master/src/agmart.c`.
/// Only used by `agexact.fit` (exact partial likelihood). O(n²) complexity.
///
/// Data must be sorted by time within strata, events first.
///
/// # Arguments
///
/// * `start` - Entry times
/// * `stop` - Exit times (sorted ascending within strata)
/// * `event` - Event indicator (1=event, 0=censored)
/// * `score` - Risk scores exp(beta*z)
/// * `wt` - Case weights
/// * `strata` - Strata indicator (1=last obs in stratum)
/// * `method` - 0=Breslow, 1=Efron
///
/// # Returns
///
/// Martingale residuals
pub fn agmart(
    start: &[f64],
    stop: &[f64],
    event: &[i32],
    score: &[f64],
    wt: &[f64],
    strata: &mut [i32],
    method: i32,
) -> Vec<f64> {
    let nused = start.len();
    strata[nused - 1] = 1; // Failsafe

    let mut resid: Vec<f64> = event.iter().map(|&e| e as f64).collect();

    let mut person = 0;
    while person < nused {
        if event[person] == 0 {
            person += 1;
        } else {
            let mut denom = 0.0_f64;
            let mut e_denom = 0.0_f64;
            let mut wtsum = 0.0_f64;
            let time = stop[person];
            let mut deaths = 0.0_f64;

            let mut k = person;
            while k < nused {
                if start[k] < time {
                    denom += score[k] * wt[k];
                    if stop[k] == time && event[k] == 1 {
                        deaths += 1.0;
                        wtsum += wt[k];
                        e_denom += score[k] * wt[k];
                    }
                }
                if strata[k] == 1 {
                    break;
                }
                k += 1;
            }

            // Compute expected for the risk set
            let mut hazard = 0.0_f64;
            let mut e_hazard = 0.0_f64;
            wtsum /= deaths;
            let deaths_int = deaths as i32;
            for kk in 0..deaths_int {
                let temp = method as f64 * (kk as f64 / deaths);
                hazard += wtsum / (denom - temp * e_denom);
                e_hazard += wtsum * (1.0 - temp) / (denom - temp * e_denom);
            }

            k = person;
            while k < nused {
                if start[k] < time {
                    if stop[k] == time && event[k] == 1 {
                        resid[k] -= score[k] * e_hazard;
                    } else {
                        resid[k] -= score[k] * hazard;
                    }
                }
                if stop[k] == time {
                    person += 1;
                }
                if strata[k] == 1 {
                    break;
                }
                k += 1;
            }
        }
    }

    resid
}

/// Score residuals for counting process (start-stop) Cox model.
///
/// Direct port of `agscore3()` from `survival-ref/survival-master/src/agscore3.c`.
/// Fast O(n) algorithm using cumulative sums.
///
/// Data is assumed sorted in descending tstop order within strata.
///
/// # Arguments
///
/// * `tstart` - Entry times
/// * `tstop` - Exit times
/// * `event` - Event indicator (1.0=event, 0.0=censored)
/// * `covar` - Covariate matrix covar[j][i] (nvar × n)
/// * `strata` - Stratum assignments (0-based integers)
/// * `score` - Risk scores exp(beta*z)
/// * `weights` - Case weights
/// * `method` - 0=Breslow, 1=Efron
/// * `sort1` - Sort index for start times (ascending within strata, 0-based)
///
/// # Returns
///
/// Score residual matrix resid[j][i] (nvar × n)
#[allow(clippy::too_many_arguments)]
pub fn agscore3(
    tstart: &[f64],
    tstop: &[f64],
    event: &[f64],
    covar: &[Vec<f64>],
    strata: &[i32],
    score: &[f64],
    weights: &[f64],
    method: i32,
    sort1: &[i32],
) -> Vec<Vec<f64>> {
    let n = tstart.len();
    let nvar = covar.len();

    let mut resid = vec![vec![0.0_f64; n]; nvar];

    // Scratch
    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut mean = vec![0.0_f64; nvar];
    let mut mh1 = vec![0.0_f64; nvar];
    let mut mh2 = vec![0.0_f64; nvar];
    let mut mh3 = vec![0.0_f64; nvar];
    let mut xhaz = vec![0.0_f64; nvar];

    let mut cumhaz = 0.0_f64;
    let mut denom = 0.0_f64;

    let mut i1 = n as i32 - 1;
    let mut currentstrata = strata[n - 1];

    // Walk backward through data (descending stop time)
    let mut person = n as i32 - 1;
    while person >= 0 {
        let dtime = tstop[person as usize];

        if strata[person as usize] != currentstrata {
            // New stratum — finish prior one
            while i1 >= 0 && sort1[i1 as usize] > person {
                let k = sort1[i1 as usize] as usize;
                for j in 0..nvar {
                    resid[j][k] -= score[k] * (cumhaz * covar[j][k] - xhaz[j]);
                }
                i1 -= 1;
            }
            // Reset
            cumhaz = 0.0;
            denom = 0.0;
            for j in 0..nvar {
                a[j] = 0.0;
                xhaz[j] = 0.0;
            }
            currentstrata = strata[person as usize];
        } else {
            // Remove subjects whose start time >= dtime
            while i1 >= 0 && tstart[sort1[i1 as usize] as usize] >= dtime {
                let k = sort1[i1 as usize] as usize;
                if strata[k] != currentstrata {
                    break;
                }
                let risk = score[k] * weights[k];
                denom -= risk;
                for j in 0..nvar {
                    resid[j][k] -= score[k] * (cumhaz * covar[j][k] - xhaz[j]);
                    a[j] -= risk * covar[j][k];
                }
                i1 -= 1;
            }
        }

        // Count up at this time point
        let mut e_denom = 0.0_f64;
        let mut meanwt = 0.0_f64;
        let mut deaths = 0.0_f64;
        for i in 0..nvar {
            a2[i] = 0.0;
        }

        while person >= 0 && tstop[person as usize] == dtime {
            if strata[person as usize] != currentstrata {
                break;
            }
            let p = person as usize;
            for j in 0..nvar {
                resid[j][p] = (covar[j][p] * cumhaz - xhaz[j]) * score[p];
            }
            let risk = score[p] * weights[p];
            denom += risk;
            for i in 0..nvar {
                a[i] += risk * covar[i][p];
            }

            if event[p] == 1.0 {
                deaths += 1.0;
                e_denom += risk;
                meanwt += weights[p];
                for i in 0..nvar {
                    a2[i] += risk * covar[i][p];
                }
            }
            person -= 1;
        }

        if deaths > 0.0 {
            let deaths_int = deaths as i32;
            if deaths_int < 2 || method == 0 {
                // Breslow (or single death)
                let hazard = meanwt / denom;
                cumhaz += hazard;
                for i in 0..nvar {
                    mean[i] = a[i] / denom;
                    xhaz[i] += mean[i] * hazard;
                    for j in (person + 1) as usize..=(person + deaths_int) as usize {
                        resid[i][j] += covar[i][j] - mean[i];
                    }
                }
            } else {
                // Efron
                for i in 0..nvar {
                    mh1[i] = 0.0;
                    mh2[i] = 0.0;
                    mh3[i] = 0.0;
                }
                meanwt /= deaths;
                for dd in 0..deaths_int {
                    let downwt = dd as f64 / deaths;
                    let d2 = denom - downwt * e_denom;
                    let hazard = meanwt / d2;
                    cumhaz += hazard;
                    for i in 0..nvar {
                        mean[i] = (a[i] - downwt * a2[i]) / d2;
                        xhaz[i] += mean[i] * hazard;
                        mh1[i] += hazard * downwt;
                        mh2[i] += mean[i] * hazard * downwt;
                        mh3[i] += mean[i] / deaths;
                    }
                }

                for j in (person + 1) as usize..=(person + deaths_int) as usize {
                    for i in 0..nvar {
                        resid[i][j] += (covar[i][j] - mh3[i])
                            + score[j] * (covar[i][j] * mh1[i] - mh2[i]);
                    }
                }
            }
        }
    }

    // Finish those in the final stratum
    while i1 >= 0 {
        let k = sort1[i1 as usize] as usize;
        for j in 0..nvar {
            resid[j][k] -= score[k] * (covar[j][k] * cumhaz - xhaz[j]);
        }
        i1 -= 1;
    }

    resid
}

/// Slow score residuals for counting process Cox model.
///
/// Direct port of `agscore2()` from `survival-ref/survival-master/src/agscore2.c`.
/// O(n²) complexity. Data must be sorted by time within strata, events first.
///
/// # Arguments
///
/// * `tstart` - Entry times
/// * `tstop` - Exit times (sorted ascending, events first at ties)
/// * `event` - Event indicator (1.0=event, 0.0=censored)
/// * `covar` - Covariate matrix covar[j][i] (nvar × n)
/// * `strata` - Strata indicator (1=last obs in stratum)
/// * `score` - Risk scores exp(beta*z)
/// * `weights` - Case weights
/// * `method` - 0=Breslow, 1=Efron
///
/// # Returns
///
/// Score residual matrix resid[j][i] (nvar × n)
#[allow(clippy::too_many_arguments)]
pub fn agscore2(
    tstart: &[f64],
    tstop: &[f64],
    event: &[f64],
    covar: &[Vec<f64>],
    strata: &[i32],
    score: &[f64],
    weights: &[f64],
    method: i32,
) -> Vec<Vec<f64>> {
    let n = tstart.len();
    let nvar = covar.len();

    let mut resid = vec![vec![0.0_f64; n]; nvar];

    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut mean = vec![0.0_f64; nvar];
    let mut mh1 = vec![0.0_f64; nvar];
    let mut mh2 = vec![0.0_f64; nvar];
    let mut mh3 = vec![0.0_f64; nvar];

    let mut person = 0;
    while person < n {
        if event[person] == 0.0 {
            person += 1;
        } else {
            // Compute mean over risk set
            let mut denom = 0.0_f64;
            let mut e_denom = 0.0_f64;
            let mut meanwt = 0.0_f64;
            let mut deaths = 0.0_f64;
            for i in 0..nvar {
                a[i] = 0.0;
                a2[i] = 0.0;
            }
            let time = tstop[person];

            let mut k = person;
            while k < n {
                if tstart[k] < time {
                    let risk = score[k] * weights[k];
                    denom += risk;
                    for i in 0..nvar {
                        a[i] += risk * covar[i][k];
                    }
                    if tstop[k] == time && event[k] == 1.0 {
                        deaths += 1.0;
                        e_denom += risk;
                        meanwt += weights[k];
                        for i in 0..nvar {
                            a2[i] += risk * covar[i][k];
                        }
                    }
                }
                if strata[k] == 1 {
                    break;
                }
                k += 1;
            }

            let deaths_int = deaths as i32;
            if deaths_int < 2 || method == 0 {
                // Breslow
                let hazard = meanwt / denom;
                for i in 0..nvar {
                    mean[i] = a[i] / denom;
                }
                k = person;
                while k < n {
                    if tstart[k] < time {
                        let risk = score[k];
                        for i in 0..nvar {
                            resid[i][k] -= (covar[i][k] - mean[i]) * risk * hazard;
                        }
                        if tstop[k] == time {
                            person += 1;
                            if event[k] == 1.0 {
                                for i in 0..nvar {
                                    resid[i][k] += covar[i][k] - mean[i];
                                }
                            }
                        }
                    }
                    if strata[k] == 1 {
                        break;
                    }
                    k += 1;
                }
            } else {
                // Efron with ties
                let mut temp1 = 0.0_f64;
                let mut temp2 = 0.0_f64;
                for i in 0..nvar {
                    mh1[i] = 0.0;
                    mh2[i] = 0.0;
                    mh3[i] = 0.0;
                }
                meanwt /= deaths;
                for dd in 0..deaths_int {
                    let downwt = dd as f64 / deaths;
                    let d2 = denom - downwt * e_denom;
                    let hazard = meanwt / d2;
                    temp1 += hazard;
                    temp2 += (1.0 - downwt) * hazard;
                    for i in 0..nvar {
                        mean[i] = (a[i] - downwt * a2[i]) / d2;
                        mh1[i] += mean[i] * hazard;
                        mh2[i] += mean[i] * (1.0 - downwt) * hazard;
                        mh3[i] += mean[i] / deaths;
                    }
                }
                k = person;
                while k < n {
                    if tstart[k] < time {
                        let risk = score[k];
                        if tstop[k] == time && event[k] == 1.0 {
                            for i in 0..nvar {
                                resid[i][k] += covar[i][k] - mh3[i];
                                resid[i][k] -= risk * covar[i][k] * temp2;
                                resid[i][k] += risk * mh2[i];
                            }
                        } else {
                            for i in 0..nvar {
                                resid[i][k] -=
                                    risk * (covar[i][k] * temp1 - mh1[i]);
                            }
                        }
                    }
                    if strata[k] == 1 {
                        break;
                    }
                    k += 1;
                }
                while tstop[person] == time {
                    if strata[person] == 1 {
                        break;
                    }
                    person += 1;
                }
            }
        }
    }

    resid
}

#[cfg(test)]
mod tests {
    use super::*;

    // Test data: counting process, 12 obs, no ties
    fn test_data() -> (Vec<f64>, Vec<f64>, Vec<f64>, Vec<f64>) {
        let start = vec![0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0, 8.0];
        let stop = vec![5.0, 3.0, 8.0, 10.0, 6.0, 12.0, 15.0, 4.0, 7.0, 9.0, 11.0, 14.0];
        let event = vec![1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0];
        let x = vec![1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        (start, stop, event, x)
    }

    fn sort_orders() -> (Vec<i32>, Vec<i32>) {
        let sort1 = vec![11_i32, 3, 6, 0, 1, 2, 4, 5, 7, 8, 9, 10];
        let sort2 = vec![6_i32, 11, 5, 10, 3, 9, 2, 8, 4, 0, 7, 1];
        (sort1, sort2)
    }

    // R reference: exp(1.186529009989266) = 3.275691559459893
    fn scores() -> Vec<f64> {
        let coef = 1.186529009989266_f64;
        let x = vec![1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        x.iter().map(|&xi| (coef * xi).exp()).collect()
    }

    #[test]
    fn test_agmart3_efron() {
        let (start, stop, event, _) = test_data();
        let (sort1, sort2) = sort_orders();
        let n = start.len();
        let score = scores();
        let weight = vec![1.0; n];
        let strata = vec![0_i32; n];

        let resid = agmart3(
            n, &start, &stop, &event, &score, &weight, &strata, &sort1, &sort2, 1,
        );

        // R reference (Efron, identical to Breslow for no-tie data)
        let expected = [
            5.981238657855465e-01,
            0.000000000000000e+00,
            -3.101655310630820e-01,
            6.750748532166053e-01,
            3.371413486857247e-01,
            -6.069544989506124e-01,
            -8.408347931892175e-01,
            8.190502204788555e-01,
            6.898344689369180e-01,
            -1.016006612138733e+00,
            3.930455010493876e-01,
            -7.383088228113914e-01,
        ];

        for i in 0..n {
            assert!(
                (resid[i] - expected[i]).abs() < 1e-6,
                "resid[{}]: {:.15e} vs {:.15e}",
                i, resid[i], expected[i]
            );
        }
    }

    #[test]
    fn test_agmart3_breslow() {
        let (start, stop, event, _) = test_data();
        let (sort1, sort2) = sort_orders();
        let n = start.len();
        let score = scores();
        let weight = vec![1.0; n];
        let strata = vec![0_i32; n];

        let resid = agmart3(
            n, &start, &stop, &event, &score, &weight, &strata, &sort1, &sort2, 0,
        );

        // Same as Efron (no ties)
        let expected = [
            5.981238657855465e-01,
            0.000000000000000e+00,
            -3.101655310630820e-01,
            6.750748532166053e-01,
            3.371413486857247e-01,
            -6.069544989506124e-01,
            -8.408347931892175e-01,
            8.190502204788555e-01,
            6.898344689369180e-01,
            -1.016006612138733e+00,
            3.930455010493876e-01,
            -7.383088228113914e-01,
        ];

        for i in 0..n {
            assert!(
                (resid[i] - expected[i]).abs() < 1e-6,
                "resid[{}]: {:.15e} vs {:.15e}",
                i, resid[i], expected[i]
            );
        }
    }

    #[test]
    fn test_agscore3_efron() {
        let (start, stop, event, x) = test_data();
        let n = start.len();
        let score = scores();
        let weight = vec![1.0; n];
        let strata = vec![0_i32; n];
        let covar = vec![x];

        // agscore3 expects data sorted in descending tstop order within strata
        // and sort1 is ascending start within strata
        // C code: sort1 is ascending order of start times (person n-1 down to 0)
        // sort1[n-1] = index of smallest start time
        // Actually, re-reading C: i1 starts at n-1 and walks DOWN
        // sort1 must be ascending order by start time
        let mut sort1_asc: Vec<i32> = (0..n as i32).collect();
        sort1_asc.sort_by(|&a, &b| {
            start[a as usize]
                .partial_cmp(&start[b as usize])
                .unwrap()
        });

        // Data must be pre-sorted by descending tstop
        // Let's create the sorted permutation
        let mut sort2_desc: Vec<usize> = (0..n).collect();
        sort2_desc.sort_by(|&a, &b| stop[b].partial_cmp(&stop[a]).unwrap());

        // Reorder all arrays by sort2_desc
        let mut s_tstart = vec![0.0; n];
        let mut s_tstop = vec![0.0; n];
        let mut s_event = vec![0.0; n];
        let mut s_covar = vec![vec![0.0; n]; 1];
        let mut s_score = vec![0.0; n];
        let mut s_weight = vec![0.0; n];
        let mut s_strata = vec![0_i32; n];

        for (new_idx, &old_idx) in sort2_desc.iter().enumerate() {
            s_tstart[new_idx] = start[old_idx];
            s_tstop[new_idx] = stop[old_idx];
            s_event[new_idx] = event[old_idx];
            s_covar[0][new_idx] = covar[0][old_idx];
            s_score[new_idx] = score[old_idx];
            s_weight[new_idx] = weight[old_idx];
            s_strata[new_idx] = strata[old_idx];
        }

        // Build sort1 for sorted data: ascending start time
        let mut s_sort1: Vec<i32> = (0..n as i32).collect();
        s_sort1.sort_by(|&a, &b| {
            s_tstart[a as usize]
                .partial_cmp(&s_tstart[b as usize])
                .unwrap()
        });

        let resid = agscore3(
            &s_tstart, &s_tstop, &s_event, &s_covar, &s_strata, &s_score,
            &s_weight, 1, &s_sort1,
        );

        // Map back to original order
        let mut orig_resid = vec![0.0; n];
        for (new_idx, &old_idx) in sort2_desc.iter().enumerate() {
            orig_resid[old_idx] = resid[0][new_idx];
        }

        // R reference (Efron)
        let expected = [
            2.127414551348435e-01,
            0.000000000000000e+00,
            1.643420555187977e-01,
            -3.086848240219440e-01,
            2.287967163788241e-01,
            3.093951574609785e-01,
            4.885754596664471e-01,
            2.262223932292799e-01,
            -1.888059053056597e-01,
            -4.776727280115179e-01,
            -2.125698767386643e-01,
            -4.423399033113836e-01,
        ];

        for i in 0..n {
            assert!(
                (orig_resid[i] - expected[i]).abs() < 1e-6,
                "score_resid[{}]: {:.15e} vs {:.15e}",
                i, orig_resid[i], expected[i]
            );
        }
    }
}
