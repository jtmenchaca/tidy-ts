//! Sorting/arrange operations WASM exports

#![deny(unsafe_op_in_unsafe_fn)]

use std::cmp::Ordering;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[inline]
fn cmp_nan_last(a: f64, b: f64) -> Ordering {
    let an = a.is_nan();
    let bn = b.is_nan();
    match (an, bn) {
        (true, true) => Ordering::Equal,
        (true, false) => Ordering::Greater, // NaN last
        (false, true) => Ordering::Less,    // NaN last
        (false, false) => a.partial_cmp(&b).unwrap_or(Ordering::Equal),
    }
}

/// Sort indices 0..n_rows-1 by K columns in `flat_cols` with per-column `dirs` (+1 asc / -1 desc).
/// `flat_cols` is column-major: flat[k * n_rows + row].
pub fn arrange_indices_f64(
    flat_cols: &[f64],
    n_rows: usize,
    n_cols: usize,
    dirs: &[i8],
) -> Vec<usize> {
    debug_assert_eq!(dirs.len(), n_cols);
    debug_assert_eq!(flat_cols.len(), n_rows * n_cols);

    let mut idx: Vec<usize> = (0..n_rows).collect();

    // Use unstable sort (faster) since we compare every key at once (lexicographic).
    idx.sort_unstable_by(|&a, &b| {
        for k in 0..n_cols {
            let ua = unsafe { *flat_cols.get_unchecked(k * n_rows + a) };
            let ub = unsafe { *flat_cols.get_unchecked(k * n_rows + b) };
            let mut ord = cmp_nan_last(ua, ub);
            if dirs[k] < 0 {
                ord = ord.reverse();
            }
            if ord != Ordering::Equal {
                return ord;
            }
        }
        Ordering::Equal
    });

    idx
}

/// WASM export: fill `indices` with sorted order (u32).
/// - `flat_cols`: column-major f64 matrix [n_cols * n_rows]
/// - `dirs`: i8 (+1 = asc, -1 = desc), length = n_cols
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
    for (i, &v) in order.iter().enumerate() {
        indices[i] = v as u32;
    }
    Ok(())
}

/// Stable sort `indices` by one f64 key vector (NaN last), asc/desc.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn stable_sort_indices_f64_wasm(
    values: &[f64],
    indices: &mut [u32],
    ascending: bool,
) -> Result<(), JsValue> {
    if ascending {
        indices.sort_by(|&a, &b| {
            let ua = values[a as usize];
            let ub = values[b as usize];
            cmp_nan_last(ua, ub)
        });
    } else {
        indices.sort_by(|&a, &b| {
            let ua = values[a as usize];
            let ub = values[b as usize];
            cmp_nan_last(ub, ua) // reverse
        });
    }
    Ok(())
}

/// Stable sort `indices` by one u32 rank key vector, asc/desc, with explicit NA code (last).
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn stable_sort_indices_u32_wasm(
    ranks: &[u32],
    indices: &mut [u32],
    ascending: bool,
    na_code: u32,
) -> Result<(), JsValue> {
    let cmp_u32_with_na_last = |ua: u32, ub: u32| {
        let a_na = ua == na_code;
        let b_na = ub == na_code;
        match (a_na, b_na) {
            (true, true) => Ordering::Equal,
            (true, false) => Ordering::Greater, // NA last
            (false, true) => Ordering::Less,    // NA last
            (false, false) => ua.cmp(&ub),
        }
    };

    if ascending {
        indices.sort_by(|&a, &b| {
            let ua = ranks[a as usize];
            let ub = ranks[b as usize];
            cmp_u32_with_na_last(ua, ub)
        });
    } else {
        indices.sort_by(|&a, &b| {
            let ua = ranks[a as usize];
            let ub = ranks[b as usize];
            cmp_u32_with_na_last(ub, ua) // reverse
        });
    }
    Ok(())
}
