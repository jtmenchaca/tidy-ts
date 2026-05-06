//! In-place U * U^T product (LAPACK DLAUU2)

/// In-place computation of U * U^T, storing result in upper triangle.
///
/// Equivalent to LAPACK DLAUU2("U", n, a, lda, info).
/// On entry, `a` contains an upper triangular matrix in column-major layout.
/// On exit, the upper triangle of `a` is overwritten with U * U^T.
pub fn dlauu2(a: &mut [f64], lda: usize, n: usize) {
    for i in 0..n {
        let aii = a[i * lda + i];

        if i + 1 < n {
            let mut dot = 0.0;
            for k in i..n {
                dot += a[k * lda + i] * a[k * lda + i];
            }
            a[i * lda + i] = dot;

            for r in 0..i {
                let mut sum = 0.0;
                for k in (i + 1)..n {
                    sum += a[k * lda + r] * a[k * lda + i];
                }
                a[i * lda + r] = aii * a[i * lda + r] + sum;
            }
        } else {
            for r in 0..=i {
                a[i * lda + r] *= aii;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_2x2() {
        // U = [[2, 3], [0, 5]]
        // U * U^T = [[13, 15], [15, 25]]
        let mut a = vec![2.0, 0.0, 3.0, 5.0]; // column-major
        dlauu2(&mut a, 2, 2);
        assert!((a[0] - 13.0).abs() < 1e-14);
        assert!((a[2] - 15.0).abs() < 1e-14);
        assert!((a[3] - 25.0).abs() < 1e-14);
    }
}
