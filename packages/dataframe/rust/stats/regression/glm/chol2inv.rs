//! chol2inv: Inverse of a symmetric positive-definite matrix from its Cholesky factor.
//!
//! Implements the LAPACK dpotri algorithm as three composable functions:
//!   1. `dtrti2` — in-place upper triangular matrix inverse (LAPACK DTRTI2)
//!   2. `dlauu2` — in-place U * U^T product (LAPACK DLAUU2)
//!   3. `chol2inv` — dpotri + symmetrize = full (R'R)^{-1}
//!
//! All functions operate on column-major flat arrays matching LAPACK conventions.
//! For GLM use, the input is the p×p upper-triangular R factor from QR decomposition.

/// In-place inverse of an upper triangular matrix.
///
/// Equivalent to LAPACK DTRTI2("U", "N", n, a, lda, info).
/// On entry, `a` contains the upper triangular matrix in column-major layout
/// with leading dimension `lda`. On exit, the upper triangle of `a` is
/// overwritten with its inverse.
///
/// Returns `Err` if a diagonal element is zero (singular matrix).
pub fn dtrti2(a: &mut [f64], lda: usize, n: usize) -> Result<(), &'static str> {
    // Check for singularity
    for j in 0..n {
        if a[j * lda + j] == 0.0 {
            return Err("singular triangular matrix in dtrti2");
        }
    }

    for j in 0..n {
        // a[j,j] = 1.0 / a[j,j]
        a[j * lda + j] = 1.0 / a[j * lda + j];
        let ajj = -a[j * lda + j];

        // DTRMV: compute a[0:j-1, 0:j-1] * a[0:j-1, j] (upper, no-transpose, non-unit)
        // i.e., multiply the column a[0..j, j] by the upper triangular block a[0..j, 0..j]
        // This is done in-place on the column.
        if j > 0 {
            // Upper triangular matrix-vector multiply: x = U * x
            // where U = a[0..j, 0..j] and x = a[0..j, j]
            // Process from top to bottom for upper triangular
            for i in 0..j {
                let mut temp = 0.0;
                for k in i..j {
                    temp += a[k * lda + i] * a[j * lda + k];
                }
                a[j * lda + i] = temp;
            }

            // DSCAL: a[0:j-1, j] *= ajj
            for i in 0..j {
                a[j * lda + i] *= ajj;
            }
        }
    }

    Ok(())
}

/// In-place computation of U * U^T, storing result in upper triangle.
///
/// Equivalent to LAPACK DLAUU2("U", n, a, lda, info).
/// On entry, `a` contains an upper triangular matrix in column-major layout.
/// On exit, the upper triangle of `a` is overwritten with U * U^T.
pub fn dlauu2(a: &mut [f64], lda: usize, n: usize) {
    for i in 0..n {
        let aii = a[i * lda + i];

        if i + 1 < n {
            // a[i,i] = dot(a[i, i:n-1], a[i, i:n-1])
            // i.e., sum of squares of row i from column i to n-1
            let mut dot = 0.0;
            for k in i..n {
                dot += a[k * lda + i] * a[k * lda + i];
            }
            a[i * lda + i] = dot;

            // DGEMV: a[0:i-1, i] = a[0:i-1, i+1:n-1] * a[i, i+1:n-1]^T + aii * a[0:i-1, i]
            // i.e., for each row r < i:
            //   a[r, i] = sum_{k=i+1}^{n-1} a[r, k] * a[i, k] + aii * a[r, i]
            for r in 0..i {
                let mut sum = 0.0;
                for k in (i + 1)..n {
                    sum += a[k * lda + r] * a[k * lda + i];
                }
                a[i * lda + r] = aii * a[i * lda + r] + sum;
            }
        } else {
            // Last column: just scale by aii
            for r in 0..=i {
                a[i * lda + r] *= aii;
            }
        }
    }
}

/// Compute (R'R)^{-1} from upper triangular R, matching R's `chol2inv()`.
///
/// This is equivalent to LAPACK dpotri("U") followed by symmetrizing the result.
/// Input: the p×p upper triangular R factor (column-major, leading dimension p).
/// Output: full symmetric p×p matrix as `Vec<Vec<f64>>`.
///
/// The algorithm:
///   1. dtrti2: R → R^{-1} (in-place triangular inverse)
///   2. dlauu2: R^{-1} → R^{-1} * (R^{-1})^T (in-place, upper triangle)
///   3. Symmetrize: copy upper triangle to lower triangle
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
    fn test_dtrti2_2x2() {
        // Upper triangular: [[2, 3], [0, 5]]
        // Inverse: [[0.5, -0.3], [0, 0.2]]
        let mut a = vec![2.0, 0.0, 3.0, 5.0]; // column-major
        dtrti2(&mut a, 2, 2).unwrap();
        assert!((a[0] - 0.5).abs() < 1e-15);
        assert!((a[2] - (-0.3)).abs() < 1e-15);
        assert!((a[3] - 0.2).abs() < 1e-15);
    }

    #[test]
    fn test_dlauu2_2x2() {
        // U = [[2, 3], [0, 5]]
        // U * U^T = [[4+9, 15], [15, 25]] = [[13, 15], [15, 25]]
        let mut a = vec![2.0, 0.0, 3.0, 5.0]; // column-major
        dlauu2(&mut a, 2, 2);
        assert!((a[0] - 13.0).abs() < 1e-14); // [0,0]
        assert!((a[2] - 15.0).abs() < 1e-14); // [0,1]
        assert!((a[3] - 25.0).abs() < 1e-14); // [1,1]
    }

    #[test]
    fn test_chol2inv_2x2() {
        // R = [[2, 3], [0, 5]]
        // R'R = [[4, 6], [6, 34]]
        // (R'R)^{-1} = [[34, -6], [-6, 4]] / (4*34 - 36) = [[34, -6], [-6, 4]] / 100
        //            = [[0.34, -0.06], [-0.06, 0.04]]
        let r = vec![vec![2.0, 3.0], vec![0.0, 5.0]];
        let result = chol2inv(&r).unwrap();
        assert!((result[0][0] - 0.34).abs() < 1e-14);
        assert!((result[0][1] - (-0.06)).abs() < 1e-14);
        assert!((result[1][0] - (-0.06)).abs() < 1e-14);
        assert!((result[1][1] - 0.04).abs() < 1e-14);
    }

    #[test]
    fn test_chol2inv_3x3_identity() {
        // R = I => (R'R)^{-1} = I
        let r = vec![
            vec![1.0, 0.0, 0.0],
            vec![0.0, 1.0, 0.0],
            vec![0.0, 0.0, 1.0],
        ];
        let result = chol2inv(&r).unwrap();
        for i in 0..3 {
            for j in 0..3 {
                let expected = if i == j { 1.0 } else { 0.0 };
                assert!(
                    (result[i][j] - expected).abs() < 1e-14,
                    "result[{}][{}] = {}, expected {}",
                    i,
                    j,
                    result[i][j],
                    expected
                );
            }
        }
    }

    #[test]
    fn test_dtrti2_singular() {
        let mut a = vec![1.0, 0.0, 2.0, 0.0]; // diagonal has a zero
        assert!(dtrti2(&mut a, 2, 2).is_err());
    }
}
