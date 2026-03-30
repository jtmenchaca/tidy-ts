//! Efron-method helper for Cox survival curves
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/agsurv5.c`

/// Efron approximation helper for Cox survival curves.
///
/// Direct port of `agsurv5()` from `survival-ref/survival-master/src/agsurv5.c`.
///
/// For each unique death time, computes the cumulative hazard increment (sum1),
/// the variance increment (sum2), and the weighted mean covariates (xbar) using
/// the Efron approximation when there are tied deaths.
///
/// # Arguments
///
/// * `dd` - Number of deaths at each unique death time
/// * `x1` - Denominator at each death time: sum(wt * risk) for risk set
/// * `x2` - Efron numerator: sum(wt * risk) for deaths only
/// * `xsum` - Weighted covariate sum for risk set: xsum[i + n*k] for time i, covariate k
/// * `xsum2` - Weighted covariate sum for deaths: xsum2[i + n*k]
/// * `nvar` - Number of covariates
///
/// # Returns
///
/// `(sum1, sum2, xbar)` where:
/// - `sum1[i]` = cumulative hazard increment at time i
/// - `sum2[i]` = variance increment at time i
/// - `xbar[i + n*k]` = weighted mean of covariate k at time i
pub fn agsurv5(
    dd: &[i32],
    x1: &[f64],
    x2: &[f64],
    xsum: &[f64],
    xsum2: &[f64],
    nvar: usize,
) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
    let n = dd.len();
    let mut sum1 = vec![0.0_f64; n];
    let mut sum2 = vec![0.0_f64; n];
    let mut xbar = vec![0.0_f64; n * nvar];

    for i in 0..n {
        let d = dd[i] as f64;
        if d == 1.0 {
            let temp = 1.0 / x1[i];
            sum1[i] = temp;
            sum2[i] = temp * temp;
            for k in 0..nvar {
                xbar[i + n * k] = xsum[i + n * k] * temp * temp;
            }
        } else if d > 1.0 {
            // Efron approximation for ties
            let d_int = dd[i];
            for j in 0..d_int {
                let temp = 1.0 / (x1[i] - x2[i] * j as f64 / d);
                sum1[i] += temp / d;
                sum2[i] += temp * temp / d;
                for k in 0..nvar {
                    let kk = i + n * k;
                    xbar[kk] += (xsum[kk] - xsum2[kk] * j as f64 / d) * temp * temp / d;
                }
            }
        }
        // If d == 0, sum1, sum2, xbar remain 0
    }

    (sum1, sum2, xbar)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agsurv5_single_death() {
        // 1 death, denom=5.0
        let dd = vec![1];
        let x1 = vec![5.0];
        let x2 = vec![1.0]; // not used when d=1
        let xsum = vec![2.0]; // 1 covariate
        let xsum2 = vec![0.5];

        let (sum1, sum2, xbar) = agsurv5(&dd, &x1, &x2, &xsum, &xsum2, 1);
        assert!((sum1[0] - 0.2).abs() < 1e-12); // 1/5
        assert!((sum2[0] - 0.04).abs() < 1e-12); // (1/5)^2
        assert!((xbar[0] - 2.0 * 0.04).abs() < 1e-12); // xsum * (1/x1)^2
    }

    #[test]
    fn test_agsurv5_no_deaths() {
        let dd = vec![0];
        let x1 = vec![5.0];
        let x2 = vec![0.0];
        let xsum = vec![0.0];
        let xsum2 = vec![0.0];

        let (sum1, sum2, _xbar) = agsurv5(&dd, &x1, &x2, &xsum, &xsum2, 1);
        assert!((sum1[0]).abs() < 1e-12);
        assert!((sum2[0]).abs() < 1e-12);
    }

    #[test]
    fn test_agsurv5_tied_deaths() {
        // 2 tied deaths, denom=10, efron_denom=4
        let dd = vec![2];
        let x1 = vec![10.0];
        let x2 = vec![4.0];
        let xsum = vec![3.0];
        let xsum2 = vec![1.0];

        let (sum1, sum2, _xbar) = agsurv5(&dd, &x1, &x2, &xsum, &xsum2, 1);
        // j=0: temp = 1/10, sum1 += 0.1/2 = 0.05
        // j=1: temp = 1/(10-4*0.5) = 1/8, sum1 += 0.125/2 = 0.0625
        let expected_sum1 = 0.05 + 0.0625;
        assert!(
            (sum1[0] - expected_sum1).abs() < 1e-12,
            "{} vs {}",
            sum1[0],
            expected_sum1
        );
    }
}
