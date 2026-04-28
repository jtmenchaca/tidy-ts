//! Cox model residuals: martingale and Schoenfeld
//!
//! ## Source Files
//!
//! - `coxmart.c`: Martingale residuals (Breslow and Efron)
//! - `coxmart2.c`: Martingale residuals (inverse time order, Breslow only)
//! - `coxscho.c`: Schoenfeld residuals

/// Compute martingale residuals for a Cox model.
///
/// Direct port of `coxmart()` from `survival-ref/survival-master/src/coxmart.c`.
///
/// Data must be sorted by ascending time within strata.
///
/// # Arguments
///
/// * `time` - Event/censoring times (sorted ascending within strata)
/// * `status` - Event indicator (1=event, 0=censored)
/// * `score` - Risk scores exp(beta*z) for each subject
/// * `strata` - Strata indicator (1=last obs in stratum)
/// * `wt` - Case weights
/// * `method` - 0=Breslow, 1=Efron
///
/// # Returns
///
/// Martingale residuals: status[i] - expected[i]
pub fn coxmart(
    time: &[f64],
    status: &[i32],
    score: &[f64],
    strata: &[i32],
    wt: &[f64],
    method: i32,
) -> Vec<f64> {
    let n = time.len();
    assert_eq!(status.len(), n);
    assert_eq!(score.len(), n);
    assert_eq!(strata.len(), n);
    assert_eq!(wt.len(), n);

    let mut strata = strata.to_vec();
    let mut expect = vec![0.0_f64; n];

    strata[n - 1] = 1; // failsafe

    // Pass 1: store the risk denominator in 'expect'
    let mut denom: f64 = 0.0;
    for i in (0..n).rev() {
        if strata[i] == 1 {
            denom = 0.0;
        }
        denom += score[i] * wt[i];
        if i == 0 || strata[i - 1] == 1 || time[i - 1] != time[i] {
            expect[i] = denom;
        } else {
            expect[i] = 0.0;
        }
    }

    // Pass 2: compute the residuals
    let mut deaths: f64 = 0.0;
    let mut wtsum: f64 = 0.0;
    let mut e_denom: f64 = 0.0;
    let mut hazard: f64 = 0.0;
    let mut lastone: usize = 0;

    for i in 0..n {
        if expect[i] != 0.0 {
            denom = expect[i];
        }
        expect[i] = status[i] as f64;
        deaths += status[i] as f64;
        wtsum += status[i] as f64 * wt[i];
        e_denom += score[i] * status[i] as f64 * wt[i];

        if strata[i] == 1 || time[i + 1] != time[i] {
            // last subject of a set of tied times
            if (deaths as i32) < 2 || method == 0 {
                hazard += wtsum / denom;
                for j in lastone..=i {
                    expect[j] -= score[j] * hazard;
                }
            } else {
                let mut temp = hazard;
                let wtsum_d = wtsum / deaths;
                for k in 0..(deaths as i32) {
                    let downwt = k as f64 / deaths;
                    hazard += wtsum_d / (denom - e_denom * downwt);
                    temp += wtsum_d * (1.0 - downwt) / (denom - e_denom * downwt);
                }
                for j in lastone..=i {
                    if status[j] == 0 {
                        expect[j] = -score[j] * hazard;
                    } else {
                        expect[j] -= score[j] * temp;
                    }
                }
            }
            lastone = i + 1;
            deaths = 0.0;
            wtsum = 0.0;
            e_denom = 0.0;
        }
        if strata[i] == 1 {
            hazard = 0.0;
        }
    }

    // Handle any remaining subjects after the last tied set
    for j in lastone..n {
        expect[j] -= score[j] * hazard;
    }

    expect
}

/// Compute martingale residuals (inverse time order, Breslow only).
///
/// Direct port of `coxmart2()` from `survival-ref/survival-master/src/coxmart2.c`.
///
/// Data must be in inverse time order (descending). Strata indicator: 1=first obs in stratum.
///
/// # Arguments
///
/// * `time` - Event/censoring times (descending within strata)
/// * `status` - Event indicator (1=event, 0=censored)
/// * `score` - Risk scores exp(beta*z)
/// * `strata` - Strata indicator (1=first obs in stratum)
/// * `wt` - Case weights
///
/// # Returns
///
/// Martingale residuals: status[i] - score[i] * cumhazard
#[allow(dead_code)]
pub(crate) fn coxmart2(
    time: &[f64],
    status: &[i32],
    score: &[f64],
    strata: &[i32],
    wt: &[f64],
) -> Vec<f64> {
    let n = time.len();
    assert_eq!(status.len(), n);
    assert_eq!(score.len(), n);
    assert_eq!(strata.len(), n);
    assert_eq!(wt.len(), n);

    let mut resid = vec![0.0_f64; n];

    // Pass 1: accumulate weighted score, store Breslow hazard increments
    let mut denom: f64 = 0.0;
    let mut i = 0;
    while i < n {
        if strata[i] == 1 {
            denom = 0.0;
        }

        let mut deaths: f64 = 0.0;
        denom += score[i] * wt[i];
        deaths += status[i] as f64 * wt[i];
        let mut j = i + 1;
        while j < n && time[j] == time[i] && strata[j] == 0 {
            denom += score[j] * wt[j];
            deaths += status[j] as f64 * wt[j];
            j += 1;
        }
        let hazard = deaths / denom;
        resid[j - 1] = hazard;
        i = j;
    }

    // Pass 2: accumulate hazard from smallest time to largest (reverse of data order)
    let mut expected: f64 = 0.0;
    for i in (0..n).rev() {
        expected += resid[i];
        resid[i] = status[i] as f64 - score[i] * expected;
        if strata[i] == 1 {
            expected = 0.0;
        }
    }

    resid
}

/// Compute Schoenfeld residuals for a Cox model.
///
/// Direct port of `coxscho()` from `survival-ref/survival-master/src/coxscho.c`.
///
/// Data must be sorted by ascending stop time within strata, deaths before censored
/// within tied times. Uses counting process (start, stop) formulation.
///
/// # Arguments
///
/// * `start` - Entry times (left truncation)
/// * `stop` - Event/censoring times
/// * `event` - Event indicator (1=event, 0=censored)
/// * `covar` - Covariate matrix, covar[i][person] (nvar x nused)
/// * `score` - Risk scores exp(beta*z)
/// * `strata` - Strata indicator (1=last obs in stratum)
/// * `method` - 0=Breslow, 1=Efron
///
/// # Returns
///
/// Schoenfeld residuals: one row per death, nvar columns.
/// Returns (death_times, residuals) where residuals[death][var].
pub fn coxscho(
    start: &[f64],
    stop: &[f64],
    event: &[f64],
    covar: &[Vec<f64>],
    score: &[f64],
    strata: &[i32],
    method: i32,
) -> (Vec<f64>, Vec<Vec<f64>>) {
    let nused = stop.len();
    let nvar = covar.len();
    assert_eq!(start.len(), nused);
    assert_eq!(event.len(), nused);
    assert_eq!(score.len(), nused);
    assert_eq!(strata.len(), nused);

    // Make mutable copy of covar (C code modifies in place)
    let mut covar = covar.to_vec();

    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut mean = vec![0.0_f64; nvar];

    let mut death_times: Vec<f64> = Vec::new();
    let mut residuals: Vec<Vec<f64>> = Vec::new();

    let mut person = 0;
    while person < nused {
        if event[person] == 0.0 {
            person += 1;
        } else {
            // Compute the mean over the risk set and over the deaths
            let mut denom: f64 = 0.0;
            let mut efron_wt: f64 = 0.0;
            for i in 0..nvar {
                a[i] = 0.0;
                a2[i] = 0.0;
            }
            let time = stop[person];
            let mut deaths: f64 = 0.0;

            for k in person..nused {
                if start[k] < time {
                    let weight = score[k];
                    denom += weight;
                    for i in 0..nvar {
                        a[i] += weight * covar[i][k];
                    }
                    if stop[k] == time && event[k] == 1.0 {
                        deaths += 1.0;
                        efron_wt += weight * event[k];
                        for i in 0..nvar {
                            a2[i] += weight * covar[i][k];
                        }
                    }
                }
                if strata[k] == 1 {
                    break;
                }
            }

            // Compute the mean at this time point
            for i in 0..nvar {
                mean[i] = 0.0;
            }
            for k in 0..(deaths as i32) {
                let temp = method as f64 * k as f64 / deaths;
                for i in 0..nvar {
                    mean[i] +=
                        (a[i] - temp * a2[i]) / (deaths * (denom - temp * efron_wt));
                }
            }

            // Compute the residuals for this time point
            while person < nused && stop[person] == time {
                if event[person] == 1.0 {
                    let mut resid = vec![0.0_f64; nvar];
                    for i in 0..nvar {
                        resid[i] = covar[i][person] - mean[i];
                        covar[i][person] = resid[i]; // match C behavior
                    }
                    death_times.push(time);
                    residuals.push(resid);
                }
                person += 1;
                if person > 0 && person <= nused && strata[person - 1] == 1 {
                    break;
                }
            }
        }
    }

    (death_times, residuals)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// AML data sorted by time with model matrix, matching cox_regression tests.
    /// Returns (time, status, x_nonmaint, score_efron, score_breslow)
    fn aml_sorted_with_scores() -> (Vec<f64>, Vec<i32>, Vec<f64>) {
        let xtime = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 13.0, 16.0, 18.0, 23.0, 23.0, 27.0, 28.0,
            30.0, 31.0, 33.0, 34.0, 43.0, 45.0, 45.0, 48.0, 161.0,
        ];
        let status = vec![
            1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0,
        ];
        let x_nonmaint = vec![
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0,
        ];
        (xtime, status, x_nonmaint)
    }

    #[test]
    fn test_coxmart_aml_efron() {
        // R: residuals(coxph(Surv(time, status) ~ x, data=aml_sorted), type="martingale")
        let (xtime, status, x) = aml_sorted_with_scores();
        let n = xtime.len();

        // Compute score = exp(beta * x) using the Efron coefficient
        let beta_efron = 0.915532575014718_f64;
        let score: Vec<f64> = x.iter().map(|&xi| (beta_efron * xi).exp()).collect();
        let wt = vec![1.0_f64; n];
        let mut strata = vec![0_i32; n];
        strata[n - 1] = 1;

        let mart = coxmart(&xtime, &status, &score, &strata, &wt, 1);

        // R exact output (sorted order):
        // 0.906576297015458, 0.906576297015458, 0.767383301486367, 0.767383301486367,
        // 0.859675930847304, 0.566143424699377, 0.789944565152947, -0.210055434847053,
        // -0.524740600582829, 0.746444803972331, 0.676262687874742, 0.191270096299239,
        // -0.005545177070409, -0.402523130844611, -0.172169718590657, 0.450740108084820,
        // -0.589443031631070, 0.252582672837299, -1.179538350935034, -1.054357401025997,
        // -1.633895839192059, -0.554357401025997, -1.554357401025997
        let expected = vec![
            0.906576297015458, 0.906576297015458, 0.767383301486367, 0.767383301486367,
            0.859675930847304, 0.566143424699377, 0.789944565152947, -0.210055434847053,
            -0.524740600582829, 0.746444803972331, 0.676262687874742, 0.191270096299239,
            -0.005545177070409, -0.402523130844611, -0.172169718590657, 0.450740108084820,
            -0.589443031631070, 0.252582672837299, -1.179538350935034, -1.054357401025997,
            -1.633895839192059, -0.554357401025997, -1.554357401025997,
        ];

        assert_eq!(mart.len(), expected.len());
        for i in 0..n {
            assert!(
                (mart[i] - expected[i]).abs() < 1e-6,
                "mart[{}]: got {:.15}, expected {:.15}",
                i, mart[i], expected[i]
            );
        }
    }

    #[test]
    fn test_coxmart_aml_breslow() {
        // R: residuals(coxph(Surv(time, status) ~ x, data=aml_sorted, ties="breslow"), type="martingale")
        let (xtime, status, x) = aml_sorted_with_scores();
        let n = xtime.len();

        let beta_breslow = 0.904219723685700_f64;
        let score: Vec<f64> = x.iter().map(|&xi| (beta_breslow * xi).exp()).collect();
        let wt = vec![1.0_f64; n];
        let mut strata = vec![0_i32; n];
        strata[n - 1] = 1;

        let mart = coxmart(&xtime, &status, &score, &strata, &wt, 0);

        // R exact output (sorted order, Breslow):
        let expected = vec![
            0.878444830134628, 0.878444830134628, 0.740069412925169, 0.740069412925169,
            0.862255389969199, 0.576772922328968, 0.792009851905271, -0.207990148094729,
            -0.513736473924354, 0.748188687206911, 0.656529756721305, 0.151627164573334,
            0.017022190707517, -0.397966098390514, -0.148972520689352, 0.454249569136659,
            -0.564482578843189, 0.254750513702143, -1.151852435085449, -1.054009174052731,
            -1.603406755185124, -0.554009174052731, -1.554009174052731,
        ];

        assert_eq!(mart.len(), expected.len());
        for i in 0..n {
            assert!(
                (mart[i] - expected[i]).abs() < 1e-6,
                "mart[{}]: got {:.15}, expected {:.15}",
                i, mart[i], expected[i]
            );
        }
    }

    #[test]
    fn test_coxscho_aml_efron() {
        // R: residuals(coxph(Surv(time, status) ~ x, data=aml_s), type="schoenfeld")
        // coxscho.c requires: ascending time, deaths before censored within ties
        let xtime = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 13.0, 16.0, 18.0, 23.0, 23.0, 27.0, 28.0,
            30.0, 31.0, 33.0, 34.0, 43.0, 45.0, 45.0, 48.0, 161.0,
        ];
        let status: Vec<i32> = vec![
            1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0,
        ];
        // Model matrix with deaths-first sort at time=45: Nonmaint(death) before Maint(censor)
        let x: Vec<f64> = vec![
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0,
        ];
        let n = xtime.len();

        let beta_efron = 0.915532575014718_f64;
        let score: Vec<f64> = x.iter().map(|&xi| (beta_efron * xi).exp()).collect();

        let start = vec![0.0_f64; n];
        let event: Vec<f64> = status.iter().map(|&s| s as f64).collect();
        let covar = vec![x];
        let mut strata = vec![0_i32; n];
        strata[n - 1] = 1;

        let (times, resids) = coxscho(&start, &xtime, &event, &covar, &score, &strata, 1);

        // R exact output: 18 deaths
        let expected_scho = vec![
            0.277155290442239, 0.277155290442239, 0.317120943768727, 0.317120943768727,
            -0.644987707742269, 0.333501833919005, -0.636188176975438, -0.652001910555074,
            -0.680250381234702, 0.319749618765298, 0.324490487468648, 0.333501833919005,
            -0.599818028566163, 0.347998089444926, -0.555368348454840, 0.375177709846911,
            0.545642511742976, 0.000000000000000,
        ];
        let expected_times = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 18.0, 23.0, 23.0, 27.0, 30.0, 31.0, 33.0,
            34.0, 43.0, 45.0, 48.0,
        ];

        assert_eq!(resids.len(), 18, "n_deaths: {}", resids.len());
        assert_eq!(times.len(), 18);

        for i in 0..18 {
            assert!(
                (times[i] - expected_times[i]).abs() < 1e-10,
                "time[{}]: got {}, expected {}",
                i, times[i], expected_times[i]
            );
            assert!(
                (resids[i][0] - expected_scho[i]).abs() < 1e-6,
                "scho[{}]: got {:.15}, expected {:.15}",
                i, resids[i][0], expected_scho[i]
            );
        }
    }
}
