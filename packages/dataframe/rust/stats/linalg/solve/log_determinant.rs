//! Log determinant of a symmetric positive-definite matrix via Cholesky

use crate::stats::linalg::cholesky::cholesky_decompose;

/// Compute log determinant of a symmetric positive-definite matrix.
///
/// Uses Cholesky decomposition: log|A| = 2 * sum(log(L_ii))
pub fn log_determinant(a: &[Vec<f64>]) -> Option<f64> {
    let chol = cholesky_decompose(a)?;
    let n = chol.len();
    let log_det = 2.0 * (0..n).map(|i| chol[i][i].ln()).sum::<f64>();
    Some(log_det)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOL: f64 = 1e-6;

    #[test]
    fn test_identity() {
        let a = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let log_det = log_determinant(&a).unwrap();
        assert!((log_det - 0.0).abs() < TOL);
    }

    #[test]
    fn test_2x2() {
        // det = 4*3 - 2*2 = 8
        let a = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let log_det = log_determinant(&a).unwrap();
        assert!((log_det - 8.0_f64.ln()).abs() < TOL);
    }
}
