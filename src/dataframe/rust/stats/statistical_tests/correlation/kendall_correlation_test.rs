use super::super::super::core::{
    AlternativeType,
    types::{KendallCorrelationTestResult, TestStatistic, TestStatisticName, EffectSize, EffectSizeType, ConfidenceInterval},
};
use super::super::super::distributions::normal;
use std::collections::HashMap;

/// Compute exact Kendall distribution using R's algorithm
/// Implements ckendall(k, n) from R's kendall.c
fn ckendall(k: i32, n: i32, memo: &mut HashMap<(i32, i32), f64>) -> f64 {
    let u = n * (n - 1) / 2;
    if k < 0 || k > u {
        return 0.0;
    }
    
    if let Some(&value) = memo.get(&(n, k)) {
        return value;
    }
    
    let result = if n == 1 {
        if k == 0 { 1.0 } else { 0.0 }
    } else {
        let mut s = 0.0;
        for i in 0..n {
            s += ckendall(k - i, n - 1, memo);
        }
        s
    };
    
    memo.insert((n, k), result);
    result
}

/// Compute exact Kendall p-value using R's pkendall algorithm
fn pkendall(q: f64, n: i32) -> f64 {
    let q_floor = (q + 1e-7).floor() as i32;
    let max_k = n * (n - 1) / 2;
    
    if q_floor < 0 {
        return 0.0;
    }
    if q_floor > max_k {
        return 1.0;
    }
    
    let mut memo = HashMap::new();
    let mut p = 0.0;
    for j in 0..=q_floor {
        p += ckendall(j, n, &mut memo);
    }
    
    // Divide by n! (gamma(n+1))
    let mut factorial = 1.0;
    for i in 1..=n {
        factorial *= i as f64;
    }
    
    p / factorial
}

/// Count concordant and discordant pairs for Kendall's tau
fn count_pairs(x: &[f64], y: &[f64]) -> (i32, i32, i32, i32, i32) {
    let n = x.len();
    let mut concordant = 0;
    let mut discordant = 0;
    let mut ties_x = 0;
    let mut ties_y = 0;
    let mut ties_xy = 0;

    for i in 0..n - 1 {
        for j in i + 1..n {
            let dx = x[j] - x[i];
            let dy = y[j] - y[i];

            if dx == 0.0 && dy == 0.0 {
                ties_xy += 1;
            } else if dx == 0.0 {
                ties_x += 1;
            } else if dy == 0.0 {
                ties_y += 1;
            } else if dx * dy > 0.0 {
                concordant += 1;
            } else {
                discordant += 1;
            }
        }
    }

    (concordant, discordant, ties_x, ties_y, ties_xy)
}

/// Kendall rank correlation test
pub fn kendall_test(x: &[f64], y: &[f64], alternative: AlternativeType, alpha: f64) -> Result<KendallCorrelationTestResult, String> {
    if x.len() != y.len() {
        return Err("x and y must have the same length".to_string());
    }

    let n = x.len();
    if n < 2 {
        return Err("Not enough observations (need at least 2)".to_string());
    }

    // Count concordant and discordant pairs
    let (concordant, discordant, ties_x, ties_y, ties_xy) = count_pairs(x, y);

    // Calculate tau using the standard formula
    let total_pairs = (n * (n - 1) / 2) as f64;
    let tau = (concordant - discordant) as f64 / total_pairs;

    // Calculate S statistic for variance calculation  
    let _s_raw = (concordant - discordant) as f64;

    // Variance with tie corrections
    let n_f = n as f64;
    let v0 = n_f * (n_f - 1.0) * (2.0 * n_f + 5.0);

    // Count tied groups
    let mut tie_groups_x: HashMap<String, i32> = HashMap::new();
    let mut tie_groups_y: HashMap<String, i32> = HashMap::new();

    for &val in x {
        let key = format!("{:.10}", val); // Use string key for floating point
        *tie_groups_x.entry(key).or_insert(0) += 1;
    }
    for &val in y {
        let key = format!("{:.10}", val);
        *tie_groups_y.entry(key).or_insert(0) += 1;
    }

    let mut vt = 0.0;
    let mut vu = 0.0;
    let mut t2_sum = 0.0;
    let mut u2_sum = 0.0;
    let mut t3_sum = 0.0;
    let mut u3_sum = 0.0;

    for &count in tie_groups_x.values() {
        if count > 1 {
            let count_f = count as f64;
            vt += count_f * (count_f - 1.0) * (2.0 * count_f + 5.0);
            let t2 = count_f * (count_f - 1.0);
            t2_sum += t2;
            t3_sum += count_f * (count_f - 1.0) * (count_f - 2.0);
        }
    }

    for &count in tie_groups_y.values() {
        if count > 1 {
            let count_f = count as f64;
            vu += count_f * (count_f - 1.0) * (2.0 * count_f + 5.0);
            let u2 = count_f * (count_f - 1.0);
            u2_sum += u2;
            u3_sum += count_f * (count_f - 1.0) * (count_f - 2.0);
        }
    }

    let mut _variance = (v0 - vt - vu) / 18.0;
    if n > 2 {
        _variance += (t2_sum * u2_sum) / (2.0 * n_f * (n_f - 1.0));
        _variance += (t3_sum * u3_sum) / (9.0 * n_f * (n_f - 1.0) * (n_f - 2.0));
    }

    // Check if we have ties
    let _has_ties = ties_x > 0 || ties_y > 0 || ties_xy > 0;

    // Follow R's exact logic: exact for small samples without ties, asymptotic otherwise
    let (test_statistic, statistic_name, p_value) = if n < 50 && !_has_ties {
        // Exact test: use T statistic like R
        // R: q <- round((r + 1) * n * (n - 1) / 4)
        let q = ((tau + 1.0) * n_f * (n_f - 1.0) / 4.0).round();
        
        let p = match alternative {
            AlternativeType::TwoSided => {
                let expected = n_f * (n_f - 1.0) / 4.0;
                let p_raw = if q > expected {
                    1.0 - pkendall(q - 1.0, n as i32)
                } else {
                    pkendall(q, n as i32)
                };
                (2.0 * p_raw).min(1.0)
            },
            AlternativeType::Greater => 1.0 - pkendall(q - 1.0, n as i32),
            AlternativeType::Less => pkendall(q, n as i32),
        };
        
        (q, TestStatisticName::SStatistic.as_str().to_string(), p)
    } else {
        // Asymptotic test: use R's approach with S statistic and z-score
        // R: S <- r * sqrt((T0 - T1) * (T0 - T2)) where T0 = n*(n-1)/2
        let t0 = n_f * (n_f - 1.0) / 2.0;
        let t1 = t2_sum / 2.0;  // sum of x ties
        let t2 = u2_sum / 2.0;  // sum of y ties
        let s = tau * ((t0 - t1) * (t0 - t2)).sqrt();
        
        // R's variance calculation with all tie corrections
        let v0 = n_f * (n_f - 1.0) * (2.0 * n_f + 5.0);
        let v1 = t2_sum * u2_sum;  // sum(xties*(xties-1)) * sum(yties*(yties-1))
        let v2 = t3_sum * u3_sum;  // more complex tie correction
        
        let var_s = (v0 - vt - vu) / 18.0 + 
                   v1 / (2.0 * n_f * (n_f - 1.0)) + 
                   v2 / (9.0 * n_f * (n_f - 1.0) * (n_f - 2.0));
        
        let z = s / var_s.sqrt();
        
        let p = match alternative {
            AlternativeType::TwoSided => 2.0 * (1.0 - normal::pnorm(z.abs(), 0.0, 1.0, true, false)),
            AlternativeType::Greater => 1.0 - normal::pnorm(z, 0.0, 1.0, true, false),
            AlternativeType::Less => normal::pnorm(z, 0.0, 1.0, true, false),
        };
        
        (z, TestStatisticName::ZStatistic.as_str().to_string(), p)
    };

    Ok(KendallCorrelationTestResult {
        test_statistic: TestStatistic {
            value: test_statistic,
            name: statistic_name,
        },
        p_value,
        test_name: "Kendall's rank correlation tau".to_string(), // Match R's method name
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN, // TODO: Implement CI for correlation
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        effect_size: EffectSize {
            value: tau,
            name: EffectSizeType::KendallsTau.as_str().to_string(),
        },
        alternative: alternative.as_str().to_string(),
    })
}
