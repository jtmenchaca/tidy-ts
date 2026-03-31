//! Survival curve computation for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_survival.R`.
//! Generates KM-style survival curves via vectorized prediction + cumprod.

use super::glm_helpers::FormulaCache;
use super::outcome_models::OutcomeModel;
use super::types::{ColumnarData, SurvivalPoint, TargetTrialConfig};

/// Survival curve result for a single treatment arm.
#[derive(Debug, Clone)]
pub struct ArmSurvivalCurve {
    /// Treatment level label
    pub arm: String,
    /// Survival probability at each followup time
    pub survival: Vec<SurvivalPoint>,
    /// Risk (1 - survival) at each followup time
    pub risk: Vec<f64>,
    /// Cumulative incidence (if competing events)
    pub cumulative_incidence: Option<Vec<f64>>,
}

/// Generate survival curves for all treatment arms.
///
/// Mirrors R's `internal.survival()` handler function.
///
/// Algorithm:
/// 1. Take baseline data (followup == 0)
/// 2. For each treatment arm:
///    a. Replicate baseline data for each followup time 0..survival_max
///    b. Set treatment to this arm's level
///    c. Predict P(outcome) at each followup
///    d. S(t) = cumprod(1 - P(outcome)) per subject
///    e. Average S(t) across subjects at each t
///
/// # Arguments
/// * `data` - Expanded trial data (must have followup column)
/// * `config` - Configuration
/// * `outcome_model` - Fitted outcome model
/// * `formula_cache` - Cached formula for prediction
/// * `ce_model` - Optional competing event model
pub fn generate_survival_curves(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    outcome_model: &OutcomeModel,
    formula_cache: &FormulaCache,
    ce_model: Option<&OutcomeModel>,
) -> Result<Vec<ArmSurvivalCurve>, String> {
    let followup_col = data
        .get_numeric("followup")
        .ok_or("followup column not found")?;

    // Get baseline rows (followup == 0)
    let baseline_rows: Vec<usize> = followup_col
        .iter()
        .enumerate()
        .filter(|&(_, &v)| v.abs() < 1e-10)
        .map(|(i, _)| i)
        .collect();

    if baseline_rows.is_empty() {
        return Err("No baseline (followup=0) rows found".to_string());
    }

    let n_base = baseline_rows.len();
    let survival_max = config.survival_max as usize;
    let n_fup = survival_max + 1;
    let tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);

    let mut curves = Vec::new();

    for (arm_idx, &level) in config.treat_levels.iter().enumerate() {
        let arm_label = format!("{}", level as i64);

        // Build prediction data: replicate baseline for each followup time
        let mut pred_data = ColumnarData::new();
        let total_rows = n_base * n_fup;

        // Copy all columns from baseline, replicated n_fup times per subject
        for (col_name, col_vals) in &data.numeric {
            if col_name == "followup"
                || col_name == &format!("followup{}", config.indicator_squared)
                || col_name == "dose"
                || col_name == "dose_sq"
            {
                continue; // These will be set explicitly
            }
            let mut new_col = Vec::with_capacity(total_rows);
            for &base_row in &baseline_rows {
                for _ in 0..n_fup {
                    new_col.push(col_vals[base_row]);
                }
            }
            pred_data.numeric.insert(col_name.clone(), new_col);
            if pred_data.nrows == 0 {
                pred_data.nrows = total_rows;
            }
        }

        // Set followup values: 0, 1, 2, ..., survival_max for each subject
        let mut followup_vals = Vec::with_capacity(total_rows);
        let mut followup_sq_vals = Vec::with_capacity(total_rows);
        for _ in 0..n_base {
            for t in 0..n_fup {
                followup_vals.push(t as f64);
                followup_sq_vals.push((t * t) as f64);
            }
        }
        pred_data.numeric.insert("followup".to_string(), followup_vals);
        pred_data.numeric.insert(
            format!("followup{}", config.indicator_squared),
            followup_sq_vals,
        );

        // Set treatment to this arm's level
        if let Some(tx_col) = pred_data.numeric.get_mut(&tx_bas) {
            for v in tx_col.iter_mut() {
                *v = level;
            }
        } else {
            pred_data
                .numeric
                .insert(tx_bas.clone(), vec![level; total_rows]);
        }

        // Dose columns for dose-response
        if config.method == super::types::AnalysisMethod::DoseResponse {
            if arm_idx == 0 {
                pred_data
                    .numeric
                    .insert("dose".to_string(), vec![0.0; total_rows]);
                pred_data
                    .numeric
                    .insert("dose_sq".to_string(), vec![0.0; total_rows]);
            } else {
                let dose: Vec<f64> = pred_data
                    .get_numeric("followup")
                    .unwrap()
                    .iter()
                    .map(|&f| f)
                    .collect();
                let dose_sq: Vec<f64> = dose.iter().map(|&d| d * d).collect();
                pred_data.numeric.insert("dose".to_string(), dose);
                pred_data.numeric.insert("dose_sq".to_string(), dose_sq);
            }
        }

        pred_data.nrows = total_rows;

        // Predict outcome probabilities
        let p_surv = super::outcome_models::predict_outcome(
            outcome_model,
            &pred_data,
            formula_cache,
            None,
        )?;

        // Compute survival: cumprod(1 - p_surv) by subject
        let mut surv_accum = vec![0.0; total_rows];
        for subj in 0..n_base {
            let start = subj * n_fup;
            let mut cum = 1.0;
            for t in 0..n_fup {
                cum *= 1.0 - p_surv[start + t];
                surv_accum[start + t] = cum;
            }
        }

        // Competing event cumulative incidence
        let ce_incidence = if let Some(ce_mod) = ce_model {
            let p_ce = super::outcome_models::predict_outcome(
                ce_mod,
                &pred_data,
                formula_cache,
                None,
            )?;

            let mut inc_accum = vec![0.0; total_rows];
            for subj in 0..n_base {
                let start = subj * n_fup;
                let mut ce_cum = 1.0;
                let mut inc_sum = 0.0;
                for t in 0..n_fup {
                    ce_cum *= (1.0 - p_surv[start + t]) * (1.0 - p_ce[start + t]);
                    inc_sum += p_surv[start + t] * (1.0 - p_ce[start + t]) * ce_cum;
                    inc_accum[start + t] = inc_sum;
                }
            }
            Some(inc_accum)
        } else {
            None
        };

        // Average across subjects at each followup time
        let mut survival_points = Vec::with_capacity(n_fup);
        let mut risk_vals = Vec::with_capacity(n_fup);
        let mut ci_vals = if ce_incidence.is_some() {
            Some(Vec::with_capacity(n_fup))
        } else {
            None
        };

        for t in 0..n_fup {
            let mut surv_sum = 0.0;
            let mut inc_sum = 0.0;
            for subj in 0..n_base {
                surv_sum += surv_accum[subj * n_fup + t];
                if let Some(ref inc) = ce_incidence {
                    inc_sum += inc[subj * n_fup + t];
                }
            }
            let surv_mean = surv_sum / n_base as f64;

            // At t=0, survival should be 1.0
            let surv_val = if t == 0 { 1.0 } else { surv_mean };

            survival_points.push(SurvivalPoint {
                followup: t as f64,
                value: surv_val,
                se: None,
                lci: None,
                uci: None,
            });
            risk_vals.push(1.0 - surv_val);

            if let Some(ref mut ci) = ci_vals {
                ci.push(if t == 0 { 0.0 } else { inc_sum / n_base as f64 });
            }
        }

        curves.push(ArmSurvivalCurve {
            arm: arm_label,
            survival: survival_points,
            risk: risk_vals,
            cumulative_incidence: ci_vals,
        });
    }

    Ok(curves)
}

/// Apply bootstrap confidence intervals to survival curves.
///
/// # Arguments
/// * `full_curves` - Survival curves from full sample
/// * `boot_curves` - Vector of survival curves from each bootstrap iteration
/// * `ci_level` - Confidence level (e.g., 0.95)
/// * `use_se` - If true, use SE method; otherwise use percentile method
pub fn apply_survival_cis(
    full_curves: &mut [ArmSurvivalCurve],
    boot_curves: &[Vec<ArmSurvivalCurve>],
    ci_level: f64,
    use_se: bool,
) {
    if boot_curves.is_empty() {
        return;
    }

    let z = crate::stats::distributions::normal::qnorm(1.0 - (1.0 - ci_level) / 2.0, 0.0, 1.0, true, false);
    let alpha = (1.0 - ci_level) / 2.0;

    for (arm_idx, curve) in full_curves.iter_mut().enumerate() {
        for (t, point) in curve.survival.iter_mut().enumerate() {
            // Collect bootstrap values at this time point for this arm
            let boot_vals: Vec<f64> = boot_curves
                .iter()
                .filter_map(|bc| bc.get(arm_idx).and_then(|c| c.survival.get(t)))
                .map(|p| p.value)
                .collect();

            if boot_vals.is_empty() {
                continue;
            }

            let n = boot_vals.len() as f64;
            let mean = boot_vals.iter().sum::<f64>() / n;
            let variance = boot_vals.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / (n - 1.0).max(1.0);
            let se = variance.sqrt();
            point.se = Some(se);

            if use_se {
                point.lci = Some((point.value - z * se).max(0.0));
                point.uci = Some((point.value + z * se).min(1.0));
            } else {
                let mut sorted = boot_vals;
                sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
                let lo_idx = (alpha * (sorted.len() as f64 - 1.0)).round() as usize;
                let hi_idx = ((1.0 - alpha) * (sorted.len() as f64 - 1.0)).round() as usize;
                point.lci = Some(sorted[lo_idx.min(sorted.len() - 1)]);
                point.uci = Some(sorted[hi_idx.min(sorted.len() - 1)]);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_apply_survival_cis_se() {
        let mut curves = vec![ArmSurvivalCurve {
            arm: "0".to_string(),
            survival: vec![
                SurvivalPoint { followup: 0.0, value: 1.0, se: None, lci: None, uci: None },
                SurvivalPoint { followup: 1.0, value: 0.9, se: None, lci: None, uci: None },
            ],
            risk: vec![0.0, 0.1],
            cumulative_incidence: None,
        }];

        let boot = vec![
            vec![ArmSurvivalCurve {
                arm: "0".to_string(),
                survival: vec![
                    SurvivalPoint { followup: 0.0, value: 1.0, se: None, lci: None, uci: None },
                    SurvivalPoint { followup: 1.0, value: 0.88, se: None, lci: None, uci: None },
                ],
                risk: vec![0.0, 0.12],
                cumulative_incidence: None,
            }],
            vec![ArmSurvivalCurve {
                arm: "0".to_string(),
                survival: vec![
                    SurvivalPoint { followup: 0.0, value: 1.0, se: None, lci: None, uci: None },
                    SurvivalPoint { followup: 1.0, value: 0.92, se: None, lci: None, uci: None },
                ],
                risk: vec![0.0, 0.08],
                cumulative_incidence: None,
            }],
        ];

        apply_survival_cis(&mut curves, &boot, 0.95, true);

        assert!(curves[0].survival[1].se.is_some());
        assert!(curves[0].survival[1].lci.is_some());
        assert!(curves[0].survival[1].uci.is_some());
        let lci = curves[0].survival[1].lci.unwrap();
        let uci = curves[0].survival[1].uci.unwrap();
        assert!(lci <= 0.9);
        assert!(uci >= 0.9);
    }
}
