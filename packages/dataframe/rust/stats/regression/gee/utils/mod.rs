//! Utilities for clustering and block operations (stubs)

pub fn group_indices_by_id(id: &[usize]) -> Vec<(usize, usize)> {
    // Returns (start, end) indices per cluster assuming contiguous grouping (as in geepack docs)
    let mut result = Vec::new();
    if id.is_empty() {
        return result;
    }
    let mut start = 0usize;
    for i in 1..id.len() {
        if id[i] != id[i - 1] {
            result.push((start, i));
            start = i;
        }
    }
    result.push((start, id.len()));
    result
}

pub mod lin_alg;
