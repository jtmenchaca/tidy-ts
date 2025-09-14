//! Array helper functions for tidy-data
//!
//! This module provides optimized implementations of common array operations
//! like unique, count, sum, etc.

use std::collections::HashSet;
use std::hash::Hash;

/// Get unique values from a slice
pub fn unique<T: Clone + Eq + Hash>(values: &[T]) -> Vec<T> {
    let mut seen = HashSet::with_capacity(values.len());
    let mut result = Vec::with_capacity(values.len());
    
    for value in values {
        if seen.insert(value.clone()) {
            result.push(value.clone());
        }
    }
    
    result
}

/// Count occurrences of a target value
pub fn count<T: PartialEq>(values: &[T], target: &T) -> usize {
    values.iter().filter(|&v| v == target).count()
}

/// Sum an array of numbers, skipping NaN values
pub fn sum_f64(values: &[f64]) -> f64 {
    values.iter()
        .filter(|&&v| v.is_finite())
        .sum()
}

/// Calculate mean of an array, optionally removing NaN values
pub fn mean_f64(values: &[f64], remove_na: bool) -> Option<f64> {
    if values.is_empty() {
        return Some(0.0);
    }
    
    if remove_na {
        let valid: Vec<f64> = values.iter()
            .filter(|&&v| v.is_finite())
            .copied()
            .collect();
        
        if valid.is_empty() {
            Some(0.0)
        } else {
            Some(valid.iter().sum::<f64>() / valid.len() as f64)
        }
    } else {
        // Check if any NaN values exist
        if values.iter().any(|&v| !v.is_finite()) {
            None
        } else {
            Some(values.iter().sum::<f64>() / values.len() as f64)
        }
    }
}

/// Check if a value is NA (NaN, or special NA marker)
pub fn is_na_f64(value: f64) -> bool {
    !value.is_finite()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unique() {
        let values = vec![1, 2, 1, 3, 2, 4];
        assert_eq!(unique(&values), vec![1, 2, 3, 4]);
        
        let strings = vec!["a", "b", "a", "c"];
        assert_eq!(unique(&strings), vec!["a", "b", "c"]);
    }

    #[test]
    fn test_count() {
        let values = vec![1, 2, 1, 3, 1];
        assert_eq!(count(&values, &1), 3);
        assert_eq!(count(&values, &2), 1);
        assert_eq!(count(&values, &4), 0);
    }

    #[test]
    fn test_sum() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(sum_f64(&values), 15.0);
        
        let with_nan = vec![1.0, 2.0, f64::NAN, 4.0, 5.0];
        assert_eq!(sum_f64(&with_nan), 12.0);
    }

    #[test]
    fn test_mean() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(mean_f64(&values, false), Some(3.0));
        
        let with_nan = vec![1.0, 2.0, f64::NAN, 4.0, 5.0];
        assert_eq!(mean_f64(&with_nan, false), None);
        assert_eq!(mean_f64(&with_nan, true), Some(3.0));
    }
}