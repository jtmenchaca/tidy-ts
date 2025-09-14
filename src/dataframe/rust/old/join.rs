//! Hash-join engine backing inner_join() and left_join().
//
//! * Keys may be any Hash + Eq type; here we expose i64 and UTF-8 &str
//!   because those cover 99 % of real-world joins.
//! * The output is pair-of-row-index vectors **preserving duplicates** just
//!   like dplyr (e.g., 3 × 2 Cartesian when both sides have duplicates).
//!
//! API surface:
//!
//! text
//! pub fn inner_join_i64 ( … ) -> (Vec<usize>, Vec<usize>)
//! pub fn left_join_i64  ( … ) -> (Vec<usize>, Vec<Option<usize>>)
//! pub fn inner_join_str ( … ) -> (Vec<usize>, Vec<usize>)
//! pub fn left_join_str  ( … ) -> (Vec<usize>, Vec<Option<usize>>)
//!
//!
//! C-ABI shims are provided at the bottom for Deno FFI.
//!   * dplyr_rs_inner_join_i64, dplyr_rs_left_join_i64
//!   * dplyr_rs_inner_join_str, dplyr_rs_left_join_str
//!
//! All indices are **0-based** internally; convert to 1-based outside if
//! you need exact R semantics.

#![deny(unsafe_op_in_unsafe_fn)]

use std::collections::HashMap;

// ---------------------------------------------------------------------------
//                             Generic helpers
// ---------------------------------------------------------------------------

/// Build a hash-map from key → Vec<row_idx>.
fn build_index<K: Eq + std::hash::Hash + Copy>(keys: &[K]) -> HashMap<K, Vec<usize>> {
    let mut map: HashMap<K, Vec<usize>> = HashMap::with_capacity(keys.len());
    for (row, &k) in keys.iter().enumerate() {
        map.entry(k).or_default().push(row);
    }
    map
}

/// Estimate total output length for inner joins
fn est_len<K: Eq + std::hash::Hash>(left_keys: &[K], right_map: &HashMap<K, Vec<usize>>) -> usize {
    left_keys
        .iter()
        .map(|k| right_map.get(k).map_or(0, |v| v.len()))
        .sum()
}

/// Estimate total output length for left joins (includes unmatched left rows)
fn est_len_left<K: Eq + std::hash::Hash>(
    left_keys: &[K],
    right_map: &HashMap<K, Vec<usize>>,
) -> usize {
    left_keys
        .iter()
        .map(|k| right_map.get(k).map_or(1, |v| v.len().max(1)))
        .sum()
}

// ---------------------------------------------------------------------------
//                                i64 joins
// ---------------------------------------------------------------------------

pub fn inner_join_i64(left_keys: &[i64], right_keys: &[i64]) -> (Vec<usize>, Vec<usize>) {
    let right_map = build_index(right_keys);

    let mut out_left = Vec::<usize>::new();
    let mut out_right = Vec::<usize>::new();

    for (lrow, &k) in left_keys.iter().enumerate() {
        if let Some(rr) = right_map.get(&k) {
            for &rrow in rr {
                out_left.push(lrow);
                out_right.push(rrow);
            }
        }
    }
    (out_left, out_right)
}

pub fn left_join_i64(left_keys: &[i64], right_keys: &[i64]) -> (Vec<usize>, Vec<Option<usize>>) {
    let right_map = build_index(right_keys);

    let mut out_left = Vec::<usize>::new();
    let mut out_right = Vec::<Option<usize>>::new();

    for (lrow, &k) in left_keys.iter().enumerate() {
        match right_map.get(&k) {
            Some(rr) => {
                for (i, &rrow) in rr.iter().enumerate() {
                    if i == 0 {
                        out_left.push(lrow);
                    } else {
                        out_left.push(lrow); // repeat left row
                    }
                    out_right.push(Some(rrow));
                }
            }
            None => {
                out_left.push(lrow);
                out_right.push(None);
            }
        }
    }
    (out_left, out_right)
}

// ---------------------------------------------------------------------------
//                               string joins
// ---------------------------------------------------------------------------

pub fn inner_join_str<'a>(
    left_keys: &[&'a str],
    right_keys: &[&'a str],
) -> (Vec<usize>, Vec<usize>) {
    let right_map = build_index(right_keys);

    let mut out_left = Vec::<usize>::new();
    let mut out_right = Vec::<usize>::new();

    for (lrow, &k) in left_keys.iter().enumerate() {
        if let Some(rr) = right_map.get(&k) {
            for &rrow in rr {
                out_left.push(lrow);
                out_right.push(rrow);
            }
        }
    }
    (out_left, out_right)
}

pub fn left_join_str<'a>(
    left_keys: &[&'a str],
    right_keys: &[&'a str],
) -> (Vec<usize>, Vec<Option<usize>>) {
    let right_map = build_index(right_keys);

    let mut out_left = Vec::<usize>::new();
    let mut out_right = Vec::<Option<usize>>::new();

    for (lrow, &k) in left_keys.iter().enumerate() {
        match right_map.get(&k) {
            Some(rr) => {
                for &rrow in rr {
                    out_left.push(lrow);
                    out_right.push(Some(rrow));
                }
            }
            None => {
                out_left.push(lrow);
                out_right.push(None);
            }
        }
    }
    (out_left, out_right)
}

// ---------------------------------------------------------------------------
//                             Right join
// ---------------------------------------------------------------------------

pub fn right_join_i64(left_keys: &[i64], right_keys: &[i64]) -> (Vec<Option<usize>>, Vec<usize>) {
    let left_map = build_index(left_keys);

    let mut out_left = Vec::<Option<usize>>::new();
    let mut out_right = Vec::<usize>::new();

    for (rrow, &k) in right_keys.iter().enumerate() {
        match left_map.get(&k) {
            Some(ll) => {
                for &lrow in ll {
                    out_left.push(Some(lrow));
                    out_right.push(rrow);
                }
            }
            None => {
                out_left.push(None);
                out_right.push(rrow);
            }
        }
    }
    (out_left, out_right)
}

pub fn right_join_str<'a>(
    left_keys: &[&'a str],
    right_keys: &[&'a str],
) -> (Vec<Option<usize>>, Vec<usize>) {
    let left_map = build_index(left_keys);

    let mut out_left = Vec::<Option<usize>>::new();
    let mut out_right = Vec::<usize>::new();

    for (rrow, &k) in right_keys.iter().enumerate() {
        match left_map.get(&k) {
            Some(ll) => {
                for &lrow in ll {
                    out_left.push(Some(lrow));
                    out_right.push(rrow);
                }
            }
            None => {
                out_left.push(None);
                out_right.push(rrow);
            }
        }
    }
    (out_left, out_right)
}

// ---------------------------------------------------------------------------
//                             Outer join (Full join)
// ---------------------------------------------------------------------------

// ===============================
// Optimized outer join (i64) - WASM
// ===============================
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn outer_join_i64_u32(l: &[i64], r: &[i64]) -> JoinIdxU32 {
    use std::collections::{HashMap, HashSet};

    let right_map: HashMap<i64, Vec<usize>> = build_index(r);
    let left_set: HashSet<i64> = l.iter().copied().collect();

    // left side capacity (matches + left-unmatched NA)
    let left_matches = est_len_left(l, &right_map);
    // exact right-unmatched
    let mut right_unmatched_total = 0usize;
    for (k, idxs) in right_map.iter() {
        if !left_set.contains(k) {
            right_unmatched_total += idxs.len();
        }
    }
    let total = left_matches + right_unmatched_total;

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    // pass 1: left rows
    for (lrow, &k) in l.iter().enumerate() {
        if let Some(rr) = right_map.get(&k) {
            for &rrow in rr {
                out_left.push(lrow as u32);
                out_right.push(rrow as u32);
            }
        } else {
            out_left.push(lrow as u32);
            out_right.push(u32::MAX); // NA sentinel
        }
    }

    // pass 2: only right keys that don't exist in left
    for (k, rr) in right_map.iter() {
        if !left_set.contains(k) {
            for &rrow in rr {
                out_left.push(u32::MAX); // NA
                out_right.push(rrow as u32);
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

// ===============================
// Optimized outer join (string) - WASM
// ===============================
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn outer_join_str_u32(l: Vec<String>, r: Vec<String>) -> JoinIdxU32 {
    use std::collections::{HashMap, HashSet};

    let left_refs: Vec<&str> = l.iter().map(|s| s.as_str()).collect();
    let right_refs: Vec<&str> = r.iter().map(|s| s.as_str()).collect();

    let right_map: HashMap<&str, Vec<usize>> = build_index(&right_refs);
    let left_set: HashSet<&str> = left_refs.iter().copied().collect();

    let left_matches = est_len_left(&left_refs, &right_map);
    let mut right_unmatched_total = 0usize;
    for (k, idxs) in right_map.iter() {
        if !left_set.contains(k) {
            right_unmatched_total += idxs.len();
        }
    }
    let total = left_matches + right_unmatched_total;

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (lrow, &k) in left_refs.iter().enumerate() {
        if let Some(rr) = right_map.get(&k) {
            for &rrow in rr {
                out_left.push(lrow as u32);
                out_right.push(rrow as u32);
            }
        } else {
            out_left.push(lrow as u32);
            out_right.push(u32::MAX); // NA
        }
    }

    for (k, rr) in right_map.iter() {
        if !left_set.contains(k) {
            for &rrow in rr {
                out_left.push(u32::MAX); // NA
                out_right.push(rrow as u32);
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

// ---------------------------------------------------------------------------
//                             Cross join (Cartesian product)
// ---------------------------------------------------------------------------

pub fn cross_join(left_len: usize, right_len: usize) -> (Vec<usize>, Vec<usize>) {
    let total = left_len * right_len;
    let mut out_left = Vec::<usize>::with_capacity(total);
    let mut out_right = Vec::<usize>::with_capacity(total);

    for lrow in 0..left_len {
        for rrow in 0..right_len {
            out_left.push(lrow);
            out_right.push(rrow);
        }
    }

    (out_left, out_right)
}

/// Cross join (Cartesian product) - WASM export returning u32 indices
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn cross_join_u32(left_len: usize, right_len: usize) -> JoinIdxU32 {
    let (left_indices, right_indices) = cross_join(left_len, right_len);
    
    JoinIdxU32 {
        left: left_indices.into_iter().map(|x| x as u32).collect(),
        right: right_indices.into_iter().map(|x| x as u32).collect(),
    }
}

// ---------------------------------------------------------------------------
//                          C-ABI export helpers
// ---------------------------------------------------------------------------

use std::slice;

/// Serialise (left,right) into a single malloc’d buffer:
///
/// [len:usize] [left …] [right …]
///   * for Vec<Option<usize>> we store usize::MAX to mean NA
unsafe fn pack_pair(left: Vec<usize>, right: Vec<Option<usize>>) -> *mut usize {
    let len = left.len();
    debug_assert_eq!(len, right.len());

    let mut buf: Vec<usize> = Vec::with_capacity(1 + len * 2);
    buf.push(len);
    buf.extend(left);
    buf.extend(right.into_iter().map(|opt| opt.unwrap_or(usize::MAX)));

    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}
unsafe fn pack_pair_plain(left: Vec<usize>, right: Vec<usize>) -> *mut usize {
    let len = left.len();
    debug_assert_eq!(len, right.len());

    let mut buf: Vec<usize> = Vec::with_capacity(1 + len * 2);
    buf.push(len);
    buf.extend(left);
    buf.extend(right);

    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

// --------------- i64 shims ---------------

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dplyr_rs_inner_join_i64(
    left_ptr: *const i64,
    right_ptr: *const i64,
    n_left: usize,
    n_right: usize,
) -> *mut usize {
    let l = unsafe { slice::from_raw_parts(left_ptr, n_left) };
    let r = unsafe { slice::from_raw_parts(right_ptr, n_right) };
    let (o_left, o_right) = inner_join_i64(l, r);
    unsafe { pack_pair_plain(o_left, o_right) }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dplyr_rs_left_join_i64(
    left_ptr: *const i64,
    right_ptr: *const i64,
    n_left: usize,
    n_right: usize,
) -> *mut usize {
    let l = unsafe { slice::from_raw_parts(left_ptr, n_left) };
    let r = unsafe { slice::from_raw_parts(right_ptr, n_right) };
    let (o_left, o_right) = left_join_i64(l, r);
    unsafe { pack_pair(o_left, o_right) }
}

// --------------- string shims ---------------
//
// We accept *const *const u8 + len*len array of C strings.

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dplyr_rs_inner_join_str(
    left_ptr: *const *const u8,
    right_ptr: *const *const u8,
    n_left: usize,
    n_right: usize,
) -> *mut usize {
    let l_raw = unsafe { slice::from_raw_parts(left_ptr, n_left) };
    let r_raw = unsafe { slice::from_raw_parts(right_ptr, n_right) };

    let l: Vec<&str> = l_raw
        .iter()
        .map(|&p| unsafe { std::ffi::CStr::from_ptr(p as *const i8).to_str().unwrap() })
        .collect();
    let r: Vec<&str> = r_raw
        .iter()
        .map(|&p| unsafe { std::ffi::CStr::from_ptr(p as *const i8).to_str().unwrap() })
        .collect();

    let (o_left, o_right) = inner_join_str(&l, &r);
    unsafe { pack_pair_plain(o_left, o_right) }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dplyr_rs_left_join_str(
    left_ptr: *const *const u8,
    right_ptr: *const *const u8,
    n_left: usize,
    n_right: usize,
) -> *mut usize {
    let l_raw = unsafe { slice::from_raw_parts(left_ptr, n_left) };
    let r_raw = unsafe { slice::from_raw_parts(right_ptr, n_right) };

    let l: Vec<&str> = l_raw
        .iter()
        .map(|&p| unsafe { std::ffi::CStr::from_ptr(p as *const i8).to_str().unwrap() })
        .collect();
    let r: Vec<&str> = r_raw
        .iter()
        .map(|&p| unsafe { std::ffi::CStr::from_ptr(p as *const i8).to_str().unwrap() })
        .collect();

    let (o_left, o_right) = left_join_str(&l, &r);
    unsafe { pack_pair(o_left, o_right) }
}

// ===============================
//           WASM Bindings
// ===============================

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
//                    OPTIMIZED TYPED ARRAY WASM EXPORTS
// ---------------------------------------------------------------------------

/// Optimized WASM join result using packed u32 arrays with sentinel values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct JoinIdxU32 {
    left: Vec<u32>,
    right: Vec<u32>,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl JoinIdxU32 {
    /// Move out the left indices (no clone)
    #[wasm_bindgen(js_name = takeLeft)]
    pub fn take_left(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.left).into_boxed_slice()
    }

    /// Move out the right indices (no clone)  
    #[wasm_bindgen(js_name = takeRight)]
    pub fn take_right(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.right).into_boxed_slice()
    }
}

/// Optimized inner join for i64 keys - returns typed u32 arrays
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn inner_join_i64_u32(l: &[i64], r: &[i64]) -> JoinIdxU32 {
    let right_map = build_index(r);
    let total = est_len(l, &right_map);

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (lrow, &k) in l.iter().enumerate() {
        if let Some(rr) = right_map.get(&k) {
            for &rrow in rr {
                out_left.push(lrow as u32);
                out_right.push(rrow as u32);
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

/// Optimized left join for i64 keys - returns typed u32 arrays (u32::MAX as NA)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn left_join_i64_u32(l: &[i64], r: &[i64]) -> JoinIdxU32 {
    let right_map = build_index(r);
    let total = est_len_left(l, &right_map);

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (lrow, &k) in l.iter().enumerate() {
        match right_map.get(&k) {
            Some(rr) => {
                for &rrow in rr {
                    out_left.push(lrow as u32);
                    out_right.push(rrow as u32);
                }
            }
            None => {
                out_left.push(lrow as u32);
                out_right.push(u32::MAX); // NA sentinel
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

/// Optimized inner join for string keys - returns typed u32 arrays
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn inner_join_str_u32(l: Vec<String>, r: Vec<String>) -> JoinIdxU32 {
    let left_refs: Vec<&str> = l.iter().map(|s| s.as_str()).collect();
    let right_refs: Vec<&str> = r.iter().map(|s| s.as_str()).collect();

    let right_map = build_index(&right_refs);
    let total = est_len(&left_refs, &right_map);

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (lrow, &k) in left_refs.iter().enumerate() {
        if let Some(rr) = right_map.get(&k) {
            for &rrow in rr {
                out_left.push(lrow as u32);
                out_right.push(rrow as u32);
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

/// Optimized left join for string keys - returns typed u32 arrays (u32::MAX as NA)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn left_join_str_u32(l: Vec<String>, r: Vec<String>) -> JoinIdxU32 {
    let left_refs: Vec<&str> = l.iter().map(|s| s.as_str()).collect();
    let right_refs: Vec<&str> = r.iter().map(|s| s.as_str()).collect();

    let right_map = build_index(&right_refs);
    let total = est_len_left(&left_refs, &right_map);

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (lrow, &k) in left_refs.iter().enumerate() {
        match right_map.get(&k) {
            Some(rr) => {
                for &rrow in rr {
                    out_left.push(lrow as u32);
                    out_right.push(rrow as u32);
                }
            }
            None => {
                out_left.push(lrow as u32);
                out_right.push(u32::MAX); // NA sentinel
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

/// Optimized right join for i64 keys - returns typed u32 arrays (u32::MAX as NA)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn right_join_i64_u32(l: &[i64], r: &[i64]) -> JoinIdxU32 {
    let left_map = build_index(l);
    let total = est_len_left(r, &left_map);

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (rrow, &k) in r.iter().enumerate() {
        match left_map.get(&k) {
            Some(ll) => {
                for &lrow in ll {
                    out_left.push(lrow as u32);
                    out_right.push(rrow as u32);
                }
            }
            None => {
                out_left.push(u32::MAX); // NA sentinel
                out_right.push(rrow as u32);
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}

/// Optimized right join for string keys - returns typed u32 arrays (u32::MAX as NA)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn right_join_str_u32(l: Vec<String>, r: Vec<String>) -> JoinIdxU32 {
    let left_refs: Vec<&str> = l.iter().map(|s| s.as_str()).collect();
    let right_refs: Vec<&str> = r.iter().map(|s| s.as_str()).collect();

    let left_map = build_index(&left_refs);
    let total = est_len_left(&right_refs, &left_map);

    let mut out_left = Vec::with_capacity(total);
    let mut out_right = Vec::with_capacity(total);

    for (rrow, &k) in right_refs.iter().enumerate() {
        match left_map.get(&k) {
            Some(ll) => {
                for &lrow in ll {
                    out_left.push(lrow as u32);
                    out_right.push(rrow as u32);
                }
            }
            None => {
                out_left.push(u32::MAX); // NA sentinel
                out_right.push(rrow as u32);
            }
        }
    }

    JoinIdxU32 {
        left: out_left,
        right: out_right,
    }
}
