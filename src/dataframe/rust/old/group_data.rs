//! Group data operations - Rust replacement for `group_data.cpp`.
//!
//! Provides `dplyr_group_indices()` and `dplyr_group_keys()` functionality
//! for working with grouped data frames.

#![deny(unsafe_op_in_unsafe_fn)]

use super::error::{Status, to_status};
use std::slice;

/// Generate group indices for each row based on group membership.
/// Returns a vector of 1-based group IDs with length equal to `row_count`.
pub fn group_indices(row_count: usize, rows: &[Vec<usize>]) -> Vec<i32> {
    if row_count == 0 {
        return Vec::new();
    }

    let mut indices = vec![0_i32; row_count];
    let _ng = rows.len();

    for (i, group_rows) in rows.iter().enumerate() {
        for &row_idx in group_rows {
            // Convert to 0-based index for array access, then assign 1-based group ID
            indices[row_idx - 1] = (i + 1) as i32;
        }
    }

    indices
}

/// Extract group keys from group data, excluding the last column (.rows).
/// Returns a vector of column vectors representing the group keys.
pub fn group_keys(group_data: &[Vec<usize>]) -> Vec<Vec<usize>> {
    if group_data.is_empty() {
        return Vec::new();
    }

    // Exclude the last column (.rows) - take all but the last
    let n = group_data.len() - 1;
    group_data[..n].to_vec()
}

// -------- C-ABI shims (exported via lib.rs) --------

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_group_indices(
    row_count: usize,
    rows_ptrs: *const *const usize,
    rows_lens: *const usize,
    groups_count: usize,
    ptr_out: *mut i32,
) -> Status {
    to_status(|| {
        // Reconstruct rows from raw pointers
        let ptrs = unsafe { slice::from_raw_parts(rows_ptrs, groups_count) };
        let lens = unsafe { slice::from_raw_parts(rows_lens, groups_count) };

        let mut rows: Vec<Vec<usize>> = Vec::with_capacity(groups_count);
        for (ptr, len) in ptrs.iter().zip(lens) {
            let group_rows = unsafe { slice::from_raw_parts(*ptr, *len) };
            rows.push(group_rows.to_vec());
        }

        // Generate indices
        let indices = group_indices(row_count, &rows);

        // Copy to output buffer
        let out_slice = unsafe { slice::from_raw_parts_mut(ptr_out, row_count) };
        out_slice.copy_from_slice(&indices);

        Ok(())
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_group_keys_simple(
    group_data_ptrs: *const *const usize,
    group_data_lens: *const usize,
    group_data_cols: usize,
    ptr_out_ptrs: *mut *mut usize,
    ptr_out_lens: *mut usize,
) -> Status {
    to_status(|| {
        // Reconstruct group_data from raw pointers
        let ptrs = unsafe { slice::from_raw_parts(group_data_ptrs, group_data_cols) };
        let lens = unsafe { slice::from_raw_parts(group_data_lens, group_data_cols) };

        let mut group_data: Vec<Vec<usize>> = Vec::with_capacity(group_data_cols);
        for (ptr, len) in ptrs.iter().zip(lens) {
            let col_data = unsafe { slice::from_raw_parts(*ptr, *len) };
            group_data.push(col_data.to_vec());
        }

        // Extract keys (all but last column)
        let keys = group_keys(&group_data);

        // Write output pointers and lengths
        let out_ptrs = unsafe { slice::from_raw_parts_mut(ptr_out_ptrs, keys.len()) };
        let out_lens = unsafe { slice::from_raw_parts_mut(ptr_out_lens, keys.len()) };

        for (i, key_col) in keys.iter().enumerate() {
            // Allocate memory for this column and copy data
            let mut col_vec = key_col.clone();
            let ptr = col_vec.as_mut_ptr();
            let len = col_vec.len();
            std::mem::forget(col_vec); // Prevent deallocation

            out_ptrs[i] = ptr;
            out_lens[i] = len;
        }

        Ok(())
    })
}
