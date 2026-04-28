//! Join + gather: does the hash join AND result column gathering in Rust.
//! Eliminates TS-side convertToTypedArrays, view gather, and result column copy.

#[cfg(feature = "napi-rs")]
use napi_derive::napi;
#[cfg(feature = "napi-rs")]
use napi::bindgen_prelude::Float64Array;

#[cfg(feature = "napi-rs")]
use super::shared_types::NapiJoinGatherResult;

#[cfg(feature = "napi-rs")]
use super::join_helpers::{
    build_csr_from_keys_u64, mix64, SENTINEL,
};

// ---------------------------------------------------------------------------
// Key encoding: f64 → u64 for hash join (replaces TS convertToTypedArrays)
// ---------------------------------------------------------------------------

#[cfg(feature = "napi-rs")]
#[inline(always)]
fn f64_to_join_key(v: f64) -> u64 {
    if v.is_nan() {
        return u64::MAX;
    }
    // Use bit pattern directly — identical f64 values have identical bits
    let bits = v.to_bits();
    // Mix for good hash distribution
    mix64(bits)
}

// ---------------------------------------------------------------------------
// Single-key hash join on f64 columns
// ---------------------------------------------------------------------------

#[cfg(feature = "napi-rs")]
fn inner_join_f64_1col(left: &[f64], right: &[f64]) -> (Vec<u32>, Vec<u32>) {
    // Build hash keys for right side
    let rkeys: Vec<u64> = right.iter().map(|&v| f64_to_join_key(v)).collect();
    let (map, adj) = build_csr_from_keys_u64(&rkeys);

    let n_left = left.len();

    // Sizing pass
    let mut total = 0usize;
    let lkeys: Vec<u64> = left.iter().map(|&v| f64_to_join_key(v)).collect();
    for i in 0..n_left {
        total += map.get(&lkeys[i]).map(|o| {
            // Verify actual equality (hash collisions possible after mix64)
            let start = o.start as usize;
            let end = start + o.len as usize;
            let mut count = 0usize;
            for pos in start..end {
                if right[adj[pos] as usize] == left[i] || (right[adj[pos] as usize].is_nan() && left[i].is_nan()) {
                    count += 1;
                }
            }
            count
        }).unwrap_or(0);
    }

    // Fill
    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if right[rj] == left[i] || (right[rj].is_nan() && left[i].is_nan()) {
                    left_out.push(i as u32);
                    right_out.push(rj as u32);
                }
            }
        }
    }

    (left_out, right_out)
}

#[cfg(feature = "napi-rs")]
fn left_join_f64_1col(left: &[f64], right: &[f64]) -> (Vec<u32>, Vec<u32>) {
    let rkeys: Vec<u64> = right.iter().map(|&v| f64_to_join_key(v)).collect();
    let (map, adj) = build_csr_from_keys_u64(&rkeys);

    let n_left = left.len();
    let lkeys: Vec<u64> = left.iter().map(|&v| f64_to_join_key(v)).collect();

    // Sizing pass
    let mut total = 0usize;
    for i in 0..n_left {
        let count = map.get(&lkeys[i]).map(|o| {
            let start = o.start as usize;
            let end = start + o.len as usize;
            let mut c = 0usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if right[rj] == left[i] || (right[rj].is_nan() && left[i].is_nan()) {
                    c += 1;
                }
            }
            c
        }).unwrap_or(0);
        total += if count > 0 { count } else { 1 };
    }

    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for i in 0..n_left {
        let mut matched = false;
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if right[rj] == left[i] || (right[rj].is_nan() && left[i].is_nan()) {
                    left_out.push(i as u32);
                    right_out.push(rj as u32);
                    matched = true;
                }
            }
        }
        if !matched {
            left_out.push(i as u32);
            right_out.push(SENTINEL);
        }
    }

    (left_out, right_out)
}

// ---------------------------------------------------------------------------
// Multi-key hash join on f64 columns
// ---------------------------------------------------------------------------

#[cfg(feature = "napi-rs")]
fn encode_multi_key(cols: &[&[f64]], row: usize) -> u64 {
    let mut h = 0x9E3779B97F4A7C15u64;
    for col in cols {
        h = mix64(h ^ col[row].to_bits());
    }
    h
}

#[cfg(feature = "napi-rs")]
fn rows_equal_f64(left_cols: &[&[f64]], right_cols: &[&[f64]], li: usize, rj: usize) -> bool {
    for c in 0..left_cols.len().min(right_cols.len()) {
        let lv = left_cols[c][li];
        let rv = right_cols[c][rj];
        if lv != rv && !(lv.is_nan() && rv.is_nan()) {
            return false;
        }
    }
    true
}

#[cfg(feature = "napi-rs")]
fn inner_join_f64_multi(left_cols: &[&[f64]], right_cols: &[&[f64]]) -> (Vec<u32>, Vec<u32>) {
    let n_left = left_cols[0].len();
    let n_right = right_cols[0].len();

    let rkeys: Vec<u64> = (0..n_right).map(|j| encode_multi_key(right_cols, j)).collect();
    let (map, adj) = build_csr_from_keys_u64(&rkeys);
    let lkeys: Vec<u64> = (0..n_left).map(|i| encode_multi_key(left_cols, i)).collect();

    // Sizing
    let mut total = 0usize;
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                if rows_equal_f64(left_cols, right_cols, i, adj[pos] as usize) {
                    total += 1;
                }
            }
        }
    }

    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if rows_equal_f64(left_cols, right_cols, i, rj) {
                    left_out.push(i as u32);
                    right_out.push(rj as u32);
                }
            }
        }
    }

    (left_out, right_out)
}

#[cfg(feature = "napi-rs")]
fn left_join_f64_multi(left_cols: &[&[f64]], right_cols: &[&[f64]]) -> (Vec<u32>, Vec<u32>) {
    let n_left = left_cols[0].len();
    let n_right = right_cols[0].len();

    let rkeys: Vec<u64> = (0..n_right).map(|j| encode_multi_key(right_cols, j)).collect();
    let (map, adj) = build_csr_from_keys_u64(&rkeys);
    let lkeys: Vec<u64> = (0..n_left).map(|i| encode_multi_key(left_cols, i)).collect();

    let mut total = 0usize;
    for i in 0..n_left {
        let count = map.get(&lkeys[i]).map(|off| {
            let start = off.start as usize;
            let end = start + off.len as usize;
            let mut c = 0usize;
            for pos in start..end {
                if rows_equal_f64(left_cols, right_cols, i, adj[pos] as usize) {
                    c += 1;
                }
            }
            c
        }).unwrap_or(0);
        total += if count > 0 { count } else { 1 };
    }

    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for i in 0..n_left {
        let mut matched = false;
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if rows_equal_f64(left_cols, right_cols, i, rj) {
                    left_out.push(i as u32);
                    right_out.push(rj as u32);
                    matched = true;
                }
            }
        }
        if !matched {
            left_out.push(i as u32);
            right_out.push(SENTINEL);
        }
    }

    (left_out, right_out)
}

// ---------------------------------------------------------------------------
// Gather: apply join indices to value columns
// ---------------------------------------------------------------------------

#[cfg(feature = "napi-rs")]
fn gather_f64(src: &[f64], indices: &[u32]) -> Vec<f64> {
    let n = indices.len();
    let mut out = vec![0.0f64; n];
    for (i, &idx) in indices.iter().enumerate() {
        unsafe { *out.get_unchecked_mut(i) = *src.get_unchecked(idx as usize); }
    }
    out
}

#[cfg(feature = "napi-rs")]
fn gather_f64_nullable(src: &[f64], indices: &[u32]) -> Vec<f64> {
    let n = indices.len();
    let mut out = vec![0.0f64; n];
    for (i, &idx) in indices.iter().enumerate() {
        unsafe {
            *out.get_unchecked_mut(i) = if idx == SENTINEL {
                f64::NAN
            } else {
                *src.get_unchecked(idx as usize)
            };
        }
    }
    out
}

// ---------------------------------------------------------------------------
// Public napi API: inner join + gather
// ---------------------------------------------------------------------------

/// Full inner join: hash join on f64 key columns + gather all f64 value columns.
/// Eliminates TS convertToTypedArrays, view gather, and result column copy.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn inner_join_gather_f64_napi(
    left_key_cols: Vec<&[f64]>,
    right_key_cols: Vec<&[f64]>,
    left_value_cols: Vec<&[f64]>,
    right_value_cols: Vec<&[f64]>,
) -> NapiJoinGatherResult {
    let n_key_cols = left_key_cols.len().min(right_key_cols.len());

    if n_key_cols == 0 || left_key_cols[0].is_empty() || right_key_cols[0].is_empty() {
        return NapiJoinGatherResult {
            left_cols: Vec::new(),
            right_cols: Vec::new(),
            n_rows: 0,
        };
    }

    // Join
    let (left_idx, right_idx) = if n_key_cols == 1 {
        inner_join_f64_1col(left_key_cols[0], right_key_cols[0])
    } else {
        inner_join_f64_multi(&left_key_cols, &right_key_cols)
    };

    let n = left_idx.len() as u32;

    // Gather left value columns
    let left_gathered: Vec<Float64Array> = left_value_cols.iter()
        .map(|col| Float64Array::new(gather_f64(col, &left_idx)))
        .collect();

    // Gather right value columns
    let right_gathered: Vec<Float64Array> = right_value_cols.iter()
        .map(|col| Float64Array::new(gather_f64(col, &right_idx)))
        .collect();

    NapiJoinGatherResult {
        left_cols: left_gathered,
        right_cols: right_gathered,
        n_rows: n,
    }
}

/// Full left join: hash join on f64 key columns + gather all f64 value columns.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn left_join_gather_f64_napi(
    left_key_cols: Vec<&[f64]>,
    right_key_cols: Vec<&[f64]>,
    left_value_cols: Vec<&[f64]>,
    right_value_cols: Vec<&[f64]>,
) -> NapiJoinGatherResult {
    let n_key_cols = left_key_cols.len().min(right_key_cols.len());

    if n_key_cols == 0 || left_key_cols[0].is_empty() {
        return NapiJoinGatherResult {
            left_cols: Vec::new(),
            right_cols: Vec::new(),
            n_rows: 0,
        };
    }

    // Handle empty right
    if right_key_cols.is_empty() || right_key_cols[0].is_empty() {
        let n_left = left_key_cols[0].len();
        let left_idx: Vec<u32> = (0..n_left as u32).collect();
        let left_gathered: Vec<Float64Array> = left_value_cols.iter()
            .map(|col| Float64Array::new(gather_f64(col, &left_idx)))
            .collect();
        let right_gathered: Vec<Float64Array> = right_value_cols.iter()
            .map(|_| Float64Array::new(vec![f64::NAN; n_left]))
            .collect();
        return NapiJoinGatherResult {
            left_cols: left_gathered,
            right_cols: right_gathered,
            n_rows: n_left as u32,
        };
    }

    // Join
    let (left_idx, right_idx) = if n_key_cols == 1 {
        left_join_f64_1col(left_key_cols[0], right_key_cols[0])
    } else {
        left_join_f64_multi(&left_key_cols, &right_key_cols)
    };

    let n = left_idx.len() as u32;

    // Gather left value columns (all matched)
    let left_gathered: Vec<Float64Array> = left_value_cols.iter()
        .map(|col| Float64Array::new(gather_f64(col, &left_idx)))
        .collect();

    // Gather right value columns (nullable — SENTINEL → NaN)
    let right_gathered: Vec<Float64Array> = right_value_cols.iter()
        .map(|col| Float64Array::new(gather_f64_nullable(col, &right_idx)))
        .collect();

    NapiJoinGatherResult {
        left_cols: left_gathered,
        right_cols: right_gathered,
        n_rows: n,
    }
}

// ---------------------------------------------------------------------------
// Gather-only: apply pre-computed join indices to Float64Array columns
// This is the fast path: u32 hash join for index pairs, then Rust gather
// for column materialization (eliminates JS gather loops).
// ---------------------------------------------------------------------------

/// Gather Float64Array columns using pre-computed left indices (inner join).
/// Each input column is gathered by left_idx to produce an output column.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn gather_f64_columns_napi(
    columns: Vec<&[f64]>,
    indices: &[u32],
) -> Vec<Float64Array> {
    columns.iter()
        .map(|col| Float64Array::new(gather_f64(col, indices)))
        .collect()
}

/// Gather Float64Array columns using pre-computed right indices (left join).
/// SENTINEL indices produce NaN in the output.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn gather_f64_columns_nullable_napi(
    columns: Vec<&[f64]>,
    indices: &[u32],
) -> Vec<Float64Array> {
    columns.iter()
        .map(|col| Float64Array::new(gather_f64_nullable(col, indices)))
        .collect()
}

// ---------------------------------------------------------------------------
// String hashing: hash string arrays to u32 keys in Rust
// Uses FNV-1a hashing instead of JS polynomial hash.
// ---------------------------------------------------------------------------

/// Hash a single string to u32 for join key encoding.
#[cfg(feature = "napi-rs")]
#[inline]
fn hash_string_to_u32(s: &str) -> u32 {
    // FNV-1a 32-bit
    let mut h: u32 = 0x811c9dc5;
    for b in s.as_bytes() {
        h ^= *b as u32;
        h = h.wrapping_mul(0x01000193);
    }
    // Avoid reserved values (0-3 = null/undefined/bool, 0xFFFFFFFF = NaN)
    if h < 4 { h + 4 } else if h == 0xFFFFFFFF { 0xFFFFFFFE } else { h }
}

/// Hash an array of strings to Uint32Array for join key encoding.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn hash_strings_napi(strings: Vec<String>) -> napi::bindgen_prelude::Uint32Array {
    let mut out = vec![0u32; strings.len()];
    for (i, s) in strings.iter().enumerate() {
        out[i] = hash_string_to_u32(s);
    }
    napi::bindgen_prelude::Uint32Array::new(out)
}
