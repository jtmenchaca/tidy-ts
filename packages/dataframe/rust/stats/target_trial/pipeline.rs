//! Main target trial emulation pipeline.
//!
//! Ported from `SEQTaRget/R/SEQuential.R`.
//! Single entry point that orchestrates:
//! expand → weights → outcome model → survival curves → hazard ratios → bootstrap → CIs

use std::collections::HashMap;

#[cfg(feature = "wasm")]
use web_sys::console;

use super::bootstrap::{bootstrap_sample_ids, resample_with_ids};
use super::covariates;
use super::expand::expand;
use super::factorize::factorize_data;
use super::glm_helpers::{init_formula_cache, FormulaCache};
use super::hazard::{estimate_hazard_ratio, estimate_hazard_ratio_with_rng, hazard_ratio_with_ci};
use super::outcome_models::{fit_outcome_model, OutcomeModel};
use super::risk_comparison::compute_risk_comparisons;
use super::survival_curves::{
    apply_survival_cis, generate_survival_curves, ArmSurvivalCurve,
};
use super::types::{
    validate_config, AnalysisMethod, ColumnarData, TargetTrialConfig, TargetTrialResult,
};
use super::weights::{apply_cumulative_weights, compute_weights};

/// Run the full target trial emulation pipeline.
///
/// This is the main entry point. It takes raw longitudinal data and configuration,
/// then runs the entire pipeline: expand → weights → model → survival → hazard → bootstrap.
///
/// # Arguments
/// * `data` - Raw longitudinal data (pre-expansion)
/// * `config` - Full pipeline configuration
///
/// # Returns
/// `TargetTrialResult` with survival curves, hazard ratios, risk comparisons, and diagnostics.
pub fn target_trial_emulation(
    data: &ColumnarData,
    config: &TargetTrialConfig,
) -> Result<TargetTrialResult, String> {
    // 1. Validate configuration
    validate_config(config)?;

    // 2. Generate default formulas if not provided
    let mut config = fill_default_formulas(config);

    // 2b. Resolve Inf values for followup_max and survival_max — R class_setters.R lines 93-98
    // R: if (is.infinite(params@followup.max)) params@followup.max <- max(params@data[[params@time]])
    // R: if (params@survival.max > params@followup.max) params@survival.max <- params@followup.max
    // R: if (is.infinite(params@survival.max)) params@survival.max <- params@followup.max
    // Note: JS serializes Infinity as 1e308, so we check >= 1e300 rather than is_infinite()
    let is_inf = |v: f64| v.is_infinite() || v >= 1e300;
    if is_inf(config.followup_max) {
        if let Some(time_col) = data.get_numeric(&config.time) {
            config.followup_max = time_col.iter().cloned().fold(0.0_f64, f64::max);
        }
    }
    if config.survival_max > config.followup_max {
        config.survival_max = config.followup_max;
    }
    if is_inf(config.survival_max) {
        config.survival_max = config.followup_max;
    }

    // 3. Initialize formula cache
    let pipeline_cache = init_formula_cache(&config);
    let outcome_cache = pipeline_cache
        .covariates
        .as_ref()
        .ok_or("Outcome covariates formula is required")?
        .clone();

    // 3a. Sort data by (id, time) — R line 69: setorderv(data, c(id.col, time.col))
    let mut source_data = data.clone();
    {
        let id_col = source_data.get_numeric(&config.id)
            .ok_or_else(|| format!("ID column '{}' not found", config.id))?
            .clone();
        let time_col = source_data.get_numeric(&config.time)
            .ok_or_else(|| format!("Time column '{}' not found", config.time))?
            .clone();

        let mut order: Vec<usize> = (0..source_data.nrows).collect();
        order.sort_by(|&a, &b| {
            id_col[a].partial_cmp(&id_col[b]).unwrap()
                .then(time_col[a].partial_cmp(&time_col[b]).unwrap())
        });

        // Check if already sorted
        let already_sorted = order.iter().enumerate().all(|(i, &v)| i == v);
        if !already_sorted {
            source_data = subset_columnar_data(&source_data, &order);
        }
    }

    // 3b. Multinomial: set eligible=0 for rows where treatment not in treat_levels
    // R: if (params@multinomial) params@data[!get(params@treatment) %in% params@treat.level, eval(params@eligible) := 0]
    if config.multinomial {
        if let Some(treatment_col) = source_data.numeric.get(&config.treatment).cloned() {
            if let Some(eligible_col) = source_data.numeric.get_mut(&config.eligible) {
                for i in 0..source_data.nrows {
                    let tx_val = treatment_col[i];
                    if !config.treat_levels.iter().any(|&lv| (tx_val - lv).abs() < 1e-10) {
                        eligible_col[i] = 0.0;
                    }
                }
            }
        }
    }

    // NOTE: R line 165 prunes `data` (local var) but NOT `params@data` which is used by SEQexpand.
    // The pruning only affects switch diagnostics later, not expansion or modeling.
    // So we do NOT prune source_data here.

    // 3c. Augment source data with squared time column (needed for pre-expansion weights)
    let mut augmented_data = source_data;
    let time_sq_name = format!("{}{}", config.time, config.indicator_squared);
    if !augmented_data.has_column(&time_sq_name) {
        if let Some(time_col) = augmented_data.get_numeric(&config.time).cloned() {
            let sq: Vec<f64> = time_col.iter().map(|v| v * v).collect();
            augmented_data.add_numeric(time_sq_name, sq);
        }
    }

    // 3c-ii. Factorize pre-expansion data (R: params@data <- factorize(params@data, params))
    factorize_data(&mut augmented_data, &config);

    // 4. Expand data (create trial structure) — use modified source_data via augmented_data
    let mut expanded = expand(&augmented_data, &config)?;

    // 4b. Factorize expanded data (R: params@DT <- factorize(SEQexpand(params), params))
    factorize_data(&mut expanded.data, &config);

    // DEBUG: Log expanded data stats
    #[cfg(feature = "wasm")]
    {
        let msg = format!(
            "[TTE DEBUG] After expand+factorize: nrows={}, method={:?}, multinomial={}, weighted={}",
            expanded.data.nrows, config.method, config.multinomial, config.weights.weighted
        );
        console::log_1(&msg.into());

        // Log factor levels
        for (name, info) in &expanded.data.factors {
            let msg = format!(
                "[TTE DEBUG] Factor '{}': levels={:?}, reference={}",
                name, info.levels, info.reference
            );
            console::log_1(&msg.into());
        }

        // Log column summary
        let tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);
        for col_name in &[&config.outcome, &tx_bas, &"followup".to_string(), &"trial".to_string()] {
            if let Some(col) = expanded.data.get_numeric(col_name) {
                let non_nan = col.iter().filter(|v| !v.is_nan()).count();
                let sum: f64 = col.iter().filter(|v| !v.is_nan()).sum();
                let msg = format!(
                    "[TTE DEBUG] Column '{}': n={}, non_nan={}, sum={:.4}",
                    col_name, col.len(), non_nan, sum
                );
                console::log_1(&msg.into());
            }
        }
    }

    // 5. Run the single-pass pipeline
    let (outcome_model, _final_weights, weight_diagnostics) =
        run_single_pass(&expanded.data, &augmented_data, &config, &outcome_cache)?;

    // 6. Generate survival curves
    let mut survival_curves = if config.km_curves {
        generate_survival_curves(
            &expanded.data,
            &config,
            &outcome_model,
            &outcome_cache,
            None,
        )?
    } else {
        Vec::new()
    };

    // 7. Estimate hazard ratio
    let point_hr = if config.hazard {
        Some(estimate_hazard_ratio(
            &expanded.data,
            &config,
            &outcome_model,
            &outcome_cache,
            config.bootstrap.seed,
        )?)
    } else {
        None
    };

    // 8. Bootstrap
    let mut boot_outcome_coefs = Vec::new();
    let mut boot_hrs = Vec::new();
    let mut boot_curves: Vec<Vec<ArmSurvivalCurve>> = Vec::new();

    boot_outcome_coefs.push(outcome_model.result.coefficients.clone());

    if config.bootstrap.enabled {
        for i in 0..config.bootstrap.nboot {
            let boot_seed = config.bootstrap.seed + (i as u64) + 1;

            // R samples IDs once from expanded data, then joins on both DT and data
            // with the same id_lookup (internal_analysis.R lines 172-199)
            let (sampled_ids, id_mult, mut boot_rng) = bootstrap_sample_ids(
                &expanded.data,
                &config,
                boot_seed,
                config.bootstrap.sample_fraction,
            )?;
            let boot_data = resample_with_ids(
                &expanded.data,
                &config,
                &sampled_ids,
                id_mult,
            )?;
            let boot_pre = resample_with_ids(
                &augmented_data,
                &config,
                &sampled_ids,
                id_mult,
            )?;

            // Run single pass on bootstrap sample
            let (boot_model, _, _) =
                run_single_pass(&boot_data, &boot_pre, &config, &outcome_cache)?;

            boot_outcome_coefs.push(boot_model.result.coefficients.clone());

            // Bootstrap survival curves
            if config.km_curves {
                if let Ok(bc) = generate_survival_curves(
                    &boot_data,
                    &config,
                    &boot_model,
                    &outcome_cache,
                    None,
                ) {
                    boot_curves.push(bc);
                }
            }

            // Bootstrap hazard ratio — pass the post-sampling RNG to maintain
            // R's single continuous stream: set.seed → sample → rbinom
            if config.hazard {
                if let Ok(hr) = estimate_hazard_ratio_with_rng(
                    &boot_data,
                    &config,
                    &boot_model,
                    &outcome_cache,
                    &mut boot_rng,
                ) {
                    boot_hrs.push(hr);
                }
            }
        }
    }

    // 9. Apply CIs to survival curves
    let use_se = config.bootstrap.ci_method == super::types::CIMethod::SE;
    if !boot_curves.is_empty() {
        apply_survival_cis(
            &mut survival_curves,
            &boot_curves,
            config.bootstrap.ci_level,
            use_se,
        );
    }

    // 10. Hazard ratio with CIs
    let hazard_ratio = point_hr.map(|hr| {
        hazard_ratio_with_ci(hr, &boot_hrs, config.bootstrap.ci_level, use_se)
    });

    // 11. Risk comparisons
    let risk_comparisons = if config.km_curves && !survival_curves.is_empty() {
        compute_risk_comparisons(
            &survival_curves,
            &boot_curves,
            config.bootstrap.ci_level,
            use_se,
        )
    } else {
        Vec::new()
    };

    // 12. Build risk data
    let risk_data: Vec<(String, f64, Option<f64>, Option<f64>)> = survival_curves
        .iter()
        .map(|c| {
            let last = c.survival.last().unwrap();
            (
                c.arm.clone(),
                1.0 - last.value,
                last.lci.map(|v| 1.0 - v),
                last.uci.map(|v| 1.0 - v),
            )
        })
        .collect();

    // 13. Assemble result
    let mut survival_map = HashMap::new();
    for curve in survival_curves {
        survival_map.insert(curve.arm.clone(), curve.survival);
    }

    Ok(TargetTrialResult {
        survival: survival_map,
        hazard_ratio,
        risk_comparisons,
        risk_data,
        weight_diagnostics: weight_diagnostics,
        outcome_coefficients: boot_outcome_coefs,
        outcome_coef_names: outcome_model.coef_names,
        ce_coefficients: Vec::new(),
        outcome_formula: config.covariates.unwrap_or_default(),
        numerator_formula: config.numerator.unwrap_or_default(),
        denominator_formula: config.denominator.unwrap_or_default(),
    })
}

/// Run a single pass of the pipeline: weights → outcome model.
fn run_single_pass(
    expanded: &ColumnarData,
    pre_data: &ColumnarData,
    config: &TargetTrialConfig,
    outcome_cache: &FormulaCache,
) -> Result<(OutcomeModel, Option<Vec<f64>>, Option<super::types::WeightDiagnostics>), String> {
    let (weights, diagnostics) = if config.weights.weighted {
        let weight_output = compute_weights(expanded, pre_data, config)?;
        let (w, d) = apply_cumulative_weights(&weight_output, expanded, config)?;
        (Some(w), Some(d))
    } else {
        (None, None)
    };

    let outcome_model = fit_outcome_model(
        expanded,
        config,
        outcome_cache,
        weights.as_deref(),
    )?;

    Ok((outcome_model, weights, diagnostics))
}

/// Fill in default formula strings if not provided.
fn fill_default_formulas(config: &TargetTrialConfig) -> TargetTrialConfig {
    let mut config = config.clone();

    if config.covariates.is_none() {
        config.covariates = Some(covariates::default_outcome_covariates(&config));
    }
    if config.numerator.is_none() && config.method != AnalysisMethod::ITT {
        config.numerator = Some(covariates::default_weight_covariates(
            &config, "numerator",
        ));
    }
    if config.denominator.is_none() && config.method != AnalysisMethod::ITT {
        config.denominator = Some(covariates::default_weight_covariates(
            &config, "denominator",
        ));
    }

    config
}

/// Subset a ColumnarData to only the given row indices.
fn subset_columnar_data(data: &ColumnarData, indices: &[usize]) -> ColumnarData {
    let mut result = ColumnarData::new();
    for (name, col) in &data.numeric {
        let new_col: Vec<f64> = indices.iter().map(|&i| col[i]).collect();
        result.numeric.insert(name.clone(), new_col);
    }
    for (name, col) in &data.categorical {
        let new_col: Vec<String> = indices.iter().map(|&i| col[i].clone()).collect();
        result.categorical.insert(name.clone(), new_col);
    }
    result.factors = data.factors.clone();
    result.nrows = indices.len();
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fill_default_formulas() {
        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();
        config.time = "period".to_string();
        config.treatment = "treatment".to_string();
        config.outcome = "outcome".to_string();
        config.eligible = "eligible".to_string();
        config.time_varying = vec!["x1".to_string()];
        config.fixed = vec!["age".to_string()];

        let filled = fill_default_formulas(&config);
        assert!(filled.covariates.is_some());
        // ITT doesn't need weight formulas
        assert!(filled.numerator.is_none());
    }

    #[test]
    fn test_fill_default_formulas_censoring() {
        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();
        config.time = "period".to_string();
        config.treatment = "treatment".to_string();
        config.outcome = "outcome".to_string();
        config.eligible = "eligible".to_string();
        config.method = AnalysisMethod::Censoring;
        config.time_varying = vec!["x1".to_string()];

        let filled = fill_default_formulas(&config);
        assert!(filled.covariates.is_some());
        assert!(filled.numerator.is_some());
        assert!(filled.denominator.is_some());
    }
}
