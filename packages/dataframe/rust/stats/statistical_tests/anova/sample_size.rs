use super::super::super::distributions::qf;

/// Calculates the required sample size for an ANOVA test.

pub fn f_sample_size(effect_size: f64, alpha: f64, power: f64, num_groups: usize) -> f64 {
    let df1 = (num_groups - 1) as f64; // Degrees of freedom for the numerator
    let df2 = 1e6; // Approximation for large sample sizes (will be refined later)

    // Calculate critical F-values based on alpha and power using our wrappers
    let f_alpha = qf(1.0 - alpha, df1, df2, true, false);
    let f_beta = qf(power, df1, df2, true, false);

    // Formula: n = ((f_alpha + f_beta) * (num_groups - 1) / effect_size^2)^2
    let n = ((f_alpha + f_beta) * df1 / effect_size.powi(2)).powi(2);
    n.ceil() // Rounds up to the next whole sample size
}
