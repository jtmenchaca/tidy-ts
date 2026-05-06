//! Symmetric matrix inversion via Gauss-Jordan (for small matrices)

/// Simple symmetric matrix inversion via Gauss-Jordan.
///
/// For positive-definite matrices, prefer `invert_symmetric_positive_definite`
/// from the `solve` module which uses Cholesky decomposition.
pub fn invert_symmetric(mut a: Vec<Vec<f64>>) -> Result<Vec<Vec<f64>>, String> {
    let n = a.len();
    if n == 0 {
        return Ok(a);
    }
    for row in &a {
        if row.len() != n {
            return Err("matrix must be square".to_string());
        }
    }
    let mut inv = vec![vec![0.0; n]; n];
    for i in 0..n {
        inv[i][i] = 1.0;
    }

    for i in 0..n {
        let mut pivot = a[i][i];
        if pivot.abs() < 1e-12 {
            let mut swap_row = None;
            for r in i + 1..n {
                if a[r][i].abs() > 1e-12 {
                    swap_row = Some(r);
                    break;
                }
            }
            if let Some(r) = swap_row {
                a.swap(i, r);
                inv.swap(i, r);
                pivot = a[i][i];
            } else {
                return Err("singular matrix".to_string());
            }
        }
        let piv_inv = 1.0 / pivot;
        for j in 0..n {
            a[i][j] *= piv_inv;
            inv[i][j] *= piv_inv;
        }
        for r in 0..n {
            if r == i {
                continue;
            }
            let factor = a[r][i];
            if factor != 0.0 {
                for j in 0..n {
                    a[r][j] -= factor * a[i][j];
                    inv[r][j] -= factor * inv[i][j];
                }
            }
        }
    }
    Ok(inv)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::linalg::matrix::matmul::matmul;

    const TOL: f64 = 1e-6;

    #[test]
    fn test_2x2() {
        let a = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let inv = invert_symmetric(a.clone()).unwrap();
        let c = matmul(&a, &inv);
        assert!((c[0][0] - 1.0).abs() < TOL);
        assert!((c[0][1] - 0.0).abs() < TOL);
        assert!((c[1][0] - 0.0).abs() < TOL);
        assert!((c[1][1] - 1.0).abs() < TOL);
    }
}
