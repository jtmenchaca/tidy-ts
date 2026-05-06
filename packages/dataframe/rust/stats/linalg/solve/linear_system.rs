//! Solve A * x = b for symmetric positive-definite A via Cholesky

use crate::stats::linalg::cholesky::cholesky_decompose;

/// Solve linear system A * x = b using Cholesky decomposition.
///
/// A must be symmetric positive-definite.
pub fn solve_linear_system(a: &[Vec<f64>], b: &[f64]) -> Option<Vec<f64>> {
    let n = b.len();

    let chol = cholesky_decompose(a)?;

    // Forward substitution: L * y = b
    let mut y = vec![0.0; n];
    for i in 0..n {
        let mut sum = b[i];
        for j in 0..i {
            sum -= chol[i][j] * y[j];
        }
        y[i] = sum / chol[i][i];
    }

    // Backward substitution: L^T * x = y
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        let mut sum = y[i];
        for j in (i + 1)..n {
            sum -= chol[j][i] * x[j];
        }
        x[i] = sum / chol[i][i];
    }

    Some(x)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOL: f64 = 1e-6;

    #[test]
    fn test_identity() {
        let a = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let b = vec![3.0, 5.0];
        let x = solve_linear_system(&a, &b).unwrap();
        assert!((x[0] - 3.0).abs() < TOL);
        assert!((x[1] - 5.0).abs() < TOL);
    }

    #[test]
    fn test_nontrivial() {
        let a = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let b = vec![10.0, 13.0];
        let x = solve_linear_system(&a, &b).unwrap();
        let ax0 = a[0][0] * x[0] + a[0][1] * x[1];
        let ax1 = a[1][0] * x[0] + a[1][1] * x[1];
        assert!((ax0 - b[0]).abs() < TOL);
        assert!((ax1 - b[1]).abs() < TOL);
    }
}
