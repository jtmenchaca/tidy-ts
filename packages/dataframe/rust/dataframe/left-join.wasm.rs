#![allow(dead_code)]

#[cfg(feature = "wasm")]
use js_sys::Uint32Array;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use super::join_helpers::{
    SENTINEL, build_csr_from_keys_u32, build_csr_from_keys_u64, bulk_copy_u32, hash_row_multi,
    pack2_u64, rows_equal_multi,
};
#[cfg(feature = "wasm")]
use super::shared_types::JoinIdxU32;

// ----------------------------- Join kernels -----------------------------

// 1 column (exact)
#[cfg(feature = "wasm")]
fn left_join_1col(left: &[u32], right: &[u32]) -> (Vec<u32>, Vec<u32>) {
    // Build CSR from right keys directly
    let (map, adj) = build_csr_from_keys_u32(right);

    // sizing
    let n_left = left.len();
    let mut counts = vec![0usize; n_left];
    for (i, &k) in left.iter().enumerate() {
        counts[i] = map.get(&k).map(|o| o.len as usize).unwrap_or(1);
    }

    // prefix
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];

    // fill
    let mut left_out = vec![0u32; total];
    let mut right_out = vec![SENTINEL; total];
    let mut o = 0usize;
    for (i, &k) in left.iter().enumerate() {
        if let Some(off) = map.get(&k) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                left_out[o] = i as u32;
                right_out[o] = adj[pos];
                o += 1;
            }
        } else {
            left_out[o] = i as u32;
            o += 1;
        }
    }

    (left_out, right_out)
}

// 2 columns (packed u64 exact)
#[cfg(feature = "wasm")]
fn left_join_2col(la: &[u32], lb: &[u32], ra: &[u32], rb: &[u32]) -> (Vec<u32>, Vec<u32>) {
    let n_left = la.len();
    let n_right = ra.len();

    // Precompute right packed keys once
    let mut rkeys = Vec::with_capacity(n_right);
    for j in 0..n_right {
        rkeys.push(pack2_u64(ra[j], rb[j]));
    }
    let (map, adj) = build_csr_from_keys_u64(&rkeys);

    // Precompute left packed keys once
    let mut lkeys = Vec::with_capacity(n_left);
    for i in 0..n_left {
        lkeys.push(pack2_u64(la[i], lb[i]));
    }

    // sizing
    let mut counts = vec![0usize; n_left];
    for i in 0..n_left {
        counts[i] = map.get(&lkeys[i]).map(|o| o.len as usize).unwrap_or(1);
    }

    // prefix
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];

    // fill
    let mut left_out = vec![0u32; total];
    let mut right_out = vec![SENTINEL; total];
    let mut o = 0usize;
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                left_out[o] = i as u32;
                right_out[o] = adj[pos];
                o += 1;
            }
        } else {
            left_out[o] = i as u32;
            o += 1;
        }
    }

    (left_out, right_out)
}

// 3+ columns (hash + verify)
#[cfg(feature = "wasm")]
fn left_join_multi(left_cols: &[&[u32]], right_cols: &[&[u32]]) -> (Vec<u32>, Vec<u32>) {
    let n_left = left_cols[0].len();
    let n_right = right_cols[0].len();

    // Precompute right hashes once
    let mut rkeys = Vec::with_capacity(n_right);
    for j in 0..n_right {
        rkeys.push(hash_row_multi(right_cols, j));
    }
    let (map, adj) = build_csr_from_keys_u64(&rkeys);

    // Precompute left hashes once
    let mut lkeys = Vec::with_capacity(n_left);
    for i in 0..n_left {
        lkeys.push(hash_row_multi(left_cols, i));
    }

    // sizing (verify on candidates)
    let mut counts = vec![0usize; n_left];
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            let mut m = 0usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if rows_equal_multi(left_cols, right_cols, i, rj) {
                    m += 1;
                }
            }
            counts[i] = m.max(1);
        } else {
            counts[i] = 1;
        }
    }

    // prefix
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];

    // fill
    let mut left_out = vec![0u32; total];
    let mut right_out = vec![SENTINEL; total];
    let mut o = 0usize;
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            let mut wrote = 0usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if rows_equal_multi(left_cols, right_cols, i, rj) {
                    left_out[o] = i as u32;
                    right_out[o] = rj as u32;
                    o += 1;
                    wrote += 1;
                }
            }
            if wrote == 0 {
                left_out[o] = i as u32;
                o += 1;
            }
        } else {
            left_out[o] = i as u32;
            o += 1;
        }
    }

    (left_out, right_out)
}

// ----------------------------- Public API -----------------------------

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn left_join_typed_multi_u32(
    left_columns: Vec<Uint32Array>,
    right_columns: Vec<Uint32Array>,
) -> JoinIdxU32 {
    if left_columns.is_empty() {
        return JoinIdxU32::new(Vec::new(), Vec::new());
    }
    if right_columns.is_empty() {
        let left_len = left_columns[0].length() as usize;
        let left_idx: Vec<u32> = (0..left_len as u32).collect();
        let right_idx: Vec<u32> = vec![SENTINEL; left_len];
        return JoinIdxU32::new(left_idx, right_idx);
    }

    // One bulk copy JS -> WASM
    let left = bulk_copy_u32(&left_columns);
    let right = bulk_copy_u32(&right_columns);

    let left_len = left.iter().map(|c| c.len()).min().unwrap_or(0);
    let right_len = right.iter().map(|c| c.len()).min().unwrap_or(0);
    if left_len == 0 {
        return JoinIdxU32::new(Vec::new(), Vec::new());
    }
    if right_len == 0 {
        let left_idx: Vec<u32> = (0..left_len as u32).collect();
        let right_idx: Vec<u32> = vec![SENTINEL; left_len];
        return JoinIdxU32::new(left_idx, right_idx);
    }

    let num_cols = left.len().min(right.len()).max(1);

    let (left_idx, right_idx) = match num_cols {
        1 => {
            let l0 = &left[0][..left_len];
            let r0 = &right[0][..right_len];
            left_join_1col(l0, r0)
        }
        2 => {
            let la = &left[0][..left_len];
            let lb = &left[1][..left_len.min(left[1].len())];
            let ra = &right[0][..right_len];
            let rb = &right[1][..right_len.min(right[1].len())];
            left_join_2col(la, lb, ra, rb)
        }
        _ => {
            // Borrow as slice-of-slices (no copies)
            let lrefs: Vec<&[u32]> = left.iter().map(|c| &c[..left_len]).collect();
            let rrefs: Vec<&[u32]> = right.iter().map(|c| &c[..right_len]).collect();
            left_join_multi(&lrefs, &rrefs)
        }
    };

    JoinIdxU32::new(left_idx, right_idx)
}
