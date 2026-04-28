//! Trial data expansion for target trial emulation.
//!
//! Ported from SEQTaRget's `SEQexpand.R` (150 lines).
//! Expands longitudinal observational data into a sequential trial structure:
//! one row per (id, trial, followup) with covariates joined from the original data.

use super::types::{AnalysisMethod, ColumnarData, TargetTrialConfig};
use std::collections::HashMap;

/// Result of data expansion.
pub struct ExpandedData {
    /// The expanded dataset
    pub data: ColumnarData,
    /// Column names of baseline-indicator columns that were created
    pub baseline_cols: Vec<String>,
    /// Column names of squared-term columns that were created
    pub squared_cols: Vec<String>,
}

/// Expand longitudinal data into sequential trial structure.
///
/// For each eligible subject-time, creates a trial with follow-up rows
/// from followup_min to followup_max. Joins time-varying and baseline
/// covariates from the original data.
///
/// Mirrors R's `SEQexpand()`.
pub fn expand(
    source: &ColumnarData,
    config: &TargetTrialConfig,
) -> Result<ExpandedData, String> {
    let id_col = source
        .get_numeric(&config.id)
        .ok_or_else(|| format!("id column '{}' not found in data", config.id))?;
    let time_col = source
        .get_numeric(&config.time)
        .ok_or_else(|| format!("time column '{}' not found in data", config.time))?;
    let eligible_col = source
        .get_numeric(&config.eligible)
        .ok_or_else(|| format!("eligible column '{}' not found in data", config.eligible))?;

    let n_source = source.nrows;

    // Build per-ID row indices, sorted by time
    let mut id_rows: HashMap<u64, Vec<usize>> = HashMap::new();
    for i in 0..n_source {
        let id_key = id_col[i].to_bits();
        id_rows.entry(id_key).or_default().push(i);
    }
    // Sort each ID's rows by time
    for rows in id_rows.values_mut() {
        rows.sort_by(|&a, &b| time_col[a].partial_cmp(&time_col[b]).unwrap());
    }

    // Phase 1: Generate trial structure (id, trial, period, followup)
    let max_followup = if config.followup_max.is_finite() && config.followup_max < 1e300 {
        config.followup_max as usize
    } else {
        // If no max (Inf or 1e308 from JS), use the max number of periods per ID
        id_rows.values().map(|r| r.len().saturating_sub(1)).max().unwrap_or(0)
    };
    let min_followup = config.followup_min as usize;

    let mut exp_id: Vec<f64> = Vec::new();
    let mut exp_trial: Vec<f64> = Vec::new();
    let mut exp_period: Vec<f64> = Vec::new();
    let mut exp_followup: Vec<f64> = Vec::new();

    for (&_id_bits, rows) in &id_rows {
        let id_val = id_col[rows[0]];
        let n_periods = rows.len();

        // Each row in the source starts a trial. R uses rowid-1 as trial number
        // (sequential per ID, regardless of eligibility). Non-eligible trials
        // get filtered out later by eligible_bas, but trial numbers retain gaps.
        for (pos, &src_row) in rows.iter().enumerate() {
            if eligible_col[src_row] != 1.0 {
                continue;
            }
            let trial_time = time_col[src_row];
            // R: trial := rowid(id) - 1, which is just the row position within ID
            let trial_val = pos as f64;

            // Follow-up goes from this period forward
            let max_fu = std::cmp::min(max_followup, n_periods - 1 - pos);
            for fu in min_followup..=max_fu {
                let period = trial_time + fu as f64;
                exp_id.push(id_val);
                exp_trial.push(trial_val);
                exp_period.push(period);
                exp_followup.push(fu as f64);
            }
        }
    }

    let n_expanded = exp_id.len();
    if n_expanded == 0 {
        return Err("expansion produced 0 rows — check eligible column and followup limits".to_string());
    }

    // Build source lookup: (id, time) → source row index
    let mut source_lookup: HashMap<(u64, u64), usize> = HashMap::with_capacity(n_source);
    for i in 0..n_source {
        source_lookup.insert((id_col[i].to_bits(), time_col[i].to_bits()), i);
    }

    // Build trial-time lookup: (id, trial) → source_time (the time at trial start)
    // trial values use row position (pos), matching R's rowid(id) - 1
    let mut trial_time_lookup: HashMap<(u64, u64), f64> = HashMap::new();
    for (&_id_bits, rows) in &id_rows {
        let id_val = id_col[rows[0]];
        for (pos, &src_row) in rows.iter().enumerate() {
            // Map ALL rows' positions to their time, not just eligible ones.
            // The expansion only creates trials for eligible positions,
            // but the baseline join needs to look up the time for any trial number.
            trial_time_lookup.insert(
                (id_val.to_bits(), pos as u64),
                time_col[src_row],
            );
        }
    }

    let mut result = ColumnarData::new();
    result.add_numeric(config.id.clone(), exp_id.clone());
    result.add_numeric("trial".to_string(), exp_trial.clone());
    result.add_numeric("period".to_string(), exp_period.clone());
    result.add_numeric("followup".to_string(), exp_followup.clone());

    // Determine which columns to join
    let _tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);

    // Collect all referenced column names from formulas
    let mut time_varying_cols: Vec<String> = Vec::new();
    let mut baseline_cols_created: Vec<String> = Vec::new();
    let mut squared_cols_created: Vec<String> = Vec::new();

    // Time-varying columns: join on (id, period)
    // Include treatment, outcome, cense, compevent, time_varying, visit
    let mut tv_names: Vec<String> = vec![config.treatment.clone(), config.outcome.clone()];
    tv_names.extend(config.time_varying.iter().cloned());
    if let Some(ref c) = config.cense { tv_names.push(c.clone()); }
    if let Some(ref c) = config.cense_eligible { tv_names.push(c.clone()); }
    if let Some(ref c) = config.compevent { tv_names.push(c.clone()); }
    if let Some(ref c) = config.visit { tv_names.push(c.clone()); }
    if let Some(ref c) = config.subgroup { tv_names.push(c.clone()); }
    // R line 40: vars.time includes excused.cols and deviation.excused_cols
    for opt in &config.excused_cols {
        if let Some(c) = opt { tv_names.push(c.clone()); }
    }
    for opt in &config.deviation.excused_cols {
        if let Some(c) = opt { tv_names.push(c.clone()); }
    }
    tv_names.sort();
    tv_names.dedup();

    // Join time-varying columns: lookup source row by (id, period)
    for col_name in &tv_names {
        if let Some(src_col) = source.get_numeric(col_name) {
            let mut joined: Vec<f64> = Vec::with_capacity(n_expanded);
            for i in 0..n_expanded {
                let key = (exp_id[i].to_bits(), exp_period[i].to_bits());
                if let Some(&src_row) = source_lookup.get(&key) {
                    joined.push(src_col[src_row]);
                } else {
                    joined.push(f64::NAN);
                }
            }
            result.add_numeric(col_name.clone(), joined);
            time_varying_cols.push(col_name.clone());
        }
    }

    // Also join fixed columns as time-varying (they exist in source, needed in expanded)
    for col_name in &config.fixed {
        if !result.has_column(col_name) {
            if let Some(src_col) = source.get_numeric(col_name) {
                let mut joined: Vec<f64> = Vec::with_capacity(result.nrows);
                let cur_id = result.get_numeric(&config.id).unwrap();
                let cur_period = result.get_numeric("period").unwrap();
                for i in 0..result.nrows {
                    let key = (cur_id[i].to_bits(), cur_period[i].to_bits());
                    if let Some(&src_row) = source_lookup.get(&key) {
                        joined.push(src_col[src_row]);
                    } else {
                        joined.push(f64::NAN);
                    }
                }
                result.add_numeric(col_name.clone(), joined);
            }
        }
    }

    // Baseline columns: join on (id, trial_time) and suffix with indicator_baseline
    let mut base_source_cols: Vec<String> = config.time_varying.clone();
    base_source_cols.push(config.treatment.clone());
    base_source_cols.push(config.eligible.clone());
    base_source_cols.extend(config.fixed.iter().cloned());
    base_source_cols.sort();
    base_source_cols.dedup();

    for col_name in &base_source_cols {
        if let Some(src_col) = source.get_numeric(col_name) {
            let bas_name = format!("{}{}", col_name, config.indicator_baseline);
            let mut joined: Vec<f64> = Vec::with_capacity(n_expanded);
            for i in 0..n_expanded {
                let trial_key = (exp_id[i].to_bits(), (exp_trial[i] as u64));
                if let Some(&trial_start_time) = trial_time_lookup.get(&trial_key) {
                    let src_key = (exp_id[i].to_bits(), trial_start_time.to_bits());
                    if let Some(&src_row) = source_lookup.get(&src_key) {
                        joined.push(src_col[src_row]);
                    } else {
                        joined.push(f64::NAN);
                    }
                } else {
                    joined.push(f64::NAN);
                }
            }
            result.add_numeric(bas_name.clone(), joined);
            baseline_cols_created.push(bas_name);
        }
    }

    // Filter to eligible baseline: eligible_bas == 1
    let elig_bas_name = format!("{}{}", config.eligible, config.indicator_baseline);
    if let Some(elig_bas) = result.get_numeric(&elig_bas_name).cloned() {
        let keep: Vec<bool> = elig_bas.iter().map(|&v| v == 1.0).collect();
        filter_columnar_data(&mut result, &keep);
        // Remove the eligible_bas column (R does this too)
        result.numeric.remove(&elig_bas_name);
        baseline_cols_created.retain(|c| c != &elig_bas_name);
    }

    // Squared terms
    let followup_sq_name = format!("followup{}", config.indicator_squared);
    if config.followup_include {
        if let Some(fu) = result.get_numeric("followup").cloned() {
            let sq: Vec<f64> = fu.iter().map(|v| v * v).collect();
            result.add_numeric(followup_sq_name.clone(), sq);
            squared_cols_created.push(followup_sq_name);
        }
    }

    let trial_sq_name = format!("trial{}", config.indicator_squared);
    if config.trial_include || config.method != AnalysisMethod::ITT {
        if let Some(tr) = result.get_numeric("trial").cloned() {
            let sq: Vec<f64> = tr.iter().map(|v| v * v).collect();
            result.add_numeric(trial_sq_name.clone(), sq);
            squared_cols_created.push(trial_sq_name);
        }
    }

    // Time squared
    let time_sq_name = format!("{}{}", config.time, config.indicator_squared);
    if let Some(period) = result.get_numeric("period").cloned() {
        let sq: Vec<f64> = period.iter().map(|v| v * v).collect();
        result.add_numeric(time_sq_name.clone(), sq);
        squared_cols_created.push(time_sq_name);
    }

    // Dose-response: cumulative treatment sum
    if config.method == AnalysisMethod::DoseResponse {
        compute_dose_columns(&mut result, config)?;
    }

    // Censoring: detect treatment switches
    if config.method == AnalysisMethod::Censoring {
        compute_censoring(&mut result, config)?;
    }

    // First-trial selection
    if config.selection_first_trial {
        filter_first_trial(&mut result, config);
    }

    Ok(ExpandedData {
        data: result,
        baseline_cols: baseline_cols_created,
        squared_cols: squared_cols_created,
    })
}

/// Filter a ColumnarData in-place, keeping only rows where `keep[i]` is true.
fn filter_columnar_data(data: &mut ColumnarData, keep: &[bool]) {
    let new_nrows = keep.iter().filter(|&&k| k).count();
    for col in data.numeric.values_mut() {
        *col = col
            .iter()
            .zip(keep.iter())
            .filter(|&(_, &k)| k)
            .map(|(&v, _)| v)
            .collect();
    }
    for col in data.categorical.values_mut() {
        *col = col
            .iter()
            .zip(keep.iter())
            .filter(|&(_, &k)| k)
            .map(|(v, _)| v.clone())
            .collect();
    }
    data.nrows = new_nrows;
}

/// Compute dose and dose_sq columns for dose-response analysis.
fn compute_dose_columns(
    data: &mut ColumnarData,
    config: &TargetTrialConfig,
) -> Result<(), String> {
    let id = data.get_numeric(&config.id).ok_or("missing id column")?.clone();
    let trial = data.get_numeric("trial").ok_or("missing trial column")?.clone();
    let treatment = data.get_numeric(&config.treatment).ok_or("missing treatment column")?.clone();

    let n = data.nrows;
    let mut dose = vec![0.0; n];

    // cumsum of treatment within (id, trial)
    let mut i = 0;
    while i < n {
        let cur_id = id[i];
        let cur_trial = trial[i];
        let mut cumsum = 0.0;
        let mut j = i;
        while j < n && id[j] == cur_id && trial[j] == cur_trial {
            cumsum += treatment[j];
            dose[j] = cumsum;
            j += 1;
        }
        i = j;
    }

    let dose_sq: Vec<f64> = dose.iter().map(|v| v * v).collect();
    data.add_numeric("dose".to_string(), dose);
    data.add_numeric(format!("dose{}", config.indicator_squared), dose_sq);

    Ok(())
}

/// Compute censoring indicators for per-protocol analysis.
///
/// Detects treatment switches and truncates follow-up at the first switch.
/// For excused censoring, switches where the excused column is 1 are forgiven
/// and the isExcused column is preserved for downstream weight calculations.
fn compute_censoring(
    data: &mut ColumnarData,
    config: &TargetTrialConfig,
) -> Result<(), String> {
    let id = data.get_numeric(&config.id).ok_or("missing id column")?.clone();
    let trial = data.get_numeric("trial").ok_or("missing trial column")?.clone();
    let treatment = data.get_numeric(&config.treatment).ok_or("missing treatment column")?.clone();
    let outcome = data.get_numeric(&config.outcome).ok_or("missing outcome column")?.clone();

    let n = data.nrows;
    let mut switch_flag = vec![false; n];
    // isExcused: NAN = not a switch row, 0 = switch not excused, 1 = switch excused
    let mut is_excused = vec![f64::NAN; n];

    // Step 1: Detect all switches: treatment != lag(treatment) within (id, trial)
    // R: out[, lag := shift(treatment, fill = treatment[1]), by = c(id, "trial")]
    // R: out[, switch := (treatment != lag)]
    let mut i = 0;
    while i < n {
        let cur_id = id[i];
        let cur_trial = trial[i];
        let mut prev_tx = treatment[i]; // fill = first value

        let mut j = i + 1;
        while j < n && id[j] == cur_id && trial[j] == cur_trial {
            if (treatment[j] - prev_tx).abs() > 1e-10 {
                switch_flag[j] = true;
            }
            prev_tx = treatment[j];
            j += 1;
        }
        i = j;
    }

    // Step 2: For excused censoring, mark excused switches and un-switch them
    if config.excused {
        // R: for each treat_level[i], where excused_cols[i] is not NA:
        //   out[(switch) & treatment == treat_level[i], isExcused := ifelse(excused_cols[i] == 1, 1, 0)]
        for (level_idx, &level) in config.treat_levels.iter().enumerate() {
            if let Some(Some(col_name)) = config.excused_cols.get(level_idx) {
                if let Some(exc_col) = data.get_numeric(col_name) {
                    for row in 0..n {
                        if switch_flag[row] && (treatment[row] - level).abs() < 1e-10 {
                            is_excused[row] = if (exc_col[row] - 1.0).abs() < 1e-10 { 1.0 } else { 0.0 };
                        }
                    }
                }
            }
        }

        // R: out[!is.na(isExcused), excused_tmp := cumsum(isExcused), by = c(id, "trial")]
        // R: out[(excused_tmp) > 0, switch := FALSE]
        let mut idx = 0;
        while idx < n {
            let cur_id = id[idx];
            let cur_trial = trial[idx];
            let group_start = idx;
            idx += 1;
            while idx < n && id[idx] == cur_id && trial[idx] == cur_trial {
                idx += 1;
            }
            // Cumsum isExcused within this group, then set switch=false where cumsum > 0
            let mut exc_cumsum = 0.0;
            for row in group_start..idx {
                if !is_excused[row].is_nan() {
                    exc_cumsum += is_excused[row];
                }
                if exc_cumsum > 0.0 {
                    switch_flag[row] = false;
                }
            }
        }
    }

    // Step 3: Find first (remaining) switch per group and truncate
    let mut keep = vec![true; n];
    let mut censored = vec![0.0; n];

    i = 0;
    while i < n {
        let cur_id = id[i];
        let cur_trial = trial[i];
        let mut j = i;
        let mut first_switch: Option<usize> = None;

        while j < n && id[j] == cur_id && trial[j] == cur_trial {
            if switch_flag[j] && first_switch.is_none() {
                first_switch = Some(j - i);
            }
            j += 1;
        }

        // Truncate: keep rows up to and including the first switch row
        if let Some(fs_pos) = first_switch {
            for k in (i + fs_pos + 1)..j {
                keep[k] = false;
            }
        }
        i = j;
    }

    // Set outcome to NAN where switch occurred, set censored indicator
    let mut new_outcome = outcome.clone();
    for idx in 0..n {
        if switch_flag[idx] {
            new_outcome[idx] = f64::NAN;
            censored[idx] = 1.0;
        }
    }

    // Replace/add columns
    data.numeric.insert(config.outcome.clone(), new_outcome);
    data.add_numeric("censored".to_string(), censored);

    // For excused censoring, keep the isExcused column (needed by weights)
    // R does NOT remove isExcused for params@excused path (only for deviation.excused)
    if config.excused {
        data.add_numeric("isExcused".to_string(), is_excused);
    }

    // Filter to kept rows
    filter_columnar_data(data, &keep);

    Ok(())
}

/// Filter to first trial per ID only.
fn filter_first_trial(data: &mut ColumnarData, config: &TargetTrialConfig) {
    let id = data.get_numeric(&config.id).unwrap().clone();
    let trial = data.get_numeric("trial").unwrap().clone();
    let n = data.nrows;

    // Find min trial per ID
    let mut min_trial: HashMap<u64, f64> = HashMap::new();
    for i in 0..n {
        let key = id[i].to_bits();
        let entry = min_trial.entry(key).or_insert(trial[i]);
        if trial[i] < *entry {
            *entry = trial[i];
        }
    }

    let keep: Vec<bool> = (0..n)
        .map(|i| {
            let key = id[i].to_bits();
            trial[i] == *min_trial.get(&key).unwrap()
        })
        .collect();

    filter_columnar_data(data, &keep);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_data() -> ColumnarData {
        let mut data = ColumnarData::new();
        // 2 subjects, 5 time periods each
        data.add_numeric("id".to_string(), vec![
            1.0, 1.0, 1.0, 1.0, 1.0,
            2.0, 2.0, 2.0, 2.0, 2.0,
        ]);
        data.add_numeric("period".to_string(), vec![
            0.0, 1.0, 2.0, 3.0, 4.0,
            0.0, 1.0, 2.0, 3.0, 4.0,
        ]);
        data.add_numeric("eligible".to_string(), vec![
            1.0, 1.0, 0.0, 0.0, 0.0,
            1.0, 0.0, 1.0, 0.0, 0.0,
        ]);
        data.add_numeric("treatment".to_string(), vec![
            1.0, 1.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 1.0, 1.0,
        ]);
        data.add_numeric("outcome".to_string(), vec![
            0.0, 0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 1.0,
        ]);
        data.add_numeric("x1".to_string(), vec![
            0.5, 0.6, 0.7, 0.8, 0.9,
            1.0, 1.1, 1.2, 1.3, 1.4,
        ]);
        data
    }

    fn make_config() -> TargetTrialConfig {
        let mut c = TargetTrialConfig::default();
        c.id = "id".to_string();
        c.time = "period".to_string();
        c.treatment = "treatment".to_string();
        c.outcome = "outcome".to_string();
        c.eligible = "eligible".to_string();
        c.time_varying = vec!["x1".to_string()];
        c.followup_max = 3.0;
        c
    }

    #[test]
    fn test_expand_basic() {
        let data = make_test_data();
        let config = make_config();
        let result = expand(&data, &config).unwrap();

        // Should have expanded rows
        assert!(result.data.nrows > 0);
        // Should have id, trial, period, followup columns
        assert!(result.data.has_column("id"));
        assert!(result.data.has_column("trial"));
        assert!(result.data.has_column("period"));
        assert!(result.data.has_column("followup"));
        // Should have treatment joined
        assert!(result.data.has_column("treatment"));
        // Should have baseline columns
        assert!(result.data.has_column("x1_bas"));
    }

    #[test]
    fn test_expand_followup_range() {
        let data = make_test_data();
        let config = make_config();
        let result = expand(&data, &config).unwrap();

        let followup = result.data.get_numeric("followup").unwrap();
        // All followup values should be >= 0 and <= max
        for &fu in followup {
            assert!(fu >= 0.0);
            assert!(fu <= config.followup_max);
        }
    }

    #[test]
    fn test_expand_censoring() {
        let data = make_test_data();
        let mut config = make_config();
        config.method = AnalysisMethod::Censoring;
        let result = expand(&data, &config).unwrap();

        // Should have censored column
        assert!(result.data.has_column("censored"));
    }

    #[test]
    fn test_expand_dose_response() {
        let data = make_test_data();
        let mut config = make_config();
        config.method = AnalysisMethod::DoseResponse;
        let result = expand(&data, &config).unwrap();

        assert!(result.data.has_column("dose"));
        assert!(result.data.has_column("dose_sq"));
    }

    #[test]
    fn test_expand_squared_terms() {
        let data = make_test_data();
        let config = make_config();
        let result = expand(&data, &config).unwrap();

        assert!(result.data.has_column("followup_sq"));
        assert!(result.data.has_column("trial_sq"));
    }
}
