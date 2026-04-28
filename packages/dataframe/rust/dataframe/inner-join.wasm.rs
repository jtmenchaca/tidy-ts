//! Ultra-optimized inner join operation WASM/NAPI exports - using shared utilities

#[cfg(feature = "wasm")]
use js_sys::Uint32Array;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use super::join_helpers::bulk_copy_u32;
#[cfg(feature = "wasm")]
use super::shared_types::JoinIdxU32;

#[cfg(any(feature = "wasm", feature = "napi-rs"))]
use super::join_helpers::{
    build_csr_from_keys_u32, build_csr_from_keys_u64, hash_row_multi, pack2_u64,
    rows_equal_multi,
};

#[cfg(feature = "napi-rs")]
use napi_derive::napi;
#[cfg(feature = "napi-rs")]
use super::shared_types::NapiJoinIdxU32;
#[cfg(feature = "napi-rs")]
use rayon::prelude::*;

// ----------------------------- Inner join kernels -----------------------------

// 1 column (exact)
#[cfg(any(feature = "wasm", feature = "napi-rs"))]
fn inner_join_1col(left: &[u32], right: &[u32]) -> (Vec<u32>, Vec<u32>) {
    // Build CSR from right keys directly
    let (map, adj) = build_csr_from_keys_u32(right);

    // sizing
    let n_left = left.len();
    let mut counts = vec![0usize; n_left];
    for (i, &k) in left.iter().enumerate() {
        counts[i] = map.get(&k).map(|o| o.len as usize).unwrap_or(0);
    }

    // prefix
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];

    // fill
    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for (i, &k) in left.iter().enumerate() {
        if let Some(off) = map.get(&k) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                left_out.push(i as u32);
                right_out.push(adj[pos]);
            }
        }
    }

    (left_out, right_out)
}

// 2 columns (packed u64 exact)
#[cfg(any(feature = "wasm", feature = "napi-rs"))]
fn inner_join_2col(la: &[u32], lb: &[u32], ra: &[u32], rb: &[u32]) -> (Vec<u32>, Vec<u32>) {
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
        counts[i] = map.get(&lkeys[i]).map(|o| o.len as usize).unwrap_or(0);
    }

    // prefix
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];

    // fill
    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                left_out.push(i as u32);
                right_out.push(adj[pos]);
            }
        }
    }

    (left_out, right_out)
}

// 3+ columns (hash + verify)
#[cfg(any(feature = "wasm", feature = "napi-rs"))]
fn inner_join_multi(left_cols: &[&[u32]], right_cols: &[&[u32]]) -> (Vec<u32>, Vec<u32>) {
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
            counts[i] = m;
        }
    }

    // prefix
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];

    // fill
    let mut left_out = Vec::with_capacity(total);
    let mut right_out = Vec::with_capacity(total);
    for i in 0..n_left {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            for pos in start..end {
                let rj = adj[pos] as usize;
                if rows_equal_multi(left_cols, right_cols, i, rj) {
                    left_out.push(i as u32);
                    right_out.push(rj as u32);
                }
            }
        }
    }

    (left_out, right_out)
}

// ----------------------------- Rayon-parallel napi kernels -----------------------------


/// Wrapper for raw pointer to allow sending across rayon threads.
/// SAFETY: The caller must ensure non-overlapping writes via the offset table.
#[cfg(feature = "napi-rs")]
pub struct RawSlice { pub ptr: *mut u32, pub len: usize }
#[cfg(feature = "napi-rs")]
unsafe impl Send for RawSlice {}
#[cfg(feature = "napi-rs")]
unsafe impl Sync for RawSlice {}

#[cfg(feature = "napi-rs")]
impl RawSlice {
    pub fn from_vec(v: &mut Vec<u32>) -> Self {
        RawSlice { ptr: v.as_mut_ptr(), len: v.len() }
    }
    /// SAFETY: caller must ensure index < len and no concurrent writes to same index
    #[inline]
    pub unsafe fn write(&self, index: usize, val: u32) {
        debug_assert!(index < self.len);
        unsafe { *self.ptr.add(index) = val; }
    }
}

/// Read-only raw pointer wrapper for sharing across rayon threads.
#[cfg(feature = "napi-rs")]
pub struct RawSliceRead { ptr: *const u32 }
#[cfg(feature = "napi-rs")]
unsafe impl Send for RawSliceRead {}
#[cfg(feature = "napi-rs")]
unsafe impl Sync for RawSliceRead {}

#[cfg(feature = "napi-rs")]
impl RawSliceRead {
    pub fn from_slice(s: &[u32]) -> Self {
        RawSliceRead { ptr: s.as_ptr() }
    }
    #[inline]
    pub unsafe fn read(&self, index: usize) -> u32 {
        unsafe { *self.ptr.add(index) }
    }
    /// Copy count elements from src_offset to dst (RawSlice) at dst_offset
    #[inline]
    pub unsafe fn copy_to(&self, src_offset: usize, dst: &RawSlice, dst_offset: usize, count: usize) {
        unsafe {
            std::ptr::copy_nonoverlapping(
                self.ptr.add(src_offset),
                dst.ptr.add(dst_offset),
                count,
            );
        }
    }
}

/// Parallel inner join for 1-column keys (napi only).
/// Build phase is serial, probe + fill are parallel via rayon.
#[cfg(feature = "napi-rs")]
fn inner_join_1col_par(left: &[u32], right: &[u32]) -> (Vec<u32>, Vec<u32>) {
    let (map, adj) = build_csr_from_keys_u32(right);
    let n_left = left.len();

    // Parallel sizing
    let counts: Vec<usize> = left.par_iter()
        .map(|k| map.get(k).map(|o| o.len as usize).unwrap_or(0))
        .collect();

    // Serial prefix sum
    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];
    if total == 0 {
        return (Vec::new(), Vec::new());
    }

    // Parallel fill via raw pointers (each left row writes to non-overlapping region)
    let mut left_out = vec![0u32; total];
    let mut right_out = vec![0u32; total];
    let lo = RawSlice::from_vec(&mut left_out);
    let ro = RawSlice::from_vec(&mut right_out);

    let adj_r = RawSliceRead::from_slice(&adj);

    (0..n_left).into_par_iter().for_each(|i| {
        let k = left[i];
        if let Some(off) = map.get(&k) {
            let start = off.start as usize;
            let count = off.len as usize;
            let out_start = offsets[i];
            for j in 0..count {
                unsafe { lo.write(out_start + j, i as u32); }
            }
            unsafe { adj_r.copy_to(start, &ro, out_start, count); }
        }
    });

    (left_out, right_out)
}

/// Parallel inner join for 2-column packed u64 keys (napi only).
#[cfg(feature = "napi-rs")]
fn inner_join_2col_par(la: &[u32], lb: &[u32], ra: &[u32], rb: &[u32]) -> (Vec<u32>, Vec<u32>) {
    let n_left = la.len();
    let n_right = ra.len();

    let rkeys: Vec<u64> = (0..n_right).map(|j| pack2_u64(ra[j], rb[j])).collect();
    let (map, adj) = build_csr_from_keys_u64(&rkeys);
    let lkeys: Vec<u64> = (0..n_left).map(|i| pack2_u64(la[i], lb[i])).collect();

    // Parallel sizing
    let counts: Vec<usize> = lkeys.par_iter()
        .map(|k| map.get(k).map(|o| o.len as usize).unwrap_or(0))
        .collect();

    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];
    if total == 0 {
        return (Vec::new(), Vec::new());
    }

    let mut left_out = vec![0u32; total];
    let mut right_out = vec![0u32; total];
    let lo = RawSlice::from_vec(&mut left_out);
    let ro = RawSlice::from_vec(&mut right_out);
    let adj_r = RawSliceRead::from_slice(&adj);

    (0..n_left).into_par_iter().for_each(|i| {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let count = off.len as usize;
            let out_start = offsets[i];
            for j in 0..count {
                unsafe { lo.write(out_start + j, i as u32); }
            }
            unsafe { adj_r.copy_to(start, &ro, out_start, count); }
        }
    });

    (left_out, right_out)
}

/// Parallel inner join for 3+ column keys with verification (napi only).
#[cfg(feature = "napi-rs")]
fn inner_join_multi_par(left_cols: &[&[u32]], right_cols: &[&[u32]]) -> (Vec<u32>, Vec<u32>) {
    let n_left = left_cols[0].len();
    let n_right = right_cols[0].len();

    let rkeys: Vec<u64> = (0..n_right).map(|j| hash_row_multi(right_cols, j)).collect();
    let (map, adj) = build_csr_from_keys_u64(&rkeys);
    let lkeys: Vec<u64> = (0..n_left).map(|i| hash_row_multi(left_cols, i)).collect();

    // Parallel sizing with verification
    let counts: Vec<usize> = (0..n_left).into_par_iter()
        .map(|i| {
            map.get(&lkeys[i]).map(|off| {
                let start = off.start as usize;
                let end = start + off.len as usize;
                (start..end).filter(|&pos| {
                    rows_equal_multi(left_cols, right_cols, i, adj[pos] as usize)
                }).count()
            }).unwrap_or(0)
        })
        .collect();

    let mut offsets = vec![0usize; n_left + 1];
    for i in 0..n_left {
        offsets[i + 1] = offsets[i] + counts[i];
    }
    let total = offsets[n_left];
    if total == 0 {
        return (Vec::new(), Vec::new());
    }

    let mut left_out = vec![0u32; total];
    let mut right_out = vec![0u32; total];
    let lo = RawSlice::from_vec(&mut left_out);
    let ro = RawSlice::from_vec(&mut right_out);

    (0..n_left).into_par_iter().for_each(|i| {
        if let Some(off) = map.get(&lkeys[i]) {
            let start = off.start as usize;
            let end = start + off.len as usize;
            let mut out_pos = offsets[i];
            for pos in start..end {
                let rj = adj[pos] as usize;
                if rows_equal_multi(left_cols, right_cols, i, rj) {
                    unsafe {
                        lo.write(out_pos, i as u32);
                        ro.write(out_pos, rj as u32);
                    }
                    out_pos += 1;
                }
            }
        }
    });

    (left_out, right_out)
}

/// Parallel dispatch for napi inner join
#[cfg(feature = "napi-rs")]
fn inner_join_dispatch_par(left_cols: &[&[u32]], right_cols: &[&[u32]]) -> (Vec<u32>, Vec<u32>) {
    let left_len = left_cols.iter().map(|c| c.len()).min().unwrap_or(0);
    let right_len = right_cols.iter().map(|c| c.len()).min().unwrap_or(0);
    if left_len == 0 || right_len == 0 {
        return (Vec::new(), Vec::new());
    }

    let num_cols = left_cols.len().min(right_cols.len()).max(1);

    match num_cols {
        1 => inner_join_1col_par(&left_cols[0][..left_len], &right_cols[0][..right_len]),
        2 => {
            let la = &left_cols[0][..left_len];
            let lb = &left_cols[1][..left_len.min(left_cols[1].len())];
            let ra = &right_cols[0][..right_len];
            let rb = &right_cols[1][..right_len.min(right_cols[1].len())];
            inner_join_2col_par(la, lb, ra, rb)
        }
        _ => {
            let lrefs: Vec<&[u32]> = left_cols.iter().map(|c| &c[..left_len]).collect();
            let rrefs: Vec<&[u32]> = right_cols.iter().map(|c| &c[..right_len]).collect();
            inner_join_multi_par(&lrefs, &rrefs)
        }
    }
}

// ----------------------------- Dispatch helper (serial, for WASM) -----------------------------

#[cfg(any(feature = "wasm", feature = "napi-rs"))]
fn inner_join_dispatch(left_cols: &[&[u32]], right_cols: &[&[u32]]) -> (Vec<u32>, Vec<u32>) {
    let left_len = left_cols.iter().map(|c| c.len()).min().unwrap_or(0);
    let right_len = right_cols.iter().map(|c| c.len()).min().unwrap_or(0);
    if left_len == 0 || right_len == 0 {
        return (Vec::new(), Vec::new());
    }

    let num_cols = left_cols.len().min(right_cols.len()).max(1);

    match num_cols {
        1 => inner_join_1col(&left_cols[0][..left_len], &right_cols[0][..right_len]),
        2 => {
            let la = &left_cols[0][..left_len];
            let lb = &left_cols[1][..left_len.min(left_cols[1].len())];
            let ra = &right_cols[0][..right_len];
            let rb = &right_cols[1][..right_len.min(right_cols[1].len())];
            inner_join_2col(la, lb, ra, rb)
        }
        _ => {
            let lrefs: Vec<&[u32]> = left_cols.iter().map(|c| &c[..left_len]).collect();
            let rrefs: Vec<&[u32]> = right_cols.iter().map(|c| &c[..right_len]).collect();
            inner_join_multi(&lrefs, &rrefs)
        }
    }
}

// ----------------------------- Public API -----------------------------

/// Ultra-optimized inner join using shared utilities and specialized kernels
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn inner_join_typed_multi_u32(
    left_columns: Vec<Uint32Array>,
    right_columns: Vec<Uint32Array>,
) -> JoinIdxU32 {
    if left_columns.is_empty() || right_columns.is_empty() {
        return JoinIdxU32::new(Vec::new(), Vec::new());
    }

    // One bulk copy JS -> WASM
    let left = bulk_copy_u32(&left_columns);
    let right = bulk_copy_u32(&right_columns);

    let lrefs: Vec<&[u32]> = left.iter().map(|c| c.as_slice()).collect();
    let rrefs: Vec<&[u32]> = right.iter().map(|c| c.as_slice()).collect();

    let (left_idx, right_idx) = inner_join_dispatch(&lrefs, &rrefs);
    JoinIdxU32::new(left_idx, right_idx)
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn inner_join_typed_multi_u32_napi(
    left_columns: Vec<&[u32]>,
    right_columns: Vec<&[u32]>,
) -> NapiJoinIdxU32 {
    if left_columns.is_empty() || right_columns.is_empty() {
        return NapiJoinIdxU32::from_vecs(Vec::new(), Vec::new());
    }

    let (left_idx, right_idx) = inner_join_dispatch_par(&left_columns, &right_columns);
    NapiJoinIdxU32::from_vecs(left_idx, right_idx)
}
