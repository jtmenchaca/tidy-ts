use super::super::super::core::{
    TailType, TestResult, TestType, calculate_p, eta_squared, mean_null_hypothesis,
};
use super::super::super::helpers::create_error_result;
use statrs::distribution::FisherSnedecor;

/// Performs a one-way ANOVA test to compare the means of multiple independent groups.

pub fn anova<T, I>(data_groups: &[I], alpha: f64) -> TestResult
where
    T: Into<f64> + Copy,
    I: AsRef<[T]>,
{
    let num_groups = data_groups.len();
    if num_groups < 2 {
        return create_error_result("ANOVA", "ANOVA requires at least two groups");
    }

    // Flatten all data and compute grand mean
    let mut all_values = Vec::new();
    for group in data_groups {
        let slice = group.as_ref();
        if slice.is_empty() {
            return create_error_result("ANOVA", "Empty group data");
        }
        all_values.extend(slice.iter().copied().map(Into::into));
    }

    let total_n = all_values.len() as f64;
    let grand_mean = all_values.iter().sum::<f64>() / total_n;

    // Sum of Squares Between Groups (SSB)
    let ss_between = data_groups.iter().fold(0.0, |acc, group| {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        let n = values.len() as f64;
        let mean = values.iter().sum::<f64>() / n;
        acc + n * (mean - grand_mean).powi(2)
    });

    // Sum of Squares Within Groups (SSW)
    let ss_within = data_groups.iter().fold(0.0, |acc, group| {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        let mean = values.iter().sum::<f64>() / values.len() as f64;
        acc + values.iter().map(|x| (x - mean).powi(2)).sum::<f64>()
    });

    // Total Sum of Squares (SST) for effect size calculation
    let ss_total = ss_between + ss_within;

    let df_between = (num_groups - 1) as f64;
    let df_within = total_n - num_groups as f64;

    if df_within <= 0.0 {
        return create_error_result("ANOVA", "Degrees of freedom too small");
    }

    let ms_between = ss_between / df_between;
    let ms_within = ss_within / df_within;

    if ms_within == 0.0 {
        return create_error_result("ANOVA", "Mean square within groups is zero");
    }

    let f_statistic = ms_between / ms_within;

    let f_dist = match FisherSnedecor::new(df_between, df_within) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result("ANOVA", &format!("Failed to create F distribution: {e}"));
        }
    };

    let p_value = calculate_p(f_statistic, TailType::Right, &f_dist);
    let reject_null = p_value < alpha;

    let null_hypothesis = mean_null_hypothesis(num_groups);
    let alt_hypothesis = "Ha: At least one group mean is different".to_string();

    TestResult {
        test_type: TestType::OneWayAnova,
        test_statistic: Some(f_statistic),
        p_value: Some(p_value),
        f_statistic: Some(f_statistic),
        degrees_of_freedom: Some(df_between),
        eta_squared: Some(eta_squared(ss_between, ss_total)),
        effect_size: Some(eta_squared(ss_between, ss_total)),
        sample_size: Some(total_n as usize),
        sum_of_squares: Some(vec![ss_between, ss_within, ss_total]),
        ..Default::default()
    }
}
