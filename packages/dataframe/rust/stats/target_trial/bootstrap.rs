//! Bootstrap resampling for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_analysis.R` (bootstrap logic).
//! ID-level resampling: resample whole subjects, not individual rows.

use super::mt19937::MersenneTwister;
use super::types::{ColumnarData, TargetTrialConfig};

/// Sample IDs with replacement from the expanded data.
///
/// Mirrors R's `sample(UIDs, n_sample, replace = TRUE)` where
/// `UIDs <- unique(params@DT[[params@id]])`.
///
/// Uses MT19937 to match R's RNG exactly.
/// Returns (sampled_ids, id_multiplier, rng) — the same list is used to
/// resample both expanded and pre-expansion data. The rng is returned
/// so the caller can continue using the same RNG state (matching R's
/// behavior where set.seed seeds both sampling and handler).
pub fn bootstrap_sample_ids(
    expanded_data: &ColumnarData,
    config: &TargetTrialConfig,
    seed: u64,
    sample_fraction: f64,
) -> Result<(Vec<f64>, f64, MersenneTwister), String> {
    let id_col = expanded_data
        .get_numeric(&config.id)
        .ok_or_else(|| format!("ID column '{}' not found", config.id))?;

    // Get unique IDs (matching R: UIDs <- unique(params@DT[[params@id]]))
    let mut unique_ids: Vec<f64> = id_col.to_vec();
    unique_ids.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    unique_ids.dedup();

    let n_unique = unique_ids.len();
    let n_sample = (sample_fraction * n_unique as f64).round() as usize;

    if n_sample == 0 {
        return Err("Bootstrap sample size is 0".to_string());
    }

    // R: set.seed(params@seed + x) then sample(UIDs, n_sample, replace=TRUE)
    let mut rng = MersenneTwister::from_seed(seed as i32);
    let indices = rng.sample_int_replace(n_unique, n_sample);
    let sampled_ids: Vec<f64> = indices.iter().map(|&idx| unique_ids[idx]).collect();

    // ID multiplier for creating unique IDs
    let max_id = unique_ids
        .iter()
        .cloned()
        .fold(f64::NEG_INFINITY, f64::max);
    let id_mult = max_id.abs() + 1.0;

    Ok((sampled_ids, id_mult, rng))
}

/// Resample a dataset using a pre-computed list of sampled IDs.
///
/// Mirrors R's join-based resampling:
/// ```r
/// DT[id_lookup, on = setNames("orig_id", params@id), allow.cartesian = TRUE]
/// ```
///
/// Both DT and data are resampled with the SAME `sampled_ids` so that
/// corresponding subjects appear in both datasets.
pub fn resample_with_ids(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    sampled_ids: &[f64],
    id_mult: f64,
) -> Result<ColumnarData, String> {
    let id_col = data
        .get_numeric(&config.id)
        .ok_or_else(|| format!("ID column '{}' not found", config.id))?;

    // Build index: id → row indices
    let mut id_to_rows: std::collections::HashMap<u64, Vec<usize>> =
        std::collections::HashMap::new();
    for (i, &id) in id_col.iter().enumerate() {
        id_to_rows.entry(id.to_bits()).or_default().push(i);
    }

    // Pre-compute total rows
    let mut total_rows = 0;
    for &orig_id in sampled_ids {
        if let Some(rows) = id_to_rows.get(&orig_id.to_bits()) {
            total_rows += rows.len();
        }
    }

    // Build new data by duplicating rows
    let mut new_data = ColumnarData::new();

    for (col_name, col_vals) in &data.numeric {
        let mut new_col = Vec::with_capacity(total_rows);

        for (boot_idx, &orig_id) in sampled_ids.iter().enumerate() {
            if let Some(rows) = id_to_rows.get(&orig_id.to_bits()) {
                for &row_idx in rows {
                    if col_name == &config.id {
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

/// Resample IDs with replacement and duplicate all rows for sampled IDs.
///
/// Convenience wrapper that combines `bootstrap_sample_ids` + `resample_with_ids`.
/// Use `bootstrap_sample_ids` + `resample_with_ids` directly when you need to
/// resample multiple datasets with the same ID selection.
pub fn bootstrap_resample(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    seed: u64,
    sample_fraction: f64,
) -> Result<ColumnarData, String> {
    let (sampled_ids, id_mult, _rng) = bootstrap_sample_ids(data, config, seed, sample_fraction)?;
    resample_with_ids(data, config, &sampled_ids, id_mult)
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

    #[test]
    fn test_shared_ids_across_datasets() {
        // Verify that sampling IDs from one dataset and applying to both
        // produces consistent results
        let mut dt = ColumnarData::new();
        dt.add_numeric("id".to_string(), vec![1.0, 1.0, 2.0, 2.0, 3.0, 3.0]);
        dt.add_numeric("x".to_string(), vec![10.0, 11.0, 20.0, 21.0, 30.0, 31.0]);

        let mut pre = ColumnarData::new();
        pre.add_numeric("id".to_string(), vec![1.0, 2.0, 3.0]);
        pre.add_numeric("y".to_string(), vec![100.0, 200.0, 300.0]);

        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();

        let (sampled_ids, id_mult, _rng) = bootstrap_sample_ids(&dt, &config, 42, 1.0).unwrap();

        let boot_dt = resample_with_ids(&dt, &config, &sampled_ids, id_mult).unwrap();
        let boot_pre = resample_with_ids(&pre, &config, &sampled_ids, id_mult).unwrap();

        // Both should have been resampled with the same IDs
        assert_eq!(boot_dt.nrows, 6); // 3 IDs × 2 rows each
        assert_eq!(boot_pre.nrows, 3); // 3 IDs × 1 row each
    }
}
