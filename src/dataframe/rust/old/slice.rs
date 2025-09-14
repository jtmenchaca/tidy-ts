//! Evaluate an expression once per group and collect the results.
//
#![deny(unsafe_op_in_unsafe_fn)]

#[allow(dead_code)]
pub fn eval_per_group<F, T>(ngroups: usize, mut f: F) -> Vec<T>
where
    F: FnMut(usize) -> T,
{
    (0..ngroups).map(|g| f(g)).collect()
}
