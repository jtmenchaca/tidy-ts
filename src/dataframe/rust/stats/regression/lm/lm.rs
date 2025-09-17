//! Linear model module - modularized
// Module declarations
pub mod lm_types;
pub mod lm_qr;
pub mod lm_fit;
pub mod lm_summary;
pub mod lm_print;
pub mod lm_utils;
pub mod lm_tests;

// Re-export main types
pub use lm_types::{
    QrLsResult, LmResult, QrResult, LmOptions, LmSummary, 
    CoefficientSummary, FStatistic, AnovaTable, AnovaRow
};

// Re-export main functions
pub use lm_fit::{lm, lm_wfit};
pub use lm_qr::cdqrls;
pub use lm_summary::summary_lm;
pub use lm_print::{print_lm, print_summary_lm, print_anova_lm};
pub use lm_utils::{
    residuals_lm, deviance_lm, fitted_lm, coef_lm, qr_lm, simulate_lm,
    formula_lm, family_lm, model_frame_lm, variable_names_lm, case_names_lm,
    anova_lm, effects_lm, model_matrix_lm, labels_lm
};