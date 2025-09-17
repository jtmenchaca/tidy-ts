//! GLM VR Data Creation Functions

use std::collections::HashMap;

/// Example data from the detergent experiment
///
/// This function creates the example dataset used in the GLM vignette.
///
/// # Returns
///
/// A HashMap containing the detergent experiment data.
pub fn create_detergent_data() -> HashMap<String, Vec<f64>> {
    let mut data = HashMap::new();

    // Fr (frequency) values
    data.insert(
        "Fr".to_string(),
        vec![
            68.0, 42.0, 42.0, 30.0, 37.0, 52.0, 24.0, 43.0, 66.0, 50.0, 33.0, 23.0, 47.0, 55.0,
            23.0, 47.0, 63.0, 53.0, 29.0, 27.0, 57.0, 49.0, 19.0, 29.0,
        ],
    );

    // Temp (temperature) - Low=0, High=1
    data.insert(
        "Temp".to_string(),
        vec![
            0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,
            0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        ],
    );

    // Soft (softness) - Hard=0, Medium=1, Soft=2
    data.insert(
        "Soft".to_string(),
        vec![
            0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0,
        ],
    );

    // M.user (machine user) - N=0, Y=1
    data.insert(
        "M.user".to_string(),
        vec![
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        ],
    );

    // Brand - X=0, M=1
    data.insert(
        "Brand".to_string(),
        vec![
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0,
        ],
    );

    data
}

/// Create a simple example dataset for testing
///
/// This function creates a minimal dataset for testing GLM functionality.
pub fn create_simple_example_data() -> HashMap<String, Vec<f64>> {
    let mut data = HashMap::new();

    // Simple linear relationship: y = 2*x + 1 + noise
    data.insert("x".to_string(), vec![1.0, 2.0, 3.0, 4.0, 5.0]);
    data.insert("y".to_string(), vec![3.1, 5.2, 7.0, 8.9, 11.1]);

    data
}

/// Create additional example datasets for comprehensive testing
///
/// This function creates various datasets for different GLM family types.
pub fn create_family_example_data() -> HashMap<String, HashMap<String, Vec<f64>>> {
    let mut all_data = HashMap::new();

    // Gaussian family example
    let mut gaussian_data = HashMap::new();
    gaussian_data.insert("x1".to_string(), vec![1.0, 2.0, 3.0, 4.0, 5.0]);
    gaussian_data.insert("x2".to_string(), vec![0.5, 1.5, 2.5, 3.5, 4.5]);
    gaussian_data.insert("y".to_string(), vec![2.1, 4.3, 6.2, 8.1, 10.0]);
    all_data.insert("gaussian".to_string(), gaussian_data);

    // Binomial family example
    let mut binomial_data = HashMap::new();
    binomial_data.insert("x".to_string(), vec![1.0, 2.0, 3.0, 4.0, 5.0]);
    binomial_data.insert("n".to_string(), vec![10.0, 15.0, 20.0, 25.0, 30.0]);
    binomial_data.insert("successes".to_string(), vec![3.0, 7.0, 12.0, 18.0, 25.0]);
    all_data.insert("binomial".to_string(), binomial_data);

    // Poisson family example (using detergent data)
    all_data.insert("poisson".to_string(), create_detergent_data());

    all_data
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_detergent_data() {
        let data = create_detergent_data();

        assert_eq!(data.len(), 5);
        assert_eq!(data["Fr"].len(), 24);
        assert_eq!(data["Temp"].len(), 24);
        assert_eq!(data["Soft"].len(), 24);
        assert_eq!(data["M.user"].len(), 24);
        assert_eq!(data["Brand"].len(), 24);
    }

    #[test]
    fn test_create_simple_example_data() {
        let data = create_simple_example_data();

        assert_eq!(data.len(), 2);
        assert_eq!(data["x"].len(), 5);
        assert_eq!(data["y"].len(), 5);
    }

    #[test]
    fn test_create_family_example_data() {
        let data = create_family_example_data();

        assert_eq!(data.len(), 3);
        assert!(data.contains_key("gaussian"));
        assert!(data.contains_key("binomial"));
        assert!(data.contains_key("poisson"));

        // Test Gaussian data
        let gaussian = &data["gaussian"];
        assert_eq!(gaussian.len(), 3);
        assert_eq!(gaussian["x1"].len(), 5);
        assert_eq!(gaussian["x2"].len(), 5);
        assert_eq!(gaussian["y"].len(), 5);

        // Test Binomial data
        let binomial = &data["binomial"];
        assert_eq!(binomial.len(), 3);
        assert_eq!(binomial["x"].len(), 5);
        assert_eq!(binomial["n"].len(), 5);
        assert_eq!(binomial["successes"].len(), 5);
    }
}
