//! Cholesky decomposition suite for survival analysis
//!
//! Port of `cholesky2.c`, `chsolve2.c`, and `chinv2.c` from R's survival
//! package (Terry Therneau).
//!
//! ## Source
//!
//! - `survival-ref/survival-master/src/cholesky2.c` — FDF' decomposition
//! - `survival-ref/survival-master/src/chsolve2.c` — Forward/back solve
//! - `survival-ref/survival-master/src/chinv2.c` — Matrix inversion
//!
//! ## Algorithm
//!
//! Cholesky decomposition: C = FDF' where F is lower triangular with 1's
//! on the diagonal, and D is diagonal.
//!
//! The factorization is stored in-place: F occupies the lower triangle
//! (without the diagonal of 1's), D occupies the diagonal, and the upper
//! triangle is left undisturbed by `cholesky2`. After `chinv2`, the upper
//! triangle + diagonal contain the inverse.
//!
//! ## Important
//!
//! This is NOT a generic Cholesky. It has survival-specific behavior:
//! - Tolerance-based singularity detection (columns below tolerance are zeroed)
//! - Returns rank (positive for NND, negative for not SPD/NND)
//! - Handles NaN/Inf on diagonal (treated as zero)
//! - The tolerance is relative to the largest diagonal element

/// Result of Cholesky decomposition, including rank information.
#[derive(Debug, Clone)]
pub struct CholeskyResult {
    /// The rank of the matrix. Positive if non-negative definite,
    /// negative if the matrix is not SPD or NND (rank * -1).
    pub rank: i32,
}

/// Cholesky decomposition: C = FDF'
///
/// Performs in-place FDF' Cholesky decomposition with tolerance-based
/// singularity detection. This is a direct port of `cholesky2()` from
/// `survival-ref/survival-master/src/cholesky2.c`.
///
/// # Arguments
///
/// * `matrix` - n×n symmetric matrix stored as `Vec<Vec<f64>>`. Only the
///   upper triangle needs to be filled on input. On output, the lower triangle
///   contains F (without the unit diagonal), the diagonal contains D, and
///   the upper triangle is undisturbed.
/// * `n` - Matrix dimension
/// * `toler` - Tolerance for singularity detection. A pivot is considered
///   zero if it's less than `toler * max_diagonal`.
///
/// # Returns
///
/// The rank of the matrix (positive for NND, negative if not SPD/NND).
/// A redundant column has its diagonal set to zero.
pub(crate) fn cholesky2(matrix: &mut [Vec<f64>], n: usize, toler: f64) -> i32 {
    let mut nonneg: i32 = 1;

    // Find max diagonal and copy upper triangle to lower triangle
    let mut eps: f64 = 0.0;
    for i in 0..n {
        if matrix[i][i] > eps {
            eps = matrix[i][i];
        }
        for j in (i + 1)..n {
            matrix[j][i] = matrix[i][j];
        }
    }

    if eps == 0.0 {
        eps = toler; // no positive diagonals!
    } else {
        eps *= toler;
    }

    let mut rank: i32 = 0;
    for i in 0..n {
        let pivot = matrix[i][i];
        if !pivot.is_finite() || pivot < eps {
            matrix[i][i] = 0.0;
            if pivot < -8.0 * eps {
                nonneg = -1;
            }
        } else {
            rank += 1;
            for j in (i + 1)..n {
                let temp = matrix[j][i] / pivot;
                matrix[j][i] = temp;
                matrix[j][j] -= temp * temp * pivot;
                for k in (j + 1)..n {
                    matrix[k][j] -= temp * matrix[k][i];
                }
            }
        }
    }

    rank * nonneg
}

/// Solve Ab = y given the FDF' Cholesky decomposition of A.
///
/// Direct port of `chsolve2()` from `survival-ref/survival-master/src/chsolve2.c`.
///
/// # Arguments
///
/// * `matrix` - The FDF' Cholesky decomposition (output of `cholesky2`)
/// * `n` - Matrix dimension
/// * `y` - Right-hand side vector (length n). Overwritten with the solution b.
pub(crate) fn chsolve2(matrix: &[Vec<f64>], n: usize, y: &mut [f64]) {
    // Forward solve: Fb = y
    for i in 0..n {
        let mut temp = y[i];
        for j in 0..i {
            temp -= y[j] * matrix[i][j];
        }
        y[i] = temp;
    }

    // Backward solve: DF'z = b
    for i in (0..n).rev() {
        if matrix[i][i] == 0.0 {
            y[i] = 0.0;
        } else {
            let mut temp = y[i] / matrix[i][i];
            for j in (i + 1)..n {
                temp -= y[j] * matrix[j][i];
            }
            y[i] = temp;
        }
    }
}

/// Matrix inversion given the FDF' Cholesky decomposition.
///
/// Direct port of `chinv2()` from `survival-ref/survival-master/src/chinv2.c`.
///
/// # Arguments
///
/// * `matrix` - The FDF' Cholesky decomposition (output of `cholesky2`).
///   On output, the upper triangle + diagonal contain (FDF')^{-1},
///   and below the diagonal contains F inverse.
/// * `n` - Matrix dimension
pub(crate) fn chinv2(matrix: &mut [Vec<f64>], n: usize) {
    // Invert the Cholesky in the lower triangle
    // Take full advantage of the Cholesky's diagonal of 1's
    for i in 0..n {
        if matrix[i][i] > 0.0 {
            matrix[i][i] = 1.0 / matrix[i][i]; // invert D
            for j in (i + 1)..n {
                matrix[j][i] = -matrix[j][i];
                for k in 0..i {
                    // sweep operator
                    matrix[j][k] += matrix[j][i] * matrix[i][k];
                }
            }
        }
    }

    // Lower triangle now contains inverse of Cholesky.
    // Calculate F'DF (inverse of Cholesky decomp process) to get
    // inverse of original matrix.
    for i in 0..n {
        if matrix[i][i] == 0.0 {
            // singular row
            for j in 0..i {
                matrix[j][i] = 0.0;
            }
            for j in i..n {
                matrix[i][j] = 0.0;
            }
        } else {
            for j in (i + 1)..n {
                let temp = matrix[j][i] * matrix[j][j];
                if j != i {
                    matrix[i][j] = temp;
                }
                for k in i..j {
                    matrix[i][k] += temp * matrix[j][k];
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper to create a symmetric matrix from upper triangle values
    fn symmetric_matrix(vals: &[&[f64]]) -> Vec<Vec<f64>> {
        let n = vals.len();
        let mut m = vec![vec![0.0; n]; n];
        for i in 0..n {
            for j in i..n {
                m[i][j] = vals[i][j];
                m[j][i] = vals[i][j];
            }
        }
        m
    }

    #[test]
    fn test_cholesky2_identity() {
        let mut m = symmetric_matrix(&[&[1.0, 0.0], &[0.0, 1.0]]);
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 2);
        // D should be [1.0, 1.0], F should be identity (lower = 0)
        assert_eq!(m[0][0], 1.0);
        assert_eq!(m[1][1], 1.0);
        assert_eq!(m[1][0], 0.0);
    }

    #[test]
    fn test_cholesky2_simple_2x2() {
        // A = [[4, 2], [2, 3]]
        // FDF': D = [4, 2], F[1][0] = 0.5
        // Check: F*D*F' = [[4, 2],[2, 0.5*0.5*4+2]] = [[4,2],[2,3]] ✓
        let mut m = symmetric_matrix(&[&[4.0, 2.0], &[2.0, 3.0]]);
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 2);
        assert_eq!(m[0][0], 4.0); // D[0]
        assert!((m[1][0] - 0.5).abs() < 1e-15); // F[1][0]
        assert!((m[1][1] - 2.0).abs() < 1e-15); // D[1] = 3 - 0.5*0.5*4 = 2
    }

    #[test]
    fn test_cholesky2_singular() {
        // Singular matrix: [[1, 1], [1, 1]]
        let mut m = symmetric_matrix(&[&[1.0, 1.0], &[1.0, 1.0]]);
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 1);
        assert_eq!(m[1][1], 0.0); // singular column zeroed
    }

    #[test]
    fn test_cholesky2_negative_definite() {
        // Not NND: [[1, 2], [2, 1]] has eigenvalues 3 and -1
        let mut m = symmetric_matrix(&[&[1.0, 2.0], &[2.0, 1.0]]);
        let rank = cholesky2(&mut m, 2, 1e-12);
        // rank should be negative (not SPD/NND)
        assert!(rank < 0);
    }

    #[test]
    fn test_chsolve2_identity() {
        // Solve Ix = [3, 5] → x = [3, 5]
        let m = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let mut y = vec![3.0, 5.0];
        chsolve2(&m, 2, &mut y);
        assert!((y[0] - 3.0).abs() < 1e-15);
        assert!((y[1] - 5.0).abs() < 1e-15);
    }

    #[test]
    fn test_chsolve2_simple() {
        // A = [[4, 2], [2, 3]], solve Ax = [8, 7]
        // x = [1, 1] (verify: 4*1+2*1=6? no, 8. Let me pick correctly)
        // Ax = [4*1+2*1, 2*1+3*1] = [6, 5]. So for b=[6,5], x=[1,1]
        let mut m = symmetric_matrix(&[&[4.0, 2.0], &[2.0, 3.0]]);
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 2);

        let mut y = vec![6.0, 5.0];
        chsolve2(&m, 2, &mut y);
        assert!((y[0] - 1.0).abs() < 1e-12);
        assert!((y[1] - 1.0).abs() < 1e-12);
    }

    #[test]
    fn test_chinv2_simple() {
        // A = [[4, 2], [2, 3]], A^{-1} = [[3/8, -1/4], [-1/4, 1/2]]
        let mut m = symmetric_matrix(&[&[4.0, 2.0], &[2.0, 3.0]]);
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 2);

        chinv2(&mut m, 2);

        // Upper triangle + diagonal should contain inverse
        assert!((m[0][0] - 3.0 / 8.0).abs() < 1e-12);
        assert!((m[0][1] - (-1.0 / 4.0)).abs() < 1e-12);
        assert!((m[1][1] - 1.0 / 2.0).abs() < 1e-12);
    }

    #[test]
    fn test_cholesky2_3x3() {
        // A = [[9, 3, 3], [3, 5, 1], [3, 1, 5]]
        // This is positive definite.
        let mut m = symmetric_matrix(&[&[9.0, 3.0, 3.0], &[3.0, 5.0, 1.0], &[3.0, 1.0, 5.0]]);
        let rank = cholesky2(&mut m, 3, 1e-12);
        assert_eq!(rank, 3);

        // Verify solve: A * [1, 1, 1] = [15, 9, 9]
        let mut y = vec![15.0, 9.0, 9.0];
        chsolve2(&m, 3, &mut y);
        assert!((y[0] - 1.0).abs() < 1e-10);
        assert!((y[1] - 1.0).abs() < 1e-10);
        assert!((y[2] - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_chinv2_3x3() {
        // A = [[9, 3, 3], [3, 5, 1], [3, 1, 5]]
        let a_orig = vec![
            vec![9.0, 3.0, 3.0],
            vec![3.0, 5.0, 1.0],
            vec![3.0, 1.0, 5.0],
        ];
        let mut m = a_orig.clone();
        let rank = cholesky2(&mut m, 3, 1e-12);
        assert_eq!(rank, 3);
        chinv2(&mut m, 3);

        // Verify A * A^{-1} ≈ I (using upper triangle of m as A^{-1})
        // Extract inverse (upper triangle + diagonal)
        let inv = vec![
            vec![m[0][0], m[0][1], m[0][2]],
            vec![m[0][1], m[1][1], m[1][2]],
            vec![m[0][2], m[1][2], m[2][2]],
        ];

        for i in 0..3 {
            for j in 0..3 {
                let mut sum = 0.0;
                for k in 0..3 {
                    sum += a_orig[i][k] * inv[k][j];
                }
                let expected = if i == j { 1.0 } else { 0.0 };
                assert!(
                    (sum - expected).abs() < 1e-10,
                    "A*A^{{-1}}[{i}][{j}] = {sum}, expected {expected}"
                );
            }
        }
    }

    #[test]
    fn test_cholesky2_nan_diagonal() {
        // NaN on diagonal should be treated as zero (singular)
        let mut m = vec![vec![f64::NAN, 0.0], vec![0.0, 1.0]];
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 1);
        assert_eq!(m[0][0], 0.0); // NaN diagonal zeroed
    }

    #[test]
    fn test_cholesky2_inf_diagonal() {
        // Inf on diagonal: eps = max(diag) = Inf, so eps*toler = Inf,
        // making ALL pivots appear singular. Rank = 0.
        let mut m = vec![vec![f64::INFINITY, 0.0], vec![0.0, 1.0]];
        let rank = cholesky2(&mut m, 2, 1e-12);
        assert_eq!(rank, 0);
        assert_eq!(m[0][0], 0.0); // Inf diagonal zeroed
        assert_eq!(m[1][1], 0.0); // 1.0 < Inf*toler = Inf, also zeroed
    }

    #[test]
    fn test_chsolve2_singular_column() {
        // If a diagonal is 0 after decomposition, that component should be 0
        let m = symmetric_matrix(&[&[1.0, 0.0], &[0.0, 0.0]]);
        // Manually set as if cholesky2 ran on a singular matrix
        // D = [1.0, 0.0], F = identity
        let mut y = vec![5.0, 3.0];
        chsolve2(&m, 2, &mut y);
        assert!((y[0] - 5.0).abs() < 1e-15);
        assert_eq!(y[1], 0.0); // singular dimension gives 0
    }
}
