//! Model trait implementation for GEE

use super::types::GeeglmResult;
use crate::stats::regression::shared::model_trait::Model;

impl Model for GeeglmResult {
    fn coefficients(&self) -> &[f64] {
        &self.glm_result.coefficients
    }

    fn fitted_values(&self) -> &[f64] {
        &self.glm_result.fitted_values
    }

    fn residuals(&self) -> &[f64] {
        &self.glm_result.residuals
    }

    fn deviance(&self) -> f64 {
        self.glm_result.deviance
    }

    fn aic(&self) -> f64 {
        self.glm_result.aic
    }

    fn rank(&self) -> usize {
        self.glm_result.rank
    }

    fn family(&self) -> &dyn crate::stats::regression::family::GlmFamily {
        self.glm_result.family.as_ref()
    }

    fn formula(&self) -> Option<&str> {
        self.glm_result.formula.as_deref()
    }

    fn call(&self) -> Option<&str> {
        self.glm_result.call.as_deref()
    }

    fn model_frame(&self) -> Option<&crate::stats::regression::model_utilities::ModelFrame> {
        self.glm_result.model.as_ref()
    }

    fn response(&self) -> &[f64] {
        &self.glm_result.y
    }

    fn prior_weights(&self) -> &[f64] {
        &self.glm_result.prior_weights
    }

    fn working_weights(&self) -> &[f64] {
        &self.glm_result.weights
    }

    fn linear_predictors(&self) -> &[f64] {
        &self.glm_result.linear_predictors
    }

    fn df_residual(&self) -> usize {
        self.glm_result.df_residual
    }

    fn df_null(&self) -> usize {
        self.glm_result.df_null
    }

    fn converged(&self) -> bool {
        self.glm_result.converged
    }

    fn boundary(&self) -> bool {
        self.glm_result.boundary
    }

    fn iterations(&self) -> usize {
        self.glm_result.iter
    }

    fn null_deviance(&self) -> f64 {
        self.glm_result.null_deviance
    }

    fn offset(&self) -> Option<&[f64]> {
        self.glm_result.offset.as_deref()
    }

    fn model_type(&self) -> &str {
        "gee"
    }
}
