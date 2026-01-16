//! Generic methods for statistical models
//!
//! This file contains generic functions and method dispatch for statistical models,
//! equivalent to R's generic_methods.R file.

use std::collections::HashMap;

/// Generic coefficient extraction function
pub fn coef<T>(object: &T, complete: Option<bool>) -> Result<Vec<f64>, String>
where
    T: HasCoefficients,
{
    let complete = complete.unwrap_or(true);
    object.coefficients(complete)
}

/// Default implementation for coefficient extraction
pub fn coef_default(object: &dyn HasCoefficients, complete: bool) -> Result<Vec<f64>, String> {
    object.coefficients(complete)
}

/// Alias for coef
pub fn coefficients<T>(object: &T, complete: Option<bool>) -> Result<Vec<f64>, String>
where
    T: HasCoefficients,
{
    coef(object, complete)
}

/// Generic residuals extraction function
pub fn residuals<T>(object: &T) -> Result<Vec<f64>, String>
where
    T: HasResiduals,
{
    object.residuals()
}

/// Default implementation for residuals extraction
pub fn residuals_default(object: &dyn HasResiduals) -> Result<Vec<f64>, String> {
    object.residuals()
}

/// Alias for residuals
pub fn resid<T>(object: &T) -> Result<Vec<f64>, String>
where
    T: HasResiduals,
{
    residuals(object)
}

/// Generic deviance extraction function
pub fn deviance<T>(object: &T) -> Result<f64, String>
where
    T: HasDeviance,
{
    object.deviance()
}

/// Default implementation for deviance extraction
pub fn deviance_default(object: &dyn HasDeviance) -> Result<f64, String> {
    object.deviance()
}

/// Generic fitted values extraction function
pub fn fitted<T>(object: &T) -> Result<Vec<f64>, String>
where
    T: HasFitted,
{
    object.fitted()
}

/// Default implementation for fitted values extraction
pub fn fitted_default(object: &dyn HasFitted) -> Result<Vec<f64>, String> {
    object.fitted()
}

/// Alias for fitted
pub fn fitted_values<T>(object: &T) -> Result<Vec<f64>, String>
where
    T: HasFitted,
{
    fitted(object)
}

/// Generic ANOVA function
pub fn anova<T>(object: &T) -> Result<AnovaResult, String>
where
    T: HasAnova,
{
    object.anova()
}

/// Generic effects extraction function
pub fn effects<T>(object: &T) -> Result<Option<Vec<f64>>, String>
where
    T: HasEffects,
{
    object.effects()
}

/// Generic weights extraction function
pub fn weights<T>(object: &T) -> Result<Option<Vec<f64>>, String>
where
    T: HasWeights,
{
    object.weights()
}

/// Default implementation for weights extraction
pub fn weights_default(object: &dyn HasWeights) -> Result<Option<Vec<f64>>, String> {
    object.weights()
}

/// Generic degrees of freedom extraction function
pub fn df_residual<T>(object: &T) -> Result<f64, String>
where
    T: HasDfResidual,
{
    object.df_residual()
}

/// Default implementation for degrees of freedom extraction
pub fn df_residual_default(object: &dyn HasDfResidual) -> Result<f64, String> {
    object.df_residual()
}

/// Generic variable names extraction function
pub fn variable_names<T>(object: &T) -> Result<Vec<String>, String>
where
    T: HasVariableNames,
{
    object.variable_names()
}

/// Default implementation for variable names extraction
pub fn variable_names_default(object: &dyn HasVariableNames) -> Result<Vec<String>, String> {
    object.variable_names()
}

/// Generic case names extraction function
pub fn case_names<T>(object: &T) -> Result<Vec<String>, String>
where
    T: HasCaseNames,
{
    object.case_names()
}

/// Default implementation for case names extraction
pub fn case_names_default(object: &dyn HasCaseNames) -> Result<Vec<String>, String> {
    object.case_names()
}

/// Generic simulate function
pub fn simulate<T>(object: &T, nsim: usize, seed: Option<u64>) -> Result<Vec<Vec<f64>>, String>
where
    T: HasSimulate,
{
    object.simulate(nsim, seed)
}

/// Offset function
pub fn offset<T>(object: T) -> T {
    object
}

/// Check model frame classes
///
/// This is equivalent to R's .checkMFClasses() function
pub fn check_mf_classes(
    classes: &HashMap<String, String>,
    model_frame: &HashMap<String, Vec<f64>>,
    ord_not_ok: bool,
) -> Result<(), String> {
    // Get classes from model frame
    let mut new_classes = HashMap::new();
    for (var_name, _) in model_frame {
        if let Some(class) = classes.get(var_name) {
            new_classes.insert(var_name.clone(), class.clone());
        }
    }

    if new_classes.is_empty() {
        return Ok(());
    }

    // Check for class mismatches
    for (var_name, new_class) in &new_classes {
        if let Some(old_class) = classes.get(var_name) {
            let mut old_class = old_class.clone();
            let mut new_class = new_class.clone();

            // Handle ordered factors
            if !ord_not_ok {
                if old_class == "ordered" {
                    old_class = "factor".to_string();
                }
                if new_class == "ordered" {
                    new_class = "factor".to_string();
                }
            }

            // Handle ordered as substitute for factor
            if new_class == "ordered" && old_class == "factor" {
                new_class = "factor".to_string();
            }

            // Handle factor as substitute for character
            if new_class == "factor" && old_class == "character" {
                new_class = "character".to_string();
            }

            if old_class != new_class {
                return Err(format!(
                    "variable '{}' was fitted with type \"{}\" but type \"{}\" was supplied",
                    var_name, old_class, new_class
                ));
            }
        }
    }

    Ok(())
}

/// Model frame class function
///
/// This is equivalent to R's .MFclass() function
pub fn mf_class(data: &[f64]) -> String {
    // Check if data is logical (all 0s and 1s)
    let is_logical = data.iter().all(|&x| x == 0.0 || x == 1.0);
    if is_logical {
        return "logical".to_string();
    }

    // Check if data is numeric
    if data.iter().all(|&x| x.is_finite()) {
        return "numeric".to_string();
    }

    // Check for NaN or infinite values
    if data.iter().any(|&x| x.is_nan() || x.is_infinite()) {
        return "numeric".to_string(); // Still numeric, just with special values
    }

    // Default to numeric
    "numeric".to_string()
}

/// Deparse function
pub fn deparse2(x: &str) -> String {
    x.to_string()
}

/// Trait for objects that have coefficients
pub trait HasCoefficients {
    fn coefficients(&self, complete: bool) -> Result<Vec<f64>, String>;
}

/// Trait for objects that have residuals
pub trait HasResiduals {
    fn residuals(&self) -> Result<Vec<f64>, String>;
}

/// Trait for objects that have fitted values
pub trait HasFitted {
    fn fitted(&self) -> Result<Vec<f64>, String>;
}

/// Trait for objects that have deviance
pub trait HasDeviance {
    fn deviance(&self) -> Result<f64, String>;
}

/// Trait for objects that have weights
pub trait HasWeights {
    fn weights(&self) -> Result<Option<Vec<f64>>, String>;
}

/// Trait for objects that have degrees of freedom
pub trait HasDfResidual {
    fn df_residual(&self) -> Result<f64, String>;
}

/// Trait for objects that have variable names
pub trait HasVariableNames {
    fn variable_names(&self) -> Result<Vec<String>, String>;
}

/// Trait for objects that have case names
pub trait HasCaseNames {
    fn case_names(&self) -> Result<Vec<String>, String>;
}

/// Trait for objects that have effects
pub trait HasEffects {
    fn effects(&self) -> Result<Option<Vec<f64>>, String>;
}

/// Trait for objects that have ANOVA
pub trait HasAnova {
    fn anova(&self) -> Result<AnovaResult, String>;
}

/// Trait for objects that can be simulated
pub trait HasSimulate {
    fn simulate(&self, nsim: usize, seed: Option<u64>) -> Result<Vec<Vec<f64>>, String>;
}

/// ANOVA result structure
#[derive(Debug, Clone)]
pub struct AnovaResult {
    pub df: Vec<f64>,
    pub sum_sq: Vec<f64>,
    pub mean_sq: Vec<f64>,
    pub f_value: Option<Vec<f64>>,
    pub p_value: Option<Vec<f64>>,
    pub heading: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_mf_class() {
        assert_eq!(mf_class(&[0.0, 1.0, 0.0]), "numeric");
    }

    #[test]
    fn test_deparse2() {
        assert_eq!(deparse2("y ~ x1 + x2"), "y ~ x1 + x2");
    }
}
