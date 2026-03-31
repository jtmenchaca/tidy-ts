//! Risk ratio and risk difference computation.
//!
//! Ported from `SEQTaRget/R/internal_misc.R` (`create.risk()`).
//! Paired bootstrap CIs for risk comparisons across treatment arms.

use super::survival_curves::ArmSurvivalCurve;
use super::types::RiskComparison;

/// Compute risk comparisons between all pairs of treatment arms.
///
/// Uses final-time risk values (1 - survival at max followup).
///
/// # Arguments
/// * `curves` - Survival curves for each treatment arm
/// * `boot_curves` - Bootstrap survival curves (empty if no bootstrap)
/// * `ci_level` - Confidence level
/// * `use_se` - SE method (true) or percentile method (false)
pub fn compute_risk_comparisons(
    curves: &[ArmSurvivalCurve],
    boot_curves: &[Vec<ArmSurvivalCurve>],
    ci_level: f64,
    use_se: bool,
) -> Vec<RiskComparison> {
    let mut comparisons = Vec::new();

    for i in 0..curves.len() {
        for j in 0..curves.len() {
            if i == j {
                continue;
            }

            let risk_i = final_risk(&curves[i]);
            let risk_j = final_risk(&curves[j]);

            let rr = if risk_i.abs() < 1e-15 {
                f64::NAN
            } else {
                risk_j / risk_i
            };
            let rd = risk_j - risk_i;

            let (rd_lci, rd_uci, rr_lci, rr_uci) = if !boot_curves.is_empty() {
                compute_paired_cis(
                    &curves[i].arm,
                    &curves[j].arm,
                    i,
                    j,
                    rr,
                    rd,
                    boot_curves,
                    ci_level,
                    use_se,
                )
            } else {
                (None, None, None, None)
            };

            comparisons.push(RiskComparison {
                arm_x: curves[i].arm.clone(),
                arm_y: curves[j].arm.clone(),
                risk_ratio: rr,
                rr_lci,
                rr_uci,
                risk_difference: rd,
                rd_lci,
                rd_uci,
            });
        }
    }

    comparisons
}

/// Get the final risk value (1 - survival at last time point).
fn final_risk(curve: &ArmSurvivalCurve) -> f64 {
    curve
        .risk
        .last()
        .cloned()
        .unwrap_or(0.0)
}

/// Compute paired bootstrap CIs for risk difference and risk ratio.
fn compute_paired_cis(
    _arm_x: &str,
    _arm_y: &str,
    idx_x: usize,
    idx_y: usize,
    point_rr: f64,
    point_rd: f64,
    boot_curves: &[Vec<ArmSurvivalCurve>],
    ci_level: f64,
    use_se: bool,
) -> (Option<f64>, Option<f64>, Option<f64>, Option<f64>) {
    let z = crate::stats::distributions::normal::qnorm(1.0 - (1.0 - ci_level) / 2.0, 0.0, 1.0, true, false);
    let alpha = (1.0 - ci_level) / 2.0;

    // Collect paired bootstrap risks
    let mut rd_boot = Vec::new();
    let mut rr_boot = Vec::new();

    for bc in boot_curves {
        if let (Some(cx), Some(cy)) = (bc.get(idx_x), bc.get(idx_y)) {
            let rx = final_risk(cx);
            let ry = final_risk(cy);
            rd_boot.push(ry - rx);
            let rr_i = if rx.abs() < 1e-15 {
                f64::NAN
            } else {
                ry / rx
            };
            if rr_i > 0.0 && rr_i.is_finite() {
                rr_boot.push(rr_i);
            }
        }
    }

    if rd_boot.is_empty() {
        return (None, None, None, None);
    }

    let (rd_lci, rd_uci) = if use_se {
        let n = rd_boot.len() as f64;
        let mean = rd_boot.iter().sum::<f64>() / n;
        let sd = (rd_boot.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / (n - 1.0).max(1.0))
            .sqrt();
        (Some(point_rd - z * sd), Some(point_rd + z * sd))
    } else {
        rd_boot.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let lo = (alpha * (rd_boot.len() as f64 - 1.0)).round() as usize;
        let hi = ((1.0 - alpha) * (rd_boot.len() as f64 - 1.0)).round() as usize;
        (
            Some(rd_boot[lo.min(rd_boot.len() - 1)]),
            Some(rd_boot[hi.min(rd_boot.len() - 1)]),
        )
    };

    let (rr_lci, rr_uci) = if rr_boot.is_empty() {
        (None, None)
    } else if use_se {
        // Log-scale SE for RR
        let log_rr: Vec<f64> = rr_boot.iter().map(|v| v.ln()).collect();
        let n = log_rr.len() as f64;
        let mean = log_rr.iter().sum::<f64>() / n;
        let sd =
            (log_rr.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / (n - 1.0).max(1.0)).sqrt();
        (
            Some((point_rr.ln() - z * sd).exp()),
            Some((point_rr.ln() + z * sd).exp()),
        )
    } else {
        rr_boot.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let lo = (alpha * (rr_boot.len() as f64 - 1.0)).round() as usize;
        let hi = ((1.0 - alpha) * (rr_boot.len() as f64 - 1.0)).round() as usize;
        (
            Some(rr_boot[lo.min(rr_boot.len() - 1)]),
            Some(rr_boot[hi.min(rr_boot.len() - 1)]),
        )
    };

    (rd_lci, rd_uci, rr_lci, rr_uci)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::target_trial::types::SurvivalPoint;

    fn make_arm(label: &str, final_surv: f64) -> ArmSurvivalCurve {
        ArmSurvivalCurve {
            arm: label.to_string(),
            survival: vec![
                SurvivalPoint { followup: 0.0, value: 1.0, se: None, lci: None, uci: None },
                SurvivalPoint { followup: 5.0, value: final_surv, se: None, lci: None, uci: None },
            ],
            risk: vec![0.0, 1.0 - final_surv],
            cumulative_incidence: None,
        }
    }

    #[test]
    fn test_risk_comparison_no_bootstrap() {
        let curves = vec![make_arm("0", 0.8), make_arm("1", 0.6)];
        let comparisons = compute_risk_comparisons(&curves, &[], 0.95, true);

        assert_eq!(comparisons.len(), 2); // (0,1) and (1,0)

        // Find 0→1 comparison
        let c01 = comparisons.iter().find(|c| c.arm_x == "0" && c.arm_y == "1").unwrap();
        // risk_0 = 0.2, risk_1 = 0.4
        assert!((c01.risk_difference - 0.2).abs() < 1e-10);
        assert!((c01.risk_ratio - 2.0).abs() < 1e-10);
        assert!(c01.rd_lci.is_none()); // no bootstrap
    }

    #[test]
    fn test_risk_comparison_with_bootstrap() {
        let curves = vec![make_arm("0", 0.8), make_arm("1", 0.6)];
        let boot = vec![
            vec![make_arm("0", 0.78), make_arm("1", 0.58)],
            vec![make_arm("0", 0.82), make_arm("1", 0.62)],
        ];

        let comparisons = compute_risk_comparisons(&curves, &boot, 0.95, true);
        let c01 = comparisons.iter().find(|c| c.arm_x == "0" && c.arm_y == "1").unwrap();
        assert!(c01.rd_lci.is_some());
        assert!(c01.rr_lci.is_some());
    }
}
