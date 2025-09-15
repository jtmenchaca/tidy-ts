//! Numerical helper functions for distribution calculations
//!
//! This module contains specialized numerical functions used by distribution
//! implementations to ensure high accuracy and numerical stability.

use super::log_gamma::log_gamma;
use std::f64;

/// Stirling's error function
///
/// Computes the log of the error term in Stirling's formula.
/// For n > 15, uses the series 1/12n - 1/360n^3 + ...
/// For n <= 15, integers or half-integers, uses stored values.
/// For other n < 15, uses lgamma directly.
///
/// Source: R-4.5.1/nmath/stirlerr.c
#[inline]
pub fn stirlerr(n: f64) -> f64 {
    debug_assert!(n > 0.0, "stirlerr should not be called with n <= 0.0");
    const S0: f64 = 0.083333333333333333333; // 1/12
    const S1: f64 = 0.00277777777777777777778; // 1/360
    const S2: f64 = 0.00079365079365079365079365; // 1/1260
    const S3: f64 = 0.000595238095238095238095238; // 1/1680
    const S4: f64 = 0.0008417508417508417508417508; // 1/1188
    const S5: f64 = 0.0019175269175269175269175262; // 691/360360
    const S6: f64 = 0.0064102564102564102564102561; // 1/156
    const S7: f64 = 0.029550653594771241830065352; // 3617/122400
    const S8: f64 = 0.17964437236883057316493850; // 43867/244188
    const S9: f64 = 1.3924322169059011164274315; // 174611/125400
    const S10: f64 = 13.402864044168391994478957; // 77683/5796
    const S11: f64 = 156.84828462600201730636509; // 236364091/1506960
    const S12: f64 = 2193.1033333333333333333333; // 657931/300
    const S13: f64 = 36108.771253724989357173269; // 3392780147/93960
    const S14: f64 = 691472.26885131306710839498; // 1723168255201/2492028
    const S15: f64 = 15238221.539407416192283370; // 7709321041217/505920
    const S16: f64 = 382900751.39141414141414141; // 151628697551/396

    // Exact values for 0, 0.5, 1.0, 1.5, ..., 14.5, 15.0
    const SFERR_HALVES: [f64; 31] = [
        0.0,                           // n=0 - wrong, place holder only
        0.1534264097200273452913848,   // 0.5
        0.0810614667953272582196702,   // 1.0
        0.0548141210519176538961390,   // 1.5
        0.0413406959554092940938221,   // 2.0
        0.03316287351993628748511048,  // 2.5
        0.02767792568499833914878929,  // 3.0
        0.02374616365629749597132920,  // 3.5
        0.02079067210376509311152277,  // 4.0
        0.01848845053267318523077934,  // 4.5
        0.01664469118982119216319487,  // 5.0
        0.01513497322191737887351255,  // 5.5
        0.01387612882307074799874573,  // 6.0
        0.01281046524292022692424986,  // 6.5
        0.01189670994589177009505572,  // 7.0
        0.01110455975820691732662991,  // 7.5
        0.010411265261972096497478567, // 8.0
        0.009799416126158803298389475, // 8.5
        0.009255462182712732917728637, // 9.0
        0.008768700134139385462952823, // 9.5
        0.008330563433362871256469318, // 10.0
        0.007934114564314020547248100, // 10.5
        0.007573675487951840794972024, // 11.0
        0.007244554301320383179543912, // 11.5
        0.006942840107209529865664152, // 12.0
        0.006665247032707682442354394, // 12.5
        0.006408994188004207068439631, // 13.0
        0.006171712263039457647532867, // 13.5
        0.005951370112758847735624416, // 14.0
        0.005746216513010115682023589, // 14.5
        0.005554733551962801371038690, // 15.0
    ];

    if n <= 23.5 {
        // Handle n = 0.0 specially
        if n == 0.0 {
            return 0.0;
        }

        let nn = n + n;
        if n <= 15.0 && (nn == nn.trunc()) {
            return SFERR_HALVES[nn as usize];
        }

        if n <= 5.25 {
            if n >= 1.0 {
                // "MM2"; slightly more accurate than direct form
                let l_n = n.ln();
                return log_gamma(n)
                    + n * (1.0 - l_n)
                    + (l_n - 1.837877066409345483560659472811) * 0.5;
            } else {
                // n < 1
                return log_gamma(n + 1.0) - (n + 0.5) * n.ln() + n
                    - 0.918938533204672741780329736406;
            }
        }

        // else 5.25 < n <= 23.5
        let nn = n * n;
        if n > 12.8 {
            return (S0 - (S1 - (S2 - (S3 - (S4 - (S5 - S6 / nn) / nn) / nn) / nn) / nn) / nn) / n;
        }
        if n > 12.3 {
            return (S0
                - (S1 - (S2 - (S3 - (S4 - (S5 - (S6 - S7 / nn) / nn) / nn) / nn) / nn) / nn) / nn)
                / n;
        }
        if n > 8.9 {
            let result = S0
                - (S1
                    - (S2 - (S3 - (S4 - (S5 - (S6 - (S7 - S8 / nn) / nn) / nn) / nn) / nn) / nn)
                        / nn)
                    / nn;
            return result / n;
        }
        if n > 7.3 {
            let result = S0
                - (S1
                    - (S2
                        - (S3
                            - (S4
                                - (S5
                                    - (S6 - (S7 - (S8 - (S9 - S10 / nn) / nn) / nn) / nn) / nn)
                                    / nn)
                                / nn)
                            / nn)
                        / nn)
                    / nn;
            return result / n;
        }
        if n > 6.6 {
            let result = S0
                - (S1
                    - (S2
                        - (S3
                            - (S4
                                - (S5
                                    - (S6
                                        - (S7
                                            - (S8
                                                - (S9 - (S10 - (S11 - S12 / nn) / nn) / nn)
                                                    / nn)
                                                / nn)
                                            / nn)
                                        / nn)
                                    / nn)
                                / nn)
                            / nn)
                        / nn)
                    / nn;
            return result / n;
        }
        if n > 6.1 {
            let result = S0
                - (S1
                    - (S2
                        - (S3
                            - (S4
                                - (S5
                                    - (S6
                                        - (S7
                                            - (S8
                                                - (S9
                                                    - (S10
                                                        - (S11
                                                            - (S12
                                                                - (S13 - S14 / nn) / nn)
                                                                / nn)
                                                            / nn)
                                                        / nn)
                                                    / nn)
                                                / nn)
                                            / nn)
                                        / nn)
                                    / nn)
                                / nn)
                            / nn)
                        / nn)
                    / nn;
            return result / n;
        }
        // 6.1 >= n > 5.25
        let result = S0
            - (S1
                - (S2
                    - (S3
                        - (S4
                            - (S5
                                - (S6
                                    - (S7
                                        - (S8
                                            - (S9
                                                - (S10
                                                    - (S11
                                                        - (S12
                                                            - (S13
                                                                - (S14
                                                                    - (S15
                                                                        - S16 / nn)
                                                                        / nn)
                                                                    / nn)
                                                                / nn)
                                                            / nn)
                                                        / nn)
                                                    / nn)
                                                / nn)
                                            / nn)
                                        / nn)
                                    / nn)
                                / nn)
                            / nn)
                        / nn)
                    / nn)
                / nn;
        return result / n;
    } else {
        // n > 23.5
        let nn = n * n;
        if n > 15.7e6 {
            return S0 / n;
        }
        if n > 6180.0 {
            return (S0 - S1 / nn) / n;
        }
        if n > 205.0 {
            return (S0 - (S1 - S2 / nn) / nn) / n;
        }
        if n > 86.0 {
            return (S0 - (S1 - (S2 - S3 / nn) / nn) / nn) / n;
        }
        if n > 27.0 {
            return (S0 - (S1 - (S2 - (S3 - S4 / nn) / nn) / nn) / nn) / n;
        }
        // 23.5 < n <= 27
        let result = S0 - (S1 - (S2 - (S3 - (S4 - S5 / nn) / nn) / nn) / nn) / nn;
        return result / n;
    }
}
