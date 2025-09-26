use statrs::distribution::{ChiSquared, ContinuousCDF};
use statrs::statistics::Statistics;

use super::super::super::core::types::{DAgostinoPearsonTestResult, TestStatistic, TestStatisticName};


/// Implements the D'Agostino-Pearson K² test for normality
/// 
/// This test combines skewness and kurtosis to produce an omnibus test of normality.
/// It's particularly effective for moderate to large sample sizes (n ≥ 20).
///
/// # References
///
/// D'Agostino, R. B. (1970). Transformation to normality of the null distribution of g1.
///     Biometrika, 57(3), 679–681.
///
/// D'Agostino, R. B., & Pearson, E. S. (1973). Tests for departure from normality.
///     Biometrika, 60(3), 613–622.
///
/// D'Agostino, R. B., & Stephens, M. A. (1986). Goodness-of-fit techniques.
///     Marcel Dekker, New York.
#[derive(Debug, PartialEq, Clone)]
pub struct DAgostinoPearsonTest;

/// Error types for D'Agostino-Pearson test
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum DAgostinoPearsonError {
    /// Sample size too small (n < 20)
    TooFewSamples,
    /// All values are identical
    NoVariation,
}

impl DAgostinoPearsonTest {
    /// Run the D'Agostino-Pearson K² test on the sample `x`.
    /// 
    /// # Arguments
    /// * `x` - Sample data
    /// * `alpha` - Significance level for the test
    /// 
    /// # Returns
    /// * `Ok(DAgostinoPearsonTestResult)` - Test results including skewness and kurtosis
    /// * `Err(String)` - Error message
    pub fn new(x: &[f64], alpha: f64) -> Result<DAgostinoPearsonTestResult, String> {
        let n = x.len();
        
        // D'Agostino-Pearson test requires at least 20 observations for reliable results
        if n < 20 {
            return Err("D'Agostino-Pearson test requires at least 20 observations".to_string());
        }
        
        // Calculate moments
        let mean = x.mean();
        let variance = x.variance();
        
        if variance == 0.0 {
            return Err("Data has zero variance".to_string());
        }
        
        let _std_dev = variance.sqrt();
        
        // Calculate skewness and kurtosis exactly as in R source
        // s = sqrt(mean((x-meanX)**2))
        let s = (x.iter().map(|&xi| (xi - mean).powi(2)).sum::<f64>() / n as f64).sqrt();
        
        // a3 = mean((x-meanX)**3)/s**3
        let a3 = x.iter().map(|&xi| (xi - mean).powi(3)).sum::<f64>() / n as f64 / s.powi(3);
        
        // a4 = mean((x-meanX)**4)/s**4
        let a4 = x.iter().map(|&xi| (xi - mean).powi(4)).sum::<f64>() / n as f64 / s.powi(4);
        
        let skewness = a3;
        let raw_kurtosis = a4; // Raw kurtosis (not excess)
        let excess_kurtosis = a4 - 3.0; // Excess kurtosis for output
        
        // Transform skewness to z-score using D'Agostino's transformation
        let z_skew = Self::transform_skewness(skewness, n);
        
        // Transform kurtosis to z-score using Anscombe & Glynn transformation  
        // NOTE: R expects raw kurtosis, does the (a4-3) adjustment internally
        let z_kurt = Self::transform_kurtosis(raw_kurtosis, n);
        
        
        // Combine into omnibus K² statistic
        let k_squared = z_skew * z_skew + z_kurt * z_kurt;
        
        // K² follows a chi-square distribution with 2 degrees of freedom
        let chi_squared = ChiSquared::new(2.0).unwrap();
        let p_value = 1.0 - chi_squared.cdf(k_squared);
        
        Ok(DAgostinoPearsonTestResult {
            test_statistic: TestStatistic {
                value: k_squared,
                name: TestStatisticName::ChiSquare.as_str().to_string(),
            },
            p_value,
            test_name: "D'Agostino-Pearson K² Test".to_string(),
            alpha,
            skewness,
            kurtosis: excess_kurtosis,
            error_message: None,
            sample_size: n,
        })
    }
    
    /// Transform sample skewness to a z-score using D'Agostino's transformation
    /// Matches the R implementation in .skewness.test from fBasics
    fn transform_skewness(a3: f64, n: usize) -> f64 {
        let n = n as f64;
        
        // From R: SD3 = sqrt(6*(n-2)/((n+1)*(n+3)))
        let sd3 = (6.0 * (n - 2.0) / ((n + 1.0) * (n + 3.0))).sqrt();
        
        // From R: U3 = a3/SD3
        let u3 = a3 / sd3;
        
        // From R: b = (3*(n**2+27*n-70)*(n+1)*(n+3))/((n-2)*(n+5)*(n+7)*(n+9))
        let b = (3.0 * (n * n + 27.0 * n - 70.0) * (n + 1.0) * (n + 3.0)) /
               ((n - 2.0) * (n + 5.0) * (n + 7.0) * (n + 9.0));
        
        // From R: W2 = sqrt(2*(b-1))-1
        let w2 = (2.0 * (b - 1.0)).sqrt() - 1.0;
        
        // From R: delta = 1/sqrt(log(sqrt(W2)))
        let delta = 1.0 / (w2.sqrt().ln()).sqrt();
        
        // From R: a = sqrt(2/(W2-1))
        let a = (2.0 / (w2 - 1.0)).sqrt();
        
        // From R: Z3 = delta*log((U3/a)+sqrt((U3/a)**2+1))
        let arg = u3 / a;
        delta * (arg + (arg * arg + 1.0).sqrt()).ln()
    }
    
    /// Transform sample kurtosis to a z-score using Anscombe & Glynn transformation
    /// Matches the R implementation in .kurtosis.test from fBasics
    fn transform_kurtosis(a4: f64, n: usize) -> f64 {
        let n = n as f64;
        
        // From R: SD4 = sqrt(24*(n-2)*(n-3)*n/((n+1)**2*(n+3)*(n+5)))
        let sd4 = (24.0 * (n - 2.0) * (n - 3.0) * n / 
                  ((n + 1.0) * (n + 1.0) * (n + 3.0) * (n + 5.0))).sqrt();
        
        // From R: U4 = (a4-3+6/(n+1))/SD4
        let u4 = (a4 - 3.0 + 6.0 / (n + 1.0)) / sd4;
        
        // From R: B = (6*(n*n-5*n+2)/((n+7)*(n+9)))*sqrt((6*(n+3)*(n+5))/(n*(n-2)*(n-3)))
        let b = (6.0 * (n * n - 5.0 * n + 2.0) / ((n + 7.0) * (n + 9.0))) *
               (6.0 * (n + 3.0) * (n + 5.0) / (n * (n - 2.0) * (n - 3.0))).sqrt();
        
        // From R: A = 6+(8/B)*((2/B)+sqrt(1+4/(B**2)))
        let a = 6.0 + (8.0 / b) * ((2.0 / b) + (1.0 + 4.0 / (b * b)).sqrt());
        
        // From R: jm = sqrt(2/(9*A))
        let jm = (2.0 / (9.0 * a)).sqrt();
        
        // From R: pos0 = ((1-2/A)/(1+U4*sqrt(2/(A-4))))
        // From R: pos <- sign(pos0) * abs(pos0) ^ (1/3)
        let pos0 = (1.0 - 2.0 / a) / (1.0 + u4 * (2.0 / (a - 4.0)).sqrt());
        let pos = pos0.signum() * pos0.abs().powf(1.0 / 3.0);
        
        // From R: Z4 = (1-2/(9*A)-pos)/jm
        (1.0 - 2.0 / (9.0 * a) - pos) / jm
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dagostino_pearson_normal_data() {
        // Test with approximately normal data
        let x = vec![
            -2.0, -1.8, -1.5, -1.2, -1.0, -0.8, -0.6, -0.4, -0.2, 0.0,
            0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.2,
            -1.3, -0.7, 0.3, 0.9, 1.1
        ];
        let test = DAgostinoPearsonTest::new(&x, 0.05).unwrap();
        
        // For normal data, we expect a high p-value
        assert!(test.p_value > 0.05);
        assert!(test.skewness.abs() < 1.0);
        assert!(test.kurtosis.abs() < 2.0);
    }
    
    #[test]
    fn dagostino_pearson_skewed_data() {
        // Test with right-skewed data
        let x = vec![
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
            1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0,
            0.15, 0.25, 0.35, 0.45, 0.55
        ];
        let test = DAgostinoPearsonTest::new(&x, 0.05).unwrap();
        
        // For skewed data, we expect a low p-value
        assert!(test.p_value < 0.1);
        assert!(test.skewness > 1.0); // Right-skewed
    }
    
    #[test]
    fn dagostino_pearson_heavy_tails() {
        // Test with heavy-tailed data (high kurtosis)
        let mut x = vec![0.0; 25];
        // Most values near center
        for i in 5..20 {
            x[i] = (i as f64 - 12.5) * 0.1;
        }
        // Some extreme outliers
        x[0] = -10.0;
        x[1] = -8.0;
        x[23] = 8.0;
        x[24] = 10.0;
        
        let test = DAgostinoPearsonTest::new(&x, 0.05).unwrap();
        
        // Heavy-tailed data should be detected as non-normal
        assert!(test.kurtosis.abs() > 1.0);
    }
    
    #[test]
    fn dagostino_pearson_too_few_samples() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let result = DAgostinoPearsonTest::new(&x, 0.05);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "D'Agostino-Pearson test requires at least 20 observations");
    }
    
    #[test]
    fn dagostino_pearson_zero_variance() {
        let x = vec![5.0; 25];
        let result = DAgostinoPearsonTest::new(&x, 0.05);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("zero variance"));
    }
}