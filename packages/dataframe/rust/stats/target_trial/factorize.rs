//! Factor encoding for target trial emulation.
//!
//! Ported from SEQTaRget's `internal_misc.R::factorize()`.
//! Marks specified columns as factors so that model.matrix
//! creates dummy variables with the reference level dropped.

use super::types::{ColumnarData, TargetTrialConfig};

/// Determine which columns should be factorized, matching R's factorize().
///
/// R factorizes: config.fixed, paste0(treatment, indicator_baseline), treatment.
pub fn columns_to_factorize(config: &TargetTrialConfig) -> Vec<String> {
    let tx_bas = format!("{}{}", config.treatment, config.indicator_baseline);

    let mut cols: Vec<String> = Vec::new();
    cols.extend(config.fixed.iter().cloned());
    cols.push(tx_bas);
    cols.push(config.treatment.clone());

    cols.sort();
    cols.dedup();
    cols
}

/// Apply factorization to data, matching R's factorize().
///
/// Only factorizes columns that actually exist in the data as numeric.
/// Silently skips columns not found (matching R behavior).
pub fn factorize_data(data: &mut ColumnarData, config: &TargetTrialConfig) {
    let cols = columns_to_factorize(config);
    for col in &cols {
        if data.numeric.contains_key(col) {
            let _ = data.factorize(col);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_columns_to_factorize() {
        let mut config = TargetTrialConfig::default();
        config.treatment = "tx_init".to_string();
        config.fixed = vec!["sex".to_string(), "age".to_string()];

        let cols = columns_to_factorize(&config);
        assert!(cols.contains(&"sex".to_string()));
        assert!(cols.contains(&"age".to_string()));
        assert!(cols.contains(&"tx_init".to_string()));
        assert!(cols.contains(&"tx_init_bas".to_string()));
    }

    #[test]
    fn test_factorize_data() {
        let mut config = TargetTrialConfig::default();
        config.treatment = "tx".to_string();
        config.fixed = vec!["sex".to_string()];

        let mut data = ColumnarData::new();
        data.add_numeric("tx".to_string(), vec![0.0, 1.0, 0.0, 1.0]);
        data.add_numeric("tx_bas".to_string(), vec![0.0, 0.0, 1.0, 1.0]);
        data.add_numeric("sex".to_string(), vec![0.0, 1.0, 1.0, 0.0]);
        data.add_numeric("followup".to_string(), vec![0.0, 1.0, 2.0, 3.0]);

        factorize_data(&mut data, &config);

        assert!(data.factors.contains_key("tx"));
        assert!(data.factors.contains_key("tx_bas"));
        assert!(data.factors.contains_key("sex"));
        // followup should NOT be factorized
        assert!(!data.factors.contains_key("followup"));

        // Check levels
        let sex_factor = data.factors.get("sex").unwrap();
        assert_eq!(sex_factor.levels, vec!["0", "1"]);
        assert_eq!(sex_factor.reference, 0);
    }
}
