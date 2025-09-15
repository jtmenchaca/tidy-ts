use super::super::super::core::TailType;
use super::super::super::distributions::students_t;

/// Calculates the required sample size for a one-sample t-test.

pub fn t_sample_size(
    effect_size: f64,
    alpha: f64,
    power: f64,
    std_dev: f64,
    tail: TailType,
) -> f64 {
    students_t::t_sample_size(effect_size, alpha, power, std_dev, tail)
}
