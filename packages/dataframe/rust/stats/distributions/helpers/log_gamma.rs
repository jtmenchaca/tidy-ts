/// Natural log of gamma function
///
/// Lanczos implementation with 15-term approximation for high accuracy.
/// Based on "Numerical Recipes" 3rd edition.
pub fn log_gamma(x: f64) -> f64 {
    // Lanczos coefficients for 15-term approximation
    const COEFF: [f64; 9] = [
        0.999_999_999_999_809_93,
        676.520_368_121_885_1,
        -1259.139_216_722_4028,
        771.323_428_777_653_13,
        -176.615_029_162_140_6,
        12.507_343_278_686_905,
        -0.138_571_095_265_720_12,
        0.000_009_984_369_578_019_571,
        1.505_632_735_149_311e-7,
    ];

    if x < 0.5 {
        // Reflection formula for x < 0.5
        return std::f64::consts::PI.ln()
            - (std::f64::consts::PI * x).sin().ln()
            - log_gamma(1.0 - x);
    }

    let mut x_lanczos = COEFF[0];
    let mut denom = x - 1.0;

    for (_i, c) in COEFF.iter().enumerate().skip(1) {
        denom += 1.0;
        x_lanczos += c / denom;
    }

    let t = x + 6.5;
    0.5 * (2.0 * std::f64::consts::PI).ln() + (x - 0.5) * t.ln() - t + x_lanczos.ln()
}
