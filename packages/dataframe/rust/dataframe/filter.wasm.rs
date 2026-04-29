//! Filtering operations WASM exports

#![deny(unsafe_op_in_unsafe_fn)]

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;
#[cfg(feature = "napi-rs")]
use napi::bindgen_prelude::Uint8Array;
#[cfg(feature = "napi-rs")]
use rayon::prelude::*;

/// Comparison operations for numbers and integers.
#[derive(Debug, Copy, Clone)]
pub enum ComparisonOp {
    Greater,
    GreaterEqual,
    Less,
    LessEqual,
    Equal,
    NotEqual,
}

/// String operations.
#[derive(Debug, Copy, Clone)]
pub enum StringOp {
    Equal,
    NotEqual,
    Contains,
    StartsWith,
    EndsWith,
}

#[inline]
fn f64_eq(a: f64, b: f64) -> bool {
    // Keep this conservative & predictable; NaN never equals.
    if !a.is_finite() || !b.is_finite() {
        return false;
    }
    (a - b).abs() <= f64::EPSILON
}

#[inline]
fn f64_ne(a: f64, b: f64) -> bool {
    // Complement of f64_eq for finite values; NaN -> false (consistent with TS fast path).
    if !a.is_finite() || !b.is_finite() {
        return false;
    }
    (a - b).abs() > f64::EPSILON
}

/// Batch compare numbers against a threshold.
/// Output mask: 1 for match, 0 otherwise. NaN compares as false in all cases.
pub fn batch_compare_numbers(
    values: &[f64],
    threshold: f64,
    op: ComparisonOp,
    output: &mut [u8],
) -> Result<(), String> {
    if values.len() != output.len() {
        return Err(format!(
            "Size mismatch: {} vs {}",
            values.len(),
            output.len()
        ));
    }

    match op {
        ComparisonOp::Greater => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v.is_finite() && threshold.is_finite() && v > threshold {
                    1
                } else {
                    0
                };
            }
        }
        ComparisonOp::GreaterEqual => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v.is_finite() && threshold.is_finite() && v >= threshold {
                    1
                } else {
                    0
                };
            }
        }
        ComparisonOp::Less => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v.is_finite() && threshold.is_finite() && v < threshold {
                    1
                } else {
                    0
                };
            }
        }
        ComparisonOp::LessEqual => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v.is_finite() && threshold.is_finite() && v <= threshold {
                    1
                } else {
                    0
                };
            }
        }
        ComparisonOp::Equal => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if f64_eq(v, threshold) { 1 } else { 0 };
            }
        }
        ComparisonOp::NotEqual => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if f64_ne(v, threshold) { 1 } else { 0 };
            }
        }
    }

    Ok(())
}

/// WASM export for batch numeric filtering
///
/// Compares a numeric array against a threshold value with the given operation.
/// Operations: 0=GT, 1=GTE, 2=LT, 3=LTE, 4=EQ, 5=NE
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_filter_numbers(
    values: &[f64],
    threshold: f64,
    operation: u8,
    output: &mut [u8],
) -> Result<(), JsValue> {
    let op = match operation {
        0 => ComparisonOp::Greater,
        1 => ComparisonOp::GreaterEqual,
        2 => ComparisonOp::Less,
        3 => ComparisonOp::LessEqual,
        4 => ComparisonOp::Equal,
        5 => ComparisonOp::NotEqual,
        _ => return Err(JsValue::from_str("Invalid comparison operation")),
    };

    batch_compare_numbers(values, threshold, op, output)
        .map_err(|e| JsValue::from_str(&format!("Batch filter error: {}", e)))
}

/// NAPI export for batch numeric filtering (rayon-parallelized)
/// Returns the output mask as a Uint8Array (zero-copy to JS)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn batch_filter_numbers_napi(
    values: &[f64],
    threshold: f64,
    operation: u8,
) -> Result<Uint8Array, napi::Error> {
    let cmp: fn(f64, f64) -> bool = match operation {
        0 => |v, t| v.is_finite() && t.is_finite() && v > t,
        1 => |v, t| v.is_finite() && t.is_finite() && v >= t,
        2 => |v, t| v.is_finite() && t.is_finite() && v < t,
        3 => |v, t| v.is_finite() && t.is_finite() && v <= t,
        4 => |v, t| f64_eq(v, t),
        5 => |v, t| f64_ne(v, t),
        _ => return Err(napi::Error::from_reason("Invalid comparison operation")),
    };

    let output: Vec<u8> = values.par_iter()
        .map(|&v| if cmp(v, threshold) { 1u8 } else { 0u8 })
        .collect();

    Ok(Uint8Array::new(output))
}

/// NAPI export for batch numeric filtering that returns a packed bitset (Uint32Array).
/// Each Uint32 word packs 32 comparison results, MSB-first layout matching JS BitSet.
/// Eliminates the Uint8Array → BitSet conversion overhead on the JS side.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn batch_filter_bitset_napi(
    values: &[f64],
    threshold: f64,
    operation: u8,
) -> Result<napi::bindgen_prelude::Uint32Array, napi::Error> {
    let profile = std::env::var("TIDY_PROFILE").is_ok();
    let t0 = if profile { Some(std::time::Instant::now()) } else { None };

    let cmp: fn(f64, f64) -> bool = match operation {
        0 => |v, t| v > t,
        1 => |v, t| v >= t,
        2 => |v, t| v < t,
        3 => |v, t| v <= t,
        4 => |v, t| f64_eq(v, t),
        5 => |v, t| f64_ne(v, t),
        _ => return Err(napi::Error::from_reason("Invalid comparison operation")),
    };

    let n = values.len();
    let n_words = (n + 31) / 32;
    let mut bits = vec![0u32; n_words];

    // Process 32 values at a time, packing into Uint32 words (MSB-first)
    let full_words = n / 32;
    for w in 0..full_words {
        let base = w * 32;
        let mut word = 0u32;
        for j in 0..32 {
            if cmp(values[base + j], threshold) {
                word |= 0x80000000u32 >> j;
            }
        }
        bits[w] = word;
    }

    // Handle remainder
    let rem = n & 31;
    if rem > 0 {
        let base = full_words * 32;
        let mut word = 0u32;
        for j in 0..rem {
            if cmp(values[base + j], threshold) {
                word |= 0x80000000u32 >> j;
            }
        }
        bits[full_words] = word;
    }

    if let Some(t) = t0 {
        eprintln!("      [rust batch_filter_bitset_napi] n={}: {:.4}ms", n, t.elapsed().as_secs_f64() * 1000.0);
    }

    Ok(napi::bindgen_prelude::Uint32Array::new(bits))
}

/// Convert a Uint8Array boolean mask (0/1) to a compact Uint32Array of set indices.
/// E.g. mask [0,1,0,1,1] → [1,3,4]
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mask_to_index_napi(
    mask: &[u8],
) -> napi::bindgen_prelude::Uint32Array {
    let n = mask.len();
    // Count set bits first for exact allocation
    let count: usize = mask.iter().map(|&v| v as usize).sum();
    let mut out = Vec::with_capacity(count);
    for i in 0..n {
        if mask[i] != 0 {
            out.push(i as u32);
        }
    }
    napi::bindgen_prelude::Uint32Array::new(out)
}
