//! Matrix transpose

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_2x3() {
        let a = vec![vec![1.0, 2.0, 3.0], vec![4.0, 5.0, 6.0]];
        let t = transpose(&a);
        assert_eq!(t.len(), 3);
        assert_eq!(t[0], vec![1.0, 4.0]);
        assert_eq!(t[1], vec![2.0, 5.0]);
        assert_eq!(t[2], vec![3.0, 6.0]);
    }
}
