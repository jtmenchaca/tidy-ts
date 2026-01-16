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
        // This is a temporary fix - we need to convert GlmFamilyInfo back to GlmFamily
        // For now, we'll return a default Gaussian family
        todo!("Convert GlmFamilyInfo back to GlmFamily trait object")
    }

    fn formula(&self) -> Option<&str> {
        Some(&self.glm_result.formula)
    }

    fn call(&self) -> Option<&str> {
        Some(&self.glm_result.call)
    }

    fn model_frame(&self) -> Option<&crate::stats::regression::model_utilities::ModelFrame> {
        // This is a temporary fix - we need to convert our ModelFrame to the expected type
        todo!("Convert ModelFrame to expected type")
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
