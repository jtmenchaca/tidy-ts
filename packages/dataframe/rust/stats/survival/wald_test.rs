//! Wald test for Cox model coefficients
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/coxph_wtest.c`

use super::cholesky::{cholesky2, chsolve2};

/// Wald test statistic: b' * var^{-1} * b
///
/// Direct port of `coxph_wtest()` from `survival-ref/survival-master/src/coxph_wtest.c`.
///
/// # Arguments
///
/// * `var` - Variance-covariance matrix (nvar × nvar), will be modified in place
/// * `b` - Coefficient vector(s), each of length nvar. Multiple test vectors
///   can be passed as consecutive slices.
/// * `ntest` - Number of test vectors
/// * `toler` - Cholesky tolerance for singularity detection
///
/// # Returns
///
/// `(test_stats, df)` where `test_stats` has one chi-squared value per test vector,
/// and `df` is the degrees of freedom (rank of var matrix).
pub fn coxph_wtest(
    var: &mut [Vec<f64>],
    b: &[f64],
    ntest: usize,
    toler: f64,
) -> (Vec<f64>, i32) {
    let nvar = var.len();

    // Cholesky decompose the variance matrix
    cholesky2(var, nvar, toler);

    // Count degrees of freedom (non-zero diagonal = non-singular columns)
    let mut df = 0_i32;
    for i in 0..nvar {
        if var[i][i] > 0.0 {
            df += 1;
        }
    }

    let mut results = Vec::with_capacity(ntest);

    for test_idx in 0..ntest {
        // Extract this test's coefficients
        let b_slice = &b[test_idx * nvar..(test_idx + 1) * nvar];
        let mut solve = b_slice.to_vec();

        // solve = var^{-1} * b  (via Cholesky forward/back solve)
        chsolve2(var, nvar, &mut solve);

        // test statistic = b' * var^{-1} * b
        let mut sum = 0.0_f64;
        for j in 0..nvar {
            sum += b_slice[j] * solve[j];
        }
        results.push(sum);
    }

    (results, df)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wald_1var() {
        // 1-variable case: Wald = beta^2 / var(beta)
        let coef = -3.052692198263517e-02_f64;
        let variance = 6.677350970290921e-01_f64;
        let mut var = vec![vec![variance]];
        let b = vec![coef];

        let (stats, df) = coxph_wtest(&mut var, &b, 1, 1e-12);

        assert_eq!(df, 1);
        let expected = coef * coef / variance;
        assert!(
            (stats[0] - expected).abs() < 1e-10,
            "wald: {:.15e} vs {:.15e}",
            stats[0], expected
        );
    }

    #[test]
    fn test_wald_2var() {
        // 2-variable case from R reference
        let coefs = vec![-2.837262050123115e-03_f64, 3.291766045978858e-01];
        let v00 = 6.729870024909020e-01_f64;
        let v01 = 7.560724881191552e-02;
        let v10 = 7.560724881191552e-02;
        let v11 = 1.036083529901137e+00;
        let mut var = vec![vec![v00, v01], vec![v10, v11]];

        let (stats, df) = coxph_wtest(&mut var, &coefs, 1, 1e-12);

        assert_eq!(df, 2);
        // R reports 0.11 for the Wald test
        assert!(
            (stats[0] - 1.1e-01).abs() < 1e-2,
            "wald 2-cov: {:.6e} vs 1.1e-01",
            stats[0]
        );
    }
}
