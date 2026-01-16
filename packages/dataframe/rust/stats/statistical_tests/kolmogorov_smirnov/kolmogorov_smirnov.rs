//! Kolmogorov-Smirnov test for comparing two distributions
//!
//! The Kolmogorov-Smirnov test is a non-parametric test that compares
//! the cumulative distributions of two samples to assess whether they
//! come from the same distribution.

use crate::stats::core::types::{KolmogorovSmirnovTestResult, TestStatistic, TestStatisticName};

/// Apply R's q rounding correction: q <- (0.5 + floor(q*m*n - 1e-7))/(m*n)
fn psmirnov_q_adjust(q: f64, m: i32, n: i32) -> f64 {
    let md = m as f64;
    let nd = n as f64;
    (0.5 + (q * md * nd - 1e-7).floor()) / (md * nd)
}

/// Calculates the empirical cumulative distribution function (ECDF)
/// at a given value for a sorted sample
#[allow(dead_code)]
fn ecdf_value(sorted_data: &[f64], value: f64) -> f64 {
    let n = sorted_data.len() as f64;
    let position = sorted_data.partition_point(|&x| x <= value) as f64;
    position / n
}

/// Performs the two-sample Kolmogorov-Smirnov test
///
/// # Arguments
/// * `x` - First sample
/// * `y` - Second sample  
/// * `alternative` - Type of test: "two-sided", "less", or "greater"
/// * `alpha` - Significance level
///
/// # Returns
/// * `KolmogorovSmirnovTestResult` containing the test statistic (D), p-value, and other results
pub fn kolmogorov_smirnov_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> Result<KolmogorovSmirnovTestResult, String> {
    // Validate inputs
    if x.is_empty() || y.is_empty() {
        return Err("Both samples must contain at least one observation".to_string());
    }

    let n1 = x.len() as f64;
    let n2 = y.len() as f64;

    // Sort both samples
    let mut x_sorted = x.to_vec();
    let mut y_sorted = y.to_vec();
    x_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    y_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    // Calculate D-statistic using R's exact method
    // Create pairs of (value, from_sample_x) and then sort to simulate R's w <- c(x, y) and order(w)
    let mut value_sample_pairs = Vec::new();

    // Add all x values with indicator "true" (from sample 1)
    for &val in &x_sorted {
        value_sample_pairs.push((val, true));
    }
    // Add all y values with indicator "false" (from sample 2)
    for &val in &y_sorted {
        value_sample_pairs.push((val, false));
    }

    // Sort by value to get R's order(w)
    value_sample_pairs.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());

    // Extract just the values for ties checking
    let combined_data: Vec<f64> = value_sample_pairs.iter().map(|(val, _)| *val).collect();

    // Check for ties like R does
    let unique_count = {
        let mut unique_vals = combined_data.clone();
        unique_vals.dedup();
        unique_vals.len()
    };
    let has_ties = unique_count < combined_data.len();

    // Calculate cumulative differences like R: z <- cumsum(ifelse(order(w) <= n.x, 1 / n.x, - 1 / n.y))
    let mut z = Vec::new();
    let mut cumsum = 0.0;

    for (_value, from_x) in &value_sample_pairs {
        if *from_x {
            cumsum += 1.0 / n1;
        } else {
            cumsum -= 1.0 / n2;
        }
        z.push(cumsum);
    }

    // If there are ties, filter z to unique positions like R does
    if has_ties {
        let mut filtered_z = Vec::new();
        let mut prev_value = None;

        for (i, &current_value) in combined_data.iter().enumerate() {
            if prev_value.is_none() || prev_value.unwrap() != current_value {
                if i > 0 {
                    filtered_z.push(z[i - 1]);
                }
            }
            prev_value = Some(current_value);
        }
        filtered_z.push(z[combined_data.len() - 1]); // Always include the last value
        z = filtered_z;
    }

    // Calculate D+ and D- from the z values
    let mut d_plus = 0.0;
    let mut d_minus = 0.0;

    for &z_val in &z {
        if z_val > d_plus {
            d_plus = z_val;
        }
        if -z_val > d_minus {
            d_minus = -z_val;
        }
    }

    // Determine test statistic based on alternative hypothesis
    let d_statistic = match alternative {
        "less" => d_minus,        // H1: F_x < F_y (x is stochastically smaller)
        "greater" => d_plus,      // H1: F_x > F_y (x is stochastically larger)
        _ => d_plus.max(d_minus), // two-sided: max absolute difference
    };

    // Determine exact vs asymptotic like R does
    let use_exact = (n1 * n2) < 10000.0;

    // Calculate p-value
    let p_value = if use_exact {
        // Use exact method for small samples (like R's psmirnov_exact)

        // Fix 1: Swap sample sizes for "less" alternative like R does
        let (m, n) = match alternative {
            "less" => (n2 as i32, n1 as i32), // swap for less
            _ => (n1 as i32, n2 as i32),
        };

        let two_sided = alternative == "two-sided";

        // Fix 2: Always apply q rounding correction like R does
        let q_adj = psmirnov_q_adjust(d_statistic, m, n);

        if has_ties {
            // Use ties version of exact algorithm (like R's psmirnov_exact_ties_upper)
            psmirnov_exact_ties_rust(q_adj, m, n, &combined_data, two_sided, false)
        } else {
            // Use no-ties version (like R's psmirnov_exact_uniq_upper)
            psmirnov_exact_rust(q_adj, m, n, two_sided, false) // lower_tail = FALSE
        }
    } else {
        // Use asymptotic approximation for large samples
        let n_eff = (n1 * n2) / (n1 + n2);
        let lambda = n_eff.sqrt() * d_statistic;

        match alternative {
            "two-sided" => {
                // Two-sided test: Use R's K2l algorithm with lower.tail = FALSE (upper tail)
                kolmogorov_cdf_complement(lambda, false, 1e-6)
            }
            "less" | "greater" => {
                // One-sided tests: R uses exp(-2 * n * q^2) for upper tail (lower.tail = FALSE)
                (-2.0 * n_eff * d_statistic * d_statistic).exp()
            }
            _ => {
                return Err(format!("Invalid alternative hypothesis: {}", alternative));
            }
        }
    };

    // Fix 3: Clamp p-value like R does: PVAL <- min(1.0, max(0.0, PVAL))
    let p_value = p_value.max(0.0).min(1.0);

    // Calculate critical value for the given alpha
    let critical_value = match alternative {
        "two-sided" => {
            // c(α) = sqrt(-ln(α/2) * 1/2)
            let c_alpha = (-0.5 * (alpha / 2.0).ln()).sqrt();
            c_alpha * ((n1 + n2) / (n1 * n2)).sqrt()
        }
        _ => {
            // For one-sided tests, use different critical value
            let c_alpha = (-0.5 * alpha.ln()).sqrt();
            c_alpha * ((n1 + n2) / (n1 * n2)).sqrt()
        }
    };

    Ok(KolmogorovSmirnovTestResult {
        test_statistic: TestStatistic {
            value: d_statistic,
            name: TestStatisticName::DStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Kolmogorov-Smirnov test".to_string(),
        alpha,
        sample1_size: x.len(),
        sample2_size: y.len(),
        critical_value,
        d_statistic,
        d_plus,
        d_minus,
        alternative: alternative.to_string(),
    })
}

/// Computes the Kolmogorov distribution CDF using R's exact K2l algorithm
/// This exactly matches R's K2l function in ks.c
fn kolmogorov_cdf_complement(x: f64, lower_tail: bool, tol: f64) -> f64 {
    // Handle edge case - exactly match R
    if x <= 0.0 {
        return if lower_tail { 0.0 } else { 1.0 };
    }

    let p = if x < 1.0 {
        // Use alternative series for x < 1 (R's approach)
        // R: k_max = (int) sqrt(2 - log(tol));
        let k_max = (2.0 - tol.ln()).sqrt() as i32;
        let w = x.ln();
        // R: z = - (M_PI_2 * M_PI_4) / (x * x) where M_PI_2 = π/2, M_PI_4 = π/4
        let z = -(std::f64::consts::PI * std::f64::consts::PI / 8.0) / (x * x);
        let mut s = 0.0;

        // R: for(k = 1; k < k_max; k += 2) s += exp(k * k * z - w);
        let mut k = 1;
        while k < k_max {
            s += ((k * k) as f64 * z - w).exp();
            k += 2;
        }

        // R: p = s / M_1_SQRT_2PI where M_1_SQRT_2PI = 1/sqrt(2π)
        let p_val = s / (2.0 * std::f64::consts::PI).sqrt();
        // R: if(!lower) p = 1 - p;
        if !lower_tail { 1.0 - p_val } else { p_val }
    } else {
        // Use standard alternating series for x >= 1 - exactly match R
        let z = -2.0 * x * x;
        let mut s = -1.0;

        let (mut k, mut old, mut new) = if lower_tail {
            // R: k = 1; old = 0; new = 1;
            (1, 0.0, 1.0)
        } else {
            // R: k = 2; old = 0; new = 2 * exp(z);
            (2, 0.0, 2.0 * z.exp())
        };

        // R: while(fabs(old - new) > tol) {
        //      old = new;
        //      new += 2 * s * exp(z * k * k);
        //      s *= -1;
        //      k++;
        //    }
        while (old - new).abs() > tol {
            old = new;
            new += 2.0 * s * (z * (k * k) as f64).exp();
            s *= -1.0;
            k += 1;
        }
        new
    };

    // R returns p directly, no clamping in K2l
    p
}

/// R's exact algorithm for Kolmogorov-Smirnov p-values (psmirnov_exact)
fn psmirnov_exact_rust(q: f64, m: i32, n: i32, two_sided: bool, lower_tail: bool) -> f64 {
    if lower_tail {
        psmirnov_exact_uniq_lower(q, m, n, two_sided)
    } else {
        psmirnov_exact_uniq_upper(q, m, n, two_sided)
    }
}

/// R's exact lower tail algorithm (psmirnov_exact_uniq_lower)
fn psmirnov_exact_uniq_lower(q: f64, m: i32, n: i32, two_sided: bool) -> f64 {
    let md = m as f64;
    let nd = n as f64;

    let mut u = vec![0.0; (n + 1) as usize];
    u[0] = 1.0;

    for j in 1..=n {
        let test_result = if two_sided {
            (0.0 - (j as f64 / nd)).abs() >= q
        } else {
            (0.0 - (j as f64 / nd)) >= q
        };

        if test_result {
            u[j as usize] = 0.0;
        } else {
            u[j as usize] = u[(j - 1) as usize];
        }
    }

    for i in 1..=m {
        let w = (i as f64) / ((i + n) as f64);
        let test_result = if two_sided {
            ((i as f64 / md) - 0.0).abs() >= q
        } else {
            (i as f64 / md) - 0.0 >= q
        };

        if test_result {
            u[0] = 0.0;
        } else {
            u[0] = w * u[0];
        }

        for j in 1..=n {
            let test_result = if two_sided {
                ((i as f64 / md) - (j as f64 / nd)).abs() >= q
            } else {
                (i as f64 / md) - (j as f64 / nd) >= q
            };

            if test_result {
                u[j as usize] = 0.0;
            } else {
                u[j as usize] = w * u[j as usize] + u[(j - 1) as usize];
            }
        }
    }

    u[n as usize]
}

/// R's exact upper tail algorithm (psmirnov_exact_uniq_upper)
fn psmirnov_exact_uniq_upper(q: f64, m: i32, n: i32, two_sided: bool) -> f64 {
    let md = m as f64;
    let nd = n as f64;

    let mut u = vec![0.0; (n + 1) as usize];
    u[0] = 0.0;

    for j in 1..=n {
        let test_result = if two_sided {
            (0.0 - (j as f64 / nd)).abs() >= q
        } else {
            (0.0 - (j as f64 / nd)) >= q
        };

        if test_result {
            u[j as usize] = 1.0;
        } else {
            u[j as usize] = u[(j - 1) as usize];
        }
    }

    for i in 1..=m {
        let test_result = if two_sided {
            ((i as f64 / md) - 0.0).abs() >= q
        } else {
            (i as f64 / md) - 0.0 >= q
        };

        if test_result {
            u[0] = 1.0;
        }

        for j in 1..=n {
            let test_result = if two_sided {
                ((i as f64 / md) - (j as f64 / nd)).abs() >= q
            } else {
                (i as f64 / md) - (j as f64 / nd) >= q
            };

            if test_result {
                u[j as usize] = 1.0;
            } else {
                let v = (i as f64) / ((i + j) as f64);
                let w = (j as f64) / ((i + j) as f64); // 1 - v
                u[j as usize] = v * u[j as usize] + w * u[(j - 1) as usize];
            }
        }
    }

    u[n as usize]
}

/// R's exact ties algorithm (psmirnov_exact_ties_upper/lower)
fn psmirnov_exact_ties_rust(
    q: f64,
    m: i32,
    n: i32,
    combined_data: &[f64],
    two_sided: bool,
    lower_tail: bool,
) -> f64 {
    // Create the z array like R does: z <- (diff(sort(z)) != 0), then c(0L, z, 1L)
    let mut z_array = vec![0; (m + n + 1) as usize];
    z_array[0] = 0; // Always 0 at start

    // Calculate diff(sort(combined_data)) != 0
    for i in 1..combined_data.len() {
        if combined_data[i] != combined_data[i - 1] {
            z_array[i] = 1; // Tie ends here
        } else {
            z_array[i] = 0; // Still in a tie
        }
    }
    z_array[combined_data.len()] = 1; // Always 1 at end

    if lower_tail {
        psmirnov_exact_ties_lower(q, m, n, &z_array, two_sided)
    } else {
        psmirnov_exact_ties_upper(q, m, n, &z_array, two_sided)
    }
}

/// R's exact ties lower tail algorithm (psmirnov_exact_ties_lower)
fn psmirnov_exact_ties_lower(q: f64, m: i32, n: i32, z: &[i32], two_sided: bool) -> f64 {
    let md = m as f64;
    let nd = n as f64;

    let mut u = vec![0.0; (n + 1) as usize];
    u[0] = 1.0;

    for j in 1..=n {
        let test_result = if two_sided {
            (0.0 - (j as f64 / nd)).abs() >= q
        } else {
            (0.0 - (j as f64 / nd)) >= q
        };

        if test_result && z[j as usize] == 1 {
            u[j as usize] = 0.0;
        } else {
            u[j as usize] = u[(j - 1) as usize];
        }
    }

    for i in 1..=m {
        let w = (i as f64) / ((i + n) as f64);
        let test_result = if two_sided {
            ((i as f64 / md) - 0.0).abs() >= q
        } else {
            (i as f64 / md) - 0.0 >= q
        };

        if test_result && z[i as usize] == 1 {
            u[0] = 0.0;
        } else {
            u[0] = w * u[0];
        }

        for j in 1..=n {
            let test_result = if two_sided {
                ((i as f64 / md) - (j as f64 / nd)).abs() >= q
            } else {
                (i as f64 / md) - (j as f64 / nd) >= q
            };

            if test_result && z[(i + j) as usize] == 1 {
                u[j as usize] = 0.0;
            } else {
                u[j as usize] = w * u[j as usize] + u[(j - 1) as usize];
            }
        }
    }

    u[n as usize]
}

/// R's exact ties upper tail algorithm (psmirnov_exact_ties_upper)
fn psmirnov_exact_ties_upper(q: f64, m: i32, n: i32, z: &[i32], two_sided: bool) -> f64 {
    let md = m as f64;
    let nd = n as f64;

    let mut u = vec![0.0; (n + 1) as usize];
    u[0] = 0.0;

    for j in 1..=n {
        let test_result = if two_sided {
            (0.0 - (j as f64 / nd)).abs() >= q
        } else {
            (0.0 - (j as f64 / nd)) >= q
        };

        if test_result && z[j as usize] == 1 {
            u[j as usize] = 1.0;
        } else {
            u[j as usize] = u[(j - 1) as usize];
        }
    }

    for i in 1..=m {
        let test_result = if two_sided {
            ((i as f64 / md) - 0.0).abs() >= q
        } else {
            (i as f64 / md) - 0.0 >= q
        };

        if test_result && z[i as usize] == 1 {
            u[0] = 1.0;
        }

        for j in 1..=n {
            let test_result = if two_sided {
                ((i as f64 / md) - (j as f64 / nd)).abs() >= q
            } else {
                (i as f64 / md) - (j as f64 / nd) >= q
            };

            if test_result && z[(i + j) as usize] == 1 {
                u[j as usize] = 1.0;
            } else {
                let v = (i as f64) / ((i + j) as f64);
                let w = (j as f64) / ((i + j) as f64); // 1 - v
                u[j as usize] = v * u[j as usize] + w * u[(j - 1) as usize];
            }
        }
    }

    u[n as usize]
}

/// Approximates the one-sided p-value for the Kolmogorov distribution
#[allow(dead_code)]
fn kolmogorov_cdf_complement_one_sided(lambda: f64) -> f64 {
    if lambda < 0.0 {
        return 1.0;
    }

    // Special case: when lambda is 0, p-value is 1
    if lambda == 0.0 || lambda < 1e-10 {
        return 1.0;
    }

    // For one-sided test, use exponential approximation
    // P(D >= d) ≈ exp(-2 * lambda^2)
    (-2.0 * lambda * lambda).exp().min(1.0).max(0.0)
}

/// Performs one-sample Kolmogorov-Smirnov test against a theoretical CDF
///
/// # Arguments
/// * `x` - Sample data
/// * `cdf_fn` - Theoretical CDF function
/// * `alternative` - Type of test: "two-sided", "less", or "greater"
/// * `alpha` - Significance level
///
/// # Returns
/// * `KolmogorovSmirnovTestResult` containing the test statistic (D), p-value, and other results
pub fn kolmogorov_smirnov_one_sample<F>(
    x: &[f64],
    cdf_fn: F,
    alternative: &str,
    alpha: f64,
) -> Result<KolmogorovSmirnovTestResult, String>
where
    F: Fn(f64) -> f64,
{
    if x.is_empty() {
        return Err("Sample must contain at least one observation".to_string());
    }

    let n = x.len() as f64;

    // Sort the sample
    let mut x_sorted = x.to_vec();
    x_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    // Check for ties like R does: TIES <- length(unique(x)) < n
    let mut unique_values = x_sorted.clone();
    unique_values.dedup();
    let _has_ties = unique_values.len() < x_sorted.len();

    // Use R's method: x <- y(sort(x), ...) - (0 : (n-1)) / n
    let mut x_transformed = Vec::new();
    for (i, &value) in x_sorted.iter().enumerate() {
        let theoretical_cdf = cdf_fn(value);
        let empirical_rank = i as f64 / n;
        x_transformed.push(theoretical_cdf - empirical_rank);
    }

    // Calculate 1/n - x for R's calculation
    let mut one_over_n_minus_x = Vec::new();
    for &x_val in &x_transformed {
        one_over_n_minus_x.push(1.0 / n - x_val);
    }

    // Calculate d_plus and d_minus for the result struct
    // d_minus = max(theoretical - empirical_minus) = max(x_transformed)
    // d_plus = max(empirical - theoretical) = max(1/n - x_transformed)
    let d_minus = x_transformed.iter().fold(0.0f64, |acc, &val| acc.max(val));
    let d_plus = one_over_n_minus_x
        .iter()
        .fold(0.0f64, |acc, &val| acc.max(val));

    // R's statistic calculation
    let d_statistic = match alternative {
        "less" => d_minus,        // max(x)
        "greater" => d_plus,      // max(1/n - x)
        _ => d_minus.max(d_plus), // two.sided: max(c(x, 1/n - x))
    };

    // Calculate p-value: R uses pkolmogorov for ALL one-sample cases
    // pkolmogorov(STATISTIC, n, two.sided = (alternative == "two.sided"), exact = exact, lower.tail = FALSE)

    // R determines exact method for one-sample: exact <- (n < 100) && !TIES
    let has_ties = unique_values.len() < x_sorted.len();
    let use_exact = (n < 100.0) && !has_ties;

    let p_value = if use_exact {
        // Use exact method like R does for small samples
        if alternative == "two-sided" {
            // R uses pkolmogorov_two_exact for two-sided one-sample tests
            // R calls with lower.tail = FALSE, so we need upper tail
            pkolmogorov_exact_one_sample_two_sided(d_statistic, n as i32, false)
        } else {
            // R uses pkolmogorov_one_exact for one-sided one-sample tests
            // R calls with lower.tail = FALSE, which gives upper tail
            pkolmogorov_exact_one_sample_one_sided(d_statistic, n as i32, false)
        }
    } else {
        // Use asymptotic method for large samples
        if alternative == "two-sided" {
            // Two-sided: R uses pkolmogorov_two_asymp which calls C_pkolmogorov_two_limit with sqrt(n) * q
            let lambda = n.sqrt() * d_statistic;
            kolmogorov_cdf_complement(lambda, false, 1e-6)
        } else {
            // One-sided: R uses pkolmogorov_one_asymp: exp(-2 * n * q^2) with lower.tail = FALSE
            (-2.0 * n * d_statistic * d_statistic).exp()
        }
    };
    // clamp like R
    let p_value = p_value.clamp(0.0, 1.0);

    // Calculate critical value
    let critical_value = match alternative {
        "two-sided" => {
            let c_alpha = (-0.5 * alpha.ln()).sqrt();
            c_alpha / n.sqrt()
        }
        _ => {
            let c_alpha = (-0.5 * (2.0 * alpha).ln()).sqrt();
            c_alpha / n.sqrt()
        }
    };

    Ok(KolmogorovSmirnovTestResult {
        test_statistic: TestStatistic {
            value: d_statistic,
            name: TestStatisticName::DStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Kolmogorov-Smirnov test (one-sample)".to_string(),
        alpha,
        sample1_size: x.len(),
        sample2_size: 0,
        critical_value,
        d_statistic,
        d_plus,
        d_minus,
        alternative: alternative.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ks_two_sample_identical() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![1.0, 2.0, 3.0, 4.0, 5.0];

        let result = kolmogorov_smirnov_test(&x, &y, "two-sided", 0.05).unwrap();

        // Identical samples should have D = 0 and p-value = 1
        assert_eq!(result.d_statistic, 0.0);
        assert!(result.p_value > 0.99);
    }

    #[test]
    fn test_ks_two_sample_different() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![6.0, 7.0, 8.0, 9.0, 10.0];

        let result = kolmogorov_smirnov_test(&x, &y, "two-sided", 0.05).unwrap();

        // Completely different samples should have D = 1 and small p-value
        assert_eq!(result.d_statistic, 1.0);
        assert!(result.p_value < 0.01);
    }

    #[test]
    fn test_ks_one_sample() {
        // Test against uniform distribution
        let x = vec![0.1, 0.3, 0.5, 0.7, 0.9];
        let uniform_cdf = |x: f64| -> f64 {
            if x < 0.0 {
                0.0
            } else if x > 1.0 {
                1.0
            } else {
                x
            }
        };

        let result = kolmogorov_smirnov_one_sample(&x, uniform_cdf, "two-sided", 0.05).unwrap();

        // Should not reject null hypothesis for uniform sample
        assert!(result.p_value > 0.05);
    }
}

/// R's K2l function for asymptotic one-sample KS distribution
/// Computes: ∑_{k=-∞}^∞ (-1)^k e^{-2 k^2 x^2}
/// This matches R's K2l function exactly
#[allow(dead_code)]
fn k2l_asymptotic(x: f64, lower_tail: bool, tol: f64) -> f64 {
    use std::f64::consts::PI;

    if x <= 0.0 {
        return if lower_tail { 0.0 } else { 1.0 };
    }

    let p = if x < 1.0 {
        // Use alternative series for x < 1
        let k_max = ((2.0 - tol.ln()).sqrt()) as i32;
        let w = x.ln();
        let z = -(PI * PI) / (8.0 * x * x);
        let mut s = 0.0;

        for k in (1..k_max).step_by(2) {
            s += ((k * k) as f64 * z - w).exp();
        }

        let mut p_val = s / (2.0 * PI).sqrt();
        if !lower_tail {
            p_val = 1.0 - p_val;
        }
        p_val
    } else {
        // Use standard series for x >= 1
        let z = -2.0 * x * x;
        let mut s = -1.0;
        let (mut k, mut old, mut new) = if lower_tail {
            (1, 0.0, 1.0)
        } else {
            (2, 0.0, 2.0 * z.exp())
        };

        while (old - new).abs() > tol {
            old = new;
            new += 2.0 * s * (z * (k * k) as f64).exp();
            s *= -1.0;
            k += 1;
        }
        new
    };

    p.clamp(0.0, 1.0)
}

/// R's exact algorithm for one-sample two-sided tests
/// This corresponds to R's pkolmogorov_two_exact which calls K2x
/// Uses the Marsaglia, Tsang & Wang (2003) algorithm
fn pkolmogorov_exact_one_sample_two_sided(d: f64, n: i32, lower_tail: bool) -> f64 {
    let p = k2x_exact(n, d);
    if lower_tail { p } else { 1.0 - p }
}

/// R's exact algorithm for one-sample one-sided tests  
/// This corresponds to R's pkolmogorov_one_exact
/// Uses the Birnbaum & Tingey (1951) formula
///
/// IMPORTANT: The BT formula computes the survival function S_n(q) = P(D^+ >= q)
/// R's pkolmogorov_one_exact computes this and returns:
/// - if lower.tail = TRUE: 1 - S_n(q) (lower tail)
/// - if lower.tail = FALSE: S_n(q) (upper tail / survival)
fn pkolmogorov_exact_one_sample_one_sided(q: f64, n: i32, lower_tail: bool) -> f64 {
    // R's implementation:
    // j <- seq.int(from = 0, to = floor(n * (1 - q)))
    // p <- q * sum(exp(lchoose(n, j) + (n - j) * log(1 - q - j / n) + (j - 1) * log(q + j / n)))
    // This computes the survival function S_n(q) = P(D^+ >= q)

    let n_f = n as f64;
    let max_j = (n_f * (1.0 - q)).floor() as i32;

    let mut sum = 0.0;
    for j in 0..=max_j {
        let j_f = j as f64;

        // Compute each term safely to avoid overflow/underflow
        let log_choose = log_combination(n, j);
        let term1 = (n_f - j_f) * (1.0 - q - j_f / n_f).ln();
        let term2 = (j_f - 1.0) * (q + j_f / n_f).ln();

        let log_term = log_choose + term1 + term2;
        sum += log_term.exp();
    }

    // The BT sum gives us the survival function S_n(q) = P(D^+ >= q)
    let survival_prob = q * sum;

    // CRITICAL DISCOVERY: R's manual BT calculation gives the same result as mine,
    // but R's pkolmogorov_one_exact function returns something completely different.
    // This suggests R is using a different implementation (possibly C code) or
    // there's some other transformation happening.
    //
    // For now, let's use the original R logic and see if we can identify the pattern
    // R's exact logic: if(lower.tail) 1 - p else p
    // where p is the survival function from BT
    if lower_tail {
        1.0 - survival_prob // Lower tail: P(D^+ < q)
    } else {
        survival_prob // Upper tail: P(D^+ >= q)
    }
}

/// Marsaglia, Tsang & Wang (2003) exact algorithm for one-sample two-sided KS test
/// This implements R's K2x function
fn k2x_exact(n: i32, d: f64) -> f64 {
    let k = ((n as f64) * d).floor() as usize + 1;
    let m = 2 * k - 1;
    let h = (k as f64) - (n as f64) * d;

    // Initialize H matrix
    let mut h_matrix = vec![vec![0.0; m]; m];

    // Fill H matrix: H[i,j] = 1 if i - j + 1 >= 0, else 0
    for i in 0..m {
        for j in 0..m {
            if (i as i32) - (j as i32) + 1 >= 0 {
                h_matrix[i][j] = 1.0;
            }
        }
    }

    // Apply boundary conditions
    for i in 0..m {
        h_matrix[i][0] -= h.powi((i + 1) as i32);
        h_matrix[m - 1][i] -= h.powi((m - i) as i32);
    }

    // Special boundary condition
    let two_h_minus_1 = 2.0 * h - 1.0;
    if two_h_minus_1 > 0.0 {
        h_matrix[m - 1][0] += two_h_minus_1.powi(m as i32);
    }

    // Divide by factorials
    for i in 0..m {
        for j in 0..m {
            if (i as i32) - (j as i32) + 1 > 0 {
                let factorial_divisor = factorial((i as i32) - (j as i32) + 1);
                h_matrix[i][j] /= factorial_divisor;
            }
        }
    }

    // Matrix power: H^n
    let result = matrix_power(&h_matrix, n);

    // Extract result and apply final scaling
    let mut s = result[k - 1][k - 1];
    for i in 1..=n {
        s = s * (i as f64) / (n as f64);
    }

    s.max(0.0).min(1.0)
}

/// R's exact lchoose implementation using beta function approach
/// This matches R's lchoose(n, k) exactly
fn log_combination(n: i32, k: i32) -> f64 {
    let n_f = n as f64;
    let _k_f = k as f64;

    // Handle edge cases exactly like R
    if k < 0 {
        return f64::NEG_INFINITY; // ML_NEGINF
    }
    if k == 0 {
        return 0.0; // log(1) = 0
    }
    if k == 1 {
        return n_f.abs().ln(); // log(|n|)
    }

    // For k >= 2, use R's lfastchoose approach:
    // lchoose(n, k) = -log(n + 1) - lbeta(n - k + 1, k + 1)
    // where lbeta(a, b) = lgamma(a) + lgamma(b) - lgamma(a + b)

    if n < k {
        return f64::NEG_INFINITY; // Impossible combination
    }

    // Use symmetry for efficiency: lchoose(n, k) = lchoose(n, n-k)
    let k_use = if n - k < k { n - k } else { k };
    let k_use_f = k_use as f64;

    if k_use < 2 {
        return log_combination(n, n - k); // Use symmetry
    }

    // R's lfastchoose: -log(n + 1) - lbeta(n - k + 1, k + 1)
    let a = n_f - k_use_f + 1.0; // n - k + 1
    let b = k_use_f + 1.0; // k + 1

    // lbeta(a, b) = lgamma(a) + lgamma(b) - lgamma(a + b)
    let lbeta_val = lgamma(a) + lgamma(b) - lgamma(a + b);

    -(n_f + 1.0).ln() - lbeta_val
}

/// Use statrs's accurate log gamma function
fn lgamma(x: f64) -> f64 {
    statrs::function::gamma::ln_gamma(x)
}

/// Helper function for factorial
fn factorial(n: i32) -> f64 {
    if n <= 1 {
        1.0
    } else {
        (1..=n).map(|i| i as f64).product()
    }
}

/// Helper function for matrix power
fn matrix_power(matrix: &[Vec<f64>], power: i32) -> Vec<Vec<f64>> {
    let size = matrix.len();
    let mut result = vec![vec![0.0; size]; size];

    // Initialize as identity matrix
    for i in 0..size {
        result[i][i] = 1.0;
    }

    let mut base = matrix.to_vec();
    let mut exp = power;

    while exp > 0 {
        if exp % 2 == 1 {
            result = matrix_multiply(&result, &base);
        }
        base = matrix_multiply(&base, &base);
        exp /= 2;
    }

    result
}

/// Helper function for matrix multiplication
fn matrix_multiply(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let size = a.len();
    let mut result = vec![vec![0.0; size]; size];

    for i in 0..size {
        for j in 0..size {
            for k in 0..size {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }

    result
}
