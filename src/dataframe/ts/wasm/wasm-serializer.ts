// deno-lint-ignore-file no-explicit-any
/**
 * Helper to convert WASM test results to plain JavaScript objects
 * that can be properly serialized with JSON.stringify
 */
export function serializeTestResult(result: any): any {
  if (!result) return null;

  // If it's a WASM object with __wbg_ptr, extract its properties
  if (result.__wbg_ptr !== undefined) {
    const serialized: any = {};

    // Common properties for all test results
    if (result.test_statistic) {
      serialized.test_statistic = {
        value: result.test_statistic.value,
        name: result.test_statistic.name,
      };
    }

    if (result.p_value !== undefined) {
      serialized.p_value = result.p_value;
    }

    if (result.test_name !== undefined) {
      serialized.test_name = result.test_name;
    }

    if (result.alpha !== undefined) {
      serialized.alpha = result.alpha;
    }

    if (result.confidence_interval) {
      serialized.confidence_interval = {
        lower: result.confidence_interval.lower,
        upper: result.confidence_interval.upper,
        confidence_level: result.confidence_interval.confidence_level,
      };
    }

    if (result.degrees_of_freedom !== undefined) {
      serialized.degrees_of_freedom = result.degrees_of_freedom;
    }

    // Welch ANOVA specific degrees of freedom
    if (result.df1 !== undefined) {
      serialized.df1 = result.df1;
    }

    if (result.df2 !== undefined) {
      serialized.df2 = result.df2;
    }

    if (result.effect_size) {
      serialized.effect_size = {
        value: result.effect_size.value,
        name: result.effect_size.effect_type,
      };
    }

    if (result.error_message !== undefined) {
      serialized.error_message = result.error_message;
    }

    // Additional properties for specific test types
    if (result.sample_size !== undefined) {
      serialized.sample_size = result.sample_size;
    }

    if (result.sample_mean !== undefined) {
      serialized.sample_mean = result.sample_mean;
    }

    if (result.sample_std !== undefined) {
      serialized.sample_std = result.sample_std;
    }

    if (result.hypothesized_mean !== undefined) {
      serialized.hypothesized_mean = result.hypothesized_mean;
    }

    // Two-sample test properties
    if (result.sample1_mean !== undefined) {
      serialized.sample1_mean = result.sample1_mean;
    }

    if (result.sample2_mean !== undefined) {
      serialized.sample2_mean = result.sample2_mean;
    }

    if (result.sample1_size !== undefined) {
      serialized.sample1_size = result.sample1_size;
    }

    if (result.sample2_size !== undefined) {
      serialized.sample2_size = result.sample2_size;
    }

    if (result.sample1_std !== undefined) {
      serialized.sample1_std = result.sample1_std;
    }

    if (result.sample2_std !== undefined) {
      serialized.sample2_std = result.sample2_std;
    }

    // ANOVA properties
    if (result.f_statistic !== undefined) {
      serialized.f_statistic = result.f_statistic;
    }

    if (result.between_group_variance !== undefined) {
      serialized.between_group_variance = result.between_group_variance;
    }

    if (result.within_group_variance !== undefined) {
      serialized.within_group_variance = result.within_group_variance;
    }

    if (result.df_between !== undefined) {
      serialized.df_between = result.df_between;
    }

    if (result.df_within !== undefined) {
      serialized.df_within = result.df_within;
    }

    // Proportion test properties
    if (result.observed_proportion !== undefined) {
      serialized.observed_proportion = result.observed_proportion;
    }

    if (result.hypothesized_proportion !== undefined) {
      serialized.hypothesized_proportion = result.hypothesized_proportion;
    }

    if (result.successes !== undefined) {
      serialized.successes = result.successes;
    }

    if (result.trials !== undefined) {
      serialized.trials = result.trials;
    }

    // Chi-square properties
    if (result.chi_square !== undefined) {
      serialized.chi_square = result.chi_square;
    }

    if (result.expected_frequencies !== undefined) {
      serialized.expected_frequencies = result.expected_frequencies;
    }

    if (result.observed_frequencies !== undefined) {
      serialized.observed_frequencies = result.observed_frequencies;
    }

    // Correlation properties
    if (result.correlation !== undefined) {
      serialized.correlation = result.correlation;
    }

    if (result.r_squared !== undefined) {
      serialized.r_squared = result.r_squared;
    }

    // Non-parametric test properties
    if (result.u_statistic !== undefined) {
      serialized.u_statistic = result.u_statistic;
    }

    if (result.w_statistic !== undefined) {
      serialized.w_statistic = result.w_statistic;
    }

    if (result.h_statistic !== undefined) {
      serialized.h_statistic = result.h_statistic;
    }

    if (result.rank_sum !== undefined) {
      serialized.rank_sum = result.rank_sum;
    }

    if (result.z_score !== undefined) {
      serialized.z_score = result.z_score;
    }

    // Shapiro-Wilk properties
    if (result.statistic !== undefined) {
      serialized.statistic = result.statistic;
    }

    if (result.normality_assumption_met !== undefined) {
      serialized.normality_assumption_met = result.normality_assumption_met;
    }

    // Two-way ANOVA properties - handle the complex structure
    if (result.factor_a) {
      serialized.factor_a = {
        test_statistic: result.factor_a.test_statistic
          ? {
            value: result.factor_a.test_statistic.value,
            name: result.factor_a.test_statistic.name,
          }
          : undefined,
        p_value: result.factor_a.p_value,
        degrees_of_freedom: result.factor_a.degrees_of_freedom,
        effect_size: result.factor_a.effect_size
          ? {
            value: result.factor_a.effect_size.value,
            name: result.factor_a.effect_size.effect_type,
          }
          : undefined,
        mean_square: result.factor_a.mean_square,
        sum_of_squares: result.factor_a.sum_of_squares,
      };
    }

    if (result.factor_b) {
      serialized.factor_b = {
        test_statistic: result.factor_b.test_statistic
          ? {
            value: result.factor_b.test_statistic.value,
            name: result.factor_b.test_statistic.name,
          }
          : undefined,
        p_value: result.factor_b.p_value,
        degrees_of_freedom: result.factor_b.degrees_of_freedom,
        effect_size: result.factor_b.effect_size
          ? {
            value: result.factor_b.effect_size.value,
            name: result.factor_b.effect_size.effect_type,
          }
          : undefined,
        mean_square: result.factor_b.mean_square,
        sum_of_squares: result.factor_b.sum_of_squares,
      };
    }

    if (result.interaction) {
      serialized.interaction = {
        test_statistic: result.interaction.test_statistic
          ? {
            value: result.interaction.test_statistic.value,
            name: result.interaction.test_statistic.name,
          }
          : undefined,
        p_value: result.interaction.p_value,
        degrees_of_freedom: result.interaction.degrees_of_freedom,
        effect_size: result.interaction.effect_size
          ? {
            value: result.interaction.effect_size.value,
            name: result.interaction.effect_size.effect_type,
          }
          : undefined,
        mean_square: result.interaction.mean_square,
        sum_of_squares: result.interaction.sum_of_squares,
      };
    }

    // Additional two-way ANOVA specific properties
    if (result.sample_means !== undefined) {
      serialized.sample_means = result.sample_means;
    }

    if (result.sample_std_devs !== undefined) {
      serialized.sample_std_devs = result.sample_std_devs;
    }

    if (result.sum_of_squares !== undefined) {
      serialized.sum_of_squares = result.sum_of_squares;
    }

    if (result.grand_mean !== undefined) {
      serialized.grand_mean = result.grand_mean;
    }

    if (result.r_squared !== undefined) {
      serialized.r_squared = result.r_squared;
    }

    // Two-way ANOVA complete table information
    if (result.df_error !== undefined) {
      serialized.df_error = result.df_error;
    }

    if (result.ms_error !== undefined) {
      serialized.ms_error = result.ms_error;
    }

    if (result.df_total !== undefined) {
      serialized.df_total = result.df_total;
    }

    // ANOVA table serialization
    if (result.anova_table) {
      serialized.anova_table = Array.from(result.anova_table).map((
        component: any,
      ) => ({
        component: component.component,
        ss: component.ss,
        df: component.df,
        ms: component.ms,
        f_statistic: component.f_statistic,
        p_value: component.p_value,
        eta_squared: component.eta_squared,
        partial_eta_squared: component.partial_eta_squared,
        omega_squared: component.omega_squared,
      }));
    }

    // Kolmogorov-Smirnov test properties
    if (result.d_statistic !== undefined) {
      serialized.d_statistic = result.d_statistic;
    }

    if (result.d_plus !== undefined) {
      serialized.d_plus = result.d_plus;
    }

    if (result.d_minus !== undefined) {
      serialized.d_minus = result.d_minus;
    }

    if (result.critical_value !== undefined) {
      serialized.critical_value = result.critical_value;
    }

    if (result.sample1_size !== undefined) {
      serialized.sample1_size = result.sample1_size;
    }

    if (result.sample2_size !== undefined) {
      serialized.sample2_size = result.sample2_size;
    }

    if (result.alternative !== undefined) {
      serialized.alternative = result.alternative;
    }

    // Post-hoc test specific properties
    if (result.comparisons !== undefined) {
      serialized.comparisons = result.comparisons.map((comp: any) => {
        if (comp.__wbg_ptr !== undefined) {
          // Serialize PairwiseComparison objects
          return {
            group1: comp.group1,
            group2: comp.group2,
            mean_difference: comp.mean_difference,
            standard_error: comp.standard_error,
            test_statistic: comp.test_statistic
              ? {
                value: comp.test_statistic.value,
                name: comp.test_statistic.name,
              }
              : undefined,
            p_value: comp.p_value,
            adjusted_p_value: comp.adjusted_p_value,
            confidence_interval: comp.confidence_interval
              ? {
                lower: comp.confidence_interval.lower,
                upper: comp.confidence_interval.upper,
                confidence_level: comp.confidence_interval.confidence_level,
              }
              : undefined,
            significant: comp.significant,
          };
        }
        return comp;
      });
    }

    if (result.correction_method !== undefined) {
      serialized.correction_method = result.correction_method;
    }

    if (result.n_groups !== undefined) {
      serialized.n_groups = result.n_groups;
    }

    if (result.n_total !== undefined) {
      serialized.n_total = result.n_total;
    }

    return serialized;
  }

  // If it's already a plain object, return as is
  return result;
}
