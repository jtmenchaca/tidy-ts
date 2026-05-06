//! Cholesky decomposition: A = L L^T

/// Cholesky decomposition of a symmetric positive-definite matrix.
///
/// Returns the lower-triangular factor L, or None if A is not positive definite.
pub fn cholesky_decompose(a: &[Vec<f64>]) -> Option<Vec<Vec<f64>>> {
    let n = a.len();
    let mut l = vec![vec![0.0; n]; n];

    for i in 0..n {
        for j in 0..=i {
            let mut sum = a[i][j];

            for k in 0..j {
                sum -= l[i][k] * l[j][k];
            }

            if i == j {
                if sum <= 0.0 {
                    return None;
                }
                l[i][j] = sum.sqrt();
            } else {
                l[i][j] = sum / l[j][j];
            }
        }
    }

    Some(l)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_2x2() {
        let a = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let l = cholesky_decompose(&a).unwrap();
        for i in 0..2 {
            for j in 0..2 {
                let mut sum = 0.0;
                for k in 0..2 {
                    sum += l[i][k] * l[j][k];
                }
                assert!((sum - a[i][j]).abs() < 1e-14);
            }
        }
    }

    #[test]
    fn test_not_positive_definite() {
        let a = vec![vec![1.0, 2.0], vec![2.0, 1.0]];
        assert!(cholesky_decompose(&a).is_none());
    }
}
