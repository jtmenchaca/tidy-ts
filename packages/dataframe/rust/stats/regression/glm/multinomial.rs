//! Multinomial logistic regression via K-1 binary GLMs
//!
//! Ported from `SEQTaRget/R/internal_multinomial.R`.
//! Uses K-1 one-vs-rest quasibinomial GLMs with softmax normalization
//! for prediction — NOT textbook multinomial MLE.

use super::glm_control::glm_control;
use super::glm_fit_core::glm_fit;
use crate::stats::regression::family::quasibinomial::QuasiBinomialFamily;

/// Result of a single binary GLM within the multinomial fit.
#[derive(Debug, Clone)]
pub struct BinaryModelResult {
    /// The class label this model predicts
    pub class: String,
    /// Fitted coefficients (length p, includes intercept)
    pub coefficients: Vec<f64>,
    /// Standard errors for coefficients
    pub standard_errors: Vec<f64>,
    /// Whether separation was detected
    pub separation_detected: bool,
}

/// Result of multinomial logistic regression.
#[derive(Debug, Clone)]
pub struct MultinomialResult {
    /// One BinaryModelResult per non-baseline class (K-1 models)
    pub models: Vec<BinaryModelResult>,
    /// The baseline (reference) class
    pub baseline: String,
    /// All class levels in order
    pub levels: Vec<String>,
    /// Number of predictors (columns in design matrix, including intercept)
    pub n_predictors: usize,
}

/// Row in the multinomial summary table.
pub struct MultinomialSummaryRow {
    pub class: String,
    pub term: String,
    pub coefficient: f64,
    pub std_error: f64,
    pub z_value: f64,
    pub p_value: f64,
}

/// Check for perfect or quasi-complete separation.
///
/// Returns true if any coefficient is non-finite or |coef| > 25.
/// (logit > 25 implies P > 1 - 1e-11, unreachable without separation)
fn check_separation(coefficients: &[f64]) -> bool {
    coefficients
        .iter()
        .any(|&c| !c.is_finite() || c.abs() > 25.0)
}

/// Fit a multinomial logistic regression via K-1 binary quasibinomial GLMs.
///
/// # Arguments
/// * `x` - Design matrix, one row per observation (n × p). Should include
///          intercept column if desired.
/// * `y` - Response labels as strings (length n). The first sorted unique
///          level becomes the baseline.
///
/// # Returns
/// `MultinomialResult` containing K-1 fitted binary models.
pub fn multinomial_fit(
    x: &[Vec<f64>],
    y: &[String],
) -> Result<MultinomialResult, String> {
    if x.is_empty() || y.is_empty() {
        return Err("x and y must be non-empty".to_string());
    }
    if x.len() != y.len() {
        return Err(format!(
            "x has {} rows but y has {} elements",
            x.len(),
            y.len()
        ));
    }

    // Determine levels (sorted, first = baseline)
    let mut levels: Vec<String> = y.iter().cloned().collect();
    levels.sort();
    levels.dedup();

    if levels.len() < 2 {
        return Err("y must have at least 2 distinct levels".to_string());
    }

    let baseline = levels[0].clone();
    let n_predictors = x[0].len();
    let control = glm_control(None, None, None)?;
    let mut models = Vec::with_capacity(levels.len() - 1);

    // Fit one binary GLM per non-baseline class
    for class in &levels[1..] {
        // Create binary response: 1 if y == class, 0 otherwise
        let y_bin: Vec<f64> = y.iter().map(|yi| if yi == class { 1.0 } else { 0.0 }).collect();

        let family: Box<dyn crate::stats::regression::family::GlmFamily> =
            Box::new(QuasiBinomialFamily::logit());

        let result = glm_fit(
            x.to_vec(),
            y_bin,
            None,  // weights
            None,  // start
            None,  // etastart
            None,  // mustart
            None,  // offset
            family,
            control.clone(),
            true,  // intercept (already in design matrix, but glm_fit needs this flag)
            None,  // column_names
        )?;

        let separated = check_separation(&result.coefficients);

        models.push(BinaryModelResult {
            class: class.clone(),
            coefficients: result.coefficients,
            standard_errors: result.standard_errors,
            separation_detected: separated,
        });
    }

    Ok(MultinomialResult {
        models,
        baseline,
        levels,
        n_predictors,
    })
}

/// Predict probabilities from a fitted multinomial model using softmax.
///
/// # Arguments
/// * `model` - Fitted MultinomialResult
/// * `x` - Design matrix for prediction (m × p)
/// * `target` - If Some, return only the column for this class
///
/// # Returns
/// Matrix of probabilities (m × K), or vector (m) if target is specified.
pub fn multinomial_predict(
    model: &MultinomialResult,
    x: &[Vec<f64>],
    target: Option<&str>,
) -> Result<Vec<Vec<f64>>, String> {
    if x.is_empty() {
        return Err("x must be non-empty".to_string());
    }

    let m = x.len();
    let k = model.levels.len();

    // Compute linear predictors: X %*% coefs for each non-baseline class
    // pred[i][j] = dot(x[i], model.models[j].coefficients)
    let mut log_odds = vec![vec![0.0; k]; m]; // column 0 stays 0 (baseline)

    for (j, binary_model) in model.models.iter().enumerate() {
        for (i, xi) in x.iter().enumerate() {
            let eta: f64 = xi
                .iter()
                .zip(binary_model.coefficients.iter())
                .map(|(xv, cv)| xv * cv)
                .sum();
            log_odds[i][j + 1] = eta;
        }
    }

    // Softmax: exp(log_odds) / rowSums(exp(log_odds))
    let mut probs = vec![vec![0.0; k]; m];
    for i in 0..m {
        let max_eta = log_odds[i]
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max);
        let exp_vals: Vec<f64> = log_odds[i].iter().map(|&v| (v - max_eta).exp()).collect();
        let sum: f64 = exp_vals.iter().sum();
        for j in 0..k {
            probs[i][j] = exp_vals[j] / sum;
        }
    }

    // If target specified, return only that column
    if let Some(target_class) = target {
        let col_idx = model
            .levels
            .iter()
            .position(|l| l == target_class)
            .ok_or_else(|| format!("Target class '{}' not found in levels", target_class))?;
        return Ok(probs.iter().map(|row| vec![row[col_idx]]).collect());
    }

    Ok(probs)
}

/// Generate a summary table from a fitted multinomial model.
///
/// Returns one row per coefficient per class, plus a baseline intercept row
/// with coefficient 0 and NaN for SE/z/p.
pub fn multinomial_summary(
    model: &MultinomialResult,
    term_names: Option<&[String]>,
) -> Vec<MultinomialSummaryRow> {
    let mut rows = Vec::new();

    // Baseline row
    rows.push(MultinomialSummaryRow {
        class: model.baseline.clone(),
        term: "(Intercept)".to_string(),
        coefficient: 0.0,
        std_error: f64::NAN,
        z_value: f64::NAN,
        p_value: f64::NAN,
    });

    // One block per non-baseline class
    for binary_model in &model.models {
        for (idx, (&coef, &se)) in binary_model
            .coefficients
            .iter()
            .zip(binary_model.standard_errors.iter())
            .enumerate()
        {
            let term = if let Some(names) = term_names {
                names.get(idx).cloned().unwrap_or_else(|| format!("V{}", idx))
            } else if idx == 0 {
                "(Intercept)".to_string()
            } else {
                format!("V{}", idx)
            };

            let z = coef / se;
            // 2 * pnorm(-|z|) = erfc(|z| / sqrt(2))
            let p = erfc_approx(z.abs() / std::f64::consts::SQRT_2);

            rows.push(MultinomialSummaryRow {
                class: binary_model.class.clone(),
                term,
                coefficient: coef,
                std_error: se,
                z_value: z,
                p_value: p,
            });
        }
    }

    rows
}

/// Approximation of erfc(x) for p-value calculation.
/// Uses the complementary error function identity: 2*pnorm(-|z|) = erfc(|z|/sqrt(2))
fn erfc_approx(x: f64) -> f64 {
    // Horner-form rational approximation (Abramowitz & Stegun 7.1.26)
    let t = 1.0 / (1.0 + 0.3275911 * x);
    let poly = t
        * (0.254829592
            + t * (-0.284496736
                + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    poly * (-x * x).exp()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_intercept_design(x_vals: &[Vec<f64>]) -> Vec<Vec<f64>> {
        x_vals
            .iter()
            .map(|row| {
                let mut r = vec![1.0]; // intercept
                r.extend(row);
                r
            })
            .collect()
    }

    #[test]
    fn test_check_separation() {
        assert!(!check_separation(&[0.5, -1.0, 2.0]));
        assert!(check_separation(&[0.5, 26.0, 2.0]));
        assert!(check_separation(&[f64::NAN, 1.0]));
        assert!(check_separation(&[f64::INFINITY, 1.0]));
    }

    #[test]
    fn test_multinomial_fit_two_classes() {
        // Simple binary case: should produce 1 model
        let x: Vec<Vec<f64>> = (0..20)
            .map(|i| vec![1.0, i as f64 / 19.0])
            .collect();
        let y: Vec<String> = (0..20)
            .map(|i| if i < 10 { "A".to_string() } else { "B".to_string() })
            .collect();

        let result = multinomial_fit(&x, &y).unwrap();
        assert_eq!(result.levels.len(), 2);
        assert_eq!(result.baseline, "A");
        assert_eq!(result.models.len(), 1);
        assert_eq!(result.models[0].class, "B");
        assert_eq!(result.models[0].coefficients.len(), 2);
    }

    #[test]
    fn test_multinomial_fit_three_classes() {
        // 3-class case: should produce 2 models
        let n = 30;
        let x: Vec<Vec<f64>> = (0..n)
            .map(|i| vec![1.0, i as f64 / (n - 1) as f64])
            .collect();
        let y: Vec<String> = (0..n)
            .map(|i| {
                if i < 10 {
                    "A".to_string()
                } else if i < 20 {
                    "B".to_string()
                } else {
                    "C".to_string()
                }
            })
            .collect();

        let result = multinomial_fit(&x, &y).unwrap();
        assert_eq!(result.levels, vec!["A", "B", "C"]);
        assert_eq!(result.baseline, "A");
        assert_eq!(result.models.len(), 2);
        assert_eq!(result.models[0].class, "B");
        assert_eq!(result.models[1].class, "C");
    }

    #[test]
    fn test_multinomial_predict_sums_to_one() {
        let n = 30;
        let x: Vec<Vec<f64>> = (0..n)
            .map(|i| vec![1.0, i as f64 / (n - 1) as f64])
            .collect();
        let y: Vec<String> = (0..n)
            .map(|i| {
                if i < 10 {
                    "A".to_string()
                } else if i < 20 {
                    "B".to_string()
                } else {
                    "C".to_string()
                }
            })
            .collect();

        let model = multinomial_fit(&x, &y).unwrap();
        let probs = multinomial_predict(&model, &x, None).unwrap();

        assert_eq!(probs.len(), n);
        assert_eq!(probs[0].len(), 3);

        for (i, row) in probs.iter().enumerate() {
            let sum: f64 = row.iter().sum();
            assert!(
                (sum - 1.0).abs() < 1e-10,
                "row {} probabilities sum to {} (expected 1.0)",
                i, sum
            );
            for &p in row {
                assert!(p >= 0.0 && p <= 1.0, "probability {} out of [0,1]", p);
            }
        }
    }

    #[test]
    fn test_multinomial_predict_target() {
        let n = 20;
        let x: Vec<Vec<f64>> = (0..n)
            .map(|i| vec![1.0, i as f64 / (n - 1) as f64])
            .collect();
        let y: Vec<String> = (0..n)
            .map(|i| if i < 10 { "A".to_string() } else { "B".to_string() })
            .collect();

        let model = multinomial_fit(&x, &y).unwrap();

        let probs_all = multinomial_predict(&model, &x, None).unwrap();
        let probs_b = multinomial_predict(&model, &x, Some("B")).unwrap();

        for (i, row) in probs_b.iter().enumerate() {
            assert_eq!(row.len(), 1);
            assert!(
                (row[0] - probs_all[i][1]).abs() < 1e-12,
                "target prediction mismatch at row {}",
                i
            );
        }
    }

    #[test]
    fn test_multinomial_summary() {
        let n = 20;
        let x: Vec<Vec<f64>> = (0..n)
            .map(|i| vec![1.0, i as f64 / (n - 1) as f64])
            .collect();
        let y: Vec<String> = (0..n)
            .map(|i| if i < 10 { "A".to_string() } else { "B".to_string() })
            .collect();

        let model = multinomial_fit(&x, &y).unwrap();
        let summary = multinomial_summary(&model, None);

        // Baseline row + 2 coefs for class B = 3 rows
        assert_eq!(summary.len(), 3);
        assert_eq!(summary[0].class, "A");
        assert_eq!(summary[0].term, "(Intercept)");
        assert_eq!(summary[0].coefficient, 0.0);
        assert!(summary[0].std_error.is_nan());

        assert_eq!(summary[1].class, "B");
        assert_eq!(summary[1].term, "(Intercept)");
        assert!(summary[1].std_error.is_finite());
        assert!(summary[1].p_value >= 0.0 && summary[1].p_value <= 1.0);
    }

    #[test]
    fn test_multinomial_errors() {
        let empty: Vec<Vec<f64>> = vec![];
        let y: Vec<String> = vec![];
        assert!(multinomial_fit(&empty, &y).is_err());

        let x = vec![vec![1.0, 2.0]];
        let y = vec!["A".to_string()];
        assert!(multinomial_fit(&x, &y).is_err()); // only 1 level

        let x = vec![vec![1.0]];
        let y = vec!["A".to_string(), "B".to_string()];
        assert!(multinomial_fit(&x, &y).is_err()); // length mismatch
    }
}
