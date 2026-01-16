use super::super::super::distributions::qnorm;

/// Calculates the required sample size for a test of proportions.

pub fn prop_sample_size(p1: f64, p2: f64, alpha: f64, power: f64) -> f64 {
    let p = (p1 + p2) / 2.0; // Pooled proportion
    let z_alpha = qnorm(1.0 - alpha / 2.0, 0.0, 1.0, true, false); // Two-tailed
    let z_beta = qnorm(power, 0.0, 1.0, true, false);

    // Formula: n = ((z_alpha * sqrt(2 * p * (1 - p)) + z_beta * sqrt(p1 * (1 - p1) + p2 * (1 - p2)))^2) / (p2 - p1)^2
    let n = (z_alpha * (2.0 * p * (1.0 - p)).sqrt()
        + z_beta * ((p1 * (1.0 - p1)) + (p2 * (1.0 - p2))).sqrt())
    .powi(2)
        / (p2 - p1).powi(2);

    n.ceil() // Rounds up to the next whole sample size
}
