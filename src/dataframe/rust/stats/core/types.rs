use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Represents the type of tail in hypothesis testing.
#[derive(Debug, Clone, PartialEq)]
pub enum TailType {
    /// Left tail test (used for testing if the observed statistic is less than a critical value).
    Left,
    /// Right tail test (used for testing if the observed statistic is greater than a critical value).
    Right,
    /// Two tail test (used for testing if the observed statistic differs from the critical value in either direction).
    Two,
}

impl TailType {
    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            TailType::Left => "Left",
            TailType::Right => "Right",
            TailType::Two => "Two",
        }
    }
}

/// Represents the type of alternative hypothesis for statistical tests.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum AlternativeType {
    /// Two-sided test (default)
    TwoSided,
    /// One-sided test: less than
    Less,
    /// One-sided test: greater than
    Greater,
}

impl AlternativeType {
    /// Convert from string representation
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "two-sided" | "two.sided" | "two_sided" | "two sided" => AlternativeType::TwoSided,
            "less" | "left" | "lower" => AlternativeType::Less,
            "greater" | "right" | "upper" => AlternativeType::Greater,
            _ => AlternativeType::TwoSided, // Default to two-sided
        }
    }

    /// Convert to TailType for internal calculations
    pub fn to_tail_type(self) -> TailType {
        match self {
            AlternativeType::TwoSided => TailType::Two,
            AlternativeType::Less => TailType::Left,
            AlternativeType::Greater => TailType::Right,
        }
    }

    /// Get string representation
    pub fn as_str(self) -> &'static str {
        match self {
            AlternativeType::TwoSided => "Two-Sided",
            AlternativeType::Less => "Less",
            AlternativeType::Greater => "Greater",
        }
    }
}

impl Default for AlternativeType {
    fn default() -> Self {
        AlternativeType::TwoSided
    }
}

/// Represents the type of statistical test performed.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum TestType {
    OneWayAnova,
    TwoWayAnovaFactorA,
    TwoWayAnovaFactorB,
    TwoWayAnovaInteraction,
    IndependentTTest,
    PairedTTest,
    OneSampleTTest,
    ChiSquareIndependence,
    MannWhitneyU,
    WilcoxonSignedRank,
    KruskalWallis,
    OneSampleZTest,
    TwoSampleZTest,
    OneSampleProportionTest,
    TwoSampleProportionTest,
    ShapiroWilk,
    FishersExact,
    PearsonCorrelation,
    SpearmanCorrelation,
    KendallCorrelation,
    Error,
}

impl TestType {
    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            TestType::OneWayAnova => "One-Way ANOVA",
            TestType::TwoWayAnovaFactorA => "Two-Way ANOVA Factor A",
            TestType::TwoWayAnovaFactorB => "Two-Way ANOVA Factor B",
            TestType::TwoWayAnovaInteraction => "Two-Way ANOVA Interaction",
            TestType::IndependentTTest => "Independent T-Test",
            TestType::PairedTTest => "Paired T-Test",
            TestType::OneSampleTTest => "One-Sample T-Test",
            TestType::ChiSquareIndependence => "Chi-Square Independence",
            TestType::MannWhitneyU => "Mann-Whitney U",
            TestType::WilcoxonSignedRank => "Wilcoxon Signed Rank",
            TestType::KruskalWallis => "Kruskal-Wallis",
            TestType::OneSampleZTest => "One-Sample Z-Test",
            TestType::TwoSampleZTest => "Two-Sample Z-Test",
            TestType::OneSampleProportionTest => "One-Sample Proportion Test",
            TestType::TwoSampleProportionTest => "Two-Sample Proportion Test",
            TestType::ShapiroWilk => "Shapiro-Wilk",
            TestType::FishersExact => "Fisher's Exact Test",
            TestType::PearsonCorrelation => "Pearson Correlation",
            TestType::SpearmanCorrelation => "Spearman Correlation",
            TestType::KendallCorrelation => "Kendall Correlation",
            TestType::Error => "Error",
        }
    }
}

/// Test statistic names that can be returned by statistical tests
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum TestStatisticName {
    TStatistic,
    FStatistic,
    ChiSquare,
    ZStatistic,
    UStatistic,
    WStatistic,
    HStatistic,
    RStatistic,
    TauStatistic,
    RhoStatistic,
    DStatistic,
    GStatistic,
    QStatistic,
    VStatistic,
    AStatistic,
    BStatistic,
    LStatistic,
    SStatistic,
    ExactTest,
}

impl TestStatisticName {
    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            TestStatisticName::TStatistic => "T-Statistic",
            TestStatisticName::FStatistic => "F-Statistic",
            TestStatisticName::ChiSquare => "Chi-Square",
            TestStatisticName::ZStatistic => "Z-Statistic",
            TestStatisticName::UStatistic => "U-Statistic",
            TestStatisticName::WStatistic => "W-Statistic",
            TestStatisticName::HStatistic => "H-Statistic",
            TestStatisticName::RStatistic => "R-Statistic",
            TestStatisticName::TauStatistic => "Tau-Statistic",
            TestStatisticName::RhoStatistic => "Rho-Statistic",
            TestStatisticName::DStatistic => "D-Statistic",
            TestStatisticName::GStatistic => "G-Statistic",
            TestStatisticName::QStatistic => "Q-Statistic",
            TestStatisticName::VStatistic => "V-Statistic",
            TestStatisticName::AStatistic => "A-Statistic",
            TestStatisticName::BStatistic => "B-Statistic",
            TestStatisticName::LStatistic => "L-Statistic",
            TestStatisticName::SStatistic => "S-Statistic",
            TestStatisticName::ExactTest => "Exact Test",
        }
    }
}

/// Effect size types that can be returned by statistical tests
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum EffectSizeType {
    CohensD,
    HedgesG,
    EtaSquared,
    PartialEtaSquared,
    OmegaSquared,
    CramersV,
    PhiCoefficient,
    PointBiserialCorrelation,
    RankBiserialCorrelation,
    KendallsTau,
    SpearmansRho,
    PearsonsR,
    GlassDelta,
    CohensF,
    CohensH,
    OddsRatio,
    RelativeRisk,
    RiskDifference,
    NumberNeededToTreat,
}

impl EffectSizeType {
    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            EffectSizeType::CohensD => "Cohen's D",
            EffectSizeType::HedgesG => "Hedges' G",
            EffectSizeType::EtaSquared => "Eta Squared",
            EffectSizeType::PartialEtaSquared => "Partial Eta Squared",
            EffectSizeType::OmegaSquared => "Omega Squared",
            EffectSizeType::CramersV => "Cramer's V",
            EffectSizeType::PhiCoefficient => "Phi Coefficient",
            EffectSizeType::PointBiserialCorrelation => "Point Biserial Correlation",
            EffectSizeType::RankBiserialCorrelation => "Rank Biserial Correlation",
            EffectSizeType::KendallsTau => "Kendall's Tau",
            EffectSizeType::SpearmansRho => "Spearman's Rho",
            EffectSizeType::PearsonsR => "Pearson's R",
            EffectSizeType::GlassDelta => "Glass's Delta",
            EffectSizeType::CohensF => "Cohen's F",
            EffectSizeType::CohensH => "Cohen's H",
            EffectSizeType::OddsRatio => "Odds Ratio",
            EffectSizeType::RelativeRisk => "Relative Risk",
            EffectSizeType::RiskDifference => "Risk Difference",
            EffectSizeType::NumberNeededToTreat => "Number Needed to Treat",
        }
    }
}

/// Effect size with type information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct EffectSize {
    pub value: f64,
    pub name: String,
}

/// Confidence interval structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct ConfidenceInterval {
    pub lower: f64,
    pub upper: f64,
    pub confidence_level: f64,
}

/// Test statistic with name
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct TestStatistic {
    pub value: f64,
    pub name: String,
}

/// One-way ANOVA test result with guaranteed properties
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct OneWayAnovaTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub degrees_of_freedom: f64,
    pub r_squared: f64,
    pub adjusted_r_squared: f64,
    pub sample_size: usize,
    pub sample_means: Vec<f64>,
    pub sample_std_devs: Vec<f64>,
    pub sum_of_squares: Vec<f64>,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Welch's ANOVA test result with proper two degrees of freedom
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct WelchAnovaTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub df1: f64, // Numerator degrees of freedom
    pub df2: f64, // Denominator degrees of freedom
    pub r_squared: f64,
    pub adjusted_r_squared: f64,
    pub sample_size: usize,
    pub sample_means: Vec<f64>,
    pub sample_std_devs: Vec<f64>,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Two-way ANOVA test result with guaranteed properties for all three tests
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct TwoWayAnovaTestResult {
    // Common properties
    pub test_name: String,
    // Factor A main effect
    pub factor_a: AnovaTestComponent,
    // Factor B main effect
    pub factor_b: AnovaTestComponent,
    // A×B interaction effect
    pub interaction: AnovaTestComponent,
    // Model-level R² (explained variance by the full model)
    pub r_squared: f64,
    pub sample_size: usize,
    pub sample_means: Vec<f64>,
    pub sample_std_devs: Vec<f64>,
    pub sum_of_squares: Vec<f64>, // [ss_a, ss_b, ss_ab, ss_error]
    pub grand_mean: f64,
    // Complete ANOVA table components
    pub anova_table: Vec<AnovaTableComponent>,
    // Error term information for complete ANOVA table
    pub df_error: f64,
    pub ms_error: f64,
    pub df_total: f64,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Complete ANOVA table component (includes Total row)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct AnovaTableComponent {
    pub component: String, // "A", "B", "AxB", "Error", "Total"
    pub ss: f64,
    pub df: f64,
    pub ms: Option<f64>,                  // None for Total
    pub f_statistic: Option<f64>,         // None for Error and Total
    pub p_value: Option<f64>,             // None for Error and Total
    pub eta_squared: Option<f64>,         // Regular eta-squared (SS_effect / SS_total)
    pub partial_eta_squared: Option<f64>, // Partial eta-squared (SS_effect / (SS_effect + SS_error))
    pub omega_squared: Option<f64>,       // Unbiased omega-squared estimate
}

/// Component of a two-way ANOVA test (Factor A, Factor B, or Interaction)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct AnovaTestComponent {
    pub test_statistic: TestStatistic,
    pub p_value: f64,
    pub degrees_of_freedom: f64,
    pub effect_size: EffectSize,
    pub mean_square: f64,
    pub sum_of_squares: f64,
}

/// Chi-square test of independence result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct ChiSquareIndependenceTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub degrees_of_freedom: f64,
    pub sample_size: usize,
    pub phi_coefficient: f64,
    pub chi_square_expected: Vec<f64>,
    pub residuals: Vec<f64>,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Chi-square goodness of fit test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct ChiSquareGoodnessOfFitTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub degrees_of_freedom: f64,
    pub sample_size: usize,
    pub chi_square_expected: Vec<f64>,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Chi-square test for variance result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct ChiSquareVarianceTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub degrees_of_freedom: f64,
    pub sample_size: usize,
    pub confidence_interval: ConfidenceInterval,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Mann-Whitney test method type
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum MannWhitneyMethod {
    Exact,
    Asymptotic,
}

impl MannWhitneyMethod {
    pub fn as_str(self) -> &'static str {
        match self {
            MannWhitneyMethod::Exact => "Exact",
            MannWhitneyMethod::Asymptotic => "Asymptotic",
        }
    }
}

/// Mann-Whitney test result with method information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct MannWhitneyTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub method: String,      // "Exact" or "Asymptotic"
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Pearson correlation test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct PearsonCorrelationTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize, // Pearson's r as effect size
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub degrees_of_freedom: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Spearman correlation test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct SpearmanCorrelationTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize, // Spearman's rho as effect size
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub degrees_of_freedom: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Kendall correlation test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct KendallCorrelationTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize, // Kendall's tau as effect size
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// One-sample t-test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct OneSampleTTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub degrees_of_freedom: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Two-sample independent t-test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct TwoSampleTTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub degrees_of_freedom: f64,
    pub mean_difference: f64,
    pub standard_error: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Paired t-test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct PairedTTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub degrees_of_freedom: f64,
    pub mean_difference: f64,
    pub standard_error: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Wilcoxon signed-rank test method type
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum WilcoxonMethod {
    Exact,
    Asymptotic,
}

impl WilcoxonMethod {
    pub fn as_str(self) -> &'static str {
        match self {
            WilcoxonMethod::Exact => "Exact",
            WilcoxonMethod::Asymptotic => "Asymptotic",
        }
    }
}

/// Wilcoxon signed-rank test result with method information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct WilcoxonSignedRankTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub method: String, // "Exact" or "Asymptotic"
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Kruskal-Wallis test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct KruskalWallisTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub degrees_of_freedom: f64,
    pub sample_size: usize,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// One-sample Z-test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct OneSampleZTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Two-sample Z-test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct TwoSampleZTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub mean_difference: f64,
    pub standard_error: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// One-sample proportion test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct OneSampleProportionTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub sample_proportion: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Two-sample proportion test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct TwoSampleProportionTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub proportion_difference: f64,
    pub alternative: String, // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Shapiro-Wilk test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct ShapiroWilkTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub test_statistic: TestStatistic,
    pub sample_size: usize,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Anderson-Darling test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct AndersonDarlingTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub test_statistic: TestStatistic,
    pub sample_size: usize,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// D'Agostino-Pearson K² test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct DAgostinoPearsonTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub test_statistic: TestStatistic,
    pub sample_size: usize,
    pub skewness: f64,
    pub kurtosis: f64,
    pub alpha: f64,
    pub error_message: Option<String>,
}

/// Fisher's exact test result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct FishersExactTestResult {
    pub test_name: String,
    pub p_value: f64,
    pub effect_size: EffectSize,
    pub test_statistic: TestStatistic,
    pub confidence_interval: ConfidenceInterval,
    pub method: String,
    pub method_type: String,      // "exact" to indicate Fisher's exact method
    pub mid_p_value: Option<f64>, // Optional mid-p corrected p-value
    pub alternative: String,      // Alternative hypothesis ("two-sided", "less", "greater")
    pub alpha: f64,
    pub error_message: Option<String>,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug)]
pub struct KolmogorovSmirnovTestResult {
    #[allow(dead_code)]
    pub(crate) test_name: String,
    pub p_value: f64,
    #[allow(dead_code)]
    pub(crate) test_statistic: TestStatistic,
    pub sample1_size: usize,
    pub sample2_size: usize,
    pub critical_value: f64,
    pub d_statistic: f64,
    pub d_plus: f64,
    pub d_minus: f64,
    #[allow(dead_code)]
    pub(crate) alternative: String,
    pub alpha: f64,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl KolmogorovSmirnovTestResult {
    #[wasm_bindgen(getter)]
    pub fn test_statistic(&self) -> TestStatistic {
        self.test_statistic.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn test_name(&self) -> String {
        self.test_name.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn alternative(&self) -> String {
        self.alternative.clone()
    }
}
