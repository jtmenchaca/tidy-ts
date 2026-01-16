use statrs::distribution::{ContinuousCDF, Normal};
use std::cmp;

use super::super::super::core::types::{
    AndersonDarlingTestResult, TestStatistic, TestStatisticName,
};

/// Implements the Anderson-Darling test for normality
/// A more sensitive test than Shapiro-Wilk for detecting deviations in the tails of the distribution.
///
/// # References
///
/// Anderson, T. W., & Darling, D. A. (1954). A test of goodness of fit.
///     Journal of the American Statistical Association, 49(268), 765–769.
///
/// Stephens, M. A. (1974). EDF Statistics for Goodness of Fit and Some Comparisons.
///     Journal of the American Statistical Association, 69(347), 730–737.
///
/// D'Agostino, R. B., & Stephens, M. A. (1986). Goodness-of-fit techniques.
///     Marcel Dekker, New York.
#[derive(Debug, PartialEq, Clone)]
pub struct AndersonDarlingTest;

/// Error types for Anderson-Darling test
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum AndersonDarlingError {
    /// Sample size too small (n < 7)
    TooFewSamples,
    /// All values are identical
    NoVariation,
}

impl AndersonDarlingTest {
    /// Run the Anderson-Darling test on the sample `x`.
    ///
    /// # Arguments
    /// * `x` - Sample data
    /// * `alpha` - Significance level for the test
    ///
    /// # Returns
    /// * `Ok(AndersonDarlingTestResult)` - Test results
    /// * `Err(String)` - Error message
    pub fn new(x: &[f64], alpha: f64) -> Result<AndersonDarlingTestResult, String> {
        let n = x.len();

        // Anderson-Darling test requires at least 8 observations (from R: n > 7)
        if n < 8 {
            return Err("sample size must be greater than 7".to_string());
        }

        // Sort the data
        let mut sorted = x.to_owned();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(cmp::Ordering::Equal));

        // Check for zero variance
        let range = sorted.last().unwrap() - sorted[0];
        if range < 1e-10 {
            return Err("Data has zero variance".to_string());
        }

        // Calculate mean and variance exactly as R does: var(x)
        let mean = sorted.iter().sum::<f64>() / n as f64;
        let var_x = sorted.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1) as f64;

        if var_x <= 0.0 {
            return Err("Data has zero variance".to_string());
        }

        // Follow R implementation exactly
        let normal = Normal::new(0.0, 1.0).unwrap();
        
        // R: p = pnorm((x - mean(x))/sqrt(var.x))
        let p_values: Vec<f64> = sorted.iter()
            .map(|&x_i| normal.cdf((x_i - mean) / var_x.sqrt()))
            .collect();
        
        // R: h = (2 * seq(1:n) - 1) * (log(p) + log(1 - rev(p)))
        let mut h_values = Vec::new();
        for i in 0..n {
            let term = (2.0 * ((i + 1) as f64) - 1.0) * 
                      (p_values[i].ln() + (1.0 - p_values[n - 1 - i]).ln());
            h_values.push(term);
        }
        
        // R: h = h[is.finite(h)] and n = length(h)
        h_values.retain(|&h| h.is_finite());
        let n_finite = h_values.len();
        
        if n_finite == 0 {
            return Err("No finite values in h calculation".to_string());
        }
        
        // R: A = -n - mean(h)
        let mean_h = h_values.iter().sum::<f64>() / n_finite as f64;
        let a = -(n_finite as f64) - mean_h;

        // R: AA = (1 + 0.75/n + 2.25/n^2) * A
        let aa = (1.0 + 0.75 / (n_finite as f64) + 2.25 / ((n_finite as f64).powi(2))) * a;

        // Calculate p-value using the modified statistic exactly as R does
        let mut p_value = Self::calculate_p_value_r(aa);
        
        // R: if (PVAL > 1) PVAL = 1
        if p_value > 1.0 {
            p_value = 1.0;
        }

        Ok(AndersonDarlingTestResult {
            test_statistic: TestStatistic {
                value: a, // Return raw A statistic like R does
                name: TestStatisticName::AStatistic.as_str().to_string(),
            },
            p_value,
            test_name: "Anderson-Darling Test".to_string(),
            alpha,
            error_message: None,
            sample_size: n_finite,
        })
    }

    /// Calculate p-value for the Anderson-Darling statistic exactly as R does
    /// From the R adTest implementation
    fn calculate_p_value_r(aa: f64) -> f64 {
        if aa < 0.2 {
            1.0 - (-13.436 + 101.14 * aa - 223.73 * aa.powi(2)).exp()
        } else if aa < 0.34 {
            1.0 - (-8.318 + 42.796 * aa - 59.938 * aa.powi(2)).exp()
        } else if aa < 0.6 {
            (0.9177 - 4.279 * aa - 1.38 * aa.powi(2)).exp()
        } else {
            (1.2937 - 5.709 * aa + 0.0186 * aa.powi(2)).exp()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn anderson_darling_normal_data() {
        // Test with normally distributed data
        let x = vec![
            -1.5, -1.2, -0.8, -0.5, -0.2, 0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7,
        ];
        let test = AndersonDarlingTest::new(&x, 0.05).unwrap();

        // For normal data, we expect a high p-value
        assert!(test.p_value > 0.05);
        assert!(test.test_statistic.value < 1.0);
    }

    #[test]
    fn anderson_darling_skewed_data() {
        // Test with clearly non-normal (exponential-like) data
        let x = vec![
            0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0, 20.0,
        ];
        let test = AndersonDarlingTest::new(&x, 0.05).unwrap();

        // For clearly non-normal data, we expect a low p-value
        assert!(test.p_value < 0.05);
        assert!(test.test_statistic.value > 1.0);
    }

    #[test]
    fn anderson_darling_uniform_data() {
        // Test with uniform-like data
        let x = vec![0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        let test = AndersonDarlingTest::new(&x, 0.05).unwrap();

        // Uniform data should be detected as non-normal
        assert!(test.p_value < 0.2);
    }

    #[test]
    fn anderson_darling_too_few_samples() {
        let x = vec![1.0, 2.0, 3.0];
        let result = AndersonDarlingTest::new(&x, 0.05);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Anderson-Darling test requires at least 7 observations"
        );
    }

    #[test]
    fn anderson_darling_zero_variance() {
        let x = vec![5.0; 10];
        let result = AndersonDarlingTest::new(&x, 0.05);
        assert!(result.is_err());
    }
}
