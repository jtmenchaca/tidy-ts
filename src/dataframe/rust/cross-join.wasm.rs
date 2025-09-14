//! Cross join WASM exports

#[cfg(feature = "wasm")]
use super::shared_types::JoinIdxU32;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Cross join (Cartesian product) - internal implementation
#[allow(dead_code)]
fn cross_join(left_len: usize, right_len: usize) -> (Vec<usize>, Vec<usize>) {
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

/// Cross join (Cartesian product) - returns u32 indices
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn cross_join_u32(left_len: usize, right_len: usize) -> JoinIdxU32 {
    let (left_indices, right_indices) = cross_join(left_len, right_len);

    JoinIdxU32::new(
        left_indices.into_iter().map(|x| x as u32).collect(),
        right_indices.into_iter().map(|x| x as u32).collect(),
    )
}
