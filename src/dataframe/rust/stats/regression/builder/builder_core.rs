//! Core model builder implementation

use super::builder_types::ModelBuilder;
use crate::stats::regression::contrasts::create_contrasts;
use crate::stats::regression::contrasts::{ContrastMatrix, ContrastType};
use crate::stats::regression::model::c::formula::terms;
use crate::stats::regression::model::c::model_frame::create_model_frame;
use crate::stats::regression::model::c::model_matrix::{ModelMatrixResult, create_model_matrix};
use crate::stats::regression::model::{ModelFrame, NaAction, Variable};

impl ModelBuilder {
    /// Creates a new model builder with the given formula
    pub fn new(formula: &str) -> Self {
        Self {
            formula: formula.to_string(),
            variables: None,
            variable_names: None,
            row_names: None,
            contrasts: Vec::new(),
            na_action: NaAction::Pass,
            subset: None,
        }
    }

    /// Sets the data for the model
    pub fn data(mut self, variables: Vec<Variable>, variable_names: Vec<String>) -> Self {
        self.variables = Some(variables);
        self.variable_names = Some(variable_names);
        self
    }

    /// Sets the model frame directly
    pub fn model_frame(mut self, model_frame: ModelFrame) -> Self {
        self.variables = Some(model_frame.variables);
        self.variable_names = Some(model_frame.variable_names);
        self.row_names = model_frame.row_names;
        self
    }

    /// Sets the contrast specifications for factors
    pub fn contrasts(mut self, contrasts: Vec<ContrastType>) -> Self {
        self.contrasts = contrasts;
        self
    }

    /// Sets how to handle missing values
    pub fn na_action(mut self, na_action: NaAction) -> Self {
        self.na_action = na_action;
        self
    }

    /// Sets a subset of rows to include
    pub fn subset(mut self, subset: Vec<usize>) -> Self {
        self.subset = Some(subset);
        self
    }

    /// Sets row names
    pub fn row_names(mut self, row_names: Vec<String>) -> Self {
        self.row_names = Some(row_names);
        self
    }

    /// Builds the model matrix
    pub fn build(self) -> Result<ModelMatrixResult, &'static str> {
        // Parse the formula
        let terms = terms(&self.formula).map_err(|_| "Failed to parse formula")?;

        // Extract values before moving self
        let contrasts = self.contrasts;

        // Create model frame if not provided directly
        let model_frame = if let (Some(variables), Some(variable_names)) =
            (self.variables, self.variable_names)
        {
            create_model_frame(
                variables,
                variable_names,
                self.row_names,
                self.subset,
                self.na_action,
            )?
            .frame
        } else {
            return Err("No data provided for model");
        };

        // Create contrast matrices
        let contrast_matrices = Self::create_contrast_matrices_static(&contrasts, &model_frame)?;

        // Create the model matrix
        create_model_matrix(&terms, &model_frame, &contrast_matrices)
    }

    /// Creates contrast matrices for factors (static version)
    fn create_contrast_matrices_static(
        contrasts: &[ContrastType],
        model_frame: &ModelFrame,
    ) -> Result<Vec<Option<ContrastMatrix>>, &'static str> {
        let mut contrast_matrices = Vec::new();
        let mut contrast_idx = 0;

        for variable in &model_frame.variables {
            match variable {
                Variable::Factor { levels, .. } => {
                    if contrast_idx < contrasts.len() {
                        let contrast_type = &contrasts[contrast_idx];
                        let contrast_matrix = create_contrasts(levels, contrast_type)?;
                        contrast_matrices.push(Some(contrast_matrix));
                    } else {
                        // Default to treatment contrasts
                        let contrast_matrix = create_contrasts(levels, &ContrastType::Treatment)?;
                        contrast_matrices.push(Some(contrast_matrix));
                    }
                    contrast_idx += 1;
                }
                _ => {
                    contrast_matrices.push(None);
                }
            }
        }

        Ok(contrast_matrices)
    }

    /// Creates contrast matrices for factors
    fn create_contrast_matrices(
        &self,
        model_frame: &ModelFrame,
    ) -> Result<Vec<Option<ContrastMatrix>>, &'static str> {
        Self::create_contrast_matrices_static(&self.contrasts, model_frame)
    }
}
