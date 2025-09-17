/// Calculate ranks for an array with tie handling (average ranks for ties)
pub fn rank(values: &[f64]) -> Vec<f64> {
    let n = values.len();
    let mut indexed: Vec<(f64, usize)> = values.iter().enumerate().map(|(i, &v)| (v, i)).collect();
    indexed.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());

    let mut ranks = vec![0.0; n];
    let mut i = 0;

    while i < n {
        let mut j = i;
        // Find all tied values
        while j < n && indexed[j].0 == indexed[i].0 {
            j += 1;
        }

        // Calculate average rank for tied values (1-based ranking)
        let avg_rank = (i + 1 + j) as f64 / 2.0;

        // Assign average rank to all tied values
        for k in i..j {
            ranks[indexed[k].1] = avg_rank;
        }

        i = j;
    }

    ranks
}
