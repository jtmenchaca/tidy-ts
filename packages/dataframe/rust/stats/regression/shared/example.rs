//! Example showing how the unified Model trait works
//!
//! This demonstrates how both GLM and GEE models can implement the same trait
//! and use shared utility functions.

use super::{Model, deviance, aic, r_squared, print_summary};

/// Example function that works with any model type
pub fn analyze_any_model<T: Model>(model: &T) {
    println!("=== Model Analysis ===");
    println!("Model Type: {}", model.model_type());
    println!("Deviance: {:.6}", deviance(model));
    println!("AIC: {:.6}", aic(model));
    println!("R-squared: {:.6}", r_squared(model));
    println!("Converged: {}", model.converged());
    println!("Iterations: {}", model.iterations());
    
    // Print full summary
    print_summary(model);
}

/// Example of model comparison
pub fn compare_models<T1: Model, T2: Model>(model1: &T1, model2: &T2) {
    println!("=== Model Comparison ===");
    println!("Model 1 ({}) AIC: {:.6}", model1.model_type(), aic(model1));
    println!("Model 2 ({}) AIC: {:.6}", model2.model_type(), aic(model2));
    
    let aic_diff = aic(model1) - aic(model2);
    if aic_diff.abs() < 2.0 {
        println!("Models are approximately equivalent (AIC difference < 2)");
    } else if aic_diff < 0.0 {
        println!("Model 1 is better (lower AIC)");
    } else {
        println!("Model 2 is better (lower AIC)");
    }
}
