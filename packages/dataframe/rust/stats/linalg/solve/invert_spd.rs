//! Invert a symmetric positive-definite matrix via Cholesky

use crate::stats::linalg::cholesky::cholesky_decompose;

/// Invert a symmetric positive-definite matrix using Cholesky decomposition.
///
/// For A = LL^T, computes A^{-1} = L^{-T} L^{-1}.
pub fn invert_symmetric_positive_definite(a: &[Vec<f64>]) -> Option<Vec<Vec<f64>>> {
    let n = a.len();
    if n == 0 {
        return Some(vec![]);
    }

    let chol = cholesky_decompose(a)?;

    // Compute L^{-1} by forward substitution on identity columns
    let mut l_inv = vec![vec![0.0; n]; n];
    for j in 0..n {
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

    // Compute A^{-1} = (L^{-1})^T (L^{-1})
    let mut a_inv = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..=i {
            let mut sum = 0.0;
            for k in i..n {
                sum += l_inv[k][i] * l_inv[k][j];
            }
            a_inv[i][j] = sum;
            a_inv[j][i] = sum;
        }
    }

    Some(a_inv)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOL: f64 = 1e-6;

    #[test]
    fn test_2x2() {
        let a = vec![vec![2.0, 1.0], vec![1.0, 3.0]];
        let inv = invert_symmetric_positive_definite(&a).unwrap();
        assert!((inv[0][0] - 0.6).abs() < TOL);
        assert!((inv[0][1] - (-0.2)).abs() < TOL);
        assert!((inv[1][0] - (-0.2)).abs() < TOL);
        assert!((inv[1][1] - 0.4).abs() < TOL);
    }

    #[test]
    fn test_empty() {
        let empty: Vec<Vec<f64>> = vec![];
        let inv = invert_symmetric_positive_definite(&empty).unwrap();
        assert!(inv.is_empty());
    }
}
