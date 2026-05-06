//! chol2inv: (R'R)^{-1} from upper-triangular R (LAPACK dpotri + symmetrize)

use crate::stats::linalg::triangular::{dlauu2, dtrti2};

/// Compute (R'R)^{-1} from upper triangular R, matching R's `chol2inv()`.
///
/// This is equivalent to LAPACK dpotri("U") followed by symmetrizing the result.
/// Input: the p×p upper triangular R factor (row-major `Vec<Vec<f64>>`).
/// Output: full symmetric p×p matrix.
pub fn chol2inv(r_upper: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, &'static str> {
    let p = r_upper.len();
    if p == 0 {
        return Ok(vec![]);
    }

    // Pack into column-major flat array (lda = p)
    let mut a = vec![0.0; p * p];
    for i in 0..p {
        for j in i..p {
            a[j * p + i] = r_upper[i][j];
        }
    }

    // Step 1: dtrti2 — invert the triangular factor
    dtrti2(&mut a, p, p)?;

    // Step 2: dlauu2 — form R^{-1} * (R^{-1})^T (upper triangle)
    dlauu2(&mut a, p, p);

    // Step 3: Unpack and symmetrize
    let mut result = vec![vec![0.0; p]; p];
    for i in 0..p {
        for j in i..p {
            let val = a[j * p + i];
            result[i][j] = val;
            result[j][i] = val;
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_2x2() {
        // R = [[2, 3], [0, 5]]
        // (R'R)^{-1} = [[0.34, -0.06], [-0.06, 0.04]]
        let r = vec![vec![2.0, 3.0], vec![0.0, 5.0]];
        let result = chol2inv(&r).unwrap();
        assert!((result[0][0] - 0.34).abs() < 1e-14);
        assert!((result[0][1] - (-0.06)).abs() < 1e-14);
        assert!((result[1][0] - (-0.06)).abs() < 1e-14);
        assert!((result[1][1] - 0.04).abs() < 1e-14);
    }

    #[test]
    fn test_3x3_identity() {
        let r = vec![
            vec![1.0, 0.0, 0.0],
            vec![0.0, 1.0, 0.0],
            vec![0.0, 0.0, 1.0],
        ];
        let result = chol2inv(&r).unwrap();
        for i in 0..3 {
            for j in 0..3 {
                let expected = if i == j { 1.0 } else { 0.0 };
                assert!((result[i][j] - expected).abs() < 1e-14);
            }
        }
    }
}
