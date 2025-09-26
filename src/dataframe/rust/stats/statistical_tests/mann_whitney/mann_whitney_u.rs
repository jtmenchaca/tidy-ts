use statrs::distribution::{ContinuousCDF, Normal};

use super::super::super::core::types::{
    EffectSize, EffectSizeType, MannWhitneyMethod, MannWhitneyTestResult, TestStatistic,
    TestStatisticName,
};
use super::super::super::distributions::pwilcox;

/// Configuration options for Mann-Whitney U test
#[derive(Debug, Clone)]
pub struct MannWhitneyConfig {
    /// Whether to use exact distribution when possible (R default: true for n ≤ 50 and no ties)
    pub exact: bool,
    /// Whether to apply continuity correction (R default: true)
    pub continuity_correction: bool,
    /// Alternative hypothesis: "two-sided", "less", or "greater" (R default: "two-sided")
    pub alternative: String,
}

impl Default for MannWhitneyConfig {
    fn default() -> Self {
        Self {
            exact: true,
            continuity_correction: true, // R uses continuity correction by default
            alternative: "two-sided".to_string(),
        }
    }
}

// Helper trait for statistical operations
trait StatOps {
    fn ranks(&self) -> (Vec<f64>, f64);
}

impl StatOps for [f64] {
    fn ranks(&self) -> (Vec<f64>, f64) {
        let mut indexed: Vec<(f64, usize)> =
            self.iter().enumerate().map(|(i, &v)| (v, i)).collect();
        indexed.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));

        let mut ranks = vec![0.0; self.len()];
        let mut i = 0;
        let mut tie_correction = 0.0;

        while i < indexed.len() {
            let mut j = i;
            let value = indexed[i].0;

            // Find all ties
            while j < indexed.len() && indexed[j].0 == value {
                j += 1;
            }

            let tie_count = j - i;
            if tie_count > 1 {
                // R's formula: sum(NTIES^3 - NTIES) where NTIES is frequency of each rank
                tie_correction += (tie_count * tie_count * tie_count - tie_count) as f64;
            }

            let avg_rank = (i + j + 1) as f64 / 2.0;
            for k in i..j {
                ranks[indexed[k].1] = avg_rank;
            }

            i = j;
        }

        (ranks, tie_correction)
    }
}

// Helper function for chaining iterators
fn chain_ranks<'a>(x: &'a [f64], y: &'a [f64]) -> (Vec<f64>, f64) {
    let combined: Vec<f64> = x.iter().chain(y.iter()).cloned().collect();
    combined.ranks()
}

/// Implements the [Mann-Whitney U test](https://en.wikipedia.org/wiki/Mann%E2%80%93Whitney_U_test),
/// also known as the Wilcoxon rank-sum test.
#[derive(Debug, Copy, Clone, PartialEq)]
pub struct MannWhitneyUTest {
    estimate: (f64, f64),
    effect_size: f64,
    p_value: f64,
}

impl MannWhitneyUTest {
    /// Run Mann-Whitney U test/Wilcoxon rank-sum test on samples `x` and `y`.
    pub fn independent(
        x: &[f64],
        y: &[f64],
        alpha: f64,
        alternative: &str,
    ) -> Result<MannWhitneyTestResult, String> {
        Self::independent_with_config(x, y, MannWhitneyConfig::default(), alpha, alternative)
    }

    /// Run Mann-Whitney U test/Wilcoxon rank-sum test with configuration options.
    pub fn independent_with_config(
        x: &[f64],
        y: &[f64],
        config: MannWhitneyConfig,
        alpha: f64,
        _alternative: &str,
    ) -> Result<MannWhitneyTestResult, String> {
        let (ranks, tie_correction) = chain_ranks(x, y);
        let n_x = x.len() as f64;
        let n_y = y.len() as f64;
        let n_xy = n_x * n_y;

        // R's W statistic: sum of ranks for first sample minus expected minimum
        let sum_ranks_x = ranks[0..x.len()].iter().sum::<f64>();
        let w_statistic = sum_ranks_x - (n_x * (n_x + 1.0)) / 2.0;

        // This W statistic is actually the U statistic that R reports
        let estimate_small = w_statistic;

        let n = n_x + n_y;

        // Determine whether to use exact distribution (R's logic: n ≤ 50 and no ties)
        let use_exact = config.exact && n_xy <= 50.0 && tie_correction == 0.0;

        // Calculate p-value using configured method
        let p_value = if use_exact {
            // Use exact Wilcoxon distribution (R's exact approach)
            let w_statistic = estimate_small;
            let p_exact = if w_statistic > n_xy / 2.0 {
                pwilcox(w_statistic - 1.0, n_x, n_y, false, false)
            } else {
                pwilcox(w_statistic, n_x, n_y, true, false)
            };

            // Apply alternative hypothesis
            match config.alternative.as_str() {
                "less" => p_exact,
                "greater" => 1.0 - p_exact,
                _ => (2.0 * p_exact).min(1.0), // two-sided
            }
        } else {
            // Use normal approximation following R's exact implementation
            // estimate_small is already the U statistic (R's W statistic)

            // R's z calculation: z <- STATISTIC - n.x * n.y / 2
            let z = estimate_small - n_xy / 2.0;

            // R's sigma calculation with tie correction
            // R formula: sqrt((n.x * n.y / 12) * ((n.x + n.y + 1) - sum(NTIES^3 - NTIES) / ((n.x + n.y) * (n.x + n.y - 1))))
            let sigma = ((n_xy / 12.0) * (n + 1.0 - tie_correction / (n * (n - 1.0)))).sqrt();

            // Apply continuity correction following R's approach
            let correction = if config.continuity_correction {
                match config.alternative.as_str() {
                    "two-sided" => z.signum() * 0.5,
                    "greater" => 0.5,
                    "less" => -0.5,
                    _ => 0.0,
                }
            } else {
                0.0
            };

            let z_corrected = (z - correction) / sigma;

            // Calculate p-value using normal distribution
            let normal = Normal::new(0.0, 1.0)
                .map_err(|e| format!("Failed to create normal distribution: {}", e))?;
            match config.alternative.as_str() {
                "less" => normal.cdf(z_corrected),
                "greater" => 1.0 - normal.cdf(z_corrected),
                _ => {
                    // R's approach: 2 * min(pnorm(z), pnorm(z, lower.tail=FALSE))
                    let p_lower = normal.cdf(z_corrected);
                    let p_upper = 1.0 - normal.cdf(z_corrected);
                    2.0 * p_lower.min(p_upper)
                }
            }
        };

        // Calculate effect size using R's helper function approach
        let expected_u = n_xy / 2.0;
        let var_u = n_xy * (n + 1.0) / 12.0;
        let z_stat = (estimate_small - expected_u) / var_u.sqrt();
        let effect_size = z_stat / n.sqrt();

        // Calculate test statistic (U statistic)
        let test_statistic = estimate_small;

        // Create confidence interval (approximate)
        let se = var_u.sqrt();
        let z_critical = match Normal::new(0.0, 1.0) {
            Ok(normal) => normal.inverse_cdf(1.0 - alpha / 2.0),
            Err(_) => 1.96, // Fallback to 95% CI if normal distribution creation fails
        };
        let _ci_lower = estimate_small - z_critical * se;
        let _ci_upper = estimate_small + z_critical * se;

        let method = if use_exact {
            MannWhitneyMethod::Exact
        } else {
            MannWhitneyMethod::Asymptotic
        };

        Ok(MannWhitneyTestResult {
            test_statistic: TestStatistic {
                value: test_statistic,
                name: TestStatisticName::UStatistic.as_str().to_string(),
            },
            p_value,
            test_name: "Mann-Whitney U Test".to_string(),
            method: method.as_str().to_string(),
            alpha,
            error_message: None,
            effect_size: EffectSize {
                value: effect_size,
                name: EffectSizeType::RankBiserialCorrelation.as_str().to_string(),
            },
            alternative: config.alternative,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mann_whitney_u() {
        let x = vec![
            134.0, 146.0, 104.0, 119.0, 124.0, 161.0, 107.0, 83.0, 113.0, 129.0, 97.0, 123.0,
        ];
        let y = vec![70.0, 118.0, 101.0, 85.0, 107.0, 132.0, 94.0];
        let test = MannWhitneyUTest::independent(&x, &y, 0.05, "two-sided").unwrap();
        assert!((test.effect_size.value - 0.39747795134385916).abs() < 1e-10);
        assert!((test.p_value - 0.09082718).abs() < 0.01);
    }

    #[test]
    fn mann_whitney_u_2() {
        let x = vec![68.0, 68.0, 59.0, 72.0, 64.0, 67.0, 70.0, 74.0];
        let y = vec![60.0, 67.0, 61.0, 62.0, 67.0, 63.0, 56.0, 58.0];
        let test = MannWhitneyUTest::independent(&x, &y, 0.05, "two-sided").unwrap();
        assert!((test.effect_size.value - 0.6038707862370792).abs() < 1e-10);
        assert!((test.p_value - 0.01770607).abs() < 0.01);
    }
}
