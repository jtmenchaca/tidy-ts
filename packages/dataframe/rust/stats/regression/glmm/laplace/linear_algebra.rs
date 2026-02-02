//! Linear algebra utilities for Laplace approximation
//!
//! This module provides matrix operations needed for GLMM fitting:
//! - Cholesky decomposition and solves
//! - Log determinant computation
//! - Symmetric positive-definite matrix inversion

use super::super::variance_components::cholesky_decompose;

/// Solve linear system A * x = b using Cholesky decomposition
///
/// A must be symmetric positive-definite.
///
/// # Arguments
/// * `a` - Symmetric positive-definite matrix (n × n)
/// * `b` - Right-hand side vector (n)
///
/// # Returns
/// Solution vector x, or None if Cholesky decomposition fails
pub fn solve_linear_system(a: &[Vec<f64>], b: &[f64]) -> Option<Vec<f64>> {
    let n = b.len();

    // Cholesky decomposition: A = L * L^T
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

/// Compute log determinant of a symmetric positive-definite matrix
///
/// Uses Cholesky decomposition: log|A| = 2 * sum(log(L_ii))
///
/// # Arguments
/// * `a` - Symmetric positive-definite matrix
///
/// # Returns
/// log|A|, or None if matrix is not positive-definite
pub fn log_determinant(a: &[Vec<f64>]) -> Option<f64> {
    let chol = cholesky_decompose(a)?;
    let n = chol.len();

    // log|A| = log|L|² = 2 * sum(log(L_ii))
    let log_det = 2.0 * (0..n).map(|i| chol[i][i].ln()).sum::<f64>();
    Some(log_det)
}

/// Invert a symmetric positive-definite matrix using Cholesky decomposition
///
/// For A = LL^T, computes A^{-1} = L^{-T} L^{-1}
///
/// This is used to compute conditional variances Var(b|y) = H^{-1} where H is
/// the Hessian of the negative joint log-likelihood.
///
/// # Arguments
/// * `a` - Symmetric positive-definite matrix (n × n)
///
/// # Returns
/// The inverse A^{-1}, or None if Cholesky decomposition fails
pub fn invert_symmetric_positive_definite(a: &[Vec<f64>]) -> Option<Vec<Vec<f64>>> {
    let n = a.len();
    if n == 0 {
        return Some(vec![]);
    }

    // Cholesky decomposition: A = LL^T
    let chol = cholesky_decompose(a)?;

    // Compute L^{-1} by forward substitution on identity columns
    let mut l_inv = vec![vec![0.0; n]; n];
    for j in 0..n {
        // Solve L * x = e_j for j-th column of L^{-1}
        for i in j..n {
            if i == j {
                l_inv[i][j] = 1.0 / chol[i][i];
            } else {
                let mut sum = 0.0;
                for k in j..i {
                    sum += chol[i][k] * l_inv[k][j];
                }
                l_inv[i][j] = -sum / chol[i][i];
            }
        }
    }

    // Compute A^{-1} = L^{-T} L^{-1} = (L^{-1})^T (L^{-1})
    let mut a_inv = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..=i {
            let mut sum = 0.0;
            // (L^{-1})^T [i, k] * L^{-1} [k, j] = L^{-1} [k, i] * L^{-1} [k, j]
            // L^{-1} is lower triangular, so only k from max(i,j) to n-1 contributes
            for k in i..n {
                sum += l_inv[k][i] * l_inv[k][j];
            }
            a_inv[i][j] = sum;
            a_inv[j][i] = sum; // Symmetric
        }
    }

    Some(a_inv)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOL: f64 = 1e-6;

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() < tol || (a.is_nan() && b.is_nan())
    }

    #[test]
    fn test_solve_linear_system_identity() {
        let a = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let b = vec![3.0, 5.0];

        let x = solve_linear_system(&a, &b).unwrap();
        assert!(approx_eq(x[0], 3.0, TOL));
        assert!(approx_eq(x[1], 5.0, TOL));
    }

    #[test]
    fn test_solve_linear_system_nontrivial() {
        let a = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let b = vec![10.0, 13.0];

        let x = solve_linear_system(&a, &b).unwrap();

        // Verify A * x = b
        let ax0 = a[0][0] * x[0] + a[0][1] * x[1];
        let ax1 = a[1][0] * x[0] + a[1][1] * x[1];
        assert!(approx_eq(ax0, b[0], TOL));
        assert!(approx_eq(ax1, b[1], TOL));
    }

    #[test]
    fn test_log_determinant_identity() {
        // det(I) = 1, log(1) = 0
        let a = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let log_det = log_determinant(&a).unwrap();
        assert!(approx_eq(log_det, 0.0, TOL));
    }

    #[test]
    fn test_log_determinant_diagonal() {
        // det = 4*9 = 36, log det = log(36)
        let a = vec![vec![4.0, 0.0], vec![0.0, 9.0]];
        let log_det = log_determinant(&a).unwrap();
        assert!(approx_eq(log_det, 36.0_f64.ln(), TOL));
    }

    #[test]
    fn test_log_determinant_2x2() {
        // [[4, 2], [2, 3]] has det = 4*3 - 2*2 = 8
        let a = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let log_det = log_determinant(&a).unwrap();
        assert!(approx_eq(log_det, 8.0_f64.ln(), TOL));
    }

    #[test]
    fn test_invert_identity() {
        let identity = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let inv = invert_symmetric_positive_definite(&identity).unwrap();

        assert_eq!(inv.len(), 2);
        assert!(approx_eq(inv[0][0], 1.0, TOL));
        assert!(approx_eq(inv[0][1], 0.0, TOL));
        assert!(approx_eq(inv[1][0], 0.0, TOL));
        assert!(approx_eq(inv[1][1], 1.0, TOL));
    }

    #[test]
    fn test_invert_diagonal() {
        let diag = vec![vec![4.0, 0.0], vec![0.0, 9.0]];
        let inv = invert_symmetric_positive_definite(&diag).unwrap();

        assert!(approx_eq(inv[0][0], 0.25, TOL));
        assert!(approx_eq(inv[0][1], 0.0, TOL));
        assert!(approx_eq(inv[1][0], 0.0, TOL));
        assert!(approx_eq(inv[1][1], 1.0 / 9.0, TOL));
    }

    #[test]
    fn test_invert_2x2() {
        // [[2, 1], [1, 3]] has det = 5
        // Inverse = [[3, -1], [-1, 2]] / 5
        let a = vec![vec![2.0, 1.0], vec![1.0, 3.0]];
        let inv = invert_symmetric_positive_definite(&a).unwrap();

        assert!(approx_eq(inv[0][0], 0.6, TOL));
        assert!(approx_eq(inv[0][1], -0.2, TOL));
        assert!(approx_eq(inv[1][0], -0.2, TOL));
        assert!(approx_eq(inv[1][1], 0.4, TOL));

        // Verify A * A^{-1} = I
        let product_00 = a[0][0] * inv[0][0] + a[0][1] * inv[1][0];
        let product_01 = a[0][0] * inv[0][1] + a[0][1] * inv[1][1];
        let product_10 = a[1][0] * inv[0][0] + a[1][1] * inv[1][0];
        let product_11 = a[1][0] * inv[0][1] + a[1][1] * inv[1][1];

        assert!(approx_eq(product_00, 1.0, TOL));
        assert!(approx_eq(product_01, 0.0, TOL));
        assert!(approx_eq(product_10, 0.0, TOL));
        assert!(approx_eq(product_11, 1.0, TOL));
    }

    #[test]
    fn test_invert_3x3() {
        let a = vec![
            vec![4.0, 2.0, 1.0],
            vec![2.0, 5.0, 2.0],
            vec![1.0, 2.0, 6.0],
        ];
        let inv = invert_symmetric_positive_definite(&a).unwrap();

        // Verify A * A^{-1} = I
        for i in 0..3 {
            for j in 0..3 {
                let product: f64 = (0..3).map(|k| a[i][k] * inv[k][j]).sum();
                let expected = if i == j { 1.0 } else { 0.0 };
                assert!(
                    approx_eq(product, expected, TOL),
                    "(A * A^-1)[{}][{}] = {}, expected {}",
                    i,
                    j,
                    product,
                    expected
                );
            }
        }

        // Verify symmetry
        for i in 0..3 {
            for j in 0..3 {
                assert!(approx_eq(inv[i][j], inv[j][i], TOL));
            }
        }
    }

    #[test]
    fn test_invert_empty() {
        let empty: Vec<Vec<f64>> = vec![];
        let inv = invert_symmetric_positive_definite(&empty).unwrap();
        assert!(inv.is_empty());
    }

    #[test]
    fn test_invert_1x1() {
        let a = vec![vec![4.0]];
        let inv = invert_symmetric_positive_definite(&a).unwrap();
        assert!(approx_eq(inv[0][0], 0.25, TOL));
    }
}
