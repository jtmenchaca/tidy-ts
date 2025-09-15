use super::super::super::core::{TailType, TestResult, TestType, calculate_p};
use super::super::super::helpers::create_error_result;
use statrs::distribution::FisherSnedecor;

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

pub fn anova_two_way(data: &[Vec<Vec<f64>>], alpha: f64) -> TestResult {
    let a_levels = data.len();
    let b_levels = if a_levels > 0 { data[0].len() } else { 0 };

    if a_levels < 2 {
        return create_error_result(
            "Two-way ANOVA",
            "Two-way ANOVA requires at least 2 levels for factor A",
        );
    }

    if b_levels < 2 {
        return create_error_result(
            "Two-way ANOVA",
            "Two-way ANOVA requires at least 2 levels for factor B",
        );
    }

    // Validate data structure and collect all observations
    let mut all_observations = Vec::new();
    let mut cell_means = vec![vec![0.0; b_levels]; a_levels];
    let mut cell_n = vec![vec![0usize; b_levels]; a_levels];
    let mut total_n = 0usize;

    for (i, a_level) in data.iter().enumerate() {
        if a_level.len() != b_levels {
            return create_error_result(
                "Two-way ANOVA",
                "All levels of factor A must have the same number of factor B levels",
            );
        }

        for (j, cell_data) in a_level.iter().enumerate() {
            if cell_data.is_empty() {
                return create_error_result(
                    "Two-way ANOVA",
                    &format!("Cell A{} B{} is empty", i + 1, j + 1),
                );
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

    // SS_A (main effect of factor A)
    let ss_a: f64 = a_means
        .iter()
        .zip(a_n.iter())
        .map(|(&mean, &n)| n as f64 * (mean - grand_mean).powi(2))
        .sum();

    // SS_B (main effect of factor B)
    let ss_b: f64 = b_means
        .iter()
        .zip(b_n.iter())
        .map(|(&mean, &n)| n as f64 * (mean - grand_mean).powi(2))
        .sum();

    // SS_AB (interaction effect)
    let mut ss_ab = 0.0;
    for i in 0..a_levels {
        for j in 0..b_levels {
            let expected_mean = a_means[i] + b_means[j] - grand_mean;
            let interaction_effect = cell_means[i][j] - expected_mean;
            ss_ab += cell_n[i][j] as f64 * interaction_effect.powi(2);
        }
    }

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
        return create_error_result(
            "Two-way ANOVA",
            "Insufficient data: need multiple observations per cell for error estimation",
        );
    }

    // Mean squares
    let ms_a = ss_a / df_a;
    let ms_b = ss_b / df_b;
    let ms_ab = ss_ab / df_ab;
    let ms_error = ss_error / df_error;

    if ms_error == 0.0 {
        return create_error_result(
            "Two-way ANOVA",
            "Mean square error is zero - no within-cell variation",
        );
    }

    // F-statistics
    let f_statistic_a = ms_a / ms_error;
    let f_statistic_b = ms_b / ms_error;
    let f_statistic_ab = ms_ab / ms_error;

    // Calculate p-values
    let f_dist_a = match FisherSnedecor::new(df_a, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Two-way ANOVA",
                &format!("Failed to create F distribution for factor A: {e}"),
            );
        }
    };
    let f_dist_b = match FisherSnedecor::new(df_b, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Two-way ANOVA",
                &format!("Failed to create F distribution for factor B: {e}"),
            );
        }
    };
    let f_dist_ab = match FisherSnedecor::new(df_ab, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Two-way ANOVA",
                &format!("Failed to create F distribution for A×B: {e}"),
            );
        }
    };

    let _p_value_a = calculate_p(f_statistic_a, TailType::Right, &f_dist_a);
    let _p_value_b = calculate_p(f_statistic_b, TailType::Right, &f_dist_b);
    let p_value_ab = calculate_p(f_statistic_ab, TailType::Right, &f_dist_ab);

    // Determine significance
    let reject_null_ab = p_value_ab < alpha;

    // Return the interaction effect as the main result
    TestResult {
        test_type: TestType::TwoWayAnovaInteraction,
        test_statistic: Some(f_statistic_ab),
        p_value: Some(p_value_ab),
        f_statistic: Some(f_statistic_ab),
        degrees_of_freedom: Some(df_ab),
        eta_squared: Some(crate::stats::core::effect_sizes::partial_eta_squared(ss_ab, ss_error)),
        effect_size: Some(crate::stats::core::effect_sizes::partial_eta_squared(ss_ab, ss_error)),
        sample_size: Some(total_n),
        sum_of_squares: Some(vec![ss_a, ss_b, ss_ab, ss_error]),
        confidence_level: Some(1.0 - alpha),
        ..Default::default()
    }
}

/// Two-way ANOVA for factor A main effect - returns TestResult directly
pub fn anova_two_way_factor_a(data: &[Vec<Vec<f64>>], alpha: f64) -> TestResult {
    // Perform the full two-way ANOVA calculations
    let a_levels = data.len();
    let b_levels = if a_levels > 0 { data[0].len() } else { 0 };

    if a_levels < 2 {
        return create_error_result(
            "Two-way ANOVA Factor A",
            "Two-way ANOVA requires at least 2 levels for factor A",
        );
    }

    if b_levels < 2 {
        return create_error_result(
            "Two-way ANOVA Factor A",
            "Two-way ANOVA requires at least 2 levels for factor B",
        );
    }

    // Validate data structure and collect all observations
    let mut all_observations = Vec::new();
    let mut cell_means = vec![vec![0.0; b_levels]; a_levels];
    let mut cell_n = vec![vec![0usize; b_levels]; a_levels];
    let mut total_n = 0usize;

    for (i, a_level) in data.iter().enumerate() {
        if a_level.len() != b_levels {
            return create_error_result(
                "Two-way ANOVA Factor A",
                "All levels of factor A must have the same number of factor B levels",
            );
        }

        for (j, cell_data) in a_level.iter().enumerate() {
            if cell_data.is_empty() {
                return create_error_result(
                    "Two-way ANOVA Factor A",
                    &format!("Cell A{} B{} is empty", i + 1, j + 1),
                );
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
        return create_error_result(
            "Two-way ANOVA Factor A",
            "Insufficient data: need multiple observations per cell for error estimation",
        );
    }

    // Mean squares
    let ms_a = ss_a / df_a;
    let ms_error = ss_error / df_error;

    if ms_error == 0.0 {
        return create_error_result(
            "Two-way ANOVA Factor A",
            "Mean square error is zero - no within-cell variation",
        );
    }

    // F-statistic
    let f_statistic_a = ms_a / ms_error;

    // Calculate p-value
    let f_dist_a = match FisherSnedecor::new(df_a, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Two-way ANOVA Factor A",
                &format!("Failed to create F distribution for factor A: {e}"),
            );
        }
    };

    let p_value_a = calculate_p(f_statistic_a, TailType::Right, &f_dist_a);
    let reject_null_a = p_value_a < alpha;

    // Return factor A main effect result
    TestResult {
        test_type: TestType::TwoWayAnovaFactorA,
        test_statistic: Some(f_statistic_a),
        p_value: Some(p_value_a),
        f_statistic: Some(f_statistic_a),
        degrees_of_freedom: Some(df_a),
        eta_squared: Some(crate::stats::core::effect_sizes::partial_eta_squared(ss_a, ss_error)),
        effect_size: Some(crate::stats::core::effect_sizes::partial_eta_squared(ss_a, ss_error)),
        sample_size: Some(total_n),
        sum_of_squares: Some(vec![ss_a, ss_error]),
        confidence_level: Some(1.0 - alpha),
        ..Default::default()
    }
}

/// Two-way ANOVA for factor B main effect - returns TestResult directly
pub fn anova_two_way_factor_b(data: &[Vec<Vec<f64>>], alpha: f64) -> TestResult {
    // Reuse the same logic as factor A, but focus on factor B
    let a_levels = data.len();
    let b_levels = if a_levels > 0 { data[0].len() } else { 0 };

    if a_levels < 2 {
        return create_error_result(
            "Two-way ANOVA Factor B",
            "Two-way ANOVA requires at least 2 levels for factor A",
        );
    }

    if b_levels < 2 {
        return create_error_result(
            "Two-way ANOVA Factor B",
            "Two-way ANOVA requires at least 2 levels for factor B",
        );
    }

    // Validate data and collect observations (same as factor A)
    let mut all_observations = Vec::new();
    let mut cell_means = vec![vec![0.0; b_levels]; a_levels];
    let mut cell_n = vec![vec![0usize; b_levels]; a_levels];
    let mut total_n = 0usize;

    for (i, a_level) in data.iter().enumerate() {
        if a_level.len() != b_levels {
            return create_error_result(
                "Two-way ANOVA Factor B",
                "All levels of factor A must have the same number of factor B levels",
            );
        }

        for (j, cell_data) in a_level.iter().enumerate() {
            if cell_data.is_empty() {
                return create_error_result(
                    "Two-way ANOVA Factor B",
                    &format!("Cell A{} B{} is empty", i + 1, j + 1),
                );
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
        return create_error_result(
            "Two-way ANOVA Factor B",
            "Insufficient data: need multiple observations per cell for error estimation",
        );
    }

    // Mean squares
    let ms_b = ss_b / df_b;
    let ms_error = ss_error / df_error;

    if ms_error == 0.0 {
        return create_error_result(
            "Two-way ANOVA Factor B",
            "Mean square error is zero - no within-cell variation",
        );
    }

    // F-statistic
    let f_statistic_b = ms_b / ms_error;

    // Calculate p-value
    let f_dist_b = match FisherSnedecor::new(df_b, df_error) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Two-way ANOVA Factor B",
                &format!("Failed to create F distribution for factor B: {e}"),
            );
        }
    };

    let p_value_b = calculate_p(f_statistic_b, TailType::Right, &f_dist_b);
    let reject_null_b = p_value_b < alpha;

    // Return factor B main effect result
    TestResult {
        test_type: TestType::TwoWayAnovaFactorB,
        test_statistic: Some(f_statistic_b),
        p_value: Some(p_value_b),
        f_statistic: Some(f_statistic_b),
        degrees_of_freedom: Some(df_b),
        eta_squared: Some(crate::stats::core::effect_sizes::partial_eta_squared(ss_b, ss_error)),
        effect_size: Some(crate::stats::core::effect_sizes::partial_eta_squared(ss_b, ss_error)),
        sample_size: Some(total_n),
        sum_of_squares: Some(vec![ss_b, ss_error]),
        confidence_level: Some(1.0 - alpha),
        ..Default::default()
    }
}

/// Two-way ANOVA for A×B interaction - returns TestResult directly
pub fn anova_two_way_interaction(data: &[Vec<Vec<f64>>], alpha: f64) -> TestResult {
    // This is the same as the main anova_two_way function
    anova_two_way(data, alpha)
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

        let result = anova_two_way(&data, 0.05);

        // Should have a valid test result
        assert!(result.test_statistic().is_finite());
        assert!(result.p_value() >= 0.0 && result.p_value() <= 1.0);
        assert_eq!(result.test_type(), TestType::TwoWayAnovaInteraction);
    }

    #[test]
    fn test_two_way_anova_error_cases() {
        // Test insufficient factor levels
        let data_one_a = vec![vec![vec![1.0, 2.0], vec![3.0, 4.0]]]; // Only 1 level of A
        let result_a = anova_two_way(&data_one_a, 0.05);
        assert!(result_a.test_statistic().is_nan());

        let data_one_b = vec![vec![vec![1.0, 2.0]], vec![vec![3.0, 4.0]]]; // Only 1 level of B
        let result_b = anova_two_way(&data_one_b, 0.05);
        assert!(result_b.test_statistic().is_nan());

        // Test empty cell
        let data_empty = vec![
            vec![vec![], vec![1.0, 2.0]],
            vec![vec![3.0, 4.0], vec![5.0, 6.0]],
        ];
        let result_empty = anova_two_way(&data_empty, 0.05);
        assert!(result_empty.test_statistic().is_nan());
    }
}
