//! Two-level clustering structure identification
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/twoclust.c`

/// Check if any id appears in multiple clusters.
///
/// Direct port of `twoclust()` from `survival-ref/survival-master/src/twoclust.c`.
/// Called by `survfitAJ` to validate clustering.
///
/// # Arguments
///
/// * `id` - Integer vector of id values
/// * `cluster` - Integer vector of cluster values
/// * `idord` - Ordering vector for id values (0-based indices)
///
/// # Returns
///
/// `true` if any id appears in more than one cluster, `false` otherwise.
#[allow(dead_code)]
pub(crate) fn twoclust(id: &[i32], cluster: &[i32], idord: &[i32]) -> bool {
    let n = id.len();
    let mut i = 0;
    while i < n {
        let cid = id[idord[i] as usize];
        let iclust = cluster[idord[i] as usize];
        while i < n && id[idord[i] as usize] == cid {
            if cluster[idord[i] as usize] != iclust {
                return true;
            }
            i += 1;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_twoclust_no_overlap() {
        // ids 0,0,1,1 in clusters 0,0,1,1 — no overlap
        let id = vec![0, 0, 1, 1];
        let cluster = vec![0, 0, 1, 1];
        let idord = vec![0, 1, 2, 3]; // already sorted by id
        assert!(!twoclust(&id, &cluster, &idord));
    }

    #[test]
    fn test_twoclust_overlap() {
        // id 0 appears in cluster 0 and cluster 1
        let id = vec![0, 1, 0, 1];
        let cluster = vec![0, 1, 1, 1];
        let mut idord: Vec<i32> = (0..4).collect();
        idord.sort_by_key(|&i| id[i as usize]);
        assert!(twoclust(&id, &cluster, &idord));
    }

    #[test]
    fn test_twoclust_single() {
        let id = vec![0];
        let cluster = vec![5];
        let idord = vec![0];
        assert!(!twoclust(&id, &cluster, &idord));
    }
}
