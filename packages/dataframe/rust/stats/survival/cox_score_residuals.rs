//! Cox model score residuals
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/coxscore2.c`
//!
//! O(np) algorithm using cumulative hazard and weighted covariate means.
//! Data must be sorted by strata, ascending time within strata.

/// Compute score residuals for a Cox model.
///
/// Direct port of `coxscore2()` from `survival-ref/survival-master/src/coxscore2.c`.
///
/// # Arguments
///
/// * `time` - Event/censoring times (ascending within strata)
/// * `status` - Event indicator (1.0=event, 0.0=censored)
/// * `covar` - Covariate matrix, covar[j][i] (nvar x n)
/// * `strata` - Strata assignment (non-negative integer, same value within stratum)
/// * `score` - Risk scores exp(beta*z)
/// * `weights` - Case weights
/// * `method` - 0=Breslow, 1=Efron
///
/// # Returns
///
/// Score residual matrix, resid[j][i] (nvar x n)
pub fn coxscore2(
    time: &[f64],
    status: &[f64],
    covar: &[Vec<f64>],
    strata: &[i32],
    score: &[f64],
    weights: &[f64],
    method: i32,
) -> Vec<Vec<f64>> {
    let n = time.len();
    let nvar = covar.len();
    assert_eq!(status.len(), n);
    assert_eq!(strata.len(), n);
    assert_eq!(score.len(), n);
    assert_eq!(weights.len(), n);
    for v in covar {
        assert_eq!(v.len(), n);
    }

    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut xhaz = vec![0.0_f64; nvar];
    let mut resid = vec![vec![0.0_f64; n]; nvar];

    let mut denom: f64 = 0.0;
    let mut cumhaz: f64 = 0.0;

    for j in 0..nvar {
        a2[j] = 0.0;
        a[j] = 0.0;
        xhaz[j] = 0.0;
    }

    let mut stratastart: isize = n as isize - 1;
    let mut currentstrata = strata[n - 1];

    let mut i = n as isize - 1;
    while i >= 0 {
        let newtime = time[i as usize];
        let mut deaths: f64 = 0.0;
        let mut e_denom: f64 = 0.0;
        let mut meanwt: f64 = 0.0;
        for j in 0..nvar {
            a2[j] = 0.0;
        }

        // Walk through tied times in same stratum
        while i >= 0 && time[i as usize] == newtime && strata[i as usize] == currentstrata {
            let ii = i as usize;
            let risk = score[ii] * weights[ii];
            denom += risk;
            for j in 0..nvar {
                resid[j][ii] = score[ii] * (covar[j][ii] * cumhaz - xhaz[j]);
                a[j] += risk * covar[j][ii];
            }
            if status[ii] == 1.0 {
                deaths += 1.0;
                e_denom += risk;
                meanwt += weights[ii];
                for j in 0..nvar {
                    a2[j] += risk * covar[j][ii];
                }
            }
            i -= 1;
        }

        if deaths > 0.0 {
            if (deaths as i32) < 2 || method == 0 {
                // Breslow
                let hazard = meanwt / denom;
                cumhaz += hazard;
                for j in 0..nvar {
                    let xbar = a[j] / denom;
                    xhaz[j] += xbar * hazard;
                    // deaths are at positions (i+1) .. (i+deaths)
                    for k in (i + 1) as usize..=(i + deaths as isize) as usize {
                        resid[j][k] += covar[j][k] - xbar;
                    }
                }
            } else {
                // Efron
                meanwt /= deaths;
                for dd in 0..(deaths as i32) {
                    let downwt = dd as f64 / deaths;
                    let temp = denom - downwt * e_denom;
                    let hazard = meanwt / temp;
                    cumhaz += hazard;
                    for j in 0..nvar {
                        let xbar = (a[j] - downwt * a2[j]) / temp;
                        xhaz[j] += xbar * hazard;
                        for k in (i + 1) as usize..=(i + deaths as isize) as usize {
                            let temp2 = covar[j][k] - xbar;
                            resid[j][k] += temp2 / deaths;
                            resid[j][k] += temp2 * score[k] * hazard * downwt;
                        }
                    }
                }
            }
        }

        if i < 0 || strata[i as usize] != currentstrata {
            // End of stratum — final adjustment
            for k in ((i + 1) as usize)..=(stratastart as usize) {
                for j in 0..nvar {
                    resid[j][k] += score[k] * (xhaz[j] - covar[j][k] * cumhaz);
                }
            }
            // Reset
            denom = 0.0;
            cumhaz = 0.0;
            for j in 0..nvar {
                a[j] = 0.0;
                xhaz[j] = 0.0;
            }
            stratastart = i;
            if i >= 0 {
                currentstrata = strata[i as usize];
            }
        }
    }

    resid
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coxscore2_aml_efron() {
        // R: residuals(coxph(Surv(time, status) ~ x, data=aml_s), type="score")
        // Data sorted by time ascending, deaths before censored within ties
        let xtime = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 13.0, 16.0, 18.0, 23.0, 23.0, 27.0, 28.0,
            30.0, 31.0, 33.0, 34.0, 43.0, 45.0, 45.0, 48.0, 161.0,
        ];
        let status: Vec<f64> = vec![
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,
        ];
        // Model matrix: 0/1 indicator for Nonmaintained, deaths-first at time=45
        let x: Vec<f64> = vec![
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0,
        ];
        let n = xtime.len();

        let beta = 0.915532575014718_f64;
        let score_vec: Vec<f64> = x.iter().map(|&xi| (beta * xi).exp()).collect();
        let weights = vec![1.0_f64; n];
        // Single stratum: all same value
        let strata = vec![0_i32; n];
        let covar = vec![x];

        let resid = coxscore2(&xtime, &status, &covar, &strata, &score_vec, &weights, 1);

        // R exact output (deaths-first sort):
        let expected = vec![
            0.251510782259014, 0.251510782259014, 0.248716234214136, 0.248716234214136,
            -0.548409748334013, 0.196434649080649, -0.494237103452805, 0.141951073522633,
            -0.170131867760086, -0.481688909633990, -0.462166816927889, 0.055815428609992,
            -0.003102414175708, 0.271386585794956, -0.049660657898267, -0.235968498398240,
            -0.190808329159270, -0.073061376992670, -0.404305579692446, -0.481757538918174,
            0.643085690463080, 0.643085690463080, 0.643085690463080,
        ];

        assert_eq!(resid.len(), 1); // 1 covariate
        assert_eq!(resid[0].len(), n);
        for i in 0..n {
            assert!(
                (resid[0][i] - expected[i]).abs() < 1e-6,
                "score_resid[{}]: got {:.15}, expected {:.15}",
                i, resid[0][i], expected[i]
            );
        }
    }

    #[test]
    fn test_coxscore2_aml_breslow() {
        // R: residuals(coxph(Surv(time, status) ~ x, data=aml_s, ties="breslow"), type="score")
        let xtime = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 13.0, 16.0, 18.0, 23.0, 23.0, 27.0, 28.0,
            30.0, 31.0, 33.0, 34.0, 43.0, 45.0, 45.0, 48.0, 161.0,
        ];
        let status: Vec<f64> = vec![
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,
        ];
        let x: Vec<f64> = vec![
            1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0,
        ];
        let n = xtime.len();

        let beta = 0.904219723685700_f64;
        let score_vec: Vec<f64> = x.iter().map(|&xi| (beta * xi).exp()).collect();
        let weights = vec![1.0_f64; n];
        let strata = vec![0_i32; n];
        let covar = vec![x];

        let resid = coxscore2(&xtime, &status, &covar, &strata, &score_vec, &weights, 0);

        // R exact output:
        let expected = vec![
            0.237767766868394, 0.237767766868394, 0.232585063243328, 0.232585063243328,
            -0.546856247729995, 0.203878910053047, -0.492501830093497, 0.141063943679755,
            -0.165307984941815, -0.479907929839168, -0.447416818623001, 0.044923325778216,
            0.007079720830777, 0.268453990442985, -0.039651989977560, -0.235908976236662,
            -0.181184546735700, -0.072655944850480, -0.395076174644614, -0.472116894207583,
            0.640826595624599, 0.640826595624599, 0.640826595624599,
        ];

        assert_eq!(resid.len(), 1);
        for i in 0..n {
            assert!(
                (resid[0][i] - expected[i]).abs() < 1e-6,
                "score_resid[{}]: got {:.15}, expected {:.15}",
                i, resid[0][i], expected[i]
            );
        }
    }
}
