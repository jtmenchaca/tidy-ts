//! Port of `summarise.cpp` recycle & size-consistency checks.
//
#![deny(unsafe_op_in_unsafe_fn)]

use super::error::{Error, Result};
use super::mutate::recycle;

/// Take `chunks_per_group[g][expr]` and recycle each inner slice so that:
/// * each expression has a single common length across groups
/// * the common length for expr j is returned in `sizes[j]`
pub fn recycle_chunks_in_place<T: Clone>(
    chunks_per_group: &mut [Vec<Vec<T>>],
) -> Result<Vec<usize>> {
    if chunks_per_group.is_empty() {
        return Ok(vec![]);
    }
    let n_expr = chunks_per_group[0].len();
    let mut sizes = vec![0_usize; n_expr];

    // First pass – determine common size
    for group in chunks_per_group.iter() {
        for (j, chunk) in group.iter().enumerate() {
            match chunk.len() {
                0 => continue,                   // NULL – handled later
                1 => sizes[j] = sizes[j].max(1), // recyclable scalar
                n if sizes[j] == 0 || sizes[j] == n => sizes[j] = n,
                n => {
                    return Err(Error::IncompatibleSize {
                        size: n,
                        expected: sizes[j],
                    });
                }
            }
        }
    }
    // Replace 0 (all-scalar) with 1 for each expr
    for s in &mut sizes {
        if *s == 0 {
            *s = 1;
        }
    }

    // Second pass – recycle in place
    for group in chunks_per_group.iter_mut() {
        for (j, chunk) in group.iter_mut().enumerate() {
            if chunk.len() != sizes[j] {
                if chunk.len() == 0 {
                    return Err(Error::MixedNull);
                }
                *chunk = recycle(chunk, sizes[j])?;
            }
        }
    }

    Ok(sizes)
}
