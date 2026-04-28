//! Vectorized mutate operations for numeric columns (napi exports)

#![deny(unsafe_op_in_unsafe_fn)]

#[cfg(feature = "napi-rs")]
use napi_derive::napi;
#[cfg(feature = "napi-rs")]
use napi::bindgen_prelude::Float64Array;

/// Binary operations between two f64 columns.
/// Operations: 0=add, 1=sub, 2=mul, 3=div
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mutate_binary_cols_napi(
    a: &[f64],
    b: &[f64],
    operation: u8,
) -> Result<Float64Array, napi::Error> {
    let n = a.len();
    if n != b.len() {
        return Err(napi::Error::from_reason(format!(
            "Column length mismatch: {} vs {}", n, b.len()
        )));
    }

    let mut out = vec![0.0f64; n];
    match operation {
        0 => { // add
            for i in 0..n { out[i] = a[i] + b[i]; }
        }
        1 => { // sub
            for i in 0..n { out[i] = a[i] - b[i]; }
        }
        2 => { // mul
            for i in 0..n { out[i] = a[i] * b[i]; }
        }
        3 => { // div
            for i in 0..n { out[i] = a[i] / b[i]; }
        }
        _ => return Err(napi::Error::from_reason("Invalid binary operation")),
    }

    Ok(Float64Array::new(out))
}

/// Binary operation: column op scalar.
/// Operations: 0=add, 1=sub, 2=mul, 3=div
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mutate_col_scalar_napi(
    col: &[f64],
    scalar: f64,
    operation: u8,
) -> Result<Float64Array, napi::Error> {
    let n = col.len();
    let mut out = vec![0.0f64; n];
    match operation {
        0 => { for i in 0..n { out[i] = col[i] + scalar; } }
        1 => { for i in 0..n { out[i] = col[i] - scalar; } }
        2 => { for i in 0..n { out[i] = col[i] * scalar; } }
        3 => { for i in 0..n { out[i] = col[i] / scalar; } }
        _ => return Err(napi::Error::from_reason("Invalid binary operation")),
    }

    Ok(Float64Array::new(out))
}

/// Compare column against scalar, returning Buffer (Uint8Array) of 0/1.
/// Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mutate_compare_scalar_napi(
    col: &[f64],
    scalar: f64,
    operation: u8,
) -> Result<napi::bindgen_prelude::Buffer, napi::Error> {
    let n = col.len();
    let mut out = vec![0u8; n];
    match operation {
        0 => { for i in 0..n { out[i] = (col[i] > scalar) as u8; } }
        1 => { for i in 0..n { out[i] = (col[i] >= scalar) as u8; } }
        2 => { for i in 0..n { out[i] = (col[i] < scalar) as u8; } }
        3 => { for i in 0..n { out[i] = (col[i] <= scalar) as u8; } }
        4 => { for i in 0..n { out[i] = (col[i] == scalar) as u8; } }
        5 => { for i in 0..n { out[i] = (col[i] != scalar) as u8; } }
        _ => return Err(napi::Error::from_reason("Invalid comparison operation")),
    }
    Ok(out.into())
}

/// Compare two f64 columns, returning Buffer (Uint8Array) of 0/1.
/// Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mutate_compare_cols_napi(
    a: &[f64],
    b: &[f64],
    operation: u8,
) -> Result<napi::bindgen_prelude::Buffer, napi::Error> {
    let n = a.len();
    if n != b.len() {
        return Err(napi::Error::from_reason(format!(
            "Column length mismatch: {} vs {}", n, b.len()
        )));
    }
    let mut out = vec![0u8; n];
    match operation {
        0 => { for i in 0..n { out[i] = (a[i] > b[i]) as u8; } }
        1 => { for i in 0..n { out[i] = (a[i] >= b[i]) as u8; } }
        2 => { for i in 0..n { out[i] = (a[i] < b[i]) as u8; } }
        3 => { for i in 0..n { out[i] = (a[i] <= b[i]) as u8; } }
        4 => { for i in 0..n { out[i] = (a[i] == b[i]) as u8; } }
        5 => { for i in 0..n { out[i] = (a[i] != b[i]) as u8; } }
        _ => return Err(napi::Error::from_reason("Invalid comparison operation")),
    }
    Ok(out.into())
}

/// Compare column against scalar, returning Vec<bool> (JS Array<boolean>).
/// napi-rs handles the O(n) conversion from Rust Vec<bool> → JS boolean[].
/// Operations: 0=gt, 1=gte, 2=lt, 3=lte, 4=eq, 5=neq
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mutate_compare_scalar_bool_napi(
    col: &[f64],
    scalar: f64,
    operation: u8,
) -> Result<Vec<bool>, napi::Error> {
    let n = col.len();
    let mut out = vec![false; n];
    match operation {
        0 => { for i in 0..n { out[i] = col[i] > scalar; } }
        1 => { for i in 0..n { out[i] = col[i] >= scalar; } }
        2 => { for i in 0..n { out[i] = col[i] < scalar; } }
        3 => { for i in 0..n { out[i] = col[i] <= scalar; } }
        4 => { for i in 0..n { out[i] = col[i] == scalar; } }
        5 => { for i in 0..n { out[i] = col[i] != scalar; } }
        _ => return Err(napi::Error::from_reason("Invalid comparison operation")),
    }
    Ok(out)
}

/// Fill a Float64Array with a scalar value.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mutate_fill_scalar_napi(
    length: u32,
    scalar: f64,
) -> Result<Float64Array, napi::Error> {
    let n = length as usize;
    let out = vec![scalar; n];
    Ok(Float64Array::new(out))
}

