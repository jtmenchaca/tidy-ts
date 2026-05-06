//! In-place upper triangular matrix inverse (LAPACK DTRTI2)

/// In-place inverse of an upper triangular matrix.
///
/// Equivalent to LAPACK DTRTI2("U", "N", n, a, lda, info).
/// On entry, `a` contains the upper triangular matrix in column-major layout
/// with leading dimension `lda`. On exit, the upper triangle of `a` is
/// overwritten with its inverse.
///
/// Returns `Err` if a diagonal element is zero (singular matrix).
pub fn dtrti2(a: &mut [f64], lda: usize, n: usize) -> Result<(), &'static str> {
    for j in 0..n {
        if a[j * lda + j] == 0.0 {
            return Err("singular triangular matrix in dtrti2");
        }
    }

    for j in 0..n {
        a[j * lda + j] = 1.0 / a[j * lda + j];
        let ajj = -a[j * lda + j];

        if j > 0 {
            for i in 0..j {
                let mut temp = 0.0;
                for k in i..j {
                    temp += a[k * lda + i] * a[j * lda + k];
                }
                a[j * lda + i] = temp;
            }

            for i in 0..j {
                a[j * lda + i] *= ajj;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_2x2() {
        // Upper triangular: [[2, 3], [0, 5]]
        // Inverse: [[0.5, -0.3], [0, 0.2]]
        let mut a = vec![2.0, 0.0, 3.0, 5.0]; // column-major
        dtrti2(&mut a, 2, 2).unwrap();
        assert!((a[0] - 0.5).abs() < 1e-15);
        assert!((a[2] - (-0.3)).abs() < 1e-15);
        assert!((a[3] - 0.2).abs() < 1e-15);
    }

    #[test]
    fn test_singular() {
        let mut a = vec![1.0, 0.0, 2.0, 0.0];
        assert!(dtrti2(&mut a, 2, 2).is_err());
    }
}
