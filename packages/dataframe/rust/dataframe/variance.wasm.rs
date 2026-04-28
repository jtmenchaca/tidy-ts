//! Variance and standard deviation WASM/NAPI exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

use super::sum::{sum_f64, mean_f64};

/// Pairwise sum of squared deviations from mean.
/// Uses the same striped accumulation as sum_f64 for auto-vectorization.
fn sum_sq_dev_f64(values: &[f64], mean: f64) -> f64 {
    const STRIPE: usize = 16;
    const BLOCK: usize = 128;

    fn horizontal_sum(mut v: [f64; STRIPE]) -> f64 {
        let mut width = STRIPE;
        while width > 4 {
            for j in 0..width / 2 {
                v[j] = v[j] + v[width / 2 + j];
            }
            width /= 2;
        }
        (v[0] + v[2]) + (v[1] + v[3])
    }

    fn sum_sq_block(block: &[f64], mean: f64) -> f64 {
        let mut acc = [0.0f64; STRIPE];
        for chunk in block.chunks_exact(STRIPE) {
            for j in 0..STRIPE {
                let d = chunk[j] - mean;
                acc[j] = acc[j] + d * d;
            }
        }
        horizontal_sum(acc)
    }

    fn pairwise(values: &[f64], mean: f64) -> f64 {
        debug_assert!(!values.is_empty() && values.len() % BLOCK == 0);
        if values.len() == BLOCK {
            return sum_sq_block(values, mean);
        }
        let blocks = values.len() / BLOCK;
        let left_len = (blocks / 2) * BLOCK;
        let (left, right) = values.split_at(left_len);
        pairwise(left, mean) + pairwise(right, mean)
    }

    let remainder = values.len() % BLOCK;
    let (rest, main) = values.split_at(remainder);
    let main_sum = if !main.is_empty() {
        pairwise(main, mean)
    } else {
        0.0
    };
    let rest_sum: f64 = rest.iter().map(|&v| { let d = v - mean; d * d }).sum();
    main_sum + rest_sum
}

/// Sample variance (N-1 denominator) for f64 values
pub(crate) fn variance_f64(values: &[f64]) -> f64 {
    let n = values.len();
    if n < 2 {
        return f64::NAN;
    }
    let mean = mean_f64(values);
    sum_sq_dev_f64(values, mean) / (n - 1) as f64
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
        *sum.get_or_insert_with(|| sum_f64(values))
    };
    let get_mean = |sum: &mut Option<f64>, mean: &mut Option<f64>| -> f64 {
        *mean.get_or_insert_with(|| {
            let s = *sum.get_or_insert_with(|| sum_f64(values));
            s / n as f64
        })
    };
    let get_var = |sum: &mut Option<f64>, mean: &mut Option<f64>, var: &mut Option<f64>| -> f64 {
        *var.get_or_insert_with(|| {
            if n < 2 { return f64::NAN; }
            let m = *mean.get_or_insert_with(|| {
                let s = *sum.get_or_insert_with(|| sum_f64(values));
                s / n as f64
            });
            sum_sq_dev_f64(values, m) / (n - 1) as f64
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

/// NAPI export for variance calculation (pairwise SIMD-friendly)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn variance_napi(values: &[f64]) -> f64 {
    let profile = std::env::var("TIDY_PROFILE").is_ok();
    let t0 = if profile { Some(std::time::Instant::now()) } else { None };
    let result = variance_f64(values);
    if let Some(t) = t0 {
        eprintln!("      [rust variance_napi] pairwise n={}: {:.4}ms", values.len(), t.elapsed().as_secs_f64() * 1000.0);
    }
    result
}

/// NAPI export for stdev calculation (pairwise SIMD-friendly)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn stdev_napi(values: &[f64]) -> f64 {
    let profile = std::env::var("TIDY_PROFILE").is_ok();
    let t0 = if profile { Some(std::time::Instant::now()) } else { None };
    let result = variance_f64(values).sqrt();
    if let Some(t) = t0 {
        eprintln!("      [rust stdev_napi] pairwise n={}: {:.4}ms", values.len(), t.elapsed().as_secs_f64() * 1000.0);
    }
    result
}

/// NAPI export for batch stats
#[cfg(feature = "napi-rs")]
#[napi]
pub fn batch_stats_napi(values: &[f64], ops: String) -> Vec<f64> {
    batch_stats_f64(values, &ops)
}
