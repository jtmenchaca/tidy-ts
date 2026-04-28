//! Sorting/arrange operations WASM exports
//!
//! Optimizations (Polars-inspired):
//! - Tuple sort: pack (idx, value) for single-col → cache-local comparisons
//! - Null pre-partition: NaNs separated before sort → comparator never checks NaN
//! - Multi-col: first key inline in tuple, tie-break into remaining cols
//! - Rayon parallel sort on napi path

#![deny(unsafe_op_in_unsafe_fn)]

use std::cmp::Ordering;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;
#[cfg(feature = "napi-rs")]
use napi::bindgen_prelude::Uint32Array;
#[cfg(feature = "napi-rs")]
use rayon::prelude::*;

// ---------------------------------------------------------------------------
// Total-order f64 comparator (NaN = largest, no branches in hot path)
// ---------------------------------------------------------------------------

/// Total ordering for f64: NaN > everything, -0.0 == +0.0.
/// Used only in multi-col fallback where we can't pre-partition nulls.
#[inline(always)]
fn tot_cmp(a: f64, b: f64) -> Ordering {
    // Canonical bit pattern: map f64 to i64 so that natural i64 ordering
    // matches the desired f64 total order (NaN last).
    #[inline(always)]
    fn to_sortable(v: f64) -> i64 {
        let bits = v.to_bits() as i64;
        // Negative floats (sign bit set): flip all bits.
        // Positive floats / NaN: flip only sign bit.
        // This maps the entire f64 range to a monotonic i64 sequence,
        // with NaN (0x7FF8...) mapping to the largest values.
        if bits < 0 {
            !bits
        } else {
            bits ^ (1_i64 << 63)
        }
    }
    to_sortable(a).cmp(&to_sortable(b))
}

// ---------------------------------------------------------------------------
// Null (NaN) pre-partition
// ---------------------------------------------------------------------------

/// Partition a slice of (idx, f64) pairs: non-NaN values first, NaN values last.
/// NaN entries are sorted by original index to preserve insertion order.
/// Returns the count of non-NaN values.
fn partition_nans(pairs: &mut [(u32, f64)]) -> usize {
    // Two-pointer swap: non-NaN to front, NaN to back
    let mut lo = 0;
    let mut hi = pairs.len();
    while lo < hi {
        if pairs[lo].1.is_nan() {
            hi -= 1;
            pairs.swap(lo, hi);
        } else {
            lo += 1;
        }
    }
    // Sort NaN tail by original index to preserve insertion order
    let nan_tail = &mut pairs[lo..];
    nan_tail.sort_unstable_by_key(|p| p.0);
    lo // count of non-NaN
}

// ---------------------------------------------------------------------------
// Single-column sort: tuple (idx, f64) with NaN pre-partition
// ---------------------------------------------------------------------------

/// Single-column argsort with NaN pre-partition + tuple sort.
/// NaN values are placed at the end regardless of direction.
fn argsort_single_f64(col: &[f64], n_rows: usize, ascending: bool) -> Vec<u32> {
    let mut pairs: Vec<(u32, f64)> = Vec::with_capacity(n_rows);
    for i in 0..n_rows {
        pairs.push((i as u32, col[i]));
    }

    let valid_count = partition_nans(&mut pairs);

    // Sort only the non-NaN portion — comparator never sees NaN
    let valid = &mut pairs[..valid_count];
    if ascending {
        valid.sort_unstable_by(|a, b| tot_cmp(a.1, b.1));
    } else {
        valid.sort_unstable_by(|a, b| tot_cmp(b.1, a.1));
    }

    // Extract indices: sorted valid values, then NaN indices
    pairs.iter().map(|p| p.0).collect()
}

/// Parallel single-column argsort (napi path).
#[cfg(feature = "napi-rs")]
fn argsort_single_f64_par(col: &[f64], n_rows: usize, ascending: bool) -> Vec<u32> {
    let mut pairs: Vec<(u32, f64)> = Vec::with_capacity(n_rows);
    for i in 0..n_rows {
        pairs.push((i as u32, col[i]));
    }

    let valid_count = partition_nans(&mut pairs);

    let valid = &mut pairs[..valid_count];
    if ascending {
        valid.par_sort_unstable_by(|a, b| tot_cmp(a.1, b.1));
    } else {
        valid.par_sort_unstable_by(|a, b| tot_cmp(b.1, a.1));
    }

    pairs.iter().map(|p| p.0).collect()
}

// ---------------------------------------------------------------------------
// Multi-column sort: first key in tuple, tie-break into remaining cols
// ---------------------------------------------------------------------------

/// Multi-column argsort. First key is packed in the tuple for cache locality.
/// Tie-breaking reads remaining columns from flat_cols (column-major).
fn argsort_multi_f64(
    flat_cols: &[f64],
    n_rows: usize,
    n_cols: usize,
    dirs: &[i8],
) -> Vec<u32> {
    debug_assert_eq!(dirs.len(), n_cols);
    debug_assert_eq!(flat_cols.len(), n_rows * n_cols);

    // Pack (idx, first_key_value) for cache locality on primary sort key
    let mut pairs: Vec<(u32, f64)> = Vec::with_capacity(n_rows);
    for i in 0..n_rows {
        pairs.push((i as u32, flat_cols[i])); // col 0 at offset 0*n_rows + i
    }

    let asc0 = dirs[0] > 0;

    pairs.sort_unstable_by(|a, b| {
        // Primary key: inline in tuple (no indirection)
        let ord0 = tot_cmp(a.1, b.1);
        let ord0 = if asc0 { ord0 } else { ord0.reverse() };
        if ord0 != Ordering::Equal {
            return ord0;
        }
        // Tie-break: remaining columns (indirect into flat_cols)
        let ai = a.0 as usize;
        let bi = b.0 as usize;
        for k in 1..n_cols {
            let ua = unsafe { *flat_cols.get_unchecked(k * n_rows + ai) };
            let ub = unsafe { *flat_cols.get_unchecked(k * n_rows + bi) };
            let ord = tot_cmp(ua, ub);
            let ord = if dirs[k] > 0 { ord } else { ord.reverse() };
            if ord != Ordering::Equal {
                return ord;
            }
        }
        Ordering::Equal
    });

    pairs.iter().map(|p| p.0).collect()
}

/// Parallel multi-column argsort (napi path).
#[cfg(feature = "napi-rs")]
fn argsort_multi_f64_par(
    flat_cols: &[f64],
    n_rows: usize,
    n_cols: usize,
    dirs: &[i8],
) -> Vec<u32> {
    debug_assert_eq!(dirs.len(), n_cols);
    debug_assert_eq!(flat_cols.len(), n_rows * n_cols);

    let mut pairs: Vec<(u32, f64)> = Vec::with_capacity(n_rows);
    for i in 0..n_rows {
        pairs.push((i as u32, flat_cols[i]));
    }

    let asc0 = dirs[0] > 0;

    pairs.par_sort_unstable_by(|a, b| {
        let ord0 = tot_cmp(a.1, b.1);
        let ord0 = if asc0 { ord0 } else { ord0.reverse() };
        if ord0 != Ordering::Equal {
            return ord0;
        }
        let ai = a.0 as usize;
        let bi = b.0 as usize;
        for k in 1..n_cols {
            let ua = unsafe { *flat_cols.get_unchecked(k * n_rows + ai) };
            let ub = unsafe { *flat_cols.get_unchecked(k * n_rows + bi) };
            let ord = tot_cmp(ua, ub);
            let ord = if dirs[k] > 0 { ord } else { ord.reverse() };
            if ord != Ordering::Equal {
                return ord;
            }
        }
        Ordering::Equal
    });

    pairs.iter().map(|p| p.0).collect()
}

// ---------------------------------------------------------------------------
// Top-level dispatch: single-col → tuple+partition, multi-col → tuple+tiebreak
// ---------------------------------------------------------------------------

/// WASM sort dispatch (single-threaded).
fn arrange_indices_f64(
    flat_cols: &[f64],
    n_rows: usize,
    n_cols: usize,
    dirs: &[i8],
) -> Vec<u32> {
    if n_cols == 1 {
        argsort_single_f64(flat_cols, n_rows, dirs[0] > 0)
    } else {
        argsort_multi_f64(flat_cols, n_rows, n_cols, dirs)
    }
}

/// Napi sort dispatch (parallel).
#[cfg(feature = "napi-rs")]
fn arrange_indices_f64_dispatch_par(
    flat_cols: &[f64],
    n_rows: usize,
    n_cols: usize,
    dirs: &[i8],
) -> Vec<u32> {
    if n_cols == 1 {
        argsort_single_f64_par(flat_cols, n_rows, dirs[0] > 0)
    } else {
        argsort_multi_f64_par(flat_cols, n_rows, n_cols, dirs)
    }
}

// ---------------------------------------------------------------------------
// WASM exports
// ---------------------------------------------------------------------------

/// WASM export: fill `indices` with sorted order (u32).
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn arrange_multi_f64_wasm(
    flat_cols: &[f64],
    n_rows: usize,
    n_cols: usize,
    dirs: &[i8],
    indices: &mut [u32],
) -> Result<(), JsValue> {
    if flat_cols.len() != n_rows * n_cols {
        return Err(JsValue::from_str("flat_cols size mismatch"));
    }
    if dirs.len() != n_cols {
        return Err(JsValue::from_str("dirs length mismatch"));
    }
    if indices.len() != n_rows {
        return Err(JsValue::from_str("indices length mismatch"));
    }
    let order = arrange_indices_f64(flat_cols, n_rows, n_cols, dirs);
    for (i, v) in order.into_iter().enumerate() {
        indices[i] = v;
    }
    Ok(())
}

/// Stable sort `indices` by one f64 key vector (NaN last), asc/desc.
/// Uses tuple sort with NaN pre-partition.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn stable_sort_indices_f64_wasm(
    values: &[f64],
    indices: &mut [u32],
    ascending: bool,
) -> Result<(), JsValue> {
    let n = indices.len();
    let mut pairs: Vec<(u32, f64)> = Vec::with_capacity(n);
    for &idx in indices.iter() {
        pairs.push((idx, values[idx as usize]));
    }

    let valid_count = partition_nans(&mut pairs);
    let valid = &mut pairs[..valid_count];

    if ascending {
        valid.sort_by(|a, b| tot_cmp(a.1, b.1));
    } else {
        valid.sort_by(|a, b| tot_cmp(b.1, a.1));
    }

    for (i, p) in pairs.iter().enumerate() {
        indices[i] = p.0;
    }
    Ok(())
}

/// Stable sort `indices` by one u32 rank key vector, asc/desc, with explicit NA code (last).
/// Uses tuple sort with NA pre-partition.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn stable_sort_indices_u32_wasm(
    ranks: &[u32],
    indices: &mut [u32],
    ascending: bool,
    na_code: u32,
) -> Result<(), JsValue> {
    let n = indices.len();
    let mut pairs: Vec<(u32, u32)> = Vec::with_capacity(n);
    for &idx in indices.iter() {
        pairs.push((idx, ranks[idx as usize]));
    }

    // Partition: non-NA first, NA last
    let mut lo = 0;
    let mut hi = n;
    while lo < hi {
        if pairs[lo].1 == na_code {
            hi -= 1;
            pairs.swap(lo, hi);
        } else {
            lo += 1;
        }
    }
    let valid = &mut pairs[..lo];

    if ascending {
        valid.sort_by(|a, b| a.1.cmp(&b.1));
    } else {
        valid.sort_by(|a, b| b.1.cmp(&a.1));
    }

    for (i, p) in pairs.iter().enumerate() {
        indices[i] = p.0;
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// NAPI exports
// ---------------------------------------------------------------------------

/// NAPI export: returns sorted indices as Uint32Array (avoids 500K JS Number allocations)
#[cfg(feature = "napi-rs")]
#[napi]
pub fn arrange_multi_f64_napi(
    flat_cols: &[f64],
    n_rows: u32,
    n_cols: u32,
    dirs: Vec<i8>,
) -> Result<Uint32Array, napi::Error> {
    let n_rows = n_rows as usize;
    let n_cols = n_cols as usize;
    if flat_cols.len() != n_rows * n_cols {
        return Err(napi::Error::from_reason("flat_cols size mismatch"));
    }
    if dirs.len() != n_cols {
        return Err(napi::Error::from_reason("dirs length mismatch"));
    }
    Ok(Uint32Array::new(arrange_indices_f64_dispatch_par(flat_cols, n_rows, n_cols, &dirs)))
}

/// NAPI export: parallel stable sort indices by one f64 key vector
#[cfg(feature = "napi-rs")]
#[napi]
pub fn stable_sort_indices_f64_napi(
    values: &[f64],
    indices: &[u32],
    ascending: bool,
) -> Uint32Array {
    let n = indices.len();
    let mut pairs: Vec<(u32, f64)> = Vec::with_capacity(n);
    for &idx in indices.iter() {
        pairs.push((idx, values[idx as usize]));
    }

    let valid_count = partition_nans(&mut pairs);
    let valid = &mut pairs[..valid_count];

    if ascending {
        valid.par_sort_by(|a, b| tot_cmp(a.1, b.1));
    } else {
        valid.par_sort_by(|a, b| tot_cmp(b.1, a.1));
    }

    Uint32Array::new(pairs.iter().map(|p| p.0).collect())
}

/// NAPI export: parallel stable sort indices by one u32 rank key vector
#[cfg(feature = "napi-rs")]
#[napi]
pub fn stable_sort_indices_u32_napi(
    ranks: &[u32],
    indices: &[u32],
    ascending: bool,
    na_code: u32,
) -> Uint32Array {
    let n = indices.len();
    let mut pairs: Vec<(u32, u32)> = Vec::with_capacity(n);
    for &idx in indices.iter() {
        pairs.push((idx, ranks[idx as usize]));
    }

    let mut lo = 0;
    let mut hi = n;
    while lo < hi {
        if pairs[lo].1 == na_code {
            hi -= 1;
            pairs.swap(lo, hi);
        } else {
            lo += 1;
        }
    }
    let valid = &mut pairs[..lo];

    if ascending {
        valid.par_sort_by(|a, b| a.1.cmp(&b.1));
    } else {
        valid.par_sort_by(|a, b| b.1.cmp(&a.1));
    }

    Uint32Array::new(pairs.iter().map(|p| p.0).collect())
}
