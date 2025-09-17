//! IQR calculation WASM exports

#![allow(dead_code)]

use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Calculate quantiles using R's algorithm
#[allow(dead_code)]
fn quantile(data: &[f64], probs: &[f64], qtype: QuantileType) -> Result<Vec<f64>, String> {
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

/// Quartiles calculation (Q1, median, Q3)
fn quartiles(data: &[f64]) -> Result<(f64, f64, f64), String> {
    let result = quantile(data, &[0.25, 0.5, 0.75], QuantileType::Type7)?;
    Ok((result[0], result[1], result[2]))
}

/// Interquartile range (Q3 - Q1)
fn iqr(data: &[f64]) -> Result<f64, String> {
    let (q1, _, q3) = quartiles(data)?;
    Ok(q3 - q1)
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

/// WASM export for interquartile range
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn iqr_wasm(data: &[f64]) -> Result<f64, JsValue> {
    iqr(data).map_err(|e| JsValue::from_str(e.as_str()))
}