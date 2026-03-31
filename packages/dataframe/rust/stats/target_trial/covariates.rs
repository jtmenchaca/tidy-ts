//! Default formula builders for target trial emulation.
//!
//! Ported from SEQTaRget's `internal_covariates.R`:
//! - `create.default.covariates()` — outcome model formula
//! - `create.default.weight.covariates()` — numerator/denominator weight formulas
//! - `create.default.LTFU.covariates()` — loss-to-followup formulas

use super::types::{AnalysisMethod, TargetTrialConfig};

/// Build the default outcome model formula string.
///
/// Mirrors R's `create.default.covariates()`.
pub fn default_outcome_covariates(config: &TargetTrialConfig) -> String {
    let tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);

    let dose = format!("dose+dose{}", config.indicator_squared);
    let interaction = format!("{}*followup", tx_bas);
    let interaction_dose = format!("followup*dose+followup*dose{}", config.indicator_squared);

    // No interaction if hazard-only or no KM curves
    let use_interaction = !config.hazard && config.km_curves;

    let time_varying_bas: Option<String> = if !config.time_varying.is_empty() {
        Some(
            config
                .time_varying
                .iter()
                .map(|v| format!("{}{}", v, config.indicator_baseline))
                .collect::<Vec<_>>()
                .join("+"),
        )
    } else {
        None
    };

    let fixed: Option<String> = if !config.fixed.is_empty() {
        let cols: Vec<&String> = if let Some(ref sg) = config.subgroup {
            config.fixed.iter().filter(|f| *f != sg).collect()
        } else {
            config.fixed.iter().collect()
        };
        if cols.is_empty() {
            None
        } else {
            Some(cols.iter().map(|s| s.as_str()).collect::<Vec<_>>().join("+"))
        }
    } else {
        None
    };

    let trial = if config.trial_include {
        Some(format!("trial+trial{}", config.indicator_squared))
    } else {
        None
    };

    let followup = if config.followup_include {
        Some(format!("followup+followup{}", config.indicator_squared))
    } else if config.followup_spline || config.followup_class {
        Some("followup".to_string())
    } else {
        None
    };

    let mut parts: Vec<String> = Vec::new();

    match config.method {
        AnalysisMethod::ITT => {
            parts.push(tx_bas);
            if let Some(f) = followup { parts.push(f); }
            if let Some(t) = trial { parts.push(t); }
            if let Some(f) = fixed { parts.push(f); }
            if let Some(tv) = time_varying_bas { parts.push(tv); }
            if use_interaction { parts.push(interaction); }
        }
        AnalysisMethod::DoseResponse => {
            parts.push(dose);
            if let Some(f) = followup { parts.push(f); }
            if let Some(t) = trial { parts.push(t); }
            if let Some(f) = &fixed { parts.push(f.clone()); }
            if !config.weights.weighted || !config.weights.preexpansion {
                if let Some(tv) = time_varying_bas { parts.push(tv); }
            }
            if use_interaction { parts.push(interaction_dose); }
        }
        AnalysisMethod::Censoring => {
            parts.push(tx_bas);
            if let Some(f) = followup { parts.push(f); }
            if let Some(t) = trial { parts.push(t); }
            if config.weights.weighted && config.weights.preexpansion && config.excused {
                // Excused + preexpansion: no fixed or time_varying
                if use_interaction { parts.push(interaction); }
            } else {
                if let Some(f) = fixed { parts.push(f); }
                if !config.weights.weighted || !config.weights.preexpansion {
                    if let Some(tv) = time_varying_bas { parts.push(tv); }
                }
                if use_interaction { parts.push(interaction); }
            }
        }
    }

    parts.join("+")
}

/// Build the default weight formula string.
///
/// Mirrors R's `create.default.weight.covariates()`.
/// `formula_type` is "numerator" or "denominator".
pub fn default_weight_covariates(
    config: &TargetTrialConfig,
    formula_type: &str,
) -> String {
    let time_str = format!(
        "{}+{}{}",
        config.time, config.time, config.indicator_squared
    );
    let followup_str = format!("followup+followup{}", config.indicator_squared);
    let trial_str = format!("trial+trial{}", config.indicator_squared);

    let time_varying: Option<String> = if !config.time_varying.is_empty() {
        Some(config.time_varying.join("+"))
    } else {
        None
    };

    let time_varying_bas: Option<String> = if !config.time_varying.is_empty() {
        Some(
            config
                .time_varying
                .iter()
                .map(|v| format!("{}{}", v, config.indicator_baseline))
                .collect::<Vec<_>>()
                .join("+"),
        )
    } else {
        None
    };

    let fixed: Option<String> = if !config.fixed.is_empty() {
        Some(config.fixed.join("+"))
    } else {
        None
    };

    let mut parts: Vec<String> = Vec::new();

    match formula_type {
        "numerator" => {
            if config.weights.preexpansion {
                // Pre-expansion numerator: fixed + time
                if let Some(f) = fixed { parts.push(f); }
                if config.method != AnalysisMethod::Censoring || !config.excused {
                    parts.push(time_str);
                }
                // Excused + censoring + preexpansion: returns NA in R (empty formula)
            } else {
                // Post-expansion numerator: fixed + tv_bas + followup + trial
                if let Some(f) = fixed { parts.push(f); }
                if let Some(tv) = time_varying_bas { parts.push(tv); }
                parts.push(followup_str);
                parts.push(trial_str);
            }
        }
        "denominator" => {
            if config.weights.preexpansion {
                if let Some(f) = fixed { parts.push(f); }
                if let Some(tv) = time_varying { parts.push(tv); }
                parts.push(time_str);
            } else {
                if let Some(f) = fixed { parts.push(f); }
                if let Some(tv) = time_varying { parts.push(tv); }
                if let Some(tvb) = time_varying_bas { parts.push(tvb); }
                parts.push(followup_str);
                parts.push(trial_str);
            }
        }
        _ => {}
    }

    parts.join("+")
}

/// Build the default LTFU (loss-to-followup) formula string.
///
/// Mirrors R's `create.default.LTFU.covariates()`.
pub fn default_ltfu_covariates(
    config: &TargetTrialConfig,
    formula_type: &str,
) -> String {
    let time_str = format!(
        "{}+{}{}",
        config.time, config.time, config.indicator_squared
    );

    let time_varying: Option<String> = if !config.time_varying.is_empty() {
        Some(config.time_varying.join("+"))
    } else {
        None
    };

    let time_varying_bas: Option<String> = if !config.time_varying.is_empty() {
        Some(
            config
                .time_varying
                .iter()
                .map(|v| format!("{}{}", v, config.indicator_baseline))
                .collect::<Vec<_>>()
                .join("+"),
        )
    } else {
        None
    };

    let fixed: Option<String> = if !config.fixed.is_empty() {
        Some(config.fixed.join("+"))
    } else {
        None
    };

    let trial_str = if config.trial_include {
        Some(format!("trial+trial{}", config.indicator_squared))
    } else {
        None
    };

    let followup_str = if config.followup_include {
        Some(format!("followup+followup{}", config.indicator_squared))
    } else {
        None
    };

    let mut parts: Vec<String> = Vec::new();
    parts.push("tx_lag".to_string());

    match formula_type {
        "numerator" => {
            if config.weights.preexpansion {
                parts.push(time_str);
                if let Some(f) = fixed { parts.push(f); }
            } else {
                if let Some(t) = trial_str { parts.push(t); }
                if let Some(f) = followup_str { parts.push(f); }
                if let Some(f) = fixed { parts.push(f); }
                if let Some(tv) = time_varying_bas { parts.push(tv); }
            }
        }
        "denominator" => {
            if config.weights.preexpansion {
                parts.push(time_str);
                if let Some(f) = fixed { parts.push(f); }
                if let Some(tv) = time_varying { parts.push(tv); }
            } else {
                if let Some(t) = trial_str { parts.push(t); }
                if let Some(f) = followup_str { parts.push(f); }
                if let Some(f) = fixed { parts.push(f); }
                if let Some(tv) = time_varying { parts.push(tv); }
                if let Some(tvb) = time_varying_bas { parts.push(tvb); }
            }
        }
        _ => {}
    }

    parts.join("+")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_config() -> TargetTrialConfig {
        let mut c = TargetTrialConfig::default();
        c.id = "id".to_string();
        c.time = "period".to_string();
        c.treatment = "treatment".to_string();
        c.outcome = "outcome".to_string();
        c.eligible = "eligible".to_string();
        c.time_varying = vec!["x1".to_string(), "x2".to_string()];
        c.fixed = vec!["age".to_string(), "sex".to_string()];
        c
    }

    #[test]
    fn test_itt_covariates() {
        let config = base_config();
        let result = default_outcome_covariates(&config);
        assert!(result.contains("treatment_bas"));
        assert!(result.contains("followup"));
        assert!(result.contains("trial"));
        assert!(result.contains("age"));
        assert!(result.contains("x1_bas"));
    }

    #[test]
    fn test_censoring_covariates() {
        let mut config = base_config();
        config.method = AnalysisMethod::Censoring;
        let result = default_outcome_covariates(&config);
        assert!(result.contains("treatment_bas"));
        assert!(result.contains("x1_bas"));
    }

    #[test]
    fn test_dose_response_covariates() {
        let mut config = base_config();
        config.method = AnalysisMethod::DoseResponse;
        let result = default_outcome_covariates(&config);
        assert!(result.contains("dose"));
    }

    #[test]
    fn test_weight_numerator_preexpansion() {
        let mut config = base_config();
        config.weights.preexpansion = true;
        config.method = AnalysisMethod::Censoring;
        let result = default_weight_covariates(&config, "numerator");
        assert!(result.contains("age"));
        assert!(result.contains("period"));
    }

    #[test]
    fn test_weight_denominator_postexpansion() {
        let mut config = base_config();
        config.weights.preexpansion = false;
        config.method = AnalysisMethod::Censoring;
        let result = default_weight_covariates(&config, "denominator");
        assert!(result.contains("x1"));
        assert!(result.contains("followup"));
        assert!(result.contains("trial"));
    }

    #[test]
    fn test_ltfu_numerator() {
        let config = base_config();
        let result = default_ltfu_covariates(&config, "numerator");
        assert!(result.starts_with("tx_lag"));
    }

    #[test]
    fn test_ltfu_denominator() {
        let config = base_config();
        let result = default_ltfu_covariates(&config, "denominator");
        assert!(result.contains("tx_lag"));
        assert!(result.contains("x1"));
    }
}
