//! High-performance grouping operations with dictionary-coded keys
//!
//! This module provides efficient grouping kernels that work with pre-encoded
//! integer keys instead of strings, avoiding expensive string operations
//! and WASM boundary crossings.

#[cfg(feature = "wasm")]
use smallvec::SmallVec;
#[cfg(feature = "wasm")]
use std::collections::HashMap;
#[cfg(feature = "wasm")]
use std::collections::hash_map::{Entry, RandomState};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Grouping result that contains all information in one pass
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct Grouping {
    gid_per_row: Vec<u32>,
    unique_keys: Vec<u32>, // row-major (group then columns)
    pub n_groups: u32,
    pub n_key_cols: u32,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl Grouping {
    // Move the buffers out without cloning
    #[wasm_bindgen(js_name = takeGidPerRow)]
    pub fn take_gid_per_row(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.gid_per_row).into_boxed_slice()
    }

    #[wasm_bindgen(js_name = takeUniqueKeys)]
    pub fn take_unique_keys(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.unique_keys).into_boxed_slice()
    }
}

/// Perform grouping in a single pass, returning all necessary data
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn group_ids_codes_all(keys_codes: &[u32], n_rows: usize, n_key_cols: usize) -> Grouping {
    type RowKey = SmallVec<[u32; 8]>;
    let build = RandomState::new();
    let mut map: HashMap<RowKey, u32, RandomState> =
        HashMap::with_capacity_and_hasher(n_rows.min(1 << 20), build);

    let mut gid = vec![0u32; n_rows];
    let mut uniq: Vec<u32> = Vec::with_capacity(n_rows.min(1 << 20) * n_key_cols);
    let mut ng: u32 = 0;

    #[inline(always)]
    fn key_for_row(buf: &[u32], n_rows: usize, n_key_cols: usize, row: usize) -> RowKey {
        let mut k: RowKey = SmallVec::with_capacity(n_key_cols);
        for c in 0..n_key_cols {
            k.push(unsafe { *buf.get_unchecked(c * n_rows + row) });
        }
        k
    }

    for row in 0..n_rows {
        let key = key_for_row(keys_codes, n_rows, n_key_cols, row);
        match map.entry(key) {
            Entry::Occupied(e) => {
                gid[row] = *e.get();
            }
            Entry::Vacant(v) => {
                let g = ng;
                ng += 1;
                let k = v.key(); // borrow inserted key
                uniq.extend_from_slice(k); // first-seen group order
                v.insert(g);
                gid[row] = g;
            }
        }
    }

    Grouping {
        gid_per_row: gid,
        unique_keys: uniq,
        n_groups: ng,
        n_key_cols: n_key_cols as u32,
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn group_ids_codes(keys_codes: &[u32], n_rows: usize, n_key_cols: usize) -> Vec<u32> {
    type RowKey = SmallVec<[u32; 8]>;
    let mut map: HashMap<RowKey, u32> = HashMap::with_capacity(n_rows.min(1 << 20));

    let mut gid_per_row = vec![0u32; n_rows];
    let mut uniq: Vec<u32> = Vec::with_capacity(n_rows.min(1 << 20) * n_key_cols);
    let mut n_groups: u32 = 0;

    #[inline(always)]
    fn key_for_row<'a>(buf: &'a [u32], n_rows: usize, n_key_cols: usize, row: usize) -> RowKey {
        let mut k: RowKey = SmallVec::with_capacity(n_key_cols);
        for c in 0..n_key_cols {
            // SAFETY: caller guarantees shape
            k.push(unsafe { *buf.get_unchecked(c * n_rows + row) });
        }
        k
    }

    for row in 0..n_rows {
        let key = key_for_row(keys_codes, n_rows, n_key_cols, row);
        if let Some(&existing_gid) = map.get(&key) {
            gid_per_row[row] = existing_gid;
        } else {
            let g = n_groups;
            n_groups += 1;
            uniq.extend_from_slice(&key); // first-seen group order
            map.insert(key, g);
            gid_per_row[row] = g;
        }
    }

    gid_per_row
}

/// Get unique group keys from grouping operation
///
/// This function needs to be called after group_ids_codes to get the unique keys.
/// The keys are stored in row-major order (group then columns).
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn get_unique_group_keys(keys_codes: &[u32], n_rows: usize, n_key_cols: usize) -> Vec<u32> {
    type RowKey = SmallVec<[u32; 8]>;

    let mut map: HashMap<RowKey, u32> = HashMap::with_capacity(n_rows.min(1 << 20));
    let mut uniq: Vec<u32> = Vec::with_capacity(n_rows.min(1 << 20) * n_key_cols);
    let mut n_groups: u32 = 0;

    let mk_key = |row: usize| {
        let mut k: RowKey = SmallVec::with_capacity(n_key_cols);
        for c in 0..n_key_cols {
            k.push(unsafe { *keys_codes.get_unchecked(c * n_rows + row) });
        }
        k
    };

    for row in 0..n_rows {
        let key = mk_key(row);
        if !map.contains_key(&key) {
            let g = n_groups;
            n_groups += 1;
            let k = key.clone();
            uniq.extend_from_slice(&k);
            map.insert(key, g);
        }
    }

    uniq
}

/// Get number of groups from grouping operation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn get_group_count(keys_codes: &[u32], n_rows: usize, n_key_cols: usize) -> u32 {
    type RowKey = SmallVec<[u32; 8]>;

    let mut map: HashMap<RowKey, u32> = HashMap::with_capacity(n_rows.min(1 << 20));

    let mk_key = |row: usize| {
        let mut k: RowKey = SmallVec::with_capacity(n_key_cols);
        for c in 0..n_key_cols {
            k.push(unsafe { *keys_codes.get_unchecked(c * n_rows + row) });
        }
        k
    };

    for row in 0..n_rows {
        let key = mk_key(row);
        if !map.contains_key(&key) {
            map.insert(key, map.len() as u32);
        }
    }

    map.len() as u32
}

/// Get group information for a specific group
///
/// Args:
/// - unique_keys: Unique group keys from group_ids_codes
/// - n_key_cols: Number of key columns
/// - group_id: Group ID to get information for
///
/// Returns:
/// - key_values: The group's key values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn get_group_info(unique_keys: &[u32], n_key_cols: usize, group_id: u32) -> Vec<u32> {
    let start_idx = (group_id as usize) * n_key_cols;
    let end_idx = start_idx + n_key_cols;

    unique_keys[start_idx..end_idx].to_vec()
}
