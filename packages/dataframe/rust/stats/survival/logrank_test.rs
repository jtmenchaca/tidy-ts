//! Log-rank test and weighted variants
//!
//! Port of `survdiff2.c` from R's survival package (Terry Therneau).
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/survdiff2.c`
//!
//! ## Supported Tests
//!
//! - **Log-rank** (rho=0): Standard unweighted log-rank test
//! - **Peto-Peto** (rho=1): Weighted by KM estimate
//! - **Fleming-Harrington** (rho=p): Weighted by S(t)^rho (G-rho family)
//! - **Stratified**: Separate strata with pooled test statistic

use serde::Serialize;

/// Result of the log-rank (survdiff) test.
#[derive(Debug, Clone, Serialize)]
pub struct SurvdiffResult {
    /// Observed events per group (ngroup elements, or nstrat*ngroup if stratified)
    pub observed: Vec<f64>,
    /// Expected events per group under H0
    pub expected: Vec<f64>,
    /// Variance-covariance matrix of (observed - expected), ngroup x ngroup
    pub var: Vec<Vec<f64>>,
    /// Chi-squared test statistic
    pub chisq: f64,
    /// Degrees of freedom (ngroup - 1)
    pub df: usize,
}

/// Compute the log-rank test (survdiff).
///
/// Direct port of `survdiff2()` from `survival-ref/survival-master/src/survdiff2.c`.
///
/// Data must be sorted by strata, then by time (ascending) within each stratum.
///
/// # Arguments
///
/// * `time` - Event/censoring times (sorted by strata then time)
/// * `status` - Event indicator (1=event, 0=censored)
/// * `group` - Group assignment, 1-indexed (values 1..=ngroup)
/// * `strata` - Strata indicator: 1 = last observation in this stratum, 0 = otherwise
/// * `ngroup` - Number of groups
/// * `nstrat` - Number of strata
/// * `rho` - Weight parameter: 0=log-rank, 1=Peto-Peto, p=G-rho family
pub fn survdiff2(
    time: &[f64],
    status: &[i32],
    group: &[i32],
    strata: &[i32],
    ngroup: usize,
    nstrat: usize,
    rho: f64,
) -> SurvdiffResult {
    let ntot = time.len();
    assert_eq!(status.len(), ntot);
    assert_eq!(group.len(), ntot);
    assert_eq!(strata.len(), ntot);

    let mut var = vec![vec![0.0_f64; ngroup]; ngroup];
    let mut obs = vec![0.0_f64; nstrat * ngroup];
    let mut exp = vec![0.0_f64; nstrat * ngroup];
    let mut risk = vec![0.0_f64; ngroup];
    let mut kaplan = vec![0.0_f64; ntot];

    let mut istart: usize = 0;
    let mut koff: usize = 0;

    while istart < ntot {
        // Reset risk counts for this stratum
        for r in risk.iter_mut() {
            *r = 0.0;
        }

        // Find last obs of this stratum
        let mut n = istart;
        for i in istart..ntot {
            if strata[i] == 1 {
                n = i + 1;
                break;
            }
            n = i + 1; // if no strata marker found, go to end
        }

        // Compute K-M (only needed if rho != 0)
        if rho != 0.0 {
            let mut km: f64 = 1.0;
            let mut i = istart;
            while i < n {
                kaplan[i] = km;
                let nrisk = (n - i) as f64;
                let mut deaths = status[i] as f64;
                let mut j = i + 1;
                while j < n && time[j] == time[i] {
                    kaplan[j] = km;
                    deaths += status[j] as f64;
                    j += 1;
                }
                km *= (nrisk - deaths) / nrisk;
                i = j;
            }
        }

        // The actual test: walk backward through this stratum
        let mut i = n as isize - 1;
        while i >= istart as isize {
            let wt: f64 = if rho == 0.0 {
                1.0
            } else {
                kaplan[i as usize].powf(rho)
            };

            let mut deaths: f64 = 0.0;
            let mut j = i;
            while j >= istart as isize && time[j as usize] == time[i as usize] {
                let k = (group[j as usize] - 1) as usize;
                deaths += status[j as usize] as f64;
                risk[k] += 1.0;
                obs[k + koff] += (status[j as usize] as f64) * wt;
                j -= 1;
            }
            i = j + 1;
            let nrisk = (n as f64) - (i as f64);

            if deaths > 0.0 {
                // Expected events under H0
                for k in 0..ngroup {
                    exp[k + koff] += wt * deaths * risk[k] / nrisk;
                }

                if nrisk as i64 == 1 {
                    // Only 1 subject, no variance contribution
                    i = j;
                    continue;
                }

                // Variance-covariance matrix
                // C code uses flat kk index; we use 2D var[j][k] directly
                let wt2 = wt * wt;
                for jj in 0..ngroup {
                    let tmp =
                        wt2 * deaths * risk[jj] * (nrisk - deaths) / (nrisk * (nrisk - 1.0));
                    var[jj][jj] += tmp;
                    for k in 0..ngroup {
                        var[jj][k] -= tmp * risk[k] / nrisk;
                    }
                }
            }

            i = j;
        }

        istart = n;
        koff += ngroup;
    }

    // Sum observed and expected across strata for each group
    let mut obs_total = vec![0.0_f64; ngroup];
    let mut exp_total = vec![0.0_f64; ngroup];
    for s in 0..nstrat {
        for k in 0..ngroup {
            obs_total[k] += obs[k + s * ngroup];
            exp_total[k] += exp[k + s * ngroup];
        }
    }

    // Compute chi-squared: (O-E)' V^{-1} (O-E) using first (ngroup-1) groups
    // For 2 groups: chisq = (O1-E1)^2 / V11
    // For >2 groups: need matrix inverse of the (ngroup-1)x(ngroup-1) submatrix
    let chisq = if ngroup == 2 {
        let diff = obs_total[0] - exp_total[0];
        if var[0][0] > 0.0 {
            diff * diff / var[0][0]
        } else {
            0.0
        }
    } else {
        // General case: use the full variance matrix
        // chi-sq = (O-E)' * V^{-1} * (O-E), dropping last group (linearly dependent)
        // For now, use a simple approach for ngroup-1 dimensional submatrix
        compute_chisq_from_var(&obs_total, &exp_total, &var, ngroup)
    };

    SurvdiffResult {
        observed: obs_total,
        expected: exp_total,
        var,
        chisq,
        df: ngroup - 1,
    }
}

/// Compute chi-squared statistic from (O-E) and variance matrix.
/// Uses the first (ngroup-1) components (last is linearly dependent).
fn compute_chisq_from_var(
    obs: &[f64],
    exp: &[f64],
    var: &[Vec<f64>],
    ngroup: usize,
) -> f64 {
    if ngroup <= 1 {
        return 0.0;
    }

    let m = ngroup - 1;
    let mut diff = vec![0.0_f64; m];
    for i in 0..m {
        diff[i] = obs[i] - exp[i];
    }

    // Extract (ngroup-1) x (ngroup-1) submatrix
    let mut subvar = vec![vec![0.0_f64; m]; m];
    for i in 0..m {
        for j in 0..m {
            subvar[i][j] = var[i][j];
        }
    }

    // Solve V * x = diff using our Cholesky
    let rank = super::cholesky::cholesky2(&mut subvar, m, 1e-12);
    if rank <= 0 {
        return 0.0; // singular
    }

    let mut x = diff.clone();
    super::cholesky::chsolve2(&subvar, m, &mut x);

    // chisq = diff' * x
    let mut chisq: f64 = 0.0;
    for i in 0..m {
        chisq += diff[i] * x[i];
    }
    chisq
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_survdiff_aml_basic() {
        // AML data: Maintained (group=1, 11 obs) vs Nonmaintained (group=2, 12 obs)
        // Data must be sorted by time within each stratum.
        // Single stratum (strata[last] = 1, rest = 0)
        let time = vec![
            5.0, 5.0, 8.0, 8.0, 9.0, 12.0, 13.0, 13.0, 16.0, 18.0, 23.0, 23.0, 27.0, 28.0,
            30.0, 31.0, 33.0, 34.0, 43.0, 45.0, 45.0, 48.0, 161.0,
        ];
        let status = vec![
            1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0,
        ];
        let group = vec![
            2, 2, 2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 2, 1, 2, 1, 2, 1, 2, 2, 1, 1, 1,
        ];

        let n = time.len();
        let mut strata = vec![0_i32; n];
        strata[n - 1] = 1; // single stratum

        let result = survdiff2(&time, &status, &group, &strata, 2, 1, 0.0);

        // R output: survdiff(Surv(time, status) ~ x, aml)
        //          N Observed Expected (O-E)^2/E (O-E)^2/V
        // x=Maintained    11        7    10.69      1.27       3.4
        // x=Nonmaintained 12       11     7.31      1.86       3.4
        // Chisq= 3.4  on 1 degrees of freedom, p= 0.0653
        assert_eq!(result.observed.len(), 2);
        assert_eq!(result.df, 1);

        // Compare against R's exact values
        assert!((result.observed[0] - 7.0).abs() < 1e-10, "obs Maintained");
        assert!((result.observed[1] - 11.0).abs() < 1e-10, "obs Nonmaintained");
        assert!((result.expected[0] - 10.69).abs() < 0.01, "exp Maintained: {}", result.expected[0]);
        assert!((result.expected[1] - 7.31).abs() < 0.01, "exp Nonmaintained: {}", result.expected[1]);
        assert!((result.chisq - 3.4).abs() < 0.1, "chisq: {}", result.chisq);
    }
}
