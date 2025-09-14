//! High-performance pivot_wider operations with dense matrix fill
//!
//! This module provides efficient pivot_wider kernels that use dense matrices
//! for small/moderate category counts and handle aggregation policies inline.

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Combined pivot result with values and seen flags
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct PivotDenseF64 {
    values: Vec<f64>, // row-major G×C
    seen: Vec<u8>,    // 0/1
    pub n_groups: u32,
    pub n_cats: u32,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl PivotDenseF64 {
    // Move the buffers out without cloning
    #[wasm_bindgen(js_name = takeValues)]
    pub fn take_values(&mut self) -> Box<[f64]> {
        std::mem::take(&mut self.values).into_boxed_slice()
    }
    
    #[wasm_bindgen(js_name = takeSeen)]
    pub fn take_seen(&mut self) -> Box<[u8]> {
        std::mem::take(&mut self.seen).into_boxed_slice()
    }
}

/// policy: 0=first, 1=last, 2=sum, 3=mean
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_wider_dense_f64(
    gid_per_row: &[u32],
    cat_codes: &[u32],
    values: &[f64],
    n_groups: u32,
    n_cats: u32,
    policy: u8,
) -> Vec<f64> {
    let g = n_groups as usize;
    let c = n_cats as usize;
    let n = gid_per_row.len();

    let mut out = vec![f64::NAN; g * c];
    let mut seen = vec![0u8; g * c];
    let mut cnt = if matches!(policy, 2 | 3) {
        vec![0u32; g * c]
    } else {
        Vec::new()
    };

    for i in 0..n {
        let dst = (gid_per_row[i] as usize) * c + (cat_codes[i] as usize);
        let v = values[i];
        match policy {
            0 => {
                if seen[dst] == 0 {
                    out[dst] = v;
                    seen[dst] = 1;
                }
            }
            1 => {
                out[dst] = v;
                seen[dst] = 1;
            }
            2 => {
                let k = if seen[dst] == 0 { 0 } else { cnt[dst] };
                out[dst] = if k == 0 { v } else { out[dst] + v };
                cnt[dst] = k + 1;
                seen[dst] = 1;
            }
            3 => {
                let k = if seen[dst] == 0 { 0 } else { cnt[dst] };
                out[dst] = if k == 0 { v } else { out[dst] + v };
                cnt[dst] = k + 1;
                seen[dst] = 1;
            }
            _ => {}
        }
    }
    if policy == 3 {
        for i in 0..out.len() {
            if seen[i] == 1 && cnt[i] > 0 {
                out[i] /= cnt[i] as f64;
            }
        }
    }
    out
}

/// Get seen flags from dense pivot operation
///
/// This function needs to be called after pivot_wider_dense_f64 to get
/// the seen flags indicating which cells have values.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_wider_seen_flags(
    gid_per_row: &[u32],
    cat_codes: &[u32],
    _values: &[f64],
    n_groups: u32,
    n_cats: u32,
    _policy: u8,
) -> Vec<u8> {
    let g = n_groups as usize;
    let c = n_cats as usize;
    let n = gid_per_row.len();

    let mut seen = vec![0u8; g * c];

    for i in 0..n {
        let gi = gid_per_row[i] as usize;
        let ci = cat_codes[i] as usize;
        let dst = gi * c + ci;
        seen[dst] = 1;
    }

    seen
}

/// Combined pivot operation that returns values and seen flags in one pass
/// policy: 0=first, 1=last, 2=sum, 3=mean
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn pivot_wider_dense_f64_all(
    gid_per_row: &[u32],
    cat_codes: &[u32],
    values: &[f64],
    n_groups: u32,
    n_cats: u32,
    policy: u8,
) -> PivotDenseF64 {
    let g = n_groups as usize;
    let c = n_cats as usize;
    let n = gid_per_row.len();

    let mut out = vec![f64::NAN; g * c];
    let mut seen = vec![0u8; g * c];
    let mut cnt = if matches!(policy, 2 | 3) {
        vec![0u32; g * c]
    } else {
        Vec::new()
    };

    for i in 0..n {
        let dst = (gid_per_row[i] as usize) * c + (cat_codes[i] as usize);
        let v = values[i];
        match policy {
            0 => {
                if seen[dst] == 0 {
                    out[dst] = v;
                    seen[dst] = 1;
                }
            }
            1 => {
                out[dst] = v;
                seen[dst] = 1;
            }
            2 => {
                let k = if seen[dst] == 0 { 0 } else { cnt[dst] };
                out[dst] = if k == 0 { v } else { out[dst] + v };
                cnt[dst] = k + 1;
                seen[dst] = 1;
            }
            3 => {
                let k = if seen[dst] == 0 { 0 } else { cnt[dst] };
                out[dst] = if k == 0 { v } else { out[dst] + v };
                cnt[dst] = k + 1;
                seen[dst] = 1;
            }
            _ => {}
        }
    }
    if policy == 3 {
        for i in 0..out.len() {
            if seen[i] == 1 && cnt[i] > 0 {
                out[i] /= cnt[i] as f64;
            }
        }
    }

    PivotDenseF64 {
        values: out,
        seen,
        n_groups,
        n_cats,
    }
}
