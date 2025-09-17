//! GLM VR (Vignette/Example) functions
//!
//! This file contains example code demonstrating GLM usage.

// Modularized components

// Re-export main functions for easy access
pub use super::glm_vr_data::{
    create_detergent_data, create_family_example_data, create_simple_example_data,
};
pub use super::glm_vr_examples::{
    FamilyComparisonResults, ModelSelectionResults, run_detergent_example,
    run_family_comparison_example, run_model_selection_example, run_simple_example,
};
pub use super::glm_vr_results::{
    DetergentResults, SimpleExampleResults, print_anova_comparison, print_correlation_matrix,
    print_detailed_model_summary, print_detergent_results, print_family_comparison_results,
    print_model_selection_results, print_simple_results,
};
pub use super::glm_vr_tests::{
    benchmark_data_creation, run_all_tests, test_data_consistency, test_data_creation,
    test_data_validation, test_example_execution, test_printing_functions,
    test_statistical_properties,
};

/// Main entry point for running all GLM VR examples
///
/// This function provides a convenient way to run all the GLM examples
/// and demonstrations in one go.
pub fn run_all_examples() -> Result<(), String> {
    println!("Running all GLM VR examples...");
    println!();

    // Run tests first
    run_all_tests()?;
    println!();

    // Run examples (these will fail until model frame is implemented)
    println!("Attempting to run examples (will fail until model frame is implemented):");

    match run_detergent_example() {
        Ok(results) => {
            print_detergent_results(&results);
        }
        Err(e) => {
            println!("Detergent example failed (expected): {}", e);
        }
    }

    match run_simple_example() {
        Ok(results) => {
            print_simple_results(&results);
        }
        Err(e) => {
            println!("Simple example failed (expected): {}", e);
        }
    }

    match run_family_comparison_example() {
        Ok(results) => {
            print_family_comparison_results(&results);
        }
        Err(e) => {
            println!("Family comparison example failed (expected): {}", e);
        }
    }

    match run_model_selection_example() {
        Ok(results) => {
            print_model_selection_results(&results);
        }
        Err(e) => {
            println!("Model selection example failed (expected): {}", e);
        }
    }

    println!();
    println!("All examples completed (with expected failures)");
    Ok(())
}

/// Quick demonstration of GLM VR functionality
///
/// This function provides a quick overview of what the GLM VR module can do.
pub fn demonstrate_capabilities() {
    println!("=== GLM VR Module Capabilities ===");
    println!();

    println!("Data Creation Functions:");
    println!("  - create_detergent_data(): Creates the classic detergent experiment dataset");
    println!("  - create_simple_example_data(): Creates a simple linear regression dataset");
    println!("  - create_family_example_data(): Creates datasets for different GLM families");
    println!();

    println!("Example Execution Functions:");
    println!("  - run_detergent_example(): Runs the complete detergent experiment");
    println!("  - run_simple_example(): Runs a basic linear regression example");
    println!("  - run_family_comparison_example(): Compares different GLM families");
    println!("  - run_model_selection_example(): Demonstrates model selection");
    println!();

    println!("Result Printing Functions:");
    println!("  - print_detergent_results(): Prints detergent experiment results");
    println!("  - print_simple_results(): Prints simple example results");
    println!("  - print_family_comparison_results(): Prints family comparison results");
    println!("  - print_model_selection_results(): Prints model selection results");
    println!("  - print_detailed_model_summary(): Prints detailed model summaries");
    println!("  - print_anova_comparison(): Prints ANOVA comparison tables");
    println!("  - print_correlation_matrix(): Prints correlation matrices");
    println!();

    println!("Testing Functions:");
    println!("  - run_all_tests(): Runs comprehensive test suite");
    println!("  - benchmark_data_creation(): Benchmarks data creation performance");
    println!("  - Various validation and consistency tests");
    println!();

    println!("This module provides GLM examples and demonstrations,");
    println!("with additional functionality for testing and demonstration.");
}
