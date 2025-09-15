use super::super::super::distributions::shapiro_wilk::ShapiroWilk;
use statrs::distribution::{ContinuousCDF, Normal};
use statrs::function::evaluate::polynomial;
use statrs::statistics::Statistics;
use std::cmp;
use std::f64::consts::{FRAC_1_SQRT_2, FRAC_PI_3};

use super::super::super::core::{TestResult, TestType};
use super::super::super::helpers::create_error_result;

/// Implements the [Shapiro-Wilk test](https://en.wikipedia.org/wiki/Shapiro%E2%80%93Wilk_test)
/// (Shapiro & Wilk, 1965). A simplified port of the algorithm
/// described by Royston (1992, 1995).
///
/// # References
///
/// Royston, P. (1992). Approximating the Shapiro-Wilk W-test for non-normality.
///     Statistics and Computing, 2(3), 117–119. <https://doi.org/10.1007/BF01891203>
///
/// Royston, P. (1995). Remark AS R94: A Remark on Algorithm AS 181:
///     The W-test for Normality. Journal of the Royal Statistical Society.
///     Series C (Applied Statistics), 44(4), 547–551. <https://doi.org/10.2307/2986146>
///
/// Shapiro, S. S., & Wilk, M. B. (1965). An analysis of variance test for normality
///     (complete samples)†. Biometrika, 52(3–4), 591–611. <https://doi.org/10.1093/biomet/52.3-4.591>
#[derive(Debug, PartialEq, Clone)]
pub struct ShapiroWilkTest {
    p_value: f64,
    estimate: f64,
    weights: Vec<f64>,
    status: ShapiroWilkStatus,
}

/// Representation of non-fatal `IFAULT` codes (Royston, 1995).
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum ShapiroWilkStatus {
    /// `IFAULT = 0` (no fault)
    Ok,
    /// `IFAULT = 2` (n > 5000)
    TooMany,
}

/// Representation of fatal `IFAULT` codes (Royston, 1995).
///
/// As for the other codes not listed here or in [ShapiroWilkStatus]:
///   - `IFAULT = 3` (insufficient storage for A) --- A is now allocated within the method
///   - `IFAULT = 4` (censoring while n < 20) --- censoring is not implemented in this port
///   - `IFAULT = 5` (the proportion censored > 0.8) --- censoring is not implemented in this port
///   - `IFAULT = 7` (the data are not in ascending order) --- data are now sorted within the method
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum ShapiroWilkError {
    /// `IFAULT = 1` (n < 3)
    TooFew,
    /// `IFAULT = 6` (the data have zero range)
    NoDifference,
    /// Should not happen
    CannotMakeDistribution,
}

static SMALL: f64 = 1E-19; // smaller for f64?
static FRAC_6_PI: f64 = 1.90985931710274; // 6/pi

// Polynomials for estimating weights.
static C1: [f64; 6] = [0.0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
static C2: [f64; 6] = [0.0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
// Polynomial for estimating scaling factor.
static G: [f64; 2] = [-2.273, 0.459];

impl ShapiroWilkTest {
    /// Run the Shapiro-Wilk test on the sample `x`.
    pub fn new(x: &[f64], alpha: f64) -> TestResult {
        let n = x.len();
        let mut sorted = x.to_owned();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(cmp::Ordering::Equal));

        let range = sorted.last().unwrap() - sorted[0];

        if range.lt(&SMALL) {
            return create_error_result("Shapiro-Wilk test", "Data has zero range");
        } else if n < 3 {
            return create_error_result("Shapiro-Wilk test", "Insufficient data (n < 3)");
        }

        let weights = Self::get_weights(n);
        let mean = (&sorted).mean();

        let (denominator, numerator): (f64, f64) = (0..n)
            .map(|i| {
                let distance = sorted[i] - mean;
                (distance * distance, distance * weights[i])
            })
            .fold((0.0, 0.0), |sum, value| (sum.0 + value.0, sum.1 + value.1));

        // Calculate complement (denominator - numerator) / denominator
        // to keep precision when numerator / denominator is close to 1
        let complement = (denominator - numerator.powi(2)) / denominator;
        let estimate = 1.0 - complement;

        // Debug output
        println!(
            "Debug Shapiro-Wilk: n={}, denominator={}, numerator={}, complement={}, estimate={}",
            n, denominator, numerator, complement, estimate
        );

        let _status = if n > 5000 {
            ShapiroWilkStatus::TooMany
        } else {
            ShapiroWilkStatus::Ok
        };
        let p_value = if n == 3 {
            FRAC_6_PI * (estimate.sqrt().asin() - FRAC_PI_3).max(0.0)
        } else {
            let distribution = match ShapiroWilk::new(n) {
                Ok(distribution) => distribution,
                Err(_) => {
                    return create_error_result(
                        "Shapiro-Wilk test",
                        "Failed to create distribution",
                    );
                }
            };
            1.0 - distribution.cdf(if n <= 11 {
                let gamma = polynomial(n as f64, &G);
                -(gamma - complement.ln()).ln()
            } else {
                complement.ln()
            })
        };

        // Create TestResult
        let test_statistic = estimate; // W statistic
        let confidence_interval = (0.0, 1.0); // Not applicable for normality test
        let null_hypothesis = "H0: Data is normally distributed".to_string();
        let alt_hypothesis = "Ha: Data is not normally distributed".to_string();
        let reject_null = p_value < alpha;

        println!(
            "Debug TestResult creation: test_statistic={}, p_value={}",
            test_statistic, p_value
        );

        TestResult {
            test_type: TestType::ShapiroWilk,
            test_statistic: Some(test_statistic),
            p_value: Some(p_value),
            sample_size: Some(n),
            normality_test_p_value: Some(p_value),
            missing_values: None,
            outliers_detected: None,
            assumptions_violated: if p_value < alpha {
                Some(vec!["Normality assumption violated".to_string()])
            } else {
                None
            },
            ..Default::default()
        }
    }

    fn get_weights(n: usize) -> Vec<f64> {
        if n == 3 {
            return vec![-FRAC_1_SQRT_2, 0.0, FRAC_1_SQRT_2];
        }

        let normal = Normal::new(0.0, 1.0).unwrap();
        let mut weights = vec![0.0; n];

        let half = n / 2;
        let float_n = n as f64;
        let an_25 = float_n + 0.25;

        let mut sum_squared = 0_f64;
        for i in 0..half {
            weights[i] = normal.inverse_cdf((i as f64 + 0.625) / an_25);
            weights[n - i - 1] = -weights[i];
            sum_squared += weights[i].powi(2);
        }
        sum_squared *= 2.0;

        let root_sum_squared = sum_squared.sqrt();
        let rsn = float_n.sqrt().recip();
        let weight0 = polynomial(rsn, &C1) - weights[0] / root_sum_squared;

        let (weights_set, scale) = if n > 5 {
            let weight1 = polynomial(rsn, &C2) - weights[1] / root_sum_squared;
            let scale = ((sum_squared - 2.0 * (weights[0].powi(2) + weights[1].powi(2)))
                / (1.0 - 2.0 * (weight0.powi(2) + weight1.powi(2))))
            .sqrt();
            weights[1] = -weight1;
            weights[n - 2] = weight1;
            (2, scale)
        } else {
            let scale =
                ((sum_squared - 2.0 * weights[0].powi(2)) / (1.0 - 2.0 * weight0.powi(2))).sqrt();
            (1, scale)
        };

        weights[0] = -weight0;
        weights[n - 1] = weight0;

        for i in weights_set..half {
            weights[i] /= scale;
            weights[n - i - 1] = -weights[i];
        }

        weights
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shapiro_wilk() {
        let x = vec![
            0.139, 0.157, 0.175, 0.256, 0.344, 0.413, 0.503, 0.577, 0.614, 0.655, 0.954, 1.392,
            1.557, 1.648, 1.690, 1.994, 2.174, 2.206, 3.245, 3.510, 3.571, 4.354, 4.980, 6.084,
            8.351,
        ];
        let test = ShapiroWilkTest::new(&x, 0.05);
        println!(
            "Debug test result: test_statistic={}, p_value={}, effect_size={}",
            test.test_statistic(),
            test.p_value(),
            test.effect_size()
        );
        assert_eq!(test.test_statistic(), 0.8346662753181684);
        assert_eq!(test.p_value(), 0.0009134904817755807);
        assert_eq!(test.effect_size(), 0.0); // Effect size not applicable for normality test
    }

    #[test]
    fn shapiro_wilk_1() {
        let x = vec![
            134.0, 146.0, 104.0, 119.0, 124.0, 161.0, 107.0, 83.0, 113.0, 129.0, 97.0, 123.0,
        ];
        let test = ShapiroWilkTest::new(&x, 0.05);
        println!(
            "Debug test result 1: test_statistic={}, p_value={}, effect_size={}",
            test.test_statistic(),
            test.p_value(),
            test.effect_size()
        );
        assert_eq!(test.test_statistic(), 0.9923657326481632);
        assert_eq!(test.p_value(), 0.9999699312420669);
        assert_eq!(test.effect_size(), 0.0); // Effect size not applicable for normality test
    }

    #[test]
    fn shapiro_wilk_2() {
        let x = vec![70.0, 118.0, 101.0, 85.0, 107.0, 132.0, 94.0];
        let test = super::ShapiroWilkTest::new(&x, 0.05);
        println!(
            "Debug test result 2: test_statistic={}, p_value={}, effect_size={}",
            test.test_statistic(),
            test.p_value(),
            test.effect_size()
        );
        assert_eq!(test.test_statistic(), 0.9980061683004456);
        assert_eq!(test.p_value(), 0.9999411393249124);
        assert_eq!(test.effect_size(), 0.0); // Effect size not applicable for normality test
    }

    #[test]
    fn large_range() {
        let x = vec![
            0.139E100, 0.157E100, 0.175E100, 0.256E100, 0.344E100, 0.413E100, 0.503E100, 0.577E100,
            0.614E100, 0.655E100, 0.954E100, 1.392E100, 1.557E100, 1.648E100, 1.690E100, 1.994E100,
            2.174E100, 2.206E100, 3.245E100, 3.510E100, 3.571E100, 4.354E100, 4.980E100, 6.084E100,
            8.351E100,
        ];
        let test = super::ShapiroWilkTest::new(&x, 0.05);
        assert_eq!(test.test_statistic(), 0.8346662753181684);
        assert_eq!(test.p_value(), 0.0009134904817755807);
        assert_eq!(test.effect_size(), 0.0); // Effect size not applicable for normality test
    }

    #[test]
    fn nearly_normally_distributed() {
        let x = vec![
            -0.44, -0.31, -0.25, -0.21, -0.18, -0.15, -0.12, -0.10, -0.08, -0.06, -0.04, -0.02,
            0.0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15, 0.18, 0.21, 0.25, 0.31, 0.44,
        ];
        let test = super::ShapiroWilkTest::new(&x, 0.05);
        assert_eq!(test.test_statistic(), 0.9997987717271388);
        assert_eq!(test.p_value(), 1.0);
        assert_eq!(test.effect_size(), 0.0); // Effect size not applicable for normality test
    }

    #[test]
    fn normally_distributed() {
        let x = vec![
            -0.4417998157703872,
            -0.310841224215176,
            -0.2544758389229413,
            -0.21509882047762266,
            -0.18254731741828356,
            -0.1541570107663562,
            -0.12852819470327187,
            -0.1048199468783084,
            -0.08247628697708857,
            -0.061100278634889656,
            -0.040388574421146996,
            -0.020093702456713224,
            0.0,
            0.020093702456713224,
            0.040388574421146996,
            0.061100278634889656,
            0.08247628697708857,
            0.1048199468783084,
            0.12852819470327187,
            0.1541570107663562,
            0.18254731741828356,
            0.21509882047762266,
            0.2544758389229413,
            0.310841224215176,
            0.4417998157703872,
        ];
        let test = super::ShapiroWilkTest::new(&x, 0.05);
        assert_eq!(test.test_statistic(), 0.9999999999999999);
        assert_eq!(test.p_value(), 1.0);
        assert_eq!(test.effect_size(), 0.0); // Effect size not applicable for normality test
    }
}
