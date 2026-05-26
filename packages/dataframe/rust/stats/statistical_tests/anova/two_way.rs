use super::super::super::core::types::{
    AnovaTableComponent, AnovaTestComponent, EffectSize, EffectSizeType, OneWayAnovaTestResult,
    TestStatistic, TestStatisticName, TwoWayAnovaTestResult,
};
use super::super::super::core::{TailType, calculate_p, eta_squared};
use crate::stats::regression::family::GaussianFamily;
use crate::stats::regression::glm::glm_fit_core::glm_fit;
use crate::stats::regression::glm::types_control::GlmControl;
use statrs::distribution::FisherSnedecor;

/// Compute Type I sequential sums-of-squares for `~ A + B + A:B` via
/// `glm_fit`'s QR effects (matches R `aov(y ~ A * B) |> summary()`).
///
/// Returns `(ss_a, ss_b, ss_ab)`. The error SS is computed separately
/// (within-cell variation) and the total SS is recovered as the sum.
///
/// Design matrix uses treatment contrasts (R default `contr.treatment`):
/// intercept, (a-1) A indicators (level 0 = reference, levels 1..a-1 each get
/// their own 0/1 column), (b-1) B indicators, (a-1)*(b-1) interaction columns.
/// Type I SS is contrast-invariant — see R `aov.R` line 348 (`sum(effects[i,]^2)`
/// where `effects` are the elements of `Q' y` corresponding to columns of each
/// term in the QR decomposition).
fn type_i_ss(
    data: &[Vec<Vec<f64>>],
    a_levels: usize,
    b_levels: usize,
    total_n: usize,
) -> Result<(f64, f64, f64), String> {
    let n = total_n;
    // Number of design-matrix columns: 1 + (a-1) + (b-1) + (a-1)(b-1) = a * b.
    let p_a = a_levels - 1;
    let p_b = b_levels - 1;
    let p_ab = p_a * p_b;
    let p = 1 + p_a + p_b + p_ab;

    // assign[col] -> term id: 0 intercept, 1 A, 2 B, 3 AB.
    // Column order: [intercept, A1..A(a-1), B1..B(b-1), (A:B) row-major over (a-1)*(b-1)].
    let mut assign: Vec<usize> = Vec::with_capacity(p);
    assign.push(0);
    for _ in 0..p_a {
        assign.push(1);
    }
    for _ in 0..p_b {
        assign.push(2);
    }
    for _ in 0..p_ab {
        assign.push(3);
    }

    // Build x as row-major Vec<Vec<f64>> per glm_fit's expected layout (x[row][col]).
    let mut x: Vec<Vec<f64>> = Vec::with_capacity(n);
    let mut y: Vec<f64> = Vec::with_capacity(n);
    for (i_a, a_level) in data.iter().enumerate() {
        for (i_b, cell_data) in a_level.iter().enumerate() {
            for &obs in cell_data {
                y.push(obs);
                let mut row = vec![0.0; p];
                row[0] = 1.0; // intercept
                // A indicators: column for i_a is 1 when i_a == k+1 (k = 0..p_a-1).
                if i_a > 0 && i_a <= p_a {
                    row[1 + (i_a - 1)] = 1.0;
                }
                // B indicators
                if i_b > 0 && i_b <= p_b {
                    row[1 + p_a + (i_b - 1)] = 1.0;
                }
                // A:B interactions (product of the two indicator columns)
                if i_a > 0 && i_b > 0 && i_a <= p_a && i_b <= p_b {
                    let interaction_offset = 1 + p_a + p_b;
                    row[interaction_offset + (i_a - 1) * p_b + (i_b - 1)] = 1.0;
                }
                x.push(row);
            }
        }
    }

    // Fit Gaussian/identity; one IRLS iteration suffices, glm_fit will return
    // `effects` as the QR-decomposed Q' y for the (pivoted) design matrix.
    let fit = glm_fit(
        x,
        y,
        None,
        None,
        None,
        None,
        None,
        Box::new(GaussianFamily::identity()),
        GlmControl::default(),
        true,
        None,
    )?;

    // Type I SS per term = sum(effects[j]^2 for j where the j-th pivoted column
    // belongs to that term). `effects` is `Q' y` of length n; the first `rank`
    // entries correspond to the basis columns in pivoted order.
    //
    // glm_fit's `qr.pivot` is 1-indexed (R/Fortran convention — see L443 of
    // glm_fit_core.rs which exposes the raw LINPACK pivot without the -1 shift).
    // Convert to 0-indexed here.
    let pivot_1based: &Vec<usize> = &fit.qr.pivot;
    let effects = &fit.effects;

    let mut ss_by_term = [0.0_f64; 4]; // [intercept, A, B, AB]
    let rank = fit.qr_rank.min(effects.len());
    for j in 0..rank {
        // The j-th effect corresponds to the j-th pivoted column.
        let orig_col_1based = pivot_1based[j];
        if orig_col_1based == 0 {
            continue;
        }
        let orig_col = orig_col_1based - 1;
        if orig_col < assign.len() {
            let term = assign[orig_col];
            ss_by_term[term] += effects[j] * effects[j];
        }
    }

    Ok((ss_by_term[1], ss_by_term[2], ss_by_term[3]))
}

/// Result for two-way ANOVA containing separate F-statistics and p-values for each factor and interaction
#[derive(Debug, Clone)]
pub struct TwoWayAnovaResult {
    /// F-statistic for factor A main effect
    pub f_statistic_a: f64,
    /// p-value for factor A main effect
    pub p_value_a: f64,
    /// Degrees of freedom for factor A
    pub df_a: f64,

    /// F-statistic for factor B main effect
    pub f_statistic_b: f64,
    /// p-value for factor B main effect
    pub p_value_b: f64,
    /// Degrees of freedom for factor B
    pub df_b: f64,

    /// F-statistic for A×B interaction
    pub f_statistic_ab: f64,
    /// p-value for A×B interaction
    pub p_value_ab: f64,
    /// Degrees of freedom for A×B interaction
    pub df_ab: f64,

    /// Error degrees of freedom
    pub df_error: f64,

    /// Sum of squares for factor A
    pub ss_a: f64,
    /// Sum of squares for factor B
    pub ss_b: f64,
    /// Sum of squares for A×B interaction
    pub ss_ab: f64,
    /// Sum of squares for error
    pub ss_error: f64,

    /// Mean squares for factor A
    pub ms_a: f64,
    /// Mean squares for factor B
    pub ms_b: f64,
    /// Mean squares for A×B interaction
    pub ms_ab: f64,
    /// Mean squares for error
    pub ms_error: f64,

    /// Grand mean
    pub grand_mean: f64,
    /// Whether factor A effect is significant
    pub reject_null_a: bool,
    /// Whether factor B effect is significant
    pub reject_null_b: bool,
    /// Whether A×B interaction is significant
    pub reject_null_ab: bool,
}

/// Performs a two-way ANOVA test to analyze the effects of two factors and their interaction.

pub fn anova_two_way(data: &[Vec<Vec<f64>>], alpha: f64) -> Result<TwoWayAnovaTestResult, String> {
    let a_levels = data.len();
    let b_levels = if a_levels > 0 { data[0].len() } else { 0 };

    if a_levels < 2 {
        return Err("Two-way ANOVA requires at least 2 levels for factor A".to_string());
    }

    if b_levels < 2 {
        return Err("Two-way ANOVA requires at least 2 levels for factor B".to_string());
    }

    // Validate data structure and collect all observations
    let mut all_observations = Vec::new();
    let mut cell_means = vec![vec![0.0; b_levels]; a_levels];
    let mut cell_n = vec![vec![0usize; b_levels]; a_levels];
    let mut total_n = 0usize;

    for (i, a_level) in data.iter().enumerate() {
        if a_level.len() != b_levels {
            return Err(
                "All levels of factor A must have the same number of factor B levels".to_string(),
            );
        }

        for (j, cell_data) in a_level.iter().enumerate() {
            if cell_data.is_empty() {
                return Err(format!("Cell A{} B{} is empty", i + 1, j + 1));
            }

            let cell_sum: f64 = cell_data.iter().sum();
            let cell_size = cell_data.len();
            cell_means[i][j] = cell_sum / cell_size as f64;
            cell_n[i][j] = cell_size;
            total_n += cell_size;
            all_observations.extend_from_slice(cell_data);
        }
    }

    // Calculate grand mean
    let grand_mean: f64 = all_observations.iter().sum::<f64>() / total_n as f64;

    // Calculate marginal means
    let mut a_means = vec![0.0; a_levels];
    let mut a_n = vec![0usize; a_levels];
    for i in 0..a_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for j in 0..b_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        a_means[i] = sum / n as f64;
        a_n[i] = n;
    }

    let mut b_means = vec![0.0; b_levels];
    let mut b_n = vec![0usize; b_levels];
    for j in 0..b_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for i in 0..a_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        b_means[j] = sum / n as f64;
        b_n[j] = n;
    }

    // Calculate sums of squares

    // SS_Total
    let _ss_total: f64 = all_observations
        .iter()
        .map(|&x| (x - grand_mean).powi(2))
        .sum();

    // Type I sequential SS via Q'y from glm_fit's QR decomposition.
    // Matches R `aov(y ~ A * B) |> summary()`. Order is A, then B, then A:B —
    // this corresponds to the order in `data` (outer = factor A).
    // For balanced designs all SS-types agree; for unbalanced designs Type I
    // depends on the order of entry (which is fixed here as A first, then B).
    let (ss_a, ss_b, ss_ab) = type_i_ss(data, a_levels, b_levels, total_n)?;

    // SS_Error (within cells)
    let mut ss_error = 0.0;
    for (i, a_level) in data.iter().enumerate() {
        for (j, cell_data) in a_level.iter().enumerate() {
            let cell_mean = cell_means[i][j];
            ss_error += cell_data
                .iter()
                .map(|&x| (x - cell_mean).powi(2))
                .sum::<f64>();
        }
    }

    // Degrees of freedom
    let df_a = (a_levels - 1) as f64;
    let df_b = (b_levels - 1) as f64;
    let df_ab = df_a * df_b;
    let df_error = (total_n - a_levels * b_levels) as f64;

    if df_error <= 0.0 {
        return Err(
            "Insufficient data: need multiple observations per cell for error estimation"
                .to_string(),
        );
    }

    // Mean squares
    let ms_a = ss_a / df_a;
    let ms_b = ss_b / df_b;
    let ms_ab = ss_ab / df_ab;
    let ms_error = ss_error / df_error;

    if ms_error == 0.0 {
        return Err("Mean square error is zero - no within-cell variation".to_string());
    }

    // F-statistics
    let f_statistic_a = ms_a / ms_error;
    let f_statistic_b = ms_b / ms_error;
    let f_statistic_ab = ms_ab / ms_error;

    // Calculate p-values
    let f_dist_a = match FisherSnedecor::new(df_a, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution for factor A: {e}"));
        }
    };
    let f_dist_b = match FisherSnedecor::new(df_b, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution for factor B: {e}"));
        }
    };
    let f_dist_ab = match FisherSnedecor::new(df_ab, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution for A×B: {e}"));
        }
    };

    let p_value_a = calculate_p(f_statistic_a, TailType::Right, &f_dist_a);
    let p_value_b = calculate_p(f_statistic_b, TailType::Right, &f_dist_b);
    let p_value_ab = calculate_p(f_statistic_ab, TailType::Right, &f_dist_ab);

    // Calculate sample means and standard deviations for each group
    let mut sample_means = Vec::new();
    let mut sample_std_devs = Vec::new();

    // Calculate means and std devs for each cell
    for i in 0..a_levels {
        for j in 0..b_levels {
            let cell_data = &data[i][j];
            let n = cell_data.len() as f64;
            let mean = cell_data.iter().sum::<f64>() / n;
            let variance = cell_data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0);
            let std_dev = variance.sqrt();

            sample_means.push(mean);
            sample_std_devs.push(std_dev);
        }
    }

    // Calculate effect sizes
    let ss_total = ss_a + ss_b + ss_ab + ss_error;

    // Model-level R² = (SS_model) / SS_total = (SS_A + SS_B + SS_AB) / SS_total
    let r_squared = (ss_a + ss_b + ss_ab) / ss_total;
    let _adjusted_r_squared = 1.0
        - ((1.0 - r_squared) * (total_n as f64 - 1.0)
            / (total_n as f64 - (a_levels * b_levels) as f64));

    // Calculate effect sizes for each component
    let eta_sq_a = eta_squared(ss_a, ss_total);
    let eta_sq_b = eta_squared(ss_b, ss_total);
    let eta_sq_ab = eta_squared(ss_ab, ss_total);

    // Calculate partial eta squared for each component
    let partial_eta_sq_a = ss_a / (ss_a + ss_error);
    let partial_eta_sq_b = ss_b / (ss_b + ss_error);
    let partial_eta_sq_ab = ss_ab / (ss_ab + ss_error);

    // Calculate omega squared for each component (unbiased estimate)
    let omega_sq_a = if ss_total > 0.0 {
        ((ss_a - df_a * ms_error) / (ss_total + ms_error)).max(0.0)
    } else {
        0.0
    };
    let omega_sq_b = if ss_total > 0.0 {
        ((ss_b - df_b * ms_error) / (ss_total + ms_error)).max(0.0)
    } else {
        0.0
    };
    let omega_sq_ab = if ss_total > 0.0 {
        ((ss_ab - df_ab * ms_error) / (ss_total + ms_error)).max(0.0)
    } else {
        0.0
    };

    // Return the complete two-way ANOVA result
    Ok(TwoWayAnovaTestResult {
        factor_a: AnovaTestComponent {
            test_statistic: TestStatistic {
                value: f_statistic_a,
                name: TestStatisticName::FStatistic.as_str().to_string(),
            },
            p_value: p_value_a,
            degrees_of_freedom: df_a,
            effect_size: EffectSize {
                value: eta_sq_a,
                name: EffectSizeType::EtaSquared.as_str().to_string(),
            },
            mean_square: ms_a,
            sum_of_squares: ss_a,
        },
        factor_b: AnovaTestComponent {
            test_statistic: TestStatistic {
                value: f_statistic_b,
                name: TestStatisticName::FStatistic.as_str().to_string(),
            },
            p_value: p_value_b,
            degrees_of_freedom: df_b,
            effect_size: EffectSize {
                value: eta_sq_b,
                name: EffectSizeType::EtaSquared.as_str().to_string(),
            },
            mean_square: ms_b,
            sum_of_squares: ss_b,
        },
        interaction: AnovaTestComponent {
            test_statistic: TestStatistic {
                value: f_statistic_ab,
                name: TestStatisticName::FStatistic.as_str().to_string(),
            },
            p_value: p_value_ab,
            degrees_of_freedom: df_ab,
            effect_size: EffectSize {
                value: eta_sq_ab,
                name: EffectSizeType::EtaSquared.as_str().to_string(),
            },
            mean_square: ms_ab,
            sum_of_squares: ss_ab,
        },
        test_name: "Two-way ANOVA".to_string(),
        alpha,
        error_message: None,
        sample_size: total_n,
        sample_means,
        sample_std_devs,
        sum_of_squares: vec![ss_a, ss_b, ss_ab, ss_error],
        grand_mean,
        r_squared,
        anova_table: vec![
            AnovaTableComponent {
                component: "A".to_string(),
                ss: ss_a,
                df: df_a,
                ms: Some(ms_a),
                f_statistic: Some(f_statistic_a),
                p_value: Some(p_value_a),
                eta_squared: Some(eta_sq_a),
                partial_eta_squared: Some(partial_eta_sq_a),
                omega_squared: Some(omega_sq_a),
            },
            AnovaTableComponent {
                component: "B".to_string(),
                ss: ss_b,
                df: df_b,
                ms: Some(ms_b),
                f_statistic: Some(f_statistic_b),
                p_value: Some(p_value_b),
                eta_squared: Some(eta_sq_b),
                partial_eta_squared: Some(partial_eta_sq_b),
                omega_squared: Some(omega_sq_b),
            },
            AnovaTableComponent {
                component: "AxB".to_string(),
                ss: ss_ab,
                df: df_ab,
                ms: Some(ms_ab),
                f_statistic: Some(f_statistic_ab),
                p_value: Some(p_value_ab),
                eta_squared: Some(eta_sq_ab),
                partial_eta_squared: Some(partial_eta_sq_ab),
                omega_squared: Some(omega_sq_ab),
            },
            AnovaTableComponent {
                component: "Error".to_string(),
                ss: ss_error,
                df: df_error,
                ms: Some(ms_error),
                f_statistic: None,
                p_value: None,
                eta_squared: None,
                partial_eta_squared: None,
                omega_squared: None,
            },
            AnovaTableComponent {
                component: "Total".to_string(),
                ss: ss_total,
                df: (total_n - 1) as f64,
                ms: None,
                f_statistic: None,
                p_value: None,
                eta_squared: None,
                partial_eta_squared: None,
                omega_squared: None,
            },
        ],
        df_error,
        ms_error,
        df_total: (total_n - 1) as f64,
    })
}

/// Two-way ANOVA for factor A main effect - returns OneWayAnovaTestResult
pub fn anova_two_way_factor_a(
    data: &[Vec<Vec<f64>>],
    alpha: f64,
) -> Result<OneWayAnovaTestResult, String> {
    // Perform the full two-way ANOVA calculations
    let a_levels = data.len();
    let b_levels = if a_levels > 0 { data[0].len() } else { 0 };

    if a_levels < 2 {
        return Err("Two-way ANOVA requires at least 2 levels for factor A".to_string());
    }

    if b_levels < 2 {
        return Err("Two-way ANOVA requires at least 2 levels for factor B".to_string());
    }

    // Validate data structure and collect all observations
    let mut all_observations = Vec::new();
    let mut cell_means = vec![vec![0.0; b_levels]; a_levels];
    let mut cell_n = vec![vec![0usize; b_levels]; a_levels];
    let mut total_n = 0usize;

    for (i, a_level) in data.iter().enumerate() {
        if a_level.len() != b_levels {
            return Err(
                "All levels of factor A must have the same number of factor B levels".to_string(),
            );
        }

        for (j, cell_data) in a_level.iter().enumerate() {
            if cell_data.is_empty() {
                return Err(format!("Cell A{} B{} is empty", i + 1, j + 1));
            }

            let cell_sum: f64 = cell_data.iter().sum();
            let cell_size = cell_data.len();
            cell_means[i][j] = cell_sum / cell_size as f64;
            cell_n[i][j] = cell_size;
            total_n += cell_size;

            all_observations.extend_from_slice(cell_data);
        }
    }

    // Grand mean
    let grand_mean: f64 = all_observations.iter().sum::<f64>() / total_n as f64;

    // Calculate marginal means for factors
    let mut a_means = vec![0.0; a_levels];
    let mut a_n = vec![0usize; a_levels];

    for i in 0..a_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for j in 0..b_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        a_means[i] = sum / n as f64;
        a_n[i] = n;
    }

    let mut b_means = vec![0.0; b_levels];
    let mut b_n = vec![0usize; b_levels];

    for j in 0..b_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for i in 0..a_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        b_means[j] = sum / n as f64;
        b_n[j] = n;
    }

    // SS_A (main effect of factor A)
    let ss_a: f64 = a_means
        .iter()
        .zip(a_n.iter())
        .map(|(&mean, &n)| n as f64 * (mean - grand_mean).powi(2))
        .sum();

    // SS_Error (within cells)
    let mut ss_error = 0.0;
    for (i, a_level) in data.iter().enumerate() {
        for (j, cell_data) in a_level.iter().enumerate() {
            let cell_mean = cell_means[i][j];
            ss_error += cell_data
                .iter()
                .map(|&x| (x - cell_mean).powi(2))
                .sum::<f64>();
        }
    }

    // Degrees of freedom
    let df_a = (a_levels - 1) as f64;
    let df_error = (total_n - a_levels * b_levels) as f64;

    if df_error <= 0.0 {
        return Err(
            "Insufficient data: need multiple observations per cell for error estimation"
                .to_string(),
        );
    }

    // Mean squares
    let ms_a = ss_a / df_a;
    let ms_error = ss_error / df_error;

    if ms_error == 0.0 {
        return Err("Mean square error is zero - no within-cell variation".to_string());
    }

    // F-statistic
    let f_statistic_a = ms_a / ms_error;

    // Calculate p-value
    let f_dist_a = match FisherSnedecor::new(df_a, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution for factor A: {e}"));
        }
    };

    let p_value_a = calculate_p(f_statistic_a, TailType::Right, &f_dist_a);

    // Calculate sample means and standard deviations for each group
    let mut sample_means = Vec::new();
    let mut sample_std_devs = Vec::new();

    // Calculate means and std devs for each cell
    for i in 0..a_levels {
        for j in 0..b_levels {
            let cell_data = &data[i][j];
            let n = cell_data.len() as f64;
            let mean = cell_data.iter().sum::<f64>() / n;
            let variance = cell_data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0);
            let std_dev = variance.sqrt();

            sample_means.push(mean);
            sample_std_devs.push(std_dev);
        }
    }

    // Compute ss_b and ss_ab for complete ANOVA table
    let mut b_means = vec![0.0; b_levels];
    let mut b_n = vec![0usize; b_levels];
    for j in 0..b_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for i in 0..a_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        b_means[j] = sum / n as f64;
        b_n[j] = n;
    }

    let ss_b: f64 = b_means
        .iter()
        .zip(b_n.iter())
        .map(|(&mean, &n)| n as f64 * (mean - grand_mean).powi(2))
        .sum();

    let mut ss_ab = 0.0;
    for i in 0..a_levels {
        for j in 0..b_levels {
            let cell_mean = cell_means[i][j];
            let n_ij = cell_n[i][j] as f64;
            ss_ab += n_ij * (cell_mean - a_means[i] - b_means[j] + grand_mean).powi(2);
        }
    }

    // Calculate effect sizes
    let ss_total = ss_a + ss_b + ss_ab + ss_error;
    let eta_sq = eta_squared(ss_a, ss_total);
    let r_squared = ss_a / ss_total;
    let adjusted_r_squared = 1.0
        - ((1.0 - r_squared) * (total_n as f64 - 1.0)
            / (total_n as f64 - (a_levels * b_levels) as f64));

    // Return factor A main effect result
    Ok(OneWayAnovaTestResult {
        test_statistic: TestStatistic {
            value: f_statistic_a,
            name: TestStatisticName::FStatistic.as_str().to_string(),
        },
        p_value: p_value_a,
        test_name: "Two-way ANOVA (Factor A)".to_string(),
        alpha,
        error_message: None,
        df_between: df_a,
        df_within: df_error,
        effect_size: EffectSize {
            value: eta_sq,
            name: EffectSizeType::EtaSquared.as_str().to_string(),
        },
        sample_size: total_n,
        sample_means,
        sample_std_devs,
        sum_of_squares: vec![ss_a, ss_b, ss_ab, ss_error],
        r_squared,
        adjusted_r_squared,
    })
}

/// Two-way ANOVA for factor B main effect - returns OneWayAnovaTestResult
pub fn anova_two_way_factor_b(
    data: &[Vec<Vec<f64>>],
    alpha: f64,
) -> Result<OneWayAnovaTestResult, String> {
    // Reuse the same logic as factor A, but focus on factor B
    let a_levels = data.len();
    let b_levels = if a_levels > 0 { data[0].len() } else { 0 };

    if a_levels < 2 {
        return Err("Two-way ANOVA requires at least 2 levels for factor A".to_string());
    }

    if b_levels < 2 {
        return Err("Two-way ANOVA requires at least 2 levels for factor B".to_string());
    }

    // Validate data and collect observations (same as factor A)
    let mut all_observations = Vec::new();
    let mut cell_means = vec![vec![0.0; b_levels]; a_levels];
    let mut cell_n = vec![vec![0usize; b_levels]; a_levels];
    let mut total_n = 0usize;

    for (i, a_level) in data.iter().enumerate() {
        if a_level.len() != b_levels {
            return Err(
                "All levels of factor A must have the same number of factor B levels".to_string(),
            );
        }

        for (j, cell_data) in a_level.iter().enumerate() {
            if cell_data.is_empty() {
                return Err(format!("Cell A{} B{} is empty", i + 1, j + 1));
            }

            let cell_sum: f64 = cell_data.iter().sum();
            let cell_size = cell_data.len();
            cell_means[i][j] = cell_sum / cell_size as f64;
            cell_n[i][j] = cell_size;
            total_n += cell_size;

            all_observations.extend_from_slice(cell_data);
        }
    }

    // Grand mean
    let grand_mean: f64 = all_observations.iter().sum::<f64>() / total_n as f64;

    // Calculate marginal means for factor B
    let mut b_means = vec![0.0; b_levels];
    let mut b_n = vec![0usize; b_levels];

    for j in 0..b_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for i in 0..a_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        b_means[j] = sum / n as f64;
        b_n[j] = n;
    }

    // SS_B (main effect of factor B)
    let ss_b: f64 = b_means
        .iter()
        .zip(b_n.iter())
        .map(|(&mean, &n)| n as f64 * (mean - grand_mean).powi(2))
        .sum();

    // SS_Error (within cells)
    let mut ss_error = 0.0;
    for (i, a_level) in data.iter().enumerate() {
        for (j, cell_data) in a_level.iter().enumerate() {
            let cell_mean = cell_means[i][j];
            ss_error += cell_data
                .iter()
                .map(|&x| (x - cell_mean).powi(2))
                .sum::<f64>();
        }
    }

    // Degrees of freedom
    let df_b = (b_levels - 1) as f64;
    let df_error = (total_n - a_levels * b_levels) as f64;

    if df_error <= 0.0 {
        return Err(
            "Insufficient data: need multiple observations per cell for error estimation"
                .to_string(),
        );
    }

    // Mean squares
    let ms_b = ss_b / df_b;
    let ms_error = ss_error / df_error;

    if ms_error == 0.0 {
        return Err("Mean square error is zero - no within-cell variation".to_string());
    }

    // F-statistic
    let f_statistic_b = ms_b / ms_error;

    // Calculate p-value
    let f_dist_b = match FisherSnedecor::new(df_b, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution for factor B: {e}"));
        }
    };

    let p_value_b = calculate_p(f_statistic_b, TailType::Right, &f_dist_b);

    // Calculate sample means and standard deviations for each group
    let mut sample_means = Vec::new();
    let mut sample_std_devs = Vec::new();

    // Calculate means and std devs for each cell
    for i in 0..a_levels {
        for j in 0..b_levels {
            let cell_data = &data[i][j];
            let n = cell_data.len() as f64;
            let mean = cell_data.iter().sum::<f64>() / n;
            let variance = cell_data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0);
            let std_dev = variance.sqrt();

            sample_means.push(mean);
            sample_std_devs.push(std_dev);
        }
    }

    // Compute ss_a and ss_ab for complete ANOVA table
    let mut a_means = vec![0.0; a_levels];
    let mut a_n = vec![0usize; a_levels];
    for i in 0..a_levels {
        let mut sum = 0.0;
        let mut n = 0;
        for j in 0..b_levels {
            sum += cell_means[i][j] * cell_n[i][j] as f64;
            n += cell_n[i][j];
        }
        a_means[i] = sum / n as f64;
        a_n[i] = n;
    }

    let ss_a: f64 = a_means
        .iter()
        .zip(a_n.iter())
        .map(|(&mean, &n)| n as f64 * (mean - grand_mean).powi(2))
        .sum();

    let mut ss_ab = 0.0;
    for i in 0..a_levels {
        for j in 0..b_levels {
            let cell_mean = cell_means[i][j];
            let n_ij = cell_n[i][j] as f64;
            ss_ab += n_ij * (cell_mean - a_means[i] - b_means[j] + grand_mean).powi(2);
        }
    }

    // Calculate effect sizes
    let ss_total = ss_a + ss_b + ss_ab + ss_error;
    let eta_sq = eta_squared(ss_b, ss_total);
    let r_squared = ss_b / ss_total;
    let adjusted_r_squared = 1.0
        - ((1.0 - r_squared) * (total_n as f64 - 1.0)
            / (total_n as f64 - (a_levels * b_levels) as f64));

    // Return factor B main effect result
    Ok(OneWayAnovaTestResult {
        test_statistic: TestStatistic {
            value: f_statistic_b,
            name: TestStatisticName::FStatistic.as_str().to_string(),
        },
        p_value: p_value_b,
        test_name: "Two-way ANOVA (Factor B)".to_string(),
        alpha,
        error_message: None,
        df_between: df_b,
        df_within: df_error,
        effect_size: EffectSize {
            value: eta_sq,
            name: EffectSizeType::EtaSquared.as_str().to_string(),
        },
        sample_size: total_n,
        sample_means,
        sample_std_devs,
        sum_of_squares: vec![ss_a, ss_b, ss_ab, ss_error],
        r_squared,
        adjusted_r_squared,
    })
}

/// Two-way ANOVA for A×B interaction - returns OneWayAnovaTestResult
pub fn anova_two_way_interaction(
    data: &[Vec<Vec<f64>>],
    alpha: f64,
) -> Result<OneWayAnovaTestResult, String> {
    // Get the full two-way ANOVA result and extract just the interaction component
    let full_result = anova_two_way(data, alpha)?;

    // Convert the interaction component to OneWayAnovaTestResult
    let df_error = full_result.df_error;

    Ok(OneWayAnovaTestResult {
        test_statistic: full_result.interaction.test_statistic,
        p_value: full_result.interaction.p_value,
        test_name: "Two-way ANOVA (Interaction)".to_string(),
        alpha: full_result.alpha,
        error_message: full_result.error_message,
        df_between: full_result.interaction.degrees_of_freedom,
        df_within: df_error,
        effect_size: full_result.interaction.effect_size,
        sample_size: full_result.sample_size,
        sample_means: full_result.sample_means,
        sample_std_devs: full_result.sample_std_devs,
        sum_of_squares: vec![
            full_result.sum_of_squares[0],          // ss_a
            full_result.sum_of_squares[1],          // ss_b
            full_result.interaction.sum_of_squares, // ss_ab
            full_result.sum_of_squares[3],          // ss_error
        ],
        r_squared: full_result.interaction.sum_of_squares
            / (full_result.interaction.sum_of_squares + full_result.sum_of_squares[3]),
        adjusted_r_squared: 0.0, // Not meaningful for interaction alone
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_two_way_anova_balanced() {
        // Simple balanced 2x2 design with interaction effect
        let data = vec![
            vec![vec![1.0, 2.0, 3.0], vec![8.0, 9.0, 10.0]], // A1: B1=[1,2,3], B2=[8,9,10]
            vec![vec![4.0, 5.0, 6.0], vec![7.0, 8.0, 9.0]],  // A2: B1=[4,5,6], B2=[7,8,9]
        ];

        let result = anova_two_way(&data, 0.05).unwrap();

        // Should have a valid test result
        assert!(result.factor_a.test_statistic.value.is_finite());
        assert!(result.factor_a.p_value >= 0.0 && result.factor_a.p_value <= 1.0);
        assert_eq!(result.test_name, "Two-way ANOVA");
    }

    #[test]
    fn test_two_way_anova_error_cases() {
        // Test insufficient factor levels
        let data_one_a = vec![vec![vec![1.0, 2.0], vec![3.0, 4.0]]]; // Only 1 level of A
        let result_a = anova_two_way(&data_one_a, 0.05);
        assert!(result_a.is_err());

        let data_one_b = vec![vec![vec![1.0, 2.0]], vec![vec![3.0, 4.0]]]; // Only 1 level of B
        let result_b = anova_two_way(&data_one_b, 0.05);
        assert!(result_b.is_err());

        // Test empty cell
        let data_empty = vec![
            vec![vec![], vec![1.0, 2.0]],
            vec![vec![3.0, 4.0], vec![5.0, 6.0]],
        ];
        let result_empty = anova_two_way(&data_empty, 0.05);
        assert!(result_empty.is_err());
    }
}
