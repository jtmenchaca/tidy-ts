//! GLM Demo and Examples
//!
//! This file demonstrates the GLM functionality with working examples.

use crate::stats::regression::family::gaussian::GaussianFamily;
use crate::stats::regression::glm::glm_main::glm;
use crate::stats::regression::glm::glm_print::print_glm;
use crate::stats::regression::glm::glm_summary::summary_glm;
use std::collections::HashMap;

/// Create a simple linear regression example
pub fn create_simple_linear_example() -> HashMap<String, Vec<f64>> {
    let mut data = HashMap::new();

    // Create a simple linear relationship: y = 2*x + 1 + noise
    let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
    let y: Vec<f64> = x.iter().map(|&xi| 2.0 * xi + 1.0 + (xi * 0.1)).collect();

    data.insert("x".to_string(), x);
    data.insert("y".to_string(), y);

    data
}

/// Run a simple linear regression example
pub fn run_simple_linear_example() -> Result<(), String> {
    println!("=== Simple Linear Regression Example ===");

    let data = create_simple_linear_example();

    // Print the data
    println!("Data:");
    println!("x: {:?}", data["x"]);
    println!("y: {:?}", data["y"]);
    println!();

    // Fit the model
    let model = glm(
        "y ~ x".to_string(),
        Some(Box::new(GaussianFamily::identity())),
        Some(data),
        None, // weights
        None, // na_action
        None, // start
        None, // etastart
        None, // mustart
        None, // offset
        None, // control
        None, // model
        None, // method
        None, // x
        None, // y
        None, // singular_ok
        None, // contrasts
    )?;

    // Print the model
    println!("Fitted Model:");
    print_glm(&model, None);
    println!();

    // Get summary
    let summary = summary_glm(&model)?;
    println!("Model Summary:");
    println!("Coefficients:");
    for coef in &summary.coefficients {
        println!(
            "  {}: {:.4} (SE: {:.4})",
            coef.name, coef.estimate, coef.std_error
        );
    }
    println!("Deviance: {:.4}", summary.deviance);
    println!("AIC: {:.4}", summary.aic);
    println!("Iterations: {}", summary.iter);

    Ok(())
}

/// Create a multiple regression example
pub fn create_multiple_regression_example() -> HashMap<String, Vec<f64>> {
    let mut data = HashMap::new();

    let n = 20;
    let x1: Vec<f64> = (1..=n).map(|i| i as f64).collect();
    let x2: Vec<f64> = (1..=n).map(|i| (i as f64) * 0.5).collect();
    let y: Vec<f64> = x1
        .iter()
        .zip(x2.iter())
        .map(|(&x1i, &x2i)| 1.0 + 2.0 * x1i + 3.0 * x2i + (x1i * 0.1))
        .collect();

    data.insert("x1".to_string(), x1);
    data.insert("x2".to_string(), x2);
    data.insert("y".to_string(), y);

    data
}

/// Run a multiple regression example
pub fn run_multiple_regression_example() -> Result<(), String> {
    println!("=== Multiple Regression Example ===");

    let data = create_multiple_regression_example();

    // Print the data
    println!("Data:");
    println!("x1: {:?}", data["x1"]);
    println!("x2: {:?}", data["x2"]);
    println!("y:  {:?}", data["y"]);
    println!();

    // Fit the model
    let model = glm(
        "y ~ x1 + x2".to_string(),
        Some(Box::new(GaussianFamily::identity())),
        Some(data),
        None, // weights
        None, // na_action
        None, // start
        None, // etastart
        None, // mustart
        None, // offset
        None, // control
        None, // model
        None, // method
        None, // x
        None, // y
        None, // singular_ok
        None, // contrasts
    )?;

    // Print the model
    println!("Fitted Model:");
    print_glm(&model, None);
    println!();

    // Get summary
    let summary = summary_glm(&model)?;
    println!("Model Summary:");
    println!("Coefficients:");
    for coef in &summary.coefficients {
        println!(
            "  {}: {:.4} (SE: {:.4})",
            coef.name, coef.estimate, coef.std_error
        );
    }
    println!("Deviance: {:.4}", summary.deviance);
    println!("AIC: {:.4}", summary.aic);
    println!("Iterations: {}", summary.iter);

    Ok(())
}

/// Run all examples
pub fn run_all_examples() -> Result<(), String> {
    println!("Running GLM Examples...\n");

    run_simple_linear_example()?;
    println!();
    run_multiple_regression_example()?;

    println!("All examples completed successfully!");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_simple_linear_example() {
        let data = create_simple_linear_example();
        assert_eq!(data.len(), 2);
        assert_eq!(data["x"].len(), 10);
        assert_eq!(data["y"].len(), 10);
    }

    #[test]
    fn test_create_multiple_regression_example() {
        let data = create_multiple_regression_example();
        assert_eq!(data.len(), 3);
        assert_eq!(data["x1"].len(), 20);
        assert_eq!(data["x2"].len(), 20);
        assert_eq!(data["y"].len(), 20);
    }

    #[test]
    fn test_run_simple_linear_example() {
        // This will fail until we implement proper model frame creation
        let result = run_simple_linear_example();
        assert!(result.is_ok());
    }

    #[test]
    fn test_run_multiple_regression_example() {
        // This will fail until we implement proper model frame creation
        let result = run_multiple_regression_example();
        assert!(result.is_ok());
    }
}
