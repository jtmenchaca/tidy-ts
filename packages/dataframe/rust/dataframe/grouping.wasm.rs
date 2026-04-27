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
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

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

/// NAPI export for group_ids_codes_all - returns JSON string with gid_per_row, unique_keys, n_groups, n_key_cols
#[cfg(feature = "napi-rs")]
#[napi]
pub fn group_ids_codes_all_napi(keys_codes: &[u32], n_rows: u32, n_key_cols: u32) -> String {
    use smallvec::SmallVec;
    use std::collections::HashMap;
    use std::collections::hash_map::{Entry, RandomState};

    type RowKey = SmallVec<[u32; 8]>;
    let n_rows = n_rows as usize;
    let n_key_cols = n_key_cols as usize;
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
                let k = v.key();
                uniq.extend_from_slice(k);
                v.insert(g);
                gid[row] = g;
            }
        }
    }

    serde_json::to_string(&serde_json::json!({
        "gid_per_row": gid,
        "unique_keys": uniq,
        "n_groups": ng,
        "n_key_cols": n_key_cols as u32,
    })).unwrap()
}

