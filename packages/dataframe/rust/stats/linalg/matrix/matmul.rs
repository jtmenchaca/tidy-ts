//! Matrix multiplication

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_2x2() {
        let a = vec![vec![1.0, 2.0], vec![3.0, 4.0]];
        let b = vec![vec![5.0, 6.0], vec![7.0, 8.0]];
        let c = matmul(&a, &b);
        assert!((c[0][0] - 19.0).abs() < 1e-14);
        assert!((c[0][1] - 22.0).abs() < 1e-14);
        assert!((c[1][0] - 43.0).abs() < 1e-14);
        assert!((c[1][1] - 50.0).abs() < 1e-14);
    }
}
