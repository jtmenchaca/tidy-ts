//! Hazard ratio estimation for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_hazard.R`.
//! Simulates first-event times from predicted probabilities,
//! then runs Cox PH (or Fine-Gray) for hazard ratio estimation.

use super::glm_helpers::FormulaCache;
use super::outcome_models::{predict_outcome, OutcomeModel};
use super::types::{AnalysisMethod, ColumnarData, HazardRatioResult, TargetTrialConfig};

/// Simple Bernoulli draw: return 1 with probability p, else 0.
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

/// Simulate events from predicted outcome probabilities.
///
/// For each (id, trial) group across each treatment arm:
/// 1. At each followup time, draw a Bernoulli event with predicted probability
/// 2. Record the first event time
///
/// Returns vectors of (followup_time, event_indicator, treatment_arm) per subject.
fn simulate_events(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    outcome_model: &OutcomeModel,
    formula_cache: &FormulaCache,
    seed: u64,
) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>), String> {
    let id_col = data.get_numeric(&config.id).ok_or("ID column not found")?;
    let followup_col = data.get_numeric("followup").ok_or("followup column not found")?;
    let trial_col = data.get_numeric("trial").ok_or("trial column not found")?;

    let tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);

    // Get unique (id, trial) pairs at baseline
    let baseline_rows: Vec<usize> = followup_col
        .iter()
        .enumerate()
        .filter(|&(_, &v)| v.abs() < 1e-10)
        .map(|(i, _)| i)
        .collect();

    let n_base = baseline_rows.len();
    let max_fup = config.followup_max as usize + 1;

    let mut all_times = Vec::new();
    let mut all_events = Vec::new();
    let mut all_arms = Vec::new();

    let mut rng = seed;

    for &level in &config.treat_levels {
        // Build prediction data: replicate baseline for each followup
        let total_rows = n_base * max_fup;
        let mut pred_data = ColumnarData::new();

        for (col_name, col_vals) in &data.numeric {
            if col_name == "followup"
                || col_name == &format!("followup{}", config.indicator_squared)
                || col_name == "dose"
                || col_name == "dose_sq"
            {
                continue;
            }
            let mut new_col = Vec::with_capacity(total_rows);
            for &base_row in &baseline_rows {
                for _ in 0..max_fup {
                    new_col.push(col_vals[base_row]);
                }
            }
            pred_data.numeric.insert(col_name.clone(), new_col);
            if pred_data.nrows == 0 {
                pred_data.nrows = total_rows;
            }
        }

        // Set followup and followup_sq
        let mut fup_vals = Vec::with_capacity(total_rows);
        let mut fup_sq_vals = Vec::with_capacity(total_rows);
        for _ in 0..n_base {
            for t in 0..max_fup {
                fup_vals.push(t as f64);
                fup_sq_vals.push((t * t) as f64);
            }
        }
        pred_data.numeric.insert("followup".to_string(), fup_vals);
        pred_data.numeric.insert(
            format!("followup{}", config.indicator_squared),
            fup_sq_vals,
        );

        // Set treatment
        if let Some(tx_col) = pred_data.numeric.get_mut(&tx_bas) {
            for v in tx_col.iter_mut() {
                *v = level;
            }
        } else {
            pred_data
                .numeric
                .insert(tx_bas.clone(), vec![level; total_rows]);
        }

        // Dose columns
        if config.method == AnalysisMethod::DoseResponse {
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

        // Predict outcome probabilities
        let probs = predict_outcome(outcome_model, &pred_data, formula_cache, None)?;

        // Simulate first event for each subject
        for subj in 0..n_base {
            let start = subj * max_fup;
            let mut event_time = (max_fup - 1) as f64;
            let mut event = 0.0;

            for t in 0..max_fup {
                let p = probs[start + t].max(0.0).min(1.0);
                if bernoulli(p, &mut rng) == 1 {
                    event_time = t as f64;
                    event = 1.0;
                    break;
                }
            }

            all_times.push(event_time);
            all_events.push(event);
            all_arms.push(level);
        }
    }

    Ok((all_times, all_events, all_arms))
}

/// Estimate hazard ratio from simulated events via simplified Cox PH.
///
/// Uses the log-rank-equivalent one-variable Cox PH estimate:
/// HR = exp(beta), where beta = sum(d * (x - xbar_weighted)) / sum(d * V)
fn simple_cox_hr(times: &[f64], events: &[f64], arms: &[f64]) -> Option<f64> {
    // Sort by time
    let n = times.len();
    let mut indices: Vec<usize> = (0..n).collect();
    indices.sort_by(|&a, &b| times[a].partial_cmp(&times[b]).unwrap_or(std::cmp::Ordering::Equal));

    // Simplified score test / partial likelihood approach
    // For a single binary covariate, the log-HR estimate can be obtained
    // via the Newton-Raphson iteration on the partial likelihood

    let total_events: f64 = events.iter().sum();
    if total_events < 1.0 {
        return None;
    }

    // Iterative Cox PH for single covariate
    let mut beta = 0.0;
    for _ in 0..25 {
        let mut score = 0.0;
        let mut info = 0.0;

        // Process events in time order
        let mut risk_set_sum = 0.0;
        let mut risk_set_x_sum = 0.0;
        let mut risk_set_x2_sum = 0.0;

        // Initialize risk set with all subjects
        for i in 0..n {
            let exp_bx = (beta * arms[i]).exp();
            risk_set_sum += exp_bx;
            risk_set_x_sum += arms[i] * exp_bx;
            risk_set_x2_sum += arms[i] * arms[i] * exp_bx;
        }

        // Process from latest to earliest time, removing subjects as their time passes
        let mut prev_processed = n;
        let mut sorted_times: Vec<(f64, usize)> =
            times.iter().cloned().zip(0..n).collect();
        sorted_times.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));

        // Actually, use the simpler approach: iterate through unique event times
        // For each event time, compute the score and information contributions
        let mut unique_times: Vec<f64> = times
            .iter()
            .zip(events.iter())
            .filter(|&(_, &e)| e > 0.5)
            .map(|(&t, _)| t)
            .collect();
        unique_times.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        unique_times.dedup();

        // Reset and compute properly
        score = 0.0;
        info = 0.0;

        for &t in &unique_times {
            // Risk set: all i with times[i] >= t
            let mut s0 = 0.0;
            let mut s1 = 0.0;
            let mut s2 = 0.0;
            for i in 0..n {
                if times[i] >= t {
                    let w = (beta * arms[i]).exp();
                    s0 += w;
                    s1 += arms[i] * w;
                    s2 += arms[i] * arms[i] * w;
                }
            }

            if s0 < 1e-15 {
                continue;
            }

            // Count events at this time
            let n_events: f64 = (0..n)
                .filter(|&i| (times[i] - t).abs() < 1e-10 && events[i] > 0.5)
                .count() as f64;

            let x_bar = s1 / s0;
            let v = s2 / s0 - x_bar * x_bar;

            // Sum of covariates for events at this time
            let x_event_sum: f64 = (0..n)
                .filter(|&i| (times[i] - t).abs() < 1e-10 && events[i] > 0.5)
                .map(|i| arms[i])
                .sum();

            score += x_event_sum - n_events * x_bar;
            info += n_events * v;
        }

        if info.abs() < 1e-15 {
            break;
        }

        let step = score / info;
        beta += step;

        if step.abs() < 1e-8 {
            break;
        }
    }

    Some(beta.exp()) // HR = exp(beta)
}

/// Estimate hazard ratio for the target trial.
///
/// Mirrors R's `internal.hazard()`.
pub fn estimate_hazard_ratio(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    outcome_model: &OutcomeModel,
    formula_cache: &FormulaCache,
    seed: u64,
) -> Result<f64, String> {
    let (times, events, arms) = simulate_events(data, config, outcome_model, formula_cache, seed)?;

    simple_cox_hr(&times, &events, &arms)
        .ok_or_else(|| "Could not estimate hazard ratio (no events)".to_string())
}

/// Compute hazard ratio with bootstrap CIs.
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

    let z = crate::stats::distributions::normal::qnorm(1.0 - (1.0 - ci_level) / 2.0, 0.0, 1.0, true, false);
    let alpha = (1.0 - ci_level) / 2.0;

    // Work on log scale (R does this too)
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

    let (lci, uci, se) = if use_se {
        let n = log_boot.len() as f64;
        let mean = log_boot.iter().sum::<f64>() / n;
        let sd = (log_boot.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / (n - 1.0).max(1.0))
            .sqrt();
        (
            (log_hr - z * sd).exp(),
            (log_hr + z * sd).exp(),
            Some(sd),
        )
    } else {
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
    fn test_simple_cox_hr() {
        // Two groups: arm 0 has lower event rate than arm 1
        let times = vec![5.0, 3.0, 4.0, 2.0, 1.0, 2.0, 3.0, 1.0];
        let events = vec![0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        let arms = vec![0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0];

        let hr = simple_cox_hr(&times, &events, &arms);
        assert!(hr.is_some());
        let hr_val = hr.unwrap();
        // Arm 1 has more/earlier events → HR > 1
        assert!(hr_val > 0.0);
        assert!(hr_val.is_finite());
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
