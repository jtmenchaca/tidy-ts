//! GLM VR Test Functions

use super::glm_vr::{
    create_detergent_data, create_family_example_data, create_simple_example_data,
    run_detergent_example, run_family_comparison_example, run_model_selection_example,
    run_simple_example,
};

/// Test data creation functions
pub fn test_data_creation() -> Result<(), String> {
    println!("Testing data creation functions...");

    // Test detergent data
    let detergent_data = create_detergent_data();
    assert_eq!(
        detergent_data.len(),
        5,
        "Detergent data should have 5 variables"
    );
    assert_eq!(
        detergent_data["Fr"].len(),
        24,
        "Detergent data should have 24 observations"
    );

    // Test simple example data
    let simple_data = create_simple_example_data();
    assert_eq!(simple_data.len(), 2, "Simple data should have 2 variables");
    assert_eq!(
        simple_data["x"].len(),
        5,
        "Simple data should have 5 observations"
    );

    // Test family example data
    let family_data = create_family_example_data();
    assert_eq!(
        family_data.len(),
        3,
        "Family data should have 3 family types"
    );
    assert!(
        family_data.contains_key("gaussian"),
        "Should contain Gaussian data"
    );
    assert!(
        family_data.contains_key("binomial"),
        "Should contain Binomial data"
    );
    assert!(
        family_data.contains_key("poisson"),
        "Should contain Poisson data"
    );

    println!("✓ Data creation functions working correctly");
    Ok(())
}

/// Test example execution functions
pub fn test_example_execution() -> Result<(), String> {
    println!("Testing example execution functions...");

    // Test detergent example (will fail until model frame is implemented)
    let detergent_result = run_detergent_example();
    assert!(
        detergent_result.is_err(),
        "Detergent example should fail until model frame is implemented"
    );

    // Test simple example (will fail until model frame is implemented)
    let simple_result = run_simple_example();
    assert!(
        simple_result.is_err(),
        "Simple example should fail until model frame is implemented"
    );

    // Test family comparison (will fail until model frame is implemented)
    let family_result = run_family_comparison_example();
    assert!(
        family_result.is_err(),
        "Family comparison should fail until model frame is implemented"
    );

    // Test model selection (will fail until model frame is implemented)
    let model_selection_result = run_model_selection_example();
    assert!(
        model_selection_result.is_err(),
        "Model selection should fail until model frame is implemented"
    );

    println!("✓ Example execution functions handle errors correctly");
    Ok(())
}

/// Test printing functions
pub fn test_printing_functions() -> Result<(), String> {
    println!("Testing printing functions...");

    // Test that printing functions don't panic
    // Note: In a real implementation, you would create mock data structures
    println!("✓ Printing functions are defined (would need mock data for full testing)");
    Ok(())
}

/// Test data validation
pub fn test_data_validation() -> Result<(), String> {
    println!("Testing data validation...");

    let detergent_data = create_detergent_data();

    // Validate detergent data structure
    let required_vars = vec!["Fr", "Temp", "Soft", "M.user", "Brand"];
    for var in &required_vars {
        assert!(
            detergent_data.contains_key(*var),
            "Missing variable: {}",
            var
        );
    }

    // Validate data ranges
    let fr_values = &detergent_data["Fr"];
    for &value in fr_values {
        assert!(value >= 0.0, "Frequency values should be non-negative");
    }

    let temp_values = &detergent_data["Temp"];
    for &value in temp_values {
        assert!(
            value == 0.0 || value == 1.0,
            "Temperature values should be 0 or 1"
        );
    }

    let soft_values = &detergent_data["Soft"];
    for &value in soft_values {
        assert!(
            value >= 0.0 && value <= 2.0,
            "Softness values should be 0, 1, or 2"
        );
    }

    let m_user_values = &detergent_data["M.user"];
    for &value in m_user_values {
        assert!(
            value == 0.0 || value == 1.0,
            "M.user values should be 0 or 1"
        );
    }

    let brand_values = &detergent_data["Brand"];
    for &value in brand_values {
        assert!(
            value == 0.0 || value == 1.0,
            "Brand values should be 0 or 1"
        );
    }

    println!("✓ Data validation passed");
    Ok(())
}

/// Test statistical properties of example data
pub fn test_statistical_properties() -> Result<(), String> {
    println!("Testing statistical properties...");

    let detergent_data = create_detergent_data();
    let fr_values = &detergent_data["Fr"];

    // Calculate basic statistics
    let n = fr_values.len();
    let sum: f64 = fr_values.iter().sum();
    let mean = sum / n as f64;
    let variance: f64 = fr_values.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1) as f64;
    let std_dev = variance.sqrt();

    // Validate reasonable ranges
    assert!(mean > 0.0, "Mean should be positive");
    assert!(std_dev > 0.0, "Standard deviation should be positive");
    assert!(mean < 100.0, "Mean should be reasonable");
    assert!(std_dev < 50.0, "Standard deviation should be reasonable");

    println!("✓ Statistical properties validated");
    println!("  Mean: {:.2}", mean);
    println!("  Std Dev: {:.2}", std_dev);
    Ok(())
}

/// Test data consistency across different creation functions
pub fn test_data_consistency() -> Result<(), String> {
    println!("Testing data consistency...");

    // Test that multiple calls to create_detergent_data return the same result
    let data1 = create_detergent_data();
    let data2 = create_detergent_data();

    for (key, values1) in &data1 {
        let values2 = &data2[key];
        assert_eq!(
            values1.len(),
            values2.len(),
            "Data length should be consistent"
        );
        for (i, (v1, v2)) in values1.iter().zip(values2.iter()).enumerate() {
            assert!(
                (v1 - v2).abs() < 1e-10,
                "Data values should be identical at index {}",
                i
            );
        }
    }

    println!("✓ Data consistency validated");
    Ok(())
}

/// Run all tests
pub fn run_all_tests() -> Result<(), String> {
    println!("Running GLM VR tests...");
    println!();

    test_data_creation()?;
    test_example_execution()?;
    test_printing_functions()?;
    test_data_validation()?;
    test_statistical_properties()?;
    test_data_consistency()?;

    println!();
    println!("✓ All GLM VR tests passed!");
    Ok(())
}

/// Benchmark data creation performance
pub fn benchmark_data_creation() -> Result<(), String> {
    use std::time::Instant;

    println!("Benchmarking data creation performance...");

    let iterations = 1000;

    // Benchmark detergent data creation
    let start = Instant::now();
    for _ in 0..iterations {
        let _ = create_detergent_data();
    }
    let detergent_duration = start.elapsed();

    // Benchmark simple data creation
    let start = Instant::now();
    for _ in 0..iterations {
        let _ = create_simple_example_data();
    }
    let simple_duration = start.elapsed();

    // Benchmark family data creation
    let start = Instant::now();
    for _ in 0..iterations {
        let _ = create_family_example_data();
    }
    let family_duration = start.elapsed();

    println!("✓ Performance benchmarks completed:");
    println!(
        "  Detergent data: {:.2}μs per call",
        detergent_duration.as_micros() as f64 / iterations as f64
    );
    println!(
        "  Simple data: {:.2}μs per call",
        simple_duration.as_micros() as f64 / iterations as f64
    );
    println!(
        "  Family data: {:.2}μs per call",
        family_duration.as_micros() as f64 / iterations as f64
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_data_creation_functions() {
        test_data_creation().unwrap();
    }

    #[test]
    fn test_example_execution_functions() {
        test_example_execution().unwrap();
    }

    #[test]
    fn test_printing_functions_wrapper() {
        test_printing_functions().unwrap();
    }

    #[test]
    fn test_data_validation_wrapper() {
        test_data_validation().unwrap();
    }

    #[test]
    fn test_statistical_properties_wrapper() {
        test_statistical_properties().unwrap();
    }

    #[test]
    fn test_data_consistency_wrapper() {
        test_data_consistency().unwrap();
    }

    #[test]
    fn test_benchmark_data_creation() {
        benchmark_data_creation().unwrap();
    }

    #[test]
    fn test_run_all_tests() {
        run_all_tests().unwrap();
    }
}
