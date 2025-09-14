//! Distance computation functions
//!
//! Rust implementations of distance metrics from R's stats package

use std::f64;

/// Euclidean distance between two vectors
/// Returns NaN if no valid pairs exist
pub fn euclidean_distance(x1: &[f64], x2: &[f64]) -> f64 {
    if x1.len() != x2.len() {
        return f64::NAN;
    }
    
    let mut count = 0;
    let mut dist = 0.0;
    
    for (a, b) in x1.iter().zip(x2.iter()) {
        if !a.is_nan() && !b.is_nan() {
            let dev = a - b;
            if !dev.is_nan() {
                dist += dev * dev;
                count += 1;
            }
        }
    }
    
    if count == 0 {
        return f64::NAN;
    }
    
    // Adjust for missing values as R does
    if count != x1.len() {
        dist /= count as f64 / x1.len() as f64;
    }
    
    dist.sqrt()
}

/// Manhattan (L1) distance between two vectors
pub fn manhattan_distance(x1: &[f64], x2: &[f64]) -> f64 {
    if x1.len() != x2.len() {
        return f64::NAN;
    }
    
    let mut count = 0;
    let mut dist = 0.0;
    
    for (a, b) in x1.iter().zip(x2.iter()) {
        if !a.is_nan() && !b.is_nan() {
            let dev = (a - b).abs();
            if !dev.is_nan() {
                dist += dev;
                count += 1;
            }
        }
    }
    
    if count == 0 {
        return f64::NAN;
    }
    
    if count != x1.len() {
        dist /= count as f64 / x1.len() as f64;
    }
    
    dist
}

/// Maximum (Chebyshev/L-infinity) distance between two vectors  
pub fn maximum_distance(x1: &[f64], x2: &[f64]) -> f64 {
    if x1.len() != x2.len() {
        return f64::NAN;
    }
    
    let mut count = 0;
    let mut dist = f64::NEG_INFINITY;
    
    for (a, b) in x1.iter().zip(x2.iter()) {
        if !a.is_nan() && !b.is_nan() {
            let dev = (a - b).abs();
            if !dev.is_nan() {
                if dev > dist {
                    dist = dev;
                }
                count += 1;
            }
        }
    }
    
    if count == 0 {
        f64::NAN
    } else {
        dist
    }
}

/// Minkowski distance with parameter p
pub fn minkowski_distance(x1: &[f64], x2: &[f64], p: f64) -> f64 {
    if x1.len() != x2.len() || !p.is_finite() || p <= 0.0 {
        return f64::NAN;
    }
    
    let mut count = 0;
    let mut dist = 0.0;
    
    for (a, b) in x1.iter().zip(x2.iter()) {
        if !a.is_nan() && !b.is_nan() {
            let dev = (a - b).abs();
            if !dev.is_nan() {
                dist += dev.powf(p);
                count += 1;
            }
        }
    }
    
    if count == 0 {
        return f64::NAN;
    }
    
    if count != x1.len() {
        dist /= count as f64 / x1.len() as f64;
    }
    
    dist.powf(1.0 / p)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_euclidean_distance() {
        let x1 = vec![1.0, 2.0, 3.0];
        let x2 = vec![4.0, 5.0, 6.0];
        let result = euclidean_distance(&x1, &x2);
        // sqrt((4-1)^2 + (5-2)^2 + (6-3)^2) = sqrt(9+9+9) = sqrt(27) H 5.196
        assert!((result - 5.196152422706632).abs() < 1e-10);
    }
    
    #[test] 
    fn test_manhattan_distance() {
        let x1 = vec![1.0, 2.0, 3.0];
        let x2 = vec![4.0, 5.0, 6.0];
        let result = manhattan_distance(&x1, &x2);
        // |4-1| + |5-2| + |6-3| = 3 + 3 + 3 = 9
        assert_eq!(result, 9.0);
    }
    
    #[test]
    fn test_with_nan() {
        let x1 = vec![1.0, f64::NAN, 3.0];
        let x2 = vec![4.0, 5.0, 6.0];
        let result = euclidean_distance(&x1, &x2);
        // Should only use non-NaN pairs: (1,4) and (3,6)
        // sqrt((4-1)^2 + (6-3)^2) = sqrt(9+9) = sqrt(18) but adjusted for 2/3 coverage
        assert!(!result.is_nan());
    }
}