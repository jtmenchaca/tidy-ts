//! Quantile functions for statistical analysis
//!
//! This module implements R's quantile algorithm (Type 7 default) for calculating
//! percentiles, quartiles, and median values. Based on stats/R/quantile.R.


/// Quantile type following R's implementation
/// R supports 9 different quantile calculation methods
#[derive(Debug, Clone, Copy)]
pub enum QuantileType {
    Type1 = 1, // Inverse of empirical distribution function
    Type2 = 2, // Similar to Type1 but with averaging at discontinuities
    Type3 = 3, // Nearest-even order statistic (SAS definition)
    Type4 = 4, // Linear interpolation of empirical distribution function
    Type5 = 5, // Piecewise linear function where knots are midpoints
    Type6 = 6, // Linear interpolation of expectations for order statistics
    Type7 = 7, // Linear interpolation of modes (R default, Excel)
    Type8 = 8, // Linear interpolation of approximate medians
    Type9 = 9, // Approximate unbiased estimate
}

impl Default for QuantileType {
    fn default() -> Self {
        QuantileType::Type7 // R default
    }
}

/// Calculate quantiles using R's algorithm
pub fn quantile(data: &[f64], probs: &[f64], qtype: QuantileType) -> Result<Vec<f64>, String> {
    if data.is_empty() {
        return Err("Cannot calculate quantiles of empty data".to_string());
    }

    // Filter out NaN values and sort
    let mut clean_data: Vec<f64> = data.iter().filter(|x| x.is_finite()).copied().collect();
    if clean_data.is_empty() {
        return Err("No finite values in data".to_string());
    }
    clean_data.sort_by(|a, b| a.partial_cmp(b).unwrap());

    // Validate probabilities
    for &p in probs {
        if p < 0.0 || p > 1.0 {
            return Err(format!("Probability {} is not in [0,1]", p));
        }
    }

    let n = clean_data.len() as f64;
    let mut results = Vec::with_capacity(probs.len());

    for &p in probs {
        let quantile = match qtype {
            QuantileType::Type1 => quantile_type1(&clean_data, p, n),
            QuantileType::Type2 => quantile_type2(&clean_data, p, n),
            QuantileType::Type3 => quantile_type3(&clean_data, p, n),
            QuantileType::Type4 => quantile_type4(&clean_data, p, n),
            QuantileType::Type5 => quantile_type5(&clean_data, p, n),
            QuantileType::Type6 => quantile_type6(&clean_data, p, n),
            QuantileType::Type7 => quantile_type7(&clean_data, p, n),
            QuantileType::Type8 => quantile_type8(&clean_data, p, n),
            QuantileType::Type9 => quantile_type9(&clean_data, p, n),
        };
        results.push(quantile);
    }

    Ok(results)
}

/// Median calculation (0.5 quantile, Type 7)
pub fn median(data: &[f64]) -> Result<f64, String> {
    let result = quantile(data, &[0.5], QuantileType::Type7)?;
    Ok(result[0])
}

/// Quartiles calculation (Q1, median, Q3)
pub fn quartiles(data: &[f64]) -> Result<(f64, f64, f64), String> {
    let result = quantile(data, &[0.25, 0.5, 0.75], QuantileType::Type7)?;
    Ok((result[0], result[1], result[2]))
}

/// Interquartile range (Q3 - Q1)
pub fn iqr(data: &[f64]) -> Result<f64, String> {
    let (q1, _, q3) = quartiles(data)?;
    Ok(q3 - q1)
}

// Type 1: Inverse of empirical distribution function
fn quantile_type1(data: &[f64], p: f64, n: f64) -> f64 {
    if p == 0.0 {
        return data[0];
    }
    if p == 1.0 {
        return data[data.len() - 1];
    }
    let h = n * p;
    let h_floor = h.floor() as usize;
    let h_floor = h_floor.max(1).min(data.len() - 1);
    data[h_floor - 1]
}

// Type 2: Similar to Type1 but with averaging at discontinuities
fn quantile_type2(data: &[f64], p: f64, n: f64) -> f64 {
    if p == 0.0 {
        return data[0];
    }
    if p == 1.0 {
        return data[data.len() - 1];
    }
    let h = n * p;
    let h_floor = h.floor() as usize;
    let h_floor = h_floor.max(1).min(data.len() - 1);
    
    if (h - h_floor as f64).abs() < f64::EPSILON {
        // Exact match, average with next value
        if h_floor < data.len() {
            (data[h_floor - 1] + data[h_floor]) / 2.0
        } else {
            data[h_floor - 1]
        }
    } else {
        data[h_floor - 1]
    }
}

// Type 3: Nearest-even order statistic (SAS definition)
fn quantile_type3(data: &[f64], p: f64, n: f64) -> f64 {
    if p == 0.0 {
        return data[0];
    }
    let h = n * p;
    let h_round = h.round() as usize;
    let h_round = h_round.max(1).min(data.len());
    data[h_round - 1]
}

// Type 4: Linear interpolation of empirical distribution function
fn quantile_type4(data: &[f64], p: f64, n: f64) -> f64 {
    let h = n * p;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let h_floor_idx = (h_floor as usize).max(1).min(data.len()) - 1;
    let h_ceil_idx = (h_ceil as usize).max(1).min(data.len()) - 1;
    
    if h_floor_idx == h_ceil_idx {
        data[h_floor_idx]
    } else {
        let gamma = h - h_floor;
        data[h_floor_idx] + gamma * (data[h_ceil_idx] - data[h_floor_idx])
    }
}

// Type 5: Piecewise linear function where knots are midpoints
fn quantile_type5(data: &[f64], p: f64, n: f64) -> f64 {
    let h = n * p + 0.5;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let h_floor_idx = (h_floor as usize).max(1).min(data.len()) - 1;
    let h_ceil_idx = (h_ceil as usize).max(1).min(data.len()) - 1;
    
    if h_floor_idx == h_ceil_idx {
        data[h_floor_idx]
    } else {
        let gamma = h - h_floor;
        data[h_floor_idx] + gamma * (data[h_ceil_idx] - data[h_floor_idx])
    }
}

// Type 6: Linear interpolation of expectations for order statistics
fn quantile_type6(data: &[f64], p: f64, n: f64) -> f64 {
    let h = (n + 1.0) * p;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let h_floor_idx = (h_floor as usize).max(1).min(data.len()) - 1;
    let h_ceil_idx = (h_ceil as usize).max(1).min(data.len()) - 1;
    
    if h_floor_idx == h_ceil_idx {
        data[h_floor_idx]
    } else {
        let gamma = h - h_floor;
        data[h_floor_idx] + gamma * (data[h_ceil_idx] - data[h_floor_idx])
    }
}

// Type 7: Linear interpolation of modes (R default, Excel)
fn quantile_type7(data: &[f64], p: f64, n: f64) -> f64 {
    let h = (n - 1.0) * p + 1.0;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let h_floor_idx = ((h_floor as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    let h_ceil_idx = ((h_ceil as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    
    if h_floor_idx == h_ceil_idx {
        data[h_floor_idx]
    } else {
        let gamma = h - h_floor;
        data[h_floor_idx] + gamma * (data[h_ceil_idx] - data[h_floor_idx])
    }
}

// Type 8: Linear interpolation of approximate medians
fn quantile_type8(data: &[f64], p: f64, n: f64) -> f64 {
    let h = (n + 1.0/3.0) * p + 1.0/3.0;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let h_floor_idx = ((h_floor as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    let h_ceil_idx = ((h_ceil as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    
    if h_floor_idx == h_ceil_idx {
        data[h_floor_idx]
    } else {
        let gamma = h - h_floor;
        data[h_floor_idx] + gamma * (data[h_ceil_idx] - data[h_floor_idx])
    }
}

// Type 9: Approximate unbiased estimate
fn quantile_type9(data: &[f64], p: f64, n: f64) -> f64 {
    let h = (n + 0.25) * p + 0.375;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let h_floor_idx = ((h_floor as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    let h_ceil_idx = ((h_ceil as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    
    if h_floor_idx == h_ceil_idx {
        data[h_floor_idx]
    } else {
        let gamma = h - h_floor;
        data[h_floor_idx] + gamma * (data[h_ceil_idx] - data[h_floor_idx])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_median() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(median(&data).unwrap(), 3.0);

        let data = vec![1.0, 2.0, 3.0, 4.0];
        assert_eq!(median(&data).unwrap(), 2.5);
    }

    #[test]
    fn test_quartiles() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let (q1, q2, q3) = quartiles(&data).unwrap();
        assert_eq!(q2, 3.0); // median
        assert!(q1 < q2 && q2 < q3);
    }

    #[test]
    fn test_quantile_type7() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let result = quantile(&data, &[0.0, 0.25, 0.5, 0.75, 1.0], QuantileType::Type7).unwrap();
        assert_eq!(result[0], 1.0); // min
        assert_eq!(result[2], 3.0); // median
        assert_eq!(result[4], 5.0); // max
    }

    #[test]
    fn test_iqr() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let iqr_val = iqr(&data).unwrap();
        assert!(iqr_val > 0.0);
    }

    #[test]
    fn test_empty_data() {
        let data = vec![];
        assert!(median(&data).is_err());
        assert!(quartiles(&data).is_err());
    }

    #[test]
    fn test_nan_data() {
        let data = vec![1.0, f64::NAN, 3.0, f64::INFINITY, 5.0];
        let result = median(&data).unwrap();
        assert!(result.is_finite());
    }
}