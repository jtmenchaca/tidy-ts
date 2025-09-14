//! Port of dplyr’s `mutate.cpp` recycle & validation logic.
//!
//! Public helpers return `Result<Vec<T>>`, carrying an explicit `Error`.

#![deny(unsafe_op_in_unsafe_fn)]

use super::error::{Error, Result};

/// Recycle `chunk` to length `n_expected`.
///
/// * If `chunk.len() == n_expected`, returns an owned clone.
/// * If `chunk.len() == 1`, returns a repeated Vec.
/// * If `chunk.len() == 0`, returns `Err(MixedNull)` (matches dplyr’s “all NULL”).  
/// * Any other size triggers `Err(IncompatibleSize)`.
pub fn recycle<T: Clone>(chunk: &[T], n_expected: usize) -> Result<Vec<T>> {
    match chunk.len() {
        0 => Err(Error::MixedNull),
        1 => Ok(std::iter::repeat(chunk[0].clone())
            .take(n_expected)
            .collect()),
        m if m == n_expected => Ok(chunk.to_vec()),
        m => Err(Error::IncompatibleSize {
            size: m,
            expected: n_expected,
        }),
    }
}

/// Validate that all `chunks[i]` share length 0 or `n_expected`.
/// Returns `Ok(())` or the first size mismatch.
#[allow(dead_code)]
pub fn validate_chunks<T>(chunks: &[Vec<T>], n_expected: usize) -> Result<()> {
    let mut seen_null = false;
    let mut seen_vec = false;

    for (idx, c) in chunks.iter().enumerate() {
        match c.len() {
            0 => {
                seen_null = true;
                if seen_vec {
                    return Err(Error::MixedNull);
                }
            }
            n if n == n_expected => {
                seen_vec = true;
                if seen_null {
                    return Err(Error::MixedNull);
                }
            }
            other => {
                return Err(Error::IncompatibleSize {
                    size: other,
                    expected: n_expected,
                })
                .map_err(|e| Error::OtherBoxed(format!("chunk {}", idx), Box::new(e)));
            }
        }
    }
    Ok(())
}
