//! Minimal replacement for the `group_by.cpp` helpers needed by
//! `dplyr_group_indices()` and `dplyr_group_keys()`.
//
//! For now we model groups as a `Vec<Vec<usize>>` (1-based indices
//! to align with R's convention), and expose two FFI helpers that
//! TypeScript can call over raw buffers.

#![deny(unsafe_op_in_unsafe_fn)]

use super::error::{Status, to_status};
use std::slice;

/// Return a `Vec<i32>` with the same length as `row_count`, filled
/// with 1-based group ids according to `rows`.
pub fn group_indices(row_count: usize, rows: &[Vec<usize>]) -> Vec<i32> {
    let mut out = vec![0_i32; row_count];
    for (gidx, grows) in rows.iter().enumerate() {
        for &r in grows {
            // Safety: user code must supply valid indices.
            out[r - 1] = (gidx + 1) as i32;
        }
    }
    out
}

/// Extract group keys from group data, excluding the last column (.rows)
pub fn group_keys(group_data: &[Vec<usize>]) -> Vec<Vec<usize>> {
    if group_data.is_empty() {
        return Vec::new();
    }
    // Exclude the last column (.rows) - take all but the last
    group_data[..group_data.len() - 1].to_vec()
}

// -------- C-ABI shims (exported via lib.rs) --------

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_group_indices_i32(
    row_count: usize,
    ptr_groups: *const usize,
    group_starts: *const usize,
    group_lens: *const usize,
    groups_len: usize,
    ptr_out: *mut i32,
) -> Status {
    to_status(|| {
        // Build Vec<Vec<usize>> view without allocations
        let starts = unsafe { slice::from_raw_parts(group_starts, groups_len) };
        let lens = unsafe { slice::from_raw_parts(group_lens, groups_len) };
        let flat = unsafe {
            slice::from_raw_parts(ptr_groups, starts[groups_len - 1] + lens[groups_len - 1])
        };
        let mut rows: Vec<Vec<usize>> = Vec::with_capacity(groups_len);
        for (s, l) in starts.iter().zip(lens) {
            rows.push(flat[*s..*s + *l].to_vec());
        }
        let res = group_indices(row_count, &rows);
        unsafe { slice::from_raw_parts_mut(ptr_out, row_count) }.copy_from_slice(&res);
        Ok(())
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn dplyr_rs_group_keys(
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
