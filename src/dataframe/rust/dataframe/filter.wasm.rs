//! Filtering operations WASM exports

#![deny(unsafe_op_in_unsafe_fn)]

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

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
