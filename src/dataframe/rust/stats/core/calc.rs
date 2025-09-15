use super::TailType;
use statrs::distribution::{ChiSquared, ContinuousCDF};

/// Calculates the p-value for a given test statistic.
///
/// This function determines the p-value based on the provided test statistic,
/// the type of tail (left, right, or two), and the statistical distribution used.
///
/// # Arguments
///
/// * `t_stat` - The test statistic (e.g., t-statistic).
/// * `tail` - The type of tail (left, right, or two).
/// * `dist` - The statistical distribution to be used, which must implement the `ContinuousCDF` trait.
///
/// # Returns
///
/// The p-value corresponding to the test statistic and tail type.
///
pub fn calculate_p_value(t_stat: f64, tail: TailType, dist: &dyn ContinuousCDF<f64, f64>) -> f64 {
    match tail {
        TailType::Left => dist.cdf(t_stat),
        TailType::Right => 1.0 - dist.cdf(t_stat),
        TailType::Two => 2.0 * (1.0 - dist.cdf(t_stat.abs())),
    }
}

/// Calculates the confidence interval for a sample mean.
///
/// This function computes the confidence interval for a sample mean based on
/// the provided sample mean, standard error, significance level, and statistical distribution.
///
/// # Arguments
///
/// * `sample_mean` - The sample mean for the dataset.
/// * `std_error` - The standard error of the mean.
/// * `alpha` - The significance level (e.g., 0.05 for a 95% confidence interval).
/// * `dist` - The statistical distribution to be used, which must implement the `ContinuousCDF` trait.
///
/// # Returns
///
/// A tuple `(lower_bound, upper_bound)` representing the confidence interval.
///
pub fn calculate_confidence_interval(
    sample_mean: f64,
    std_error: f64,
    alpha: f64,
    dist: &dyn ContinuousCDF<f64, f64>,
) -> (f64, f64) {
    let margin_of_error = dist.inverse_cdf(1.0 - alpha / 2.0) * std_error;
    (sample_mean - margin_of_error, sample_mean + margin_of_error)
}

/// Calculates the confidence interval for Chi-squared distribution.
///
/// This function computes the confidence interval for the variance of a population
/// based on the sample variance and the Chi-squared distribution.
///
/// # Arguments
///
/// * `sample_variance` - The sample variance for the dataset.
/// * `alpha` - The significance level (e.g., 0.05 for a 95% confidence interval).
/// * `dist` - The Chi-squared distribution used for the calculation.
///
/// # Returns
///
/// A tuple `(lower_bound, upper_bound)` representing the confidence interval for variance.
///
pub fn calculate_chi2_confidence_interval(
    sample_variance: f64,
    alpha: f64,
    dist: &ChiSquared,
) -> (f64, f64) {
    let df = dist.shape(); // Degrees of freedom
    let chi_square_lower = dist.inverse_cdf(alpha / 2.0);
    let chi_square_upper = dist.inverse_cdf(1.0 - alpha / 2.0);

    // Confidence interval for variance: (n-1) * sample_variance / chi_square_stat
    let lower_bound = (df * sample_variance) / chi_square_upper;
    let upper_bound = (df * sample_variance) / chi_square_lower;
    (lower_bound, upper_bound)
}
