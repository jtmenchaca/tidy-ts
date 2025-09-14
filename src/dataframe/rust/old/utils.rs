//! Small helpers shared across filter / mutate / summarise.

#![deny(unsafe_op_in_unsafe_fn)]

/// In-place three-state logical ‘AND’.  
/// Encoding: 0 = FALSE · 1 = TRUE · 2 = NA
#[inline]
pub fn zip_and(in_: &[u8], out: &mut [u8]) {
    debug_assert_eq!(in_.len(), out.len());
    for (lhs, &rhs) in out.iter_mut().zip(in_) {
        *lhs = match (*lhs, rhs) {
            (0, _) | (_, 0) => 0, // any FALSE
            (1, 1) => 1,          // both TRUE
            _ => 2,               // NA propagates
        };
    }
}

/// Return `Some(common_len)` when every slice is either length 1 or that
/// common length.  Otherwise return `None`.
#[allow(dead_code)]
pub fn common_len<T>(slices: &[&[T]]) -> Option<usize> {
    let mut target = 0usize;
    for s in slices {
        match s.len() {
            0 | 1 => continue,
            n if target == 0 => target = n,
            n if n == target => continue,
            _ => return None,
        }
    }
    Some(target.max(1))
}
