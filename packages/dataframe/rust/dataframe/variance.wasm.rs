//! Variance and standard deviation WASM/NAPI exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

/// Sample variance (N-1 denominator) for f64 values
pub(crate) fn variance_f64(values: &[f64]) -> f64 {
    let n = values.len();
    if n < 2 {
        return f64::NAN;
    }
    let mean = values.iter().sum::<f64>() / n as f64;
    let sum_sq: f64 = values.iter().map(|&v| {
        let d = v - mean;
        d * d
    }).sum();
    sum_sq / (n - 1) as f64
}

/// Sample standard deviation for f64 values
pub(crate) fn stdev_f64(values: &[f64]) -> f64 {
    variance_f64(values).sqrt()
}

/// Batch stats: compute multiple statistics on a single column in one call.
/// ops is a comma-separated string: "sum,mean,variance,stdev,median,min,max"
/// Returns results in the same order as ops.
pub(crate) fn batch_stats_f64(values: &[f64], ops: &str) -> Vec<f64> {
    let n = values.len();
    let mut results = Vec::new();

    // Pre-compute common values lazily
    let mut sum: Option<f64> = None;
    let mut mean: Option<f64> = None;
    let mut var: Option<f64> = None;

    let get_sum = |sum: &mut Option<f64>| -> f64 {
        *sum.get_or_insert_with(|| values.iter().sum::<f64>())
    };
    let get_mean = |sum: &mut Option<f64>, mean: &mut Option<f64>| -> f64 {
        *mean.get_or_insert_with(|| {
            let s = *sum.get_or_insert_with(|| values.iter().sum::<f64>());
            s / n as f64
        })
    };
    let get_var = |sum: &mut Option<f64>, mean: &mut Option<f64>, var: &mut Option<f64>| -> f64 {
        *var.get_or_insert_with(|| {
            if n < 2 { return f64::NAN; }
            let m = *mean.get_or_insert_with(|| {
                let s = *sum.get_or_insert_with(|| values.iter().sum::<f64>());
                s / n as f64
            });
            let sum_sq: f64 = values.iter().map(|&v| { let d = v - m; d * d }).sum();
            sum_sq / (n - 1) as f64
        })
    };

    for op in ops.split(',') {
        let result = match op.trim() {
            "sum" => get_sum(&mut sum),
            "mean" => get_mean(&mut sum, &mut mean),
            "variance" => get_var(&mut sum, &mut mean, &mut var),
            "stdev" => get_var(&mut sum, &mut mean, &mut var).sqrt(),
            "min" => values.iter().copied().fold(f64::INFINITY, f64::min),
            "max" => values.iter().copied().fold(f64::NEG_INFINITY, f64::max),
            "count" => n as f64,
            _ => f64::NAN,
        };
        results.push(result);
    }

    results
}

/// WASM export for variance calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn variance_wasm(values: &[f64]) -> f64 {
    variance_f64(values)
}

/// WASM export for stdev calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn stdev_wasm(values: &[f64]) -> f64 {
    stdev_f64(values)
}

/// WASM export for batch stats
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_stats_wasm(values: &[f64], ops: &str) -> Vec<f64> {
    batch_stats_f64(values, ops)
}

/// NAPI export for variance calculation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn variance_napi(values: &[f64]) -> f64 {
    variance_f64(values)
}

/// NAPI export for stdev calculation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn stdev_napi(values: &[f64]) -> f64 {
    stdev_f64(values)
}

/// NAPI export for batch stats
#[cfg(feature = "napi-rs")]
#[napi]
pub fn batch_stats_napi(values: &[f64], ops: String) -> Vec<f64> {
    batch_stats_f64(values, &ops)
}
