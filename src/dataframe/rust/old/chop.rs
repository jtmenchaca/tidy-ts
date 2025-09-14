//! Lazy `vec_chop` equivalent.
//!
//! For now we simply return `Vec<&[T]>` slices representing each group.
//
#![deny(unsafe_op_in_unsafe_fn)]

#[allow(dead_code)]
pub fn vec_chop<'a, T>(col: &'a [T], groups: &[Vec<usize>]) -> Vec<&'a [T]> {
    groups
        .iter()
        .map(|idx| {
            // assume row indices are consecutive & 1-based as in dplyr
            let start = idx[0] - 1;
            &col[start..start + idx.len()]
        })
        .collect()
}
