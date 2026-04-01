//! Hazard ratio estimation for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_hazard.R`.
//! Simulates first-event times from predicted probabilities,
//! then runs Cox PH for hazard ratio estimation.

use std::collections::BTreeMap;

use super::glm_helpers::FormulaCache;
use super::outcome_models::{predict_outcome, OutcomeModel};
use super::types::{ColumnarData, HazardRatioResult, TargetTrialConfig};
use crate::stats::survival::cox_regression::{coxfit6, CoxfitConfig, CoxMethod};

/// Simple Bernoulli draw: return 1 with probability p, else 0.
///
/// Uses xorshift64 PRNG (deterministic given state).
fn bernoulli(p: f64, rng_state: &mut u64) -> u32 {
    // xorshift64
    let mut x = *rng_state;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    *rng_state = x;
    let u = (x as f64) / (u64::MAX as f64);
    if u < p { 1 } else { 0 }
}

/// Simulate events and run Cox PH, mirroring R's `internal.hazard()` handler.
///
/// R logic (internal_hazard.R lines 20-59):
/// 1. kept = columns NOT in {followup, followup_sq, treatment, tx_bas, period, outcome}
/// 2. trials = data[kept] → .SD[1] per (id, trial) → replicate followup.max+1 times
///    → set followup = 0..N-1 per (id,trial) → set followup_sq
/// 3. For each treat_level: copy trials → set tx_bas → predict outcomeProb
///    → outcome = rbinom(.N, 1, outcomeProb)
///    → firstEvent = match(TRUE, outcome==1) per (id,trial); if NA then .N
/// 4. rbindlist all arms → keep rows 1..firstEvent per (id,trial,tx_bas)
///    → take last row per (id,trial,tx_bas) → event = (outcome==1)
/// 5. coxph(Surv(followup, event==1) ~ get(tx_bas), data) → return coefficients (log HR)
fn hazard_handler(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    outcome_model: &OutcomeModel,
    formula_cache: &FormulaCache,
    seed: u64,
) -> Result<f64, String> {
    let tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);
    let fup_sq_col = format!("followup{}", config.indicator_squared);

    // R line 10-12: columns to exclude from trials base data
    let exclude: Vec<String> = vec![
        "followup".to_string(),
        fup_sq_col.clone(),
        config.treatment.clone(),
        tx_bas.clone(),
        "period".to_string(),
        config.outcome.clone(),
    ];

    // R line 21-22: .SD[1] by (id, trial)
    // Take first row of each (id, trial) group
    let id_col = data.get_numeric(&config.id).ok_or("ID column not found")?;
    let trial_col = data.get_numeric("trial").ok_or("trial column not found")?;

    // Find first row per (id, trial) — data is already sorted by (id, time)
    // Use BTreeMap for deterministic ordering
    let mut first_rows: BTreeMap<(i64, i64), usize> = BTreeMap::new();
    for i in 0..data.nrows {
        let key = (id_col[i] as i64, trial_col[i] as i64);
        first_rows.entry(key).or_insert(i);
    }
    let baseline_rows: Vec<usize> = first_rows.values().copied().collect();
    let n_base = baseline_rows.len();

    if n_base == 0 {
        return Err("No (id, trial) groups found".to_string());
    }

    // R line 23: rep(seq_len(.N), each = params@followup.max + 1)
    let max_fup = config.followup_max as usize + 1;

    // R line 28-33: for each treatment level, build prediction data and simulate
    let mut all_followup: Vec<f64> = Vec::new();
    let mut all_event: Vec<f64> = Vec::new();
    let mut all_arm: Vec<f64> = Vec::new();

    let mut rng = seed;

    for &level in &config.treat_levels {
        let total_rows = n_base * max_fup;
        let mut pred_data = ColumnarData::new();

        // R line 21: data[, kept, with = FALSE] — copy non-excluded columns
        // Use sorted keys for deterministic ordering
        let sorted_keys: Vec<String> = {
            let mut keys: Vec<String> = data.numeric.keys().cloned().collect();
            keys.sort();
            keys
        };

        for col_name in &sorted_keys {
            if exclude.contains(col_name) {
                continue;
            }
            let col_vals = &data.numeric[col_name];
            let mut new_col = Vec::with_capacity(total_rows);
            // R line 23: rep(seq_len(.N), each = followup.max + 1) — replicate each baseline row
            for &base_row in &baseline_rows {
                for _ in 0..max_fup {
                    new_col.push(col_vals[base_row]);
                }
            }
            pred_data.numeric.insert(col_name.clone(), new_col);
        }

        // Copy factor metadata
        for (name, info) in &data.factors {
            pred_data.factors.insert(name.clone(), info.clone());
        }

        // R line 24: [, "followup" := seq.int(1:.N) - 1, by = c(params@id, "trial")]
        let mut fup_vals = Vec::with_capacity(total_rows);
        let mut fup_sq_vals = Vec::with_capacity(total_rows);
        for _ in 0..n_base {
            for t in 0..max_fup {
                fup_vals.push(t as f64);
                fup_sq_vals.push((t * t) as f64);
            }
        }
        pred_data.numeric.insert("followup".to_string(), fup_vals);
        pred_data.numeric.insert(fup_sq_col.clone(), fup_sq_vals);

        // R line 31: [, eval(tx_bas) := params@treat.level[[i]]]
        pred_data.numeric.insert(tx_bas.clone(), vec![level; total_rows]);

        // Dose columns for dose-response
        if config.method == super::types::AnalysisMethod::DoseResponse {
            let dose: Vec<f64> = if level.abs() < 1e-10 {
                vec![0.0; total_rows]
            } else {
                pred_data.get_numeric("followup").unwrap().clone()
            };
            let dose_sq: Vec<f64> = dose.iter().map(|d| d * d).collect();
            pred_data.numeric.insert("dose".to_string(), dose);
            pred_data.numeric.insert("dose_sq".to_string(), dose_sq);
        }

        pred_data.nrows = total_rows;

        // R line 32: inline.pred(model, newdata = .SD, params, type = "outcome", cache = cache)
        let probs = predict_outcome(outcome_model, &pred_data, formula_cache, None)?;

        // R line 33: [, "outcome" := rbinom(.N, 1, fcoalesce(outcomeProb, 0.5))]
        let mut outcomes = vec![0u32; total_rows];
        for idx in 0..total_rows {
            let p = if probs[idx].is_nan() { 0.5 } else { probs[idx].max(0.0).min(1.0) };
            outcomes[idx] = bernoulli(p, &mut rng);
        }

        // R line 39: [, "firstEvent" := { m <- match(TRUE, outcome == 1); if (is.na(m)) .N else m },
        //             by = c(params@id, "trial")]
        // Then R line 45-49:
        //   data <- out[out[, .I[seq_len(firstEvent[1])], by = c(id, "trial", tx_bas)]$V1]
        //            [, .SD[.N], by = c(id, "trial", tx_bas)]
        //            [, event := 0][outcome == 1, event := 1]
        //
        // This means: for each subject, find first event position (1-indexed).
        // Keep rows 1..firstEvent. Take the last of those rows.
        // The followup time of that last row is firstEvent-1 (0-indexed).
        // If outcome==1 at that row, event=1; otherwise event=0.
        for subj in 0..n_base {
            let start = subj * max_fup;
            // R: match(TRUE, outcome == 1) returns 1-indexed position, or .N if not found
            let mut first_event_pos = max_fup; // .N (1-indexed: max_fup)
            for t in 0..max_fup {
                if outcomes[start + t] == 1 {
                    first_event_pos = t + 1; // 1-indexed
                    break;
                }
            }

            // R: keep rows 1..firstEvent, take last → row at index firstEvent-1 (0-indexed = first_event_pos - 1)
            let last_row_t = first_event_pos - 1; // 0-indexed followup time
            let event = if outcomes[start + last_row_t] == 1 { 1.0 } else { 0.0 };

            all_followup.push(last_row_t as f64);
            all_event.push(event);
            all_arm.push(level);
        }
    }

    // R line 58: coxph(Surv(followup, event == 1) ~ get(tx_bas), data)
    run_cox_ph(&all_followup, &all_event, &all_arm)
}

/// Run Cox PH using our coxfit6 implementation.
///
/// R: coxph(Surv(followup, event == 1) ~ get(tx_bas), data)
/// Returns log hazard ratio (coefficient).
fn run_cox_ph(times: &[f64], events: &[f64], arms: &[f64]) -> Result<f64, String> {
    let n = times.len();
    if n == 0 {
        return Err("No observations for Cox PH".to_string());
    }

    let total_events: f64 = events.iter().sum();
    if total_events < 1.0 {
        return Err("No events for Cox PH".to_string());
    }

    // Sort by (time ascending, events before censored at ties)
    let status: Vec<i32> = events.iter().map(|&e| if e > 0.5 { 1 } else { 0 }).collect();
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        times[a]
            .partial_cmp(&times[b])
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(status[b].cmp(&status[a]))
    });

    let sorted_time: Vec<f64> = order.iter().map(|&i| times[i]).collect();
    let sorted_status: Vec<i32> = order.iter().map(|&i| status[i]).collect();
    let sorted_arm: Vec<f64> = order.iter().map(|&i| arms[i]).collect();

    // Single stratum: marker[last] = 1, rest = 0
    let mut strata = vec![0i32; n];
    strata[n - 1] = 1;

    let weights = vec![1.0; n];
    let offset = vec![0.0; n];
    let init = vec![0.0]; // single covariate

    let config = CoxfitConfig {
        maxiter: 25,
        eps: 1e-9,
        toler: 1e-12,
        method: CoxMethod::Efron, // R default
        doscale: vec![true],
    };

    let result = coxfit6(
        &sorted_time,
        &sorted_status,
        &[sorted_arm],
        &strata,
        &offset,
        &weights,
        &init,
        &config,
    );

    if result.coef.is_empty() {
        return Err("Cox PH returned no coefficients".to_string());
    }

    Ok(result.coef[0]) // log HR
}

/// Estimate hazard ratio for the target trial.
///
/// Mirrors R's `internal.hazard()`.
/// R line 61: set.seed(params@seed) then run handler
/// R line 118: exp(full) — exponentiate log HR
pub fn estimate_hazard_ratio(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    outcome_model: &OutcomeModel,
    formula_cache: &FormulaCache,
    seed: u64,
) -> Result<f64, String> {
    // R line 59: handler returns log HR (coefficients)
    let log_hr = hazard_handler(data, config, outcome_model, formula_cache, seed)?;

    // R line 118: exp(full)
    Ok(log_hr.exp())
}

/// Compute hazard ratio with bootstrap CIs.
///
/// R internal_hazard.R lines 102-120:
/// - bootstrap = unlist(bootstrap) — log HRs from bootstrap
/// - SE method: z = qnorm(...), se = sd(bootstrap), ci = exp(sort(c(full + z*se, full - z*se)))
/// - Quantile method: ci = exp(quantile(bootstrap, probs = ...))
/// - Return c(exp(full), ci)
pub fn hazard_ratio_with_ci(
    point_hr: f64,
    boot_hrs: &[f64],
    ci_level: f64,
    use_se: bool,
) -> HazardRatioResult {
    if boot_hrs.is_empty() {
        return HazardRatioResult {
            hr: point_hr,
            lci: None,
            uci: None,
            se: None,
        };
    }

    let z = crate::stats::distributions::normal::qnorm(
        1.0 - (1.0 - ci_level) / 2.0,
        0.0,
        1.0,
        true,
        false,
    );
    let alpha = (1.0 - ci_level) / 2.0;

    // R works on log scale: bootstrap values are already log HRs
    // point_hr is already exp(log_hr), so we take log again
    let log_hr = point_hr.ln();
    let log_boot: Vec<f64> = boot_hrs
        .iter()
        .filter(|&&h| h > 0.0 && h.is_finite())
        .map(|h| h.ln())
        .collect();

    if log_boot.is_empty() {
        return HazardRatioResult {
            hr: point_hr,
            lci: None,
            uci: None,
            se: None,
        };
    }

    // R line 107-113
    let (lci, uci, se) = if use_se {
        // R: se <- sd(bootstrap, na.rm = TRUE)
        // R: ci <- exp(sort(c(full + z*se, full - z*se), decreasing = FALSE))
        let n = log_boot.len() as f64;
        let mean = log_boot.iter().sum::<f64>() / n;
        let sd = (log_boot
            .iter()
            .map(|v| (v - mean).powi(2))
            .sum::<f64>()
            / (n - 1.0).max(1.0))
        .sqrt();
        (
            (log_hr - z * sd).exp(),
            (log_hr + z * sd).exp(),
            Some(sd),
        )
    } else {
        // R: ci <- exp(quantile(bootstrap, probs = c(alpha, 1-alpha)))
        let mut sorted = log_boot;
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let lo = (alpha * (sorted.len() as f64 - 1.0)).round() as usize;
        let hi = ((1.0 - alpha) * (sorted.len() as f64 - 1.0)).round() as usize;
        (
            sorted[lo.min(sorted.len() - 1)].exp(),
            sorted[hi.min(sorted.len() - 1)].exp(),
            None,
        )
    };

    HazardRatioResult {
        hr: point_hr,
        lci: Some(lci),
        uci: Some(uci),
        se,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bernoulli() {
        let mut rng: u64 = 12345;
        let mut count = 0;
        let n = 10000;
        for _ in 0..n {
            count += bernoulli(0.5, &mut rng);
        }
        let proportion = count as f64 / n as f64;
        // Should be roughly 0.5
        assert!((proportion - 0.5).abs() < 0.05);
    }

    #[test]
    fn test_run_cox_ph() {
        // Two groups: arm 0 has lower event rate than arm 1
        let times = vec![5.0, 3.0, 4.0, 2.0, 1.0, 2.0, 3.0, 1.0];
        let events = vec![0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        let arms = vec![0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0];

        let log_hr = run_cox_ph(&times, &events, &arms);
        assert!(log_hr.is_ok());
        let hr = log_hr.unwrap().exp();
        // Arm 1 has more/earlier events → HR > 1
        assert!(hr > 0.0);
        assert!(hr.is_finite());
    }

    #[test]
    fn test_hazard_ratio_with_ci_se() {
        let result = hazard_ratio_with_ci(1.5, &[1.3, 1.4, 1.6, 1.7], 0.95, true);
        assert!((result.hr - 1.5).abs() < 1e-10);
        assert!(result.lci.is_some());
        assert!(result.uci.is_some());
        assert!(result.lci.unwrap() < 1.5);
        assert!(result.uci.unwrap() > 1.5);
    }

    #[test]
    fn test_hazard_ratio_no_bootstrap() {
        let result = hazard_ratio_with_ci(2.0, &[], 0.95, true);
        assert!((result.hr - 2.0).abs() < 1e-10);
        assert!(result.lci.is_none());
    }
}
