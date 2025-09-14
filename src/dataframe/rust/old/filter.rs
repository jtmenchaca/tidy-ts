//! Logical filter reduction and batch, vectorized predicate evaluators.
//!
//! Semantics aligned with the TS fast path:
//!   * Batch numeric/integer/string predicates return a 0/1 mask
//!     (NaN or non-finite compares => 0).
//!   * Float Equal/NotEqual use EPSILON tolerance (predictable).
//!   * Three-state AND reduction (0=false, 1=true, 2=NA) via `zip_and`.
//!
//! Exposed surface:
//!   - `logical_and(input, output)`               // 3-state AND
//!   - `reduce_and(inputs, output)`               // AND-reduce N columns
//!   - `batch_compare_numbers(values, threshold, op, output)`
//!   - `batch_compare_integers(values, threshold, op, output)`
//!   - `batch_compare_strings(values, target, op, output)`
//!   - C-ABI: `dplyr_rs_filter_reduce(ptr_in, ptr_out)`
//!
//! WASM shims live in `wasm.rs`.

#![deny(unsafe_op_in_unsafe_fn)]

use super::error::{Error, Status, to_status};
use super::utils::zip_and;
use std::slice;

// ===============================
//           Public API
// ===============================

/// In-place three-state logical "AND" (0,1,2) combining `input` into `output`.
/// Encoding: 0 = FALSE · 1 = TRUE · 2 = NA
pub fn logical_and(input: &[u8], output: &mut [u8]) {
    zip_and(input, output);
}

/// Reduce `inputs` (Vec<&[u8]>) with logical AND into `output`.
/// If `inputs` is empty, `output` is left as-is (caller decides the default).
pub fn reduce_and(inputs: &[&[u8]], output: &mut [u8]) -> Result<(), Error> {
    if inputs.is_empty() {
        return Ok(());
    }
    let len = output.len();
    for in_ in inputs {
        if in_.len() != len {
            return Err(Error::IncompatibleSize {
                size: in_.len(),
                expected: len,
            });
        }
        zip_and(in_, output);
    }
    Ok(())
}

// ===============================
//     Batch predicate kernels
// ===============================

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
) -> Result<(), Error> {
    if values.len() != output.len() {
        return Err(Error::IncompatibleSize {
            size: values.len(),
            expected: output.len(),
        });
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

/// Batch integer compare against a threshold (no NA notion, plain 0/1).
pub fn batch_compare_integers(
    values: &[i64],
    threshold: i64,
    op: ComparisonOp,
    output: &mut [u8],
) -> Result<(), Error> {
    if values.len() != output.len() {
        return Err(Error::IncompatibleSize {
            size: values.len(),
            expected: output.len(),
        });
    }

    match op {
        ComparisonOp::Greater => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v > threshold { 1 } else { 0 };
            }
        }
        ComparisonOp::GreaterEqual => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v >= threshold { 1 } else { 0 };
            }
        }
        ComparisonOp::Less => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v < threshold { 1 } else { 0 };
            }
        }
        ComparisonOp::LessEqual => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v <= threshold { 1 } else { 0 };
            }
        }
        ComparisonOp::Equal => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v == threshold { 1 } else { 0 };
            }
        }
        ComparisonOp::NotEqual => {
            for (i, &v) in values.iter().enumerate() {
                output[i] = if v != threshold { 1 } else { 0 };
            }
        }
    }

    Ok(())
}

/// Batch string comparison. `values` are compared to a single `target`.
/// For non-equality ops, we use Rust's `contains`, `starts_with`, `ends_with`.
pub fn batch_compare_strings(
    values: &[String],
    target: &str,
    op: StringOp,
    output: &mut [u8],
) -> Result<(), Error> {
    if values.len() != output.len() {
        return Err(Error::IncompatibleSize {
            size: values.len(),
            expected: output.len(),
        });
    }

    match op {
        StringOp::Equal => {
            for (i, v) in values.iter().enumerate() {
                output[i] = if v == target { 1 } else { 0 };
            }
        }
        StringOp::NotEqual => {
            for (i, v) in values.iter().enumerate() {
                output[i] = if v != target { 1 } else { 0 };
            }
        }
        StringOp::Contains => {
            for (i, v) in values.iter().enumerate() {
                output[i] = if v.contains(target) { 1 } else { 0 };
            }
        }
        StringOp::StartsWith => {
            for (i, v) in values.iter().enumerate() {
                output[i] = if v.starts_with(target) { 1 } else { 0 };
            }
        }
        StringOp::EndsWith => {
            for (i, v) in values.iter().enumerate() {
                output[i] = if v.ends_with(target) { 1 } else { 0 };
            }
        }
    }

    Ok(())
}

// ===============================
//             C-ABI
// ===============================
//
// dplyr_rs_filter_reduce:
//
// Accepts N logical columns laid out consecutively after a header:
//   [count:u32][len:u32][col0 bytes …][col1 bytes …] …
// Writes the reduced result into caller-allocated `out_ptr` (length = len).
//
// The AND is the 3-state AND used by zip_and (0=false,1=true,2=NA).

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_filter_reduce(ptr_in: *const u8, ptr_out: *mut u8) -> Status {
    to_status(|| unsafe {
        let hdr = slice::from_raw_parts(ptr_in as *const u32, 2);
        let n_cols = hdr[0] as usize;
        let len = hdr[1] as usize;

        // Build &[&[u8]] without allocations.
        let mut inputs: Vec<&[u8]> = Vec::with_capacity(n_cols);
        let mut cursor = ptr_in.add(8);
        for _ in 0..n_cols {
            inputs.push(slice::from_raw_parts(cursor, len));
            cursor = cursor.add(len);
        }

        // Output starts as all TRUE (1) so zip_and can only turn bits to 0/2.
        let out = slice::from_raw_parts_mut(ptr_out, len);
        out.fill(1);

        reduce_and(&inputs, out)
    })
}

// ===============================
//           WASM Bindings
// ===============================

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for logical AND filter operation
///
/// Performs element-wise logical AND between input and output arrays.
/// This replaces the FFI `dplyr_rs_filterand` function.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn filterand(input: &[u8], output: &mut [u8]) -> Result<(), JsValue> {
    if input.len() != output.len() {
        return Err(JsValue::from_str(&format!(
            "Input and output arrays must have same length: {} vs {}",
            input.len(),
            output.len()
        )));
    }

    logical_and(input, output);
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
        .map_err(|e| JsValue::from_str(&format!("Batch filter error: {:?}", e)))
}

/// WASM export for batch integer filtering
///
/// Compares an integer array against a threshold value with the given operation.
/// Operations: 0=GT, 1=GTE, 2=LT, 3=LTE, 4=EQ, 5=NE
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_filter_integers(
    values: &[i64],
    threshold: i64,
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

    batch_compare_integers(values, threshold, op, output)
        .map_err(|e| JsValue::from_str(&format!("Batch filter error: {:?}", e)))
}

/// WASM export for batch string filtering
///
/// Compares a string array against a target string with the given operation.
/// Operations: 0=EQ, 1=NE, 2=CONTAINS, 3=STARTS_WITH, 4=ENDS_WITH
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_filter_strings(
    values: Vec<String>,
    target: &str,
    operation: u8,
    output: &mut [u8],
) -> Result<(), JsValue> {
    let op = match operation {
        0 => StringOp::Equal,
        1 => StringOp::NotEqual,
        2 => StringOp::Contains,
        3 => StringOp::StartsWith,
        4 => StringOp::EndsWith,
        _ => return Err(JsValue::from_str("Invalid string operation")),
    };

    batch_compare_strings(&values, target, op, output)
        .map_err(|e| JsValue::from_str(&format!("Batch filter error: {:?}", e)))
}

// ===============================
//             Tests
// ===============================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_batch_compare_numbers() {
        let vals = [1.0, 2.0, f64::NAN, 5.0, 5.0];
        let mut out = [0u8; 5];

        batch_compare_numbers(&vals, 2.0, ComparisonOp::Greater, &mut out).unwrap();
        assert_eq!(out, [0, 0, 0, 1, 1]);

        batch_compare_numbers(&vals, 5.0, ComparisonOp::Equal, &mut out).unwrap();
        assert_eq!(out, [0, 0, 0, 1, 1]);

        batch_compare_numbers(&vals, 5.0, ComparisonOp::NotEqual, &mut out).unwrap();
        assert_eq!(out, [1, 1, 0, 0, 0]); // NaN -> 0 (not counted as NE)
    }

    #[test]
    fn test_batch_compare_integers() {
        let vals = [1i64, 2, 3, 4, 5];
        let mut out = [0u8; 5];

        batch_compare_integers(&vals, 3, ComparisonOp::LessEqual, &mut out).unwrap();
        assert_eq!(out, [1, 1, 1, 0, 0]);

        batch_compare_integers(&vals, 5, ComparisonOp::Equal, &mut out).unwrap();
        assert_eq!(out, [0, 0, 0, 0, 1]);
    }

    #[test]
    fn test_batch_compare_strings() {
        let vals = vec![
            "apple".to_string(),
            "banana".to_string(),
            "cherry".to_string(),
            "app".to_string(),
        ];
        let mut out = [0u8; 4];

        batch_compare_strings(&vals, "apple", StringOp::Equal, &mut out).unwrap();
        assert_eq!(out, [1, 0, 0, 0]);

        batch_compare_strings(&vals, "an", StringOp::Contains, &mut out).unwrap();
        assert_eq!(out, [0, 1, 0, 0]);

        batch_compare_strings(&vals, "app", StringOp::StartsWith, &mut out).unwrap();
        assert_eq!(out, [1, 0, 0, 1]);

        batch_compare_strings(&vals, "rry", StringOp::EndsWith, &mut out).unwrap();
        assert_eq!(out, [0, 0, 1, 0]);
    }

    #[test]
    fn test_reduce_and() {
        let a = [1u8, 1, 0, 2];
        let b = [1u8, 0, 1, 2];
        let mut out = [1u8, 1, 1, 1];
        reduce_and(&[&a, &b], &mut out).unwrap();
        // zip_and semantics:
        // (1 & 1) = 1, (1 & 0) = 0, (0 & 1) = 0, (2 & 2) = 2
        assert_eq!(out, [1, 0, 0, 2]);
    }
}
