//! Kalbfleisch-Prentice survival estimate for Cox models
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/agsurv4.c`

/// Compute the Kalbfleisch-Prentice estimate of a Cox model survival curve.
///
/// Direct port of `agsurv4()` from `survival-ref/survival-master/src/agsurv4.c`.
///
/// Uses bisection to solve for the baseline survival increment at each
/// unique death time when there are tied deaths.
///
/// # Arguments
///
/// * `ndeath` - Number of deaths at each unique death time
/// * `risk` - Risk scores for the deaths (concatenated, ndeath[0] entries then ndeath[1], etc.)
/// * `wt` - Case weights for the deaths (same layout as risk)
/// * `denom` - Denominator of the partial likelihood at each death time (sum of risk*wt for at-risk set)
///
/// # Returns
///
/// KP survival increment at each death time: S₀(t) = prod(km[i]) over times ≤ t
pub fn agsurv4(ndeath: &[i32], risk: &[f64], wt: &[f64], denom: &[f64]) -> Vec<f64> {
    let n = ndeath.len(); // number of unique death times
    let mut km = vec![0.0_f64; n];

    let mut j = 0_usize;
    for i in 0..n {
        if ndeath[i] == 0 {
            km[i] = 1.0;
        } else if ndeath[i] == 1 {
            // Not a tied death
            km[i] = (1.0 - wt[j] * risk[j] / denom[i]).powf(1.0 / risk[j]);
        } else {
            // Bisection solution for tied deaths
            let mut guess = 0.5_f64;
            let mut inc = 0.25_f64;
            for _ in 0..35 {
                let mut sumt = 0.0_f64;
                for k in j..(j + ndeath[i] as usize) {
                    sumt += wt[k] * risk[k] / (1.0 - guess.powf(risk[k]));
                }
                if sumt < denom[i] {
                    guess += inc;
                } else {
                    guess -= inc;
                }
                inc /= 2.0;
            }
            km[i] = guess;
        }
        j += ndeath[i] as usize;
    }

    km
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agsurv4_no_ties() {
        // 3 death times, 1 death each, risk=1.0, wt=1.0
        // KP with no ties: km[i] = (1 - 1/denom)^(1/risk) = (1-1/denom)
        let ndeath = vec![1, 1, 1];
        let risk = vec![1.0, 1.0, 1.0];
        let wt = vec![1.0, 1.0, 1.0];
        let denom = vec![5.0, 4.0, 3.0];

        let km = agsurv4(&ndeath, &risk, &wt, &denom);
        assert!((km[0] - 0.8).abs() < 1e-10); // 1 - 1/5
        assert!((km[1] - 0.75).abs() < 1e-10); // 1 - 1/4
        assert!((km[2] - 2.0 / 3.0).abs() < 1e-10); // 1 - 1/3
    }

    #[test]
    fn test_agsurv4_no_deaths() {
        let ndeath = vec![0, 1, 0];
        let risk = vec![1.0];
        let wt = vec![1.0];
        let denom = vec![5.0, 4.0, 3.0];

        let km = agsurv4(&ndeath, &risk, &wt, &denom);
        assert!((km[0] - 1.0).abs() < 1e-10);
        assert!((km[1] - 0.75).abs() < 1e-10);
        assert!((km[2] - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_agsurv4_tied_deaths() {
        // 2 tied deaths with same risk
        let ndeath = vec![2];
        let risk = vec![1.0, 1.0];
        let wt = vec![1.0, 1.0];
        let denom = vec![5.0];

        let km = agsurv4(&ndeath, &risk, &wt, &denom);
        // With risk=1, (1-guess^1) = 1-guess, so sumt = 2/(1-guess)
        // Solve 2/(1-guess) = 5 → guess = 1 - 2/5 = 0.6
        assert!((km[0] - 0.6).abs() < 1e-6);
    }
}
