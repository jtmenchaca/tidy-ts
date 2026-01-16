//! Minimal linear algebra helpers shared across GEE

pub fn matmul(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let m = a.len();
    let k = if m > 0 { a[0].len() } else { 0 };
    let n = if !b.is_empty() { b[0].len() } else { 0 };
    let mut c = vec![vec![0.0; n]; m];
    for i in 0..m {
        for t in 0..k {
            let ait = a[i][t];
            for j in 0..n {
                c[i][j] += ait * b[t][j];
            }
        }
    }
    c
}

pub fn transpose(a: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let m = a.len();
    let n = if m > 0 { a[0].len() } else { 0 };
    let mut t = vec![vec![0.0; m]; n];
    for i in 0..m {
        for j in 0..n {
            t[j][i] = a[i][j];
        }
    }
    t
}

// Simple symmetric matrix inversion via Gauss-Jordan (for small p)
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
