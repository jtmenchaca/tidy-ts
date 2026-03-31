//! Bootstrap resampling for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_analysis.R` (bootstrap logic).
//! ID-level resampling: resample whole subjects, not individual rows.

use super::types::{ColumnarData, TargetTrialConfig};

/// Resample IDs with replacement and duplicate all rows for sampled IDs.
///
/// Mirrors R's `bootstrap_sample()`:
/// - Samples `round(sample_fraction * n_unique_ids)` IDs with replacement
/// - Creates unique new IDs for each copy (original_id * multiplier + boot_idx)
/// - Returns a new ColumnarData with duplicated rows
pub fn bootstrap_resample(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    seed: u64,
    sample_fraction: f64,
) -> Result<ColumnarData, String> {
    let id_col = data
        .get_numeric(&config.id)
        .ok_or_else(|| format!("ID column '{}' not found", config.id))?;

    // Get unique IDs
    let mut unique_ids: Vec<f64> = id_col.to_vec();
    unique_ids.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    unique_ids.dedup();

    let n_unique = unique_ids.len();
    let n_sample = (sample_fraction * n_unique as f64).round() as usize;

    if n_sample == 0 {
        return Err("Bootstrap sample size is 0".to_string());
    }

    // Build index: id → row indices
    let mut id_to_rows: std::collections::HashMap<u64, Vec<usize>> =
        std::collections::HashMap::new();
    for (i, &id) in id_col.iter().enumerate() {
        id_to_rows.entry(id.to_bits()).or_default().push(i);
    }

    // Sample IDs with replacement using xorshift
    let mut rng = seed;
    let mut sampled_ids = Vec::with_capacity(n_sample);
    for _ in 0..n_sample {
        rng ^= rng << 13;
        rng ^= rng >> 7;
        rng ^= rng << 17;
        let idx = (rng as usize) % n_unique;
        sampled_ids.push(unique_ids[idx]);
    }

    // ID multiplier for creating unique IDs
    let max_id = unique_ids
        .iter()
        .cloned()
        .fold(f64::NEG_INFINITY, f64::max);
    let id_mult = max_id.abs() + 1.0;

    // Build new data by duplicating rows
    let mut new_data = ColumnarData::new();
    let mut total_rows = 0;

    // Pre-compute how many rows we need
    for (boot_idx, &orig_id) in sampled_ids.iter().enumerate() {
        if let Some(rows) = id_to_rows.get(&orig_id.to_bits()) {
            total_rows += rows.len();
        }
    }

    // Initialize columns
    for (col_name, col_vals) in &data.numeric {
        let mut new_col = Vec::with_capacity(total_rows);

        for (boot_idx, &orig_id) in sampled_ids.iter().enumerate() {
            if let Some(rows) = id_to_rows.get(&orig_id.to_bits()) {
                for &row_idx in rows {
                    if col_name == &config.id {
                        // Create unique ID
                        new_col.push(orig_id * id_mult + boot_idx as f64);
                    } else {
                        new_col.push(col_vals[row_idx]);
                    }
                }
            }
        }

        new_data.numeric.insert(col_name.clone(), new_col);
    }

    for (col_name, col_vals) in &data.categorical {
        let mut new_col = Vec::with_capacity(total_rows);

        for (_, &orig_id) in sampled_ids.iter().enumerate() {
            if let Some(rows) = id_to_rows.get(&orig_id.to_bits()) {
                for &row_idx in rows {
                    new_col.push(col_vals[row_idx].clone());
                }
            }
        }

        new_data.categorical.insert(col_name.clone(), new_col);
    }

    // Copy factor metadata
    new_data.factors = data.factors.clone();

    new_data.nrows = total_rows;
    Ok(new_data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bootstrap_resample_basic() {
        let mut data = ColumnarData::new();
        // 3 subjects, 2 rows each
        data.add_numeric(
            "id".to_string(),
            vec![1.0, 1.0, 2.0, 2.0, 3.0, 3.0],
        );
        data.add_numeric(
            "followup".to_string(),
            vec![0.0, 1.0, 0.0, 1.0, 0.0, 1.0],
        );
        data.add_numeric(
            "outcome".to_string(),
            vec![0.0, 1.0, 0.0, 0.0, 1.0, 1.0],
        );

        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();

        let resampled = bootstrap_resample(&data, &config, 42, 1.0).unwrap();

        // Should have 3 sampled IDs × 2 rows each = 6 rows
        assert_eq!(resampled.nrows, 6);

        // IDs should be unique (different from originals due to multiplier)
        let new_ids = resampled.get_numeric("id").unwrap();
        assert_eq!(new_ids.len(), 6);

        // followup pattern should be preserved within each subject
        let fup = resampled.get_numeric("followup").unwrap();
        for i in (0..6).step_by(2) {
            assert!((fup[i] - 0.0).abs() < 1e-10);
            assert!((fup[i + 1] - 1.0).abs() < 1e-10);
        }
    }

    #[test]
    fn test_bootstrap_resample_fraction() {
        let mut data = ColumnarData::new();
        // 10 subjects, 1 row each
        let ids: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let vals: Vec<f64> = vec![0.0; 10];

        data.add_numeric("id".to_string(), ids);
        data.add_numeric("x".to_string(), vals);

        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();

        let resampled = bootstrap_resample(&data, &config, 12345, 0.5).unwrap();

        // 50% of 10 = 5 subjects
        assert_eq!(resampled.nrows, 5);
    }
}
