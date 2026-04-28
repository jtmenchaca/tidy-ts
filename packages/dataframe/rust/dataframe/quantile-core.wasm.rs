//! Shared quantile calculation engine
//! Used by quantile_wasm, median_wasm, and iqr_wasm

use super::shared_types::QuantileType;

// ---------------------------------------------------------------------------
// Single-quantile fast path: O(n) quickselect instead of O(n log n) sort
// ---------------------------------------------------------------------------

/// Type 7 quickselect for a single probability — O(n) instead of O(n log n).
/// Data must be mutable (will be partially reordered).
/// Assumes data contains no NaN/Inf (caller must filter first).
pub(crate) fn quantile_type7_select(data: &mut [f64], p: f64) -> f64 {
    let n = data.len() as f64;
    let h = (n - 1.0) * p + 1.0;
    let h_floor = h.floor();
    let h_ceil = h.ceil();
    let lo = ((h_floor as usize).max(1).min(data.len()) - 1).min(data.len() - 1);
    let hi = ((h_ceil as usize).max(1).min(data.len()) - 1).min(data.len() - 1);

    if lo == hi {
        data.select_nth_unstable_by(lo, |a, b| a.partial_cmp(b).unwrap());
        data[lo]
    } else {
        data.select_nth_unstable_by(lo, |a, b| a.partial_cmp(b).unwrap());
        let lo_val = data[lo];
        let hi_val = data[lo + 1..].iter().copied().fold(f64::INFINITY, f64::min);
        let gamma = h - h_floor;
        lo_val + gamma * (hi_val - lo_val)
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Calculate quantiles using R's algorithm.
/// Fast path: skips NaN filtering when all values are finite (common for
/// Float64Array data from the ColumnarStore proxy cache).
pub(crate) fn quantile(data: &[f64], probs: &[f64], qtype: QuantileType) -> Result<Vec<f64>, String> {
    if data.is_empty() {
        return Err("Cannot calculate quantiles of empty data".to_string());
    }

    // Validate probabilities
    for &p in probs {
        if p < 0.0 || p > 1.0 {
            return Err(format!("Probability {} is not in [0,1]", p));
        }
    }

    // Check if data is already clean (no NaN/Inf) — common fast path
    let all_finite = data.iter().all(|x| x.is_finite());

    if all_finite {
        // Single prob + Type7: use O(n) quickselect
        if probs.len() == 1 && matches!(qtype, QuantileType::Type7) {
            let mut buf = data.to_vec();
            return Ok(vec![quantile_type7_select(&mut buf, probs[0])]);
        }

        // Multiple probs or non-Type7: sort once (no filter copy needed)
        let mut sorted = data.to_vec();
        sorted.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap());
        let n = sorted.len() as f64;
        let mut results = Vec::with_capacity(probs.len());
        for &p in probs {
            results.push(dispatch_quantile(&sorted, p, n, &qtype));
        }
        return Ok(results);
    }

    // Slow path: filter NaN/Inf, then sort
    let mut clean_data: Vec<f64> = data.iter().filter(|x| x.is_finite()).copied().collect();
    if clean_data.is_empty() {
        return Err("No finite values in data".to_string());
    }

    // Single prob + Type7: quickselect on clean data
    if probs.len() == 1 && matches!(qtype, QuantileType::Type7) {
        return Ok(vec![quantile_type7_select(&mut clean_data, probs[0])]);
    }

    clean_data.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap());

    let n = clean_data.len() as f64;
    let mut results = Vec::with_capacity(probs.len());
    for &p in probs {
        results.push(dispatch_quantile(&clean_data, p, n, &qtype));
    }
    Ok(results)
}

/// Dispatch to the appropriate quantile type on already-sorted data
#[inline]
fn dispatch_quantile(sorted: &[f64], p: f64, n: f64, qtype: &QuantileType) -> f64 {
    match qtype {
        QuantileType::Type1 => quantile_type1(sorted, p, n),
        QuantileType::Type2 => quantile_type2(sorted, p, n),
        QuantileType::Type3 => quantile_type3(sorted, p, n),
        QuantileType::Type4 => quantile_type4(sorted, p, n),
        QuantileType::Type5 => quantile_type5(sorted, p, n),
        QuantileType::Type6 => quantile_type6(sorted, p, n),
        QuantileType::Type7 => quantile_type7(sorted, p, n),
        QuantileType::Type8 => quantile_type8(sorted, p, n),
        QuantileType::Type9 => quantile_type9(sorted, p, n),
    }
}

// Type 7: Linear interpolation of modes (R default, Excel)
pub(crate) fn quantile_type7(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type1(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type2(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type3(data: &[f64], p: f64, n: f64) -> f64 {
    if p == 0.0 {
        return data[0];
    }
    let h = n * p;
    let h_round = h.round() as usize;
    let h_round = h_round.max(1).min(data.len());
    data[h_round - 1]
}

// Type 4: Linear interpolation of empirical distribution function
pub(crate) fn quantile_type4(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type5(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type6(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type8(data: &[f64], p: f64, n: f64) -> f64 {
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
pub(crate) fn quantile_type9(data: &[f64], p: f64, n: f64) -> f64 {
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
