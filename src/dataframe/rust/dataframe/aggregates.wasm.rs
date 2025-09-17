//! High-performance aggregation operations
//!
//! This module provides efficient single-pass aggregation kernels for grouped data.

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Sum aggregation for f64 values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn reduce_sum_f64(gid_per_row: &[u32], vals: &[f64], n_groups: u32) -> Vec<f64> {
    let g = n_groups as usize;
    let mut out = vec![0.0f64; g];

    for i in 0..vals.len() {
        out[gid_per_row[i] as usize] += vals[i];
    }

    out
}

/// Count aggregation (number of non-null values)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn reduce_count_u32(gid_per_row: &[u32], valid: &[u8], n_groups: u32) -> Vec<u32> {
    let mut out = vec![0u32; n_groups as usize];
    for i in 0..gid_per_row.len() {
        if valid[i] != 0 {
            out[gid_per_row[i] as usize] += 1;
        }
    }
    out
}

/// Mean aggregation for f64 values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn reduce_mean_f64(gid_per_row: &[u32], vals: &[f64], valid: &[u8], n_groups: u32) -> Vec<f64> {
    let g = n_groups as usize;
    let mut sums = vec![0.0f64; g];
    let mut cnts = vec![0u32; g];
    for i in 0..vals.len() {
        if valid[i] != 0 {
            let gi = gid_per_row[i] as usize;
            sums[gi] += vals[i];
            cnts[gi] += 1;
        }
    }
    for i in 0..g {
        sums[i] = if cnts[i] > 0 {
            sums[i] / (cnts[i] as f64)
        } else {
            f64::NAN
        };
    }
    sums
}
