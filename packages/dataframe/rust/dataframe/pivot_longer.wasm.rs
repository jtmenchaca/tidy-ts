//! High-performance pivot_longer operations
//!
//! This module provides efficient pivot_longer kernels that reshape wide data to long format
//! by melting/unpivoting specified columns while preserving ID columns.

#[cfg(feature = "wasm")]
use super::join_helpers::{bulk_copy_f64, bulk_copy_u8};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Result of pivot_longer operation containing reshaped data
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct PivotLongerResult {
    // Keep columns data (column-major, C×G where C = number of keep columns, G = output rows)
    keep_data: Vec<u32>, // Dictionary-encoded values for kept columns
    // Names column data
    names_data: Vec<u32>, // Dictionary-encoded names of melted columns
    // Values column data
    values_data: Vec<f64>, // Actual values from melted columns
    pub n_rows: u32,       // Number of output rows
    pub n_keep_cols: u32,  // Number of kept columns
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl PivotLongerResult {
    // Move the buffers out without cloning
    #[wasm_bindgen(js_name = takeKeepData)]
    pub fn take_keep_data(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.keep_data).into_boxed_slice()
    }

    #[wasm_bindgen(js_name = takeNamesData)]
    pub fn take_names_data(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.names_data).into_boxed_slice()
    }

    #[wasm_bindgen(js_name = takeValuesData)]
    pub fn take_values_data(&mut self) -> Box<[f64]> {
        std::mem::take(&mut self.values_data).into_boxed_slice()
    }
}

// ----------------------------- Optimized WASM API with typed arrays -----------------------------

/// Ultra-optimized pivot_longer using typed arrays and bulk copying
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_longer_typed_arrays(
    keep_cols_data: &js_sys::Uint32Array,
    fold_cols_data: &js_sys::Float64Array,
    fold_cols_names: &js_sys::Uint32Array,
    n_input_rows: u32,
    n_keep_cols: u32,
    n_fold_cols: u32,
) -> PivotLongerResult {
    // Bulk copy data for efficient processing
    let keep_data = {
        let mut v = vec![0u32; keep_cols_data.length() as usize];
        keep_cols_data.copy_to(&mut v);
        v
    };
    let fold_data = bulk_copy_f64(fold_cols_data);
    let fold_names = {
        let mut v = vec![0u32; fold_cols_names.length() as usize];
        fold_cols_names.copy_to(&mut v);
        v
    };

    // Call the optimized dense function
    pivot_longer_dense(
        &keep_data,
        &fold_data,
        &fold_names,
        n_input_rows,
        n_keep_cols,
        n_fold_cols,
    )
}

/// Ultra-optimized pivot_longer for numeric data with validation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_longer_typed_numeric(
    keep_cols_data: &js_sys::Uint32Array,
    fold_cols_data: &js_sys::Float64Array,
    fold_cols_valid: &js_sys::Uint8Array,
    fold_cols_names: &js_sys::Uint32Array,
    n_input_rows: u32,
    n_keep_cols: u32,
    n_fold_cols: u32,
) -> PivotLongerResult {
    // Bulk copy data for efficient processing
    let keep_data = {
        let mut v = vec![0u32; keep_cols_data.length() as usize];
        keep_cols_data.copy_to(&mut v);
        v
    };
    let fold_data = bulk_copy_f64(fold_cols_data);
    let fold_valid = bulk_copy_u8(fold_cols_valid);
    let fold_names = {
        let mut v = vec![0u32; fold_cols_names.length() as usize];
        fold_cols_names.copy_to(&mut v);
        v
    };

    // Call the optimized numeric function
    pivot_longer_numeric(
        &keep_data,
        &fold_data,
        &fold_valid,
        &fold_names,
        n_input_rows,
        n_keep_cols,
        n_fold_cols,
    )
}

/// Ultra-optimized pivot_longer for string data
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_longer_typed_strings(
    keep_cols_data: &js_sys::Uint32Array,
    fold_cols_data: &js_sys::Uint32Array,
    fold_cols_names: &js_sys::Uint32Array,
    n_input_rows: u32,
    n_keep_cols: u32,
    n_fold_cols: u32,
) -> PivotLongerStringResult {
    // Bulk copy data for efficient processing
    let keep_data = {
        let mut v = vec![0u32; keep_cols_data.length() as usize];
        keep_cols_data.copy_to(&mut v);
        v
    };
    let fold_data = {
        let mut v = vec![0u32; fold_cols_data.length() as usize];
        fold_cols_data.copy_to(&mut v);
        v
    };
    let fold_names = {
        let mut v = vec![0u32; fold_cols_names.length() as usize];
        fold_cols_names.copy_to(&mut v);
        v
    };

    // Call the optimized strings function
    pivot_longer_strings(
        &keep_data,
        &fold_data,
        &fold_names,
        n_input_rows,
        n_keep_cols,
        n_fold_cols,
    )
}

/// Perform pivot_longer operation on dictionary-encoded columns
///
/// Args:
/// - keep_cols_data: Column-major dictionary-encoded data for columns to keep (n_keep_cols × n_input_rows)
/// - fold_cols_data: Column-major data for columns to fold/melt (n_fold_cols × n_input_rows)
/// - fold_cols_names: Dictionary codes for the names of columns being folded
/// - n_input_rows: Number of input rows
/// - n_keep_cols: Number of columns to keep
/// - n_fold_cols: Number of columns to fold/melt
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_longer_dense(
    keep_cols_data: &[u32],  // Column-major: keep_cols × input_rows
    fold_cols_data: &[f64],  // Column-major: fold_cols × input_rows
    fold_cols_names: &[u32], // Names of columns being folded (length = n_fold_cols)
    n_input_rows: u32,
    n_keep_cols: u32,
    n_fold_cols: u32,
) -> PivotLongerResult {
    let input_rows = n_input_rows as usize;
    let keep_cols = n_keep_cols as usize;
    let fold_cols = n_fold_cols as usize;
    let output_rows = input_rows * fold_cols;

    // Pre-allocate output arrays
    let mut keep_data = vec![0u32; keep_cols * output_rows];
    let mut names_data = vec![0u32; output_rows];
    let mut values_data = vec![0f64; output_rows];

    // Fast path for single fold column
    if fold_cols == 1 {
        let output_rows = input_rows;
        let keep_data = keep_cols_data.to_vec(); // already correct shape
        let names_data = vec![fold_cols_names[0]; output_rows];
        let values_data = fold_cols_data.to_vec();
        return PivotLongerResult {
            keep_data,
            names_data,
            values_data,
            n_rows: output_rows as u32,
            n_keep_cols,
        };
    }

    // Pass A: names + values, in contiguous out_idx order (good locality)
    let mut out_idx = 0;
    for row_idx in 0..input_rows {
        for fold_idx in 0..fold_cols {
            names_data[out_idx] = fold_cols_names[fold_idx];
            let value_idx = fold_idx * input_rows + row_idx;
            values_data[out_idx] = fold_cols_data[value_idx];
            out_idx += 1;
        }
    }

    // Pass B: keep_data with contiguous writes per keep column
    for keep_idx in 0..keep_cols {
        let src = &keep_cols_data[keep_idx * input_rows..keep_idx * input_rows + input_rows];
        // destination base for this keep column
        let mut dst = keep_idx * output_rows;
        for row_idx in 0..input_rows {
            // write a run of length fold_cols with the same code
            let v = unsafe { *src.get_unchecked(row_idx) };
            let slice = &mut keep_data[dst..dst + fold_cols];
            for x in slice.iter_mut() {
                *x = v;
            } // tight contiguous store
            dst += fold_cols;
        }
    }

    PivotLongerResult {
        keep_data,
        names_data,
        values_data,
        n_rows: output_rows as u32,
        n_keep_cols,
    }
}

/// Optimized pivot_longer for the common case of numeric values
/// This version handles NaN/undefined values appropriately
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_longer_numeric(
    keep_cols_data: &[u32],  // Column-major: keep_cols × input_rows
    fold_cols_data: &[f64],  // Column-major: fold_cols × input_rows
    fold_cols_valid: &[u8],  // Valid flags for fold columns (1 = valid, 0 = null/undefined)
    fold_cols_names: &[u32], // Names of columns being folded
    n_input_rows: u32,
    n_keep_cols: u32,
    n_fold_cols: u32,
) -> PivotLongerResult {
    let input_rows = n_input_rows as usize;
    let keep_cols = n_keep_cols as usize;
    let fold_cols = n_fold_cols as usize;
    let output_rows = input_rows * fold_cols;

    // Pre-allocate output arrays
    let mut keep_data = vec![0u32; keep_cols * output_rows];
    let mut names_data = vec![0u32; output_rows];
    let mut values_data = vec![f64::NAN; output_rows];

    // Fast path for single fold column
    if fold_cols == 1 {
        let output_rows = input_rows;
        let keep_data = keep_cols_data.to_vec(); // already correct shape
        let names_data = vec![fold_cols_names[0]; output_rows];
        let mut values_data = vec![f64::NAN; output_rows];

        for i in 0..input_rows {
            if fold_cols_valid[i] != 0 {
                values_data[i] = fold_cols_data[i];
            }
        }

        return PivotLongerResult {
            keep_data,
            names_data,
            values_data,
            n_rows: output_rows as u32,
            n_keep_cols,
        };
    }

    // Pass A: names + values, in contiguous out_idx order (good locality)
    let mut out_idx = 0;
    for row_idx in 0..input_rows {
        for fold_idx in 0..fold_cols {
            names_data[out_idx] = fold_cols_names[fold_idx];

            // Add the value with validation
            let value_idx = fold_idx * input_rows + row_idx;
            if fold_cols_valid[value_idx] != 0 {
                values_data[out_idx] = fold_cols_data[value_idx];
            }
            // else it remains NaN

            out_idx += 1;
        }
    }

    // Pass B: keep_data with contiguous writes per keep column
    for keep_idx in 0..keep_cols {
        let src = &keep_cols_data[keep_idx * input_rows..keep_idx * input_rows + input_rows];
        // destination base for this keep column
        let mut dst = keep_idx * output_rows;
        for row_idx in 0..input_rows {
            // write a run of length fold_cols with the same code
            let v = unsafe { *src.get_unchecked(row_idx) };
            let slice = &mut keep_data[dst..dst + fold_cols];
            for x in slice.iter_mut() {
                *x = v;
            } // tight contiguous store
            dst += fold_cols;
        }
    }

    PivotLongerResult {
        keep_data,
        names_data,
        values_data,
        n_rows: output_rows as u32,
        n_keep_cols,
    }
}

/// Fast pivot_longer specifically for string columns
/// Returns dictionary codes that can be decoded in TypeScript
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_longer_strings(
    keep_cols_data: &[u32],  // Column-major: keep_cols × input_rows
    fold_cols_data: &[u32],  // Column-major dictionary codes: fold_cols × input_rows
    fold_cols_names: &[u32], // Names of columns being folded
    n_input_rows: u32,
    n_keep_cols: u32,
    n_fold_cols: u32,
) -> PivotLongerStringResult {
    let input_rows = n_input_rows as usize;
    let keep_cols = n_keep_cols as usize;
    let fold_cols = n_fold_cols as usize;
    let output_rows = input_rows * fold_cols;

    // Pre-allocate output arrays
    let mut keep_data = vec![0u32; keep_cols * output_rows];
    let mut names_data = vec![0u32; output_rows];
    let mut values_data = vec![0u32; output_rows]; // String codes

    let mut out_idx = 0;

    for row_idx in 0..input_rows {
        for fold_idx in 0..fold_cols {
            // Copy kept columns efficiently
            for keep_idx in 0..keep_cols {
                let src_idx = keep_idx * input_rows + row_idx;
                let dst_idx = keep_idx * output_rows + out_idx;
                keep_data[dst_idx] = keep_cols_data[src_idx];
            }

            names_data[out_idx] = fold_cols_names[fold_idx];

            // Copy string code
            let value_idx = fold_idx * input_rows + row_idx;
            values_data[out_idx] = fold_cols_data[value_idx];

            out_idx += 1;
        }
    }

    PivotLongerStringResult {
        keep_data,
        names_data,
        values_data,
        n_rows: output_rows as u32,
        n_keep_cols,
    }
}

/// Result for string pivot_longer operations
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct PivotLongerStringResult {
    keep_data: Vec<u32>,   // Dictionary codes for kept columns
    names_data: Vec<u32>,  // Dictionary codes for names column
    values_data: Vec<u32>, // Dictionary codes for values column
    pub n_rows: u32,
    pub n_keep_cols: u32,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl PivotLongerStringResult {
    #[wasm_bindgen(js_name = takeKeepData)]
    pub fn take_keep_data(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.keep_data).into_boxed_slice()
    }

    #[wasm_bindgen(js_name = takeNamesData)]
    pub fn take_names_data(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.names_data).into_boxed_slice()
    }

    #[wasm_bindgen(js_name = takeValuesData)]
    pub fn take_values_data(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.values_data).into_boxed_slice()
    }
}
