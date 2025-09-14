//! Public FFI / wasm-bindgen entry points.
//!
//! Internal logic lives in sub-modules (`filter`, `funs`, …).

#![deny(unsafe_op_in_unsafe_fn)] // 2024-edition safety convention

mod chop;
mod error;
mod expand_groups;
mod filter;
mod funs;
mod group_by;
mod group_data;
mod join;
mod mask;
mod mutate;
mod reconstruct;
mod slice;
mod summarise;
mod utils;

// Stats functions
mod stats {
    pub mod distance;
    pub mod quantiles;
    
    #[cfg(feature = "wasm")]
    pub mod wasm_bindings;
}

use error::{Status, to_status};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

// ---------- C-ABI (for Deno.dlopen) ----------

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_filter_and(ptr_in: *const u8, len: usize, ptr_out: *mut u8) -> Status {
    to_status(|| {
        // SAFETY: FFI promises that the pointers are valid for `len` bytes.
        let in_slice = unsafe { std::slice::from_raw_parts(ptr_in, len) };
        let out_slice = unsafe { std::slice::from_raw_parts_mut(ptr_out, len) };
        filter::logical_and(in_slice, out_slice);
        Ok(())
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_cummean_f64(
    ptr_in: *const f64,
    len: usize,
    ptr_out: *mut f64,
) -> Status {
    to_status(|| {
        let in_slice = unsafe { std::slice::from_raw_parts(ptr_in, len) };
        let out_slice = unsafe { std::slice::from_raw_parts_mut(ptr_out, len) };
        funs::cummean(in_slice, out_slice);
        Ok(())
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_summarise_recycle(
    ptr_chunks: *mut *mut u8,
    lens: *const usize,
    n_groups: usize,
    n_expr: usize,
) -> Status {
    use crate::summarise::recycle_chunks_in_place;

    to_status(|| unsafe {
        // Build & mutate an in-memory Vec<Vec<Vec<u8>>> representation
        let mut groups: Vec<Vec<Vec<u8>>> = Vec::with_capacity(n_groups);
        for g in 0..n_groups {
            let mut exprs: Vec<Vec<u8>> = Vec::with_capacity(n_expr);
            for e in 0..n_expr {
                let idx = g * n_expr + e;
                let len = *lens.add(idx);
                let slice = std::slice::from_raw_parts(*ptr_chunks.add(idx), len);
                exprs.push(slice.to_vec());
            }
            groups.push(exprs);
        }
        recycle_chunks_in_place(&mut groups)?;
        Ok(())
    })
}

/// Euclidean distance between two f64 arrays
#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_euclidean_distance(
    ptr1: *const f64,
    ptr2: *const f64,
    len: usize,
) -> f64 {
    unsafe {
        let slice1 = std::slice::from_raw_parts(ptr1, len);
        let slice2 = std::slice::from_raw_parts(ptr2, len);
        stats::distance::euclidean_distance(slice1, slice2)
    }
}

/// Manhattan distance between two f64 arrays  
#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_manhattan_distance(
    ptr1: *const f64,
    ptr2: *const f64,
    len: usize,
) -> f64 {
    unsafe {
        let slice1 = std::slice::from_raw_parts(ptr1, len);
        let slice2 = std::slice::from_raw_parts(ptr2, len);
        stats::distance::manhattan_distance(slice1, slice2)
    }
}

/// Maximum distance between two f64 arrays
#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_maximum_distance(
    ptr1: *const f64,
    ptr2: *const f64,
    len: usize,
) -> f64 {
    unsafe {
        let slice1 = std::slice::from_raw_parts(ptr1, len);
        let slice2 = std::slice::from_raw_parts(ptr2, len);
        stats::distance::maximum_distance(slice1, slice2)
    }
}

/// Minkowski distance between two f64 arrays with parameter p
#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_minkowski_distance(
    ptr1: *const f64,
    ptr2: *const f64,
    len: usize,
    p: f64,
) -> f64 {
    unsafe {
        let slice1 = std::slice::from_raw_parts(ptr1, len);
        let slice2 = std::slice::from_raw_parts(ptr2, len);
        stats::distance::minkowski_distance(slice1, slice2, p)
    }
}

pub use expand_groups::dplyr_rs_expand_groups;
pub use filter::dplyr_rs_filter_reduce;
pub use group_by::dplyr_rs_group_indices_i32;
pub use group_by::dplyr_rs_group_keys;
pub use group_data::dplyr_rs_group_indices;
pub use group_data::dplyr_rs_group_keys_simple;
pub use join::dplyr_rs_inner_join_i64;
pub use join::dplyr_rs_inner_join_str;
pub use join::dplyr_rs_left_join_i64;
pub use join::dplyr_rs_left_join_str;

// ---------- wasm-bindgen shims (optional) ----------

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_test() -> f64 {
    42.0
}

// Export statistical functions
#[cfg(feature = "wasm")]
pub use stats::wasm_bindings::*;

// TODO: Re-enable when statistical modules are available
// #[cfg(feature = "wasm")]
// #[path = "../../wasm-bindings/wasm.rs"]
// pub mod wasm;
