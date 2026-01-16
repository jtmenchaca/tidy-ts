use super::super::super::core::AlternativeType;
use super::super::super::distributions::normal;

pub fn z_sample_size(
    effect_size: f64,
    alpha: f64,
    power: f64,
    std_dev: f64,
    alternative: AlternativeType,
) -> f64 {
    let alpha_value = match alternative {
        AlternativeType::TwoSided => alpha / 2.0, // Two-sided
        _ => alpha,                               // One-sided (less or greater)
    };

    let z_alpha = normal::normal_inverse_cdf(1.0 - alpha_value);
    let z_beta = normal::normal_inverse_cdf(power);

    // Formula: n = ((z_alpha + z_beta) * std_dev / effect_size)^2
    let n = ((z_alpha + z_beta) * std_dev / effect_size).powi(2);
    n.ceil() // Rounds up to the next whole sample size
}
