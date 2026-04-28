//! Sum calculation WASM/NAPI exports
//!
//! Uses pairwise summation with 16-lane striped accumulation
//! (same algorithm as Polars) for better numerical accuracy
//! and auto-vectorization on stable Rust.

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

const STRIPE: usize = 16;
const BLOCK: usize = 128; // must be a multiple of STRIPE

/// Horizontal reduction of a 16-lane accumulator.
/// Folds in half repeatedly, then adds the final 4 elements
/// in a shuffle-friendly pattern (matches Polars approach).
#[inline(always)]
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

/// Sum a single 128-element block using 16-lane striped accumulation.
/// This pattern auto-vectorizes well with opt-level=3.
#[inline(always)]
fn sum_block(block: &[f64]) -> f64 {
    debug_assert!(block.len() == BLOCK);
    let mut acc = [0.0f64; STRIPE];
    for chunk in block.chunks_exact(STRIPE) {
        for j in 0..STRIPE {
            acc[j] = acc[j] + chunk[j];
        }
    }
    horizontal_sum(acc)
}

/// Pairwise recursive summation over aligned blocks.
/// Recursively splits in half for O(log n) error growth.
fn pairwise_sum(values: &[f64]) -> f64 {
    debug_assert!(!values.is_empty() && values.len() % BLOCK == 0);

    if values.len() == BLOCK {
        return sum_block(values);
    }

    let blocks = values.len() / BLOCK;
    let left_len = (blocks / 2) * BLOCK;
    let (left, right) = values.split_at(left_len);
    pairwise_sum(left) + pairwise_sum(right)
}

/// High-performance sum using pairwise summation with striped accumulation.
/// Matches the Polars float_sum algorithm for auto-vectorization.
pub(crate) fn sum_f64(values: &[f64]) -> f64 {
    let remainder = values.len() % BLOCK;
    let (rest, main) = values.split_at(remainder);
    let main_sum = if !main.is_empty() {
        pairwise_sum(main)
    } else {
        0.0
    };
    let rest_sum: f64 = rest.iter().sum();
    main_sum + rest_sum
}

/// Mean calculation for f64 values
pub(crate) fn mean_f64(values: &[f64]) -> f64 {
    sum_f64(values) / values.len() as f64
}

/// WASM export for sum calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn sum_wasm(values: &[f64]) -> f64 {
    sum_f64(values)
}

/// WASM export for mean calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn mean_wasm(values: &[f64]) -> f64 {
    mean_f64(values)
}

/// NAPI export for sum calculation (pairwise SIMD-friendly)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn sum_napi(values: &[f64]) -> f64 {
    let profile = std::env::var("TIDY_PROFILE").is_ok();
    let t0 = if profile { Some(std::time::Instant::now()) } else { None };
    let result = sum_f64(values);
    if let Some(t) = t0 {
        eprintln!("      [rust sum_napi] pairwise_sum n={}: {:.4}ms", values.len(), t.elapsed().as_secs_f64() * 1000.0);
    }
    result
}

/// NAPI export for mean calculation (pairwise SIMD-friendly)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mean_napi(values: &[f64]) -> f64 {
    let profile = std::env::var("TIDY_PROFILE").is_ok();
    let t0 = if profile { Some(std::time::Instant::now()) } else { None };
    let result = mean_f64(values);
    if let Some(t) = t0 {
        eprintln!("      [rust mean_napi] pairwise_sum n={}: {:.4}ms", values.len(), t.elapsed().as_secs_f64() * 1000.0);
    }
    result
}
