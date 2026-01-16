//! Effect size calculations for statistical tests
//!
//! This module provides standardized effect size calculations for various statistical tests.

/// Calculate Cohen's d for one-sample t-test
///
/// Cohen's d = (sample_mean - pop_mean) / sample_std
///
/// # Arguments
/// * `sample_mean` - The sample mean
/// * `pop_mean` - The population mean (null hypothesis value)
/// * `sample_std` - The sample standard deviation
///
/// # Returns
/// Cohen's d effect size
pub fn cohens_d_one_sample(sample_mean: f64, pop_mean: f64, sample_std: f64) -> f64 {
    if sample_std == 0.0 {
        0.0
    } else {
        (sample_mean - pop_mean) / sample_std
    }
}

/// Calculate Cohen's d for independent t-test
///
/// Cohen's d = (mean1 - mean2) / pooled_std
///
/// # Arguments
/// * `mean1` - Mean of first group
/// * `mean2` - Mean of second group
/// * `pooled_std` - Pooled standard deviation
///
/// # Returns
/// Cohen's d effect size
pub fn cohens_d_independent(mean1: f64, mean2: f64, pooled_std: f64) -> f64 {
    if pooled_std == 0.0 {
        0.0
    } else {
        (mean1 - mean2) / pooled_std
    }
}

/// Calculate Cohen's d for independent t-test using individual group statistics
///
/// This version calculates the pooled standard deviation from individual group statistics
///
/// # Arguments
/// * `mean1` - Mean of first group
/// * `mean2` - Mean of second group
/// * `var1` - Variance of first group
/// * `var2` - Variance of second group
/// * `n1` - Sample size of first group
/// * `n2` - Sample size of second group
///
/// # Returns
/// Cohen's d effect size
pub fn cohens_d_independent_from_vars(
    mean1: f64,
    mean2: f64,
    var1: f64,
    var2: f64,
    n1: f64,
    n2: f64,
) -> f64 {
    let pooled_var = ((n1 - 1.0) * var1 + (n2 - 1.0) * var2) / (n1 + n2 - 2.0);
    let pooled_std = pooled_var.sqrt();
    cohens_d_independent(mean1, mean2, pooled_std)
}

/// Calculate Cramér's V for chi-square test of independence
///
/// Cramér's V = sqrt(chi_square / (n * min(r-1, c-1)))
///
/// # Arguments
/// * `chi_square` - Chi-square test statistic
/// * `n` - Total sample size
/// * `rows` - Number of rows in contingency table
/// * `cols` - Number of columns in contingency table
///
/// # Returns
/// Cramér's V effect size
pub fn cramers_v(chi_square: f64, n: f64, rows: usize, cols: usize) -> f64 {
    let min_dim = (rows - 1).min(cols - 1) as f64;
    if min_dim == 0.0 || n == 0.0 {
        0.0
    } else {
        (chi_square / (n * min_dim)).sqrt()
    }
}

/// Calculate eta-squared for ANOVA
///
/// Eta-squared = SS_between / SS_total
///
/// # Arguments
/// * `ss_between` - Sum of squares between groups
/// * `ss_total` - Total sum of squares
///
/// # Returns
/// Eta-squared effect size
pub fn eta_squared(ss_between: f64, ss_total: f64) -> f64 {
    if ss_total == 0.0 {
        0.0
    } else {
        ss_between / ss_total
    }
}

/// Calculate partial eta-squared for ANOVA
///
/// Partial eta-squared = SS_effect / (SS_effect + SS_error)
///
/// # Arguments
/// * `ss_effect` - Sum of squares for the effect
/// * `ss_error` - Sum of squares for error
///
/// # Returns
/// Partial eta-squared effect size
pub fn partial_eta_squared(ss_effect: f64, ss_error: f64) -> f64 {
    let total = ss_effect + ss_error;
    if total == 0.0 { 0.0 } else { ss_effect / total }
}

/// Calculate omega-squared for ANOVA
///
/// Omega-squared = (SS_between - (df_between * MS_error)) / (SS_total + MS_error)
/// This is a less biased estimate of effect size than eta-squared
///
/// # Arguments
/// * `ss_between` - Sum of squares between groups
/// * `ss_total` - Total sum of squares
/// * `df_between` - Degrees of freedom between groups
/// * `ms_error` - Mean square error
///
/// # Returns
/// Omega-squared effect size
pub fn omega_squared(ss_between: f64, ss_total: f64, df_between: f64, ms_error: f64) -> f64 {
    let numerator = ss_between - (df_between * ms_error);
    let denominator = ss_total + ms_error;
    if denominator == 0.0 {
        0.0
    } else {
        (numerator / denominator).max(0.0) // Omega-squared cannot be negative
    }
}

/// Calculate partial omega-squared for ANOVA
///
/// Partial omega-squared = (SS_effect - (df_effect * MS_error)) / (SS_effect + SS_error + MS_error)
/// This is a less biased estimate of partial effect size than partial eta-squared
///
/// # Arguments
/// * `ss_effect` - Sum of squares for the effect
/// * `ss_error` - Sum of squares for error
/// * `df_effect` - Degrees of freedom for the effect
/// * `ms_error` - Mean square error
///
/// # Returns
/// Partial omega-squared effect size
pub fn partial_omega_squared(ss_effect: f64, ss_error: f64, df_effect: f64, ms_error: f64) -> f64 {
    let numerator = ss_effect - (df_effect * ms_error);
    let denominator = ss_effect + ss_error + ms_error;
    if denominator == 0.0 {
        0.0
    } else {
        (numerator / denominator).max(0.0) // Partial omega-squared cannot be negative
    }
}

/// Calculate Cohen's h for proportion tests
///
/// Cohen's h = 2 * (arcsin(sqrt(p1)) - arcsin(sqrt(p2)))
///
/// # Arguments
/// * `p1` - First proportion
/// * `p2` - Second proportion
///
/// # Returns
/// Cohen's h effect size
pub fn cohens_h(p1: f64, p2: f64) -> f64 {
    // Clamp proportions to valid range [0, 1]
    let p1_clamped = p1.max(0.0).min(1.0);
    let p2_clamped = p2.max(0.0).min(1.0);

    2.0 * (p1_clamped.sqrt().asin() - p2_clamped.sqrt().asin())
}

/// Calculate Cohen's d for one-sample Z-tests
///
/// Cohen's d = (sample_mean - pop_mean) / pop_std
///
/// # Arguments
/// * `sample_mean` - The sample mean
/// * `pop_mean` - The population mean (null hypothesis value)
/// * `pop_std` - The population standard deviation
///
/// # Returns
/// Cohen's d effect size
pub fn cohens_d_z_test(sample_mean: f64, pop_mean: f64, pop_std: f64) -> f64 {
    if pop_std == 0.0 {
        0.0
    } else {
        (sample_mean - pop_mean) / pop_std
    }
}

/// Calculate Cohen's d for paired two-sample Z-tests
///
/// Cohen's d = mean_difference / pop_std_diff
///
/// # Arguments
/// * `mean_difference` - The mean of the paired differences
/// * `pop_std_diff` - The population standard deviation of differences
///
/// # Returns
/// Cohen's d effect size
pub fn cohens_d_z_test_paired(mean_difference: f64, pop_std_diff: f64) -> f64 {
    if pop_std_diff == 0.0 {
        0.0
    } else {
        mean_difference / pop_std_diff
    }
}

/// Calculate Cohen's d for independent two-sample Z-tests
///
/// Cohen's d = (mean1 - mean2) / pooled_pop_std
///
/// # Arguments
/// * `mean1` - Mean of first group
/// * `mean2` - Mean of second group
/// * `pop_std1` - Population standard deviation of first group
/// * `pop_std2` - Population standard deviation of second group
///
/// # Returns
/// Cohen's d effect size
pub fn cohens_d_z_test_independent(mean1: f64, mean2: f64, pop_std1: f64, pop_std2: f64) -> f64 {
    // For independent Z-tests, we use the average of the two population standard deviations
    // as the pooled standard deviation, since we know both population parameters
    let pooled_pop_std = (pop_std1 + pop_std2) / 2.0;

    if pooled_pop_std == 0.0 {
        0.0
    } else {
        (mean1 - mean2) / pooled_pop_std
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cohens_d_one_sample() {
        assert_eq!(cohens_d_one_sample(10.0, 8.0, 2.0), 1.0);
        assert_eq!(cohens_d_one_sample(10.0, 8.0, 0.0), 0.0);
        assert_eq!(cohens_d_one_sample(8.0, 8.0, 2.0), 0.0);
    }

    #[test]
    fn test_cohens_d_independent() {
        assert_eq!(cohens_d_independent(10.0, 8.0, 2.0), 1.0);
        assert_eq!(cohens_d_independent(10.0, 8.0, 0.0), 0.0);
        assert_eq!(cohens_d_independent(8.0, 8.0, 2.0), 0.0);
    }

    #[test]
    fn test_cramers_v() {
        assert!((cramers_v(10.0, 100.0, 2, 2) - 0.316).abs() < 0.001);
        assert_eq!(cramers_v(10.0, 0.0, 2, 2), 0.0);
        assert_eq!(cramers_v(0.0, 100.0, 2, 2), 0.0);
    }

    #[test]
    fn test_eta_squared() {
        assert_eq!(eta_squared(20.0, 100.0), 0.2);
        assert_eq!(eta_squared(20.0, 0.0), 0.0);
        assert_eq!(eta_squared(0.0, 100.0), 0.0);
    }

    #[test]
    fn test_omega_squared() {
        // Omega-squared should be smaller than eta-squared (less biased)
        // For SS_between=20, SS_total=100, df_between=2, MS_error=5
        // omega² = (20 - 2*5) / (100 + 5) = 10/105 ≈ 0.095
        assert!((omega_squared(20.0, 100.0, 2.0, 5.0) - 0.095238).abs() < 1e-5);
        assert_eq!(omega_squared(20.0, 0.0, 2.0, 0.0), 0.0);
        // Test that omega-squared cannot be negative
        assert_eq!(omega_squared(5.0, 100.0, 10.0, 1.0), 0.0); // (5 - 10*1)/(100+1) < 0, so returns 0
    }

    #[test]
    fn test_partial_omega_squared() {
        // For SS_effect=20, SS_error=60, df_effect=2, MS_error=3
        // partial omega² = (20 - 2*3) / (20 + 60 + 3) = 14/83 ≈ 0.169
        assert!((partial_omega_squared(20.0, 60.0, 2.0, 3.0) - 0.168674).abs() < 1e-5);
        assert_eq!(partial_omega_squared(20.0, 60.0, 2.0, 0.0), 0.25); // 20/(20+60)
        // Test that partial omega-squared cannot be negative
        assert_eq!(partial_omega_squared(5.0, 60.0, 10.0, 1.0), 0.0); // (5 - 10*1)/(5+60+1) < 0, so returns 0
    }

    #[test]
    fn test_cohens_h() {
        assert!((cohens_h(0.8, 0.6) - 0.4421432).abs() < 1e-6);
        assert_eq!(cohens_h(0.5, 0.5), 0.0);
        assert!((cohens_h(1.0, 0.0) - std::f64::consts::PI).abs() < 1e-6); // π
    }

    #[test]
    fn test_cohens_d_z_test() {
        assert_eq!(cohens_d_z_test(10.0, 8.0, 2.0), 1.0);
        assert_eq!(cohens_d_z_test(10.0, 8.0, 0.0), 0.0);
        assert_eq!(cohens_d_z_test(8.0, 8.0, 2.0), 0.0);
    }

    #[test]
    fn test_cohens_d_z_test_paired() {
        assert_eq!(cohens_d_z_test_paired(2.0, 1.0), 2.0);
        assert_eq!(cohens_d_z_test_paired(2.0, 0.0), 0.0);
        assert_eq!(cohens_d_z_test_paired(0.0, 1.0), 0.0);
    }

    #[test]
    fn test_cohens_d_z_test_independent() {
        assert_eq!(cohens_d_z_test_independent(10.0, 8.0, 2.0, 2.0), 1.0);
        assert_eq!(cohens_d_z_test_independent(10.0, 8.0, 0.0, 0.0), 0.0);
        assert_eq!(cohens_d_z_test_independent(8.0, 8.0, 2.0, 2.0), 0.0);
    }
}
