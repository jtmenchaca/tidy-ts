//! Random effects design matrix (Z) construction
//!
//! This module provides sparse matrix representations for random effects design matrices.
//! The Z matrix maps random effect coefficients (BLUPs) to individual observations.
//!
//! # Structure
//!
//! For a model with random effects `(1 + x | group)`:
//! - Z has n_obs rows (one per observation)
//! - Z has n_groups × n_terms columns (each group has intercept + slope columns)
//! - Each row has exactly n_terms non-zero entries (one per term in that obs's group)
//!
//! # Sparse Representation
//!
//! Z matrices are inherently sparse: for n observations and q random effect columns,
//! there are only n × n_terms_per_obs non-zero entries out of n × q total entries.
//! We use CSR (Compressed Sparse Row) format for efficient row-based operations.

use super::types::RandomEffect;

/// Compressed Sparse Row (CSR) matrix representation
///
/// Efficient for:
/// - Row-based iteration (important for IRLS)
/// - Matrix-vector products Z * b
/// - Transpose products Z^T * v
#[derive(Debug, Clone)]
pub struct SparseMatrix {
    /// Row pointers: row_ptr[i] is the start index in col_idx/values for row i
    /// Length: nrow + 1 (last element is nnz)
    pub row_ptr: Vec<usize>,
    /// Column indices for non-zero values
    /// Length: nnz
    pub col_idx: Vec<usize>,
    /// Non-zero values
    /// Length: nnz
    pub values: Vec<f64>,
    /// Number of rows
    pub nrow: usize,
    /// Number of columns
    pub ncol: usize,
}

impl SparseMatrix {
    /// Create an empty sparse matrix with given dimensions
    pub fn new(nrow: usize, ncol: usize) -> Self {
        Self {
            row_ptr: vec![0; nrow + 1],
            col_idx: Vec::new(),
            values: Vec::new(),
            nrow,
            ncol,
        }
    }

    /// Number of non-zero elements
    pub fn nnz(&self) -> usize {
        self.values.len()
    }

    /// Get the start and end indices in col_idx/values for a given row
    pub fn row_range(&self, row: usize) -> (usize, usize) {
        (self.row_ptr[row], self.row_ptr[row + 1])
    }

    /// Multiply: result = Z * b (sparse matrix times dense vector)
    ///
    /// # Arguments
    /// * `b` - Dense vector of length ncol
    ///
    /// # Returns
    /// * Dense vector of length nrow
    pub fn mul_vec(&self, b: &[f64]) -> Vec<f64> {
        assert_eq!(b.len(), self.ncol, "Vector length must match ncol");
        let mut result = vec![0.0; self.nrow];

        for row in 0..self.nrow {
            let (start, end) = self.row_range(row);
            for idx in start..end {
                result[row] += self.values[idx] * b[self.col_idx[idx]];
            }
        }
        result
    }

    /// Multiply: result = Z^T * v (transpose times dense vector)
    ///
    /// # Arguments
    /// * `v` - Dense vector of length nrow
    ///
    /// # Returns
    /// * Dense vector of length ncol
    pub fn transpose_mul_vec(&self, v: &[f64]) -> Vec<f64> {
        assert_eq!(v.len(), self.nrow, "Vector length must match nrow");
        let mut result = vec![0.0; self.ncol];

        for row in 0..self.nrow {
            let (start, end) = self.row_range(row);
            for idx in start..end {
                result[self.col_idx[idx]] += self.values[idx] * v[row];
            }
        }
        result
    }

    /// Multiply: result = Z^T * diag(w) * Z (weighted cross-product)
    ///
    /// Returns a dense q × q matrix where q = ncol
    ///
    /// # Arguments
    /// * `weights` - Diagonal weight vector of length nrow
    ///
    /// # Returns
    /// * Dense matrix as Vec<Vec<f64>> of size ncol × ncol
    pub fn weighted_cross_product(&self, weights: &[f64]) -> Vec<Vec<f64>> {
        assert_eq!(weights.len(), self.nrow, "Weights length must match nrow");
        let q = self.ncol;
        let mut result = vec![vec![0.0; q]; q];

        for row in 0..self.nrow {
            let w = weights[row];
            let (start, end) = self.row_range(row);

            // For each pair of non-zero entries in this row
            for i in start..end {
                let col_i = self.col_idx[i];
                let val_i = self.values[i];
                for j in start..end {
                    let col_j = self.col_idx[j];
                    let val_j = self.values[j];
                    result[col_i][col_j] += w * val_i * val_j;
                }
            }
        }
        result
    }

    /// Convert to dense column-major matrix
    ///
    /// # Returns
    /// * Dense matrix as Vec<f64> in column-major order (nrow × ncol)
    pub fn to_dense(&self) -> Vec<f64> {
        let mut dense = vec![0.0; self.nrow * self.ncol];

        for row in 0..self.nrow {
            let (start, end) = self.row_range(row);
            for idx in start..end {
                let col = self.col_idx[idx];
                // Column-major: element (row, col) is at index row + col * nrow
                dense[row + col * self.nrow] = self.values[idx];
            }
        }
        dense
    }

    /// Get column indices for a specific row
    pub fn row_cols(&self, row: usize) -> &[usize] {
        let (start, end) = self.row_range(row);
        &self.col_idx[start..end]
    }

    /// Get values for a specific row
    pub fn row_values(&self, row: usize) -> &[f64] {
        let (start, end) = self.row_range(row);
        &self.values[start..end]
    }
}

/// Construct sparse Z matrix for a single random effect term
///
/// For a model with `(1 | group)` (random intercept only):
/// - Z is n × n_groups
/// - Row i has a 1.0 in column group_indices[i]
///
/// For a model with `(1 + x | group)` (random intercept + slope):
/// - Z is n × (n_groups × 2)
/// - Row i has values [1.0, x[i]] in columns [2*g, 2*g+1] where g = group_indices[i]
///
/// # Arguments
/// * `random_effect` - The random effect specification with populated group info
/// * `term_values` - Values for each term for each observation. Shape: n_obs × n_terms
///                   For intercept, all values should be 1.0
///                   For slopes, values are the covariate values
///
/// # Returns
/// * Sparse Z matrix in CSR format
pub fn construct_z_matrix(
    random_effect: &RandomEffect,
    term_values: &[Vec<f64>],
) -> Result<SparseMatrix, String> {
    let n_obs = random_effect.group_indices.len();
    let n_terms = random_effect.n_terms();
    let n_groups = random_effect.n_groups;

    // Validate inputs
    if term_values.len() != n_terms {
        return Err(format!(
            "term_values length ({}) must match n_terms ({})",
            term_values.len(),
            n_terms
        ));
    }
    for (i, tv) in term_values.iter().enumerate() {
        if tv.len() != n_obs {
            return Err(format!(
                "term_values[{}] length ({}) must match n_obs ({})",
                i,
                tv.len(),
                n_obs
            ));
        }
    }

    let ncol = n_groups * n_terms;
    let nnz = n_obs * n_terms;

    let mut row_ptr = Vec::with_capacity(n_obs + 1);
    let mut col_idx = Vec::with_capacity(nnz);
    let mut values = Vec::with_capacity(nnz);

    row_ptr.push(0);

    for obs in 0..n_obs {
        let group = random_effect.group_indices[obs];

        // Validate group index
        if group >= n_groups {
            return Err(format!(
                "Invalid group index {} at observation {} (n_groups = {})",
                group, obs, n_groups
            ));
        }

        // Add entries for each term
        for term in 0..n_terms {
            let col = group * n_terms + term;
            col_idx.push(col);
            values.push(term_values[term][obs]);
        }

        row_ptr.push(row_ptr[obs] + n_terms);
    }

    Ok(SparseMatrix {
        row_ptr,
        col_idx,
        values,
        nrow: n_obs,
        ncol,
    })
}

/// Construct combined Z matrix for multiple random effects
///
/// For crossed random effects like `(1 | patient) + (1 | provider)`:
/// - Z is n × (n_patients + n_providers)
/// - Row i has 1.0s in columns for both patient[i] and provider[i]
///
/// # Arguments
/// * `random_effects` - Vector of random effect specifications
/// * `term_values_per_re` - For each random effect, values for each term. Outer len = n_re, inner = n_terms × n_obs
///
/// # Returns
/// * Combined sparse Z matrix in CSR format
pub fn construct_combined_z_matrix(
    random_effects: &[RandomEffect],
    term_values_per_re: &[Vec<Vec<f64>>],
) -> Result<SparseMatrix, String> {
    if random_effects.is_empty() {
        return Err("At least one random effect required".to_string());
    }

    if random_effects.len() != term_values_per_re.len() {
        return Err(format!(
            "Number of random effects ({}) must match term_values_per_re length ({})",
            random_effects.len(),
            term_values_per_re.len()
        ));
    }

    // All random effects must have the same n_obs
    let n_obs = random_effects[0].group_indices.len();
    for (i, re) in random_effects.iter().enumerate() {
        if re.group_indices.len() != n_obs {
            return Err(format!(
                "Random effect {} has {} observations, expected {}",
                i,
                re.group_indices.len(),
                n_obs
            ));
        }
    }

    // Calculate total columns and entries per row
    let mut total_cols = 0;
    let mut entries_per_row = 0;
    for re in random_effects {
        total_cols += re.n_groups * re.n_terms();
        entries_per_row += re.n_terms();
    }

    let nnz = n_obs * entries_per_row;

    let mut row_ptr = Vec::with_capacity(n_obs + 1);
    let mut col_idx = Vec::with_capacity(nnz);
    let mut values = Vec::with_capacity(nnz);

    row_ptr.push(0);

    for obs in 0..n_obs {
        let mut col_offset = 0;

        for (re_idx, re) in random_effects.iter().enumerate() {
            let group = re.group_indices[obs];
            let n_terms = re.n_terms();

            // Validate
            if group >= re.n_groups {
                return Err(format!(
                    "Invalid group index {} in RE {} at obs {} (n_groups = {})",
                    group, re_idx, obs, re.n_groups
                ));
            }

            // Add entries for each term in this random effect
            for term in 0..n_terms {
                let col = col_offset + group * n_terms + term;
                col_idx.push(col);
                values.push(term_values_per_re[re_idx][term][obs]);
            }

            col_offset += re.n_groups * n_terms;
        }

        row_ptr.push(row_ptr[obs] + entries_per_row);
    }

    Ok(SparseMatrix {
        row_ptr,
        col_idx,
        values,
        nrow: n_obs,
        ncol: total_cols,
    })
}

/// Create intercept-only term values (all 1.0s)
///
/// Convenience function for random intercept models
pub fn intercept_term_values(n_obs: usize) -> Vec<Vec<f64>> {
    vec![vec![1.0; n_obs]]
}

/// Create intercept + slope term values
///
/// # Arguments
/// * `slope_values` - The covariate values for the random slope
///
/// # Returns
/// * Vec with two elements: [intercept (all 1s), slope_values]
pub fn intercept_slope_term_values(slope_values: &[f64]) -> Vec<Vec<f64>> {
    let n_obs = slope_values.len();
    vec![vec![1.0; n_obs], slope_values.to_vec()]
}

/// Helper to populate a RandomEffect with group information from raw data
///
/// # Arguments
/// * `re` - Mutable random effect to populate
/// * `group_values` - The actual group values (strings) for each observation
pub fn populate_random_effect(re: &mut RandomEffect, group_values: &[String]) {
    use std::collections::HashMap;

    let mut group_map: HashMap<&str, usize> = HashMap::new();
    let mut group_ids: Vec<String> = Vec::new();
    let mut group_indices: Vec<usize> = Vec::with_capacity(group_values.len());
    let mut group_counts: Vec<usize> = Vec::new();

    for val in group_values {
        let idx = if let Some(&idx) = group_map.get(val.as_str()) {
            group_counts[idx] += 1;
            idx
        } else {
            let idx = group_ids.len();
            group_map.insert(val, idx);
            group_ids.push(val.clone());
            group_counts.push(1);
            idx
        };
        group_indices.push(idx);
    }

    re.n_groups = group_ids.len();
    re.group_ids = group_ids;
    re.group_indices = group_indices;
    re.group_sizes = group_counts;
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_random_effect(n_obs: usize, n_groups: usize) -> RandomEffect {
        // Create a random effect with observations evenly distributed across groups
        let group_indices: Vec<usize> = (0..n_obs).map(|i| i % n_groups).collect();
        let mut group_sizes = vec![0usize; n_groups];
        for &g in &group_indices {
            group_sizes[g] += 1;
        }

        RandomEffect {
            grouping_var: "group".to_string(),
            terms: vec!["1".to_string()],
            n_groups,
            group_sizes,
            group_ids: (0..n_groups).map(|i| format!("g{}", i)).collect(),
            group_indices,
            covariance: super::super::types::CovarianceType::Independent,
        }
    }

    #[test]
    fn test_sparse_matrix_basic() {
        // Create a simple 3x4 sparse matrix:
        // [1 0 2 0]
        // [0 3 0 4]
        // [5 0 0 6]
        let z = SparseMatrix {
            row_ptr: vec![0, 2, 4, 6],
            col_idx: vec![0, 2, 1, 3, 0, 3],
            values: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
            nrow: 3,
            ncol: 4,
        };

        assert_eq!(z.nnz(), 6);
        assert_eq!(z.row_range(0), (0, 2));
        assert_eq!(z.row_range(1), (2, 4));
        assert_eq!(z.row_range(2), (4, 6));
    }

    #[test]
    fn test_sparse_mul_vec() {
        // Z = [1 0]
        //     [0 1]
        //     [1 0]
        let z = SparseMatrix {
            row_ptr: vec![0, 1, 2, 3],
            col_idx: vec![0, 1, 0],
            values: vec![1.0, 1.0, 1.0],
            nrow: 3,
            ncol: 2,
        };

        let b = vec![2.0, 3.0];
        let result = z.mul_vec(&b);
        assert_eq!(result, vec![2.0, 3.0, 2.0]);
    }

    #[test]
    fn test_sparse_transpose_mul_vec() {
        // Z = [1 0]
        //     [0 1]
        //     [1 0]
        // Z^T = [1 0 1]
        //       [0 1 0]
        let z = SparseMatrix {
            row_ptr: vec![0, 1, 2, 3],
            col_idx: vec![0, 1, 0],
            values: vec![1.0, 1.0, 1.0],
            nrow: 3,
            ncol: 2,
        };

        let v = vec![1.0, 2.0, 3.0];
        let result = z.transpose_mul_vec(&v);
        assert_eq!(result, vec![4.0, 2.0]); // [1+3, 2]
    }

    #[test]
    fn test_construct_z_intercept_only() {
        // 100 observations, 10 groups, random intercept only
        let re = create_test_random_effect(100, 10);
        let term_values = intercept_term_values(100);

        let z = construct_z_matrix(&re, &term_values).unwrap();

        // Z should be 100 x 10
        assert_eq!(z.nrow, 100);
        assert_eq!(z.ncol, 10);

        // Each row should have exactly 1 non-zero entry
        for row in 0..z.nrow {
            let (start, end) = z.row_range(row);
            assert_eq!(
                end - start,
                1,
                "Row {} should have 1 entry, got {}",
                row,
                end - start
            );
            assert_eq!(z.values[start], 1.0);
        }

        // Test that Z * b produces correct group offsets
        let b: Vec<f64> = (0..10).map(|i| i as f64).collect();
        let offsets = z.mul_vec(&b);

        // Observation i is in group i % 10, so offset should be (i % 10)
        for (i, &offset) in offsets.iter().enumerate() {
            let expected = (i % 10) as f64;
            assert!(
                (offset - expected).abs() < 1e-10,
                "Obs {} should have offset {}, got {}",
                i,
                expected,
                offset
            );
        }
    }

    #[test]
    fn test_construct_z_intercept_slope() {
        // 100 observations, 10 groups, random intercept + slope
        let mut re = create_test_random_effect(100, 10);
        re.terms = vec!["1".to_string(), "x".to_string()];
        re.covariance = super::super::types::CovarianceType::Unstructured;

        // Slope values: just use observation index for simplicity
        let slope_values: Vec<f64> = (0..100).map(|i| i as f64).collect();
        let term_values = intercept_slope_term_values(&slope_values);

        let z = construct_z_matrix(&re, &term_values).unwrap();

        // Z should be 100 x 20 (10 groups × 2 terms)
        assert_eq!(z.nrow, 100);
        assert_eq!(z.ncol, 20);

        // Each row should have exactly 2 non-zero entries
        for row in 0..z.nrow {
            let (start, end) = z.row_range(row);
            assert_eq!(
                end - start,
                2,
                "Row {} should have 2 entries, got {}",
                row,
                end - start
            );

            // First entry should be intercept (1.0)
            assert_eq!(z.values[start], 1.0);
            // Second entry should be slope value (row index)
            assert_eq!(z.values[start + 1], row as f64);
        }

        // Test Z * b
        // b = [intercept_0, slope_0, intercept_1, slope_1, ...]
        let mut b = vec![0.0; 20];
        for g in 0..10 {
            b[g * 2] = g as f64; // intercept for group g
            b[g * 2 + 1] = 0.1; // slope for group g
        }

        let offsets = z.mul_vec(&b);

        // For obs i in group g: offset = intercept_g + slope_g * x_i
        // = g + 0.1 * i
        for (i, &offset) in offsets.iter().enumerate() {
            let g = i % 10;
            let expected = g as f64 + 0.1 * i as f64;
            assert!(
                (offset - expected).abs() < 1e-10,
                "Obs {} should have offset {}, got {}",
                i,
                expected,
                offset
            );
        }
    }

    #[test]
    fn test_crossed_random_effects() {
        // 100 obs, 10 patients, 5 providers (crossed)
        let n_obs = 100;
        let n_patients = 10;
        let n_providers = 5;

        // Patient assignments: obs i -> patient i % 10
        let patient_indices: Vec<usize> = (0..n_obs).map(|i| i % n_patients).collect();
        // Provider assignments: obs i -> provider (i / 20) % 5
        let provider_indices: Vec<usize> = (0..n_obs).map(|i| (i / 20) % n_providers).collect();

        let patient_re = RandomEffect {
            grouping_var: "patient".to_string(),
            terms: vec!["1".to_string()],
            n_groups: n_patients,
            group_sizes: {
                let mut sizes = vec![0; n_patients];
                for &p in &patient_indices {
                    sizes[p] += 1;
                }
                sizes
            },
            group_ids: (0..n_patients).map(|i| format!("P{}", i)).collect(),
            group_indices: patient_indices,
            covariance: super::super::types::CovarianceType::Independent,
        };

        let provider_re = RandomEffect {
            grouping_var: "provider".to_string(),
            terms: vec!["1".to_string()],
            n_groups: n_providers,
            group_sizes: {
                let mut sizes = vec![0; n_providers];
                for &p in &provider_indices {
                    sizes[p] += 1;
                }
                sizes
            },
            group_ids: (0..n_providers).map(|i| format!("D{}", i)).collect(),
            group_indices: provider_indices,
            covariance: super::super::types::CovarianceType::Independent,
        };

        let random_effects = vec![patient_re, provider_re];
        let term_values = vec![
            intercept_term_values(n_obs), // patient intercepts
            intercept_term_values(n_obs), // provider intercepts
        ];

        let z = construct_combined_z_matrix(&random_effects, &term_values).unwrap();

        // Z should be 100 x 15 (10 patients + 5 providers)
        assert_eq!(z.nrow, 100);
        assert_eq!(z.ncol, 15);

        // Each row should have exactly 2 non-zero entries
        for row in 0..z.nrow {
            let (start, end) = z.row_range(row);
            assert_eq!(
                end - start,
                2,
                "Row {} should have 2 entries, got {}",
                row,
                end - start
            );

            // Both entries should be 1.0 (intercepts)
            assert_eq!(z.values[start], 1.0);
            assert_eq!(z.values[start + 1], 1.0);
        }

        // Test Z * b correctly adds patient and provider effects
        let mut b = vec![0.0; 15];
        for p in 0..n_patients {
            b[p] = p as f64 * 10.0; // patient effect
        }
        for d in 0..n_providers {
            b[n_patients + d] = d as f64; // provider effect
        }

        let offsets = z.mul_vec(&b);

        // For obs i: offset = patient_effect[i % 10] + provider_effect[(i / 20) % 5]
        for (i, &offset) in offsets.iter().enumerate() {
            let patient = i % n_patients;
            let provider = (i / 20) % n_providers;
            let expected = (patient * 10 + provider) as f64;
            assert!(
                (offset - expected).abs() < 1e-10,
                "Obs {} (patient {}, provider {}): expected {}, got {}",
                i,
                patient,
                provider,
                expected,
                offset
            );
        }
    }

    #[test]
    fn test_weighted_cross_product() {
        // Simple 3x2 matrix for testing Z^T W Z
        // Z = [1 0]
        //     [1 0]
        //     [0 1]
        // W = diag([1, 2, 3])
        // Z^T W Z = [1*1+1*2  0    ] = [3 0]
        //           [0        1*3  ]   [0 3]
        let z = SparseMatrix {
            row_ptr: vec![0, 1, 2, 3],
            col_idx: vec![0, 0, 1],
            values: vec![1.0, 1.0, 1.0],
            nrow: 3,
            ncol: 2,
        };

        let weights = vec![1.0, 2.0, 3.0];
        let ztwz = z.weighted_cross_product(&weights);

        assert_eq!(ztwz.len(), 2);
        assert_eq!(ztwz[0].len(), 2);

        assert!((ztwz[0][0] - 3.0).abs() < 1e-10);
        assert!((ztwz[0][1] - 0.0).abs() < 1e-10);
        assert!((ztwz[1][0] - 0.0).abs() < 1e-10);
        assert!((ztwz[1][1] - 3.0).abs() < 1e-10);
    }

    #[test]
    fn test_to_dense() {
        // Z = [1 2]
        //     [3 0]
        let z = SparseMatrix {
            row_ptr: vec![0, 2, 3],
            col_idx: vec![0, 1, 0],
            values: vec![1.0, 2.0, 3.0],
            nrow: 2,
            ncol: 2,
        };

        let dense = z.to_dense();
        // Column-major: [z00, z10, z01, z11] = [1, 3, 2, 0]
        assert_eq!(dense, vec![1.0, 3.0, 2.0, 0.0]);
    }

    #[test]
    fn test_populate_random_effect() {
        let mut re = RandomEffect::intercept("group".to_string());
        let group_values: Vec<String> = vec![
            "A", "A", "B", "A", "C", "B", "C", "A", "B", "C",
        ]
        .into_iter()
        .map(String::from)
        .collect();

        populate_random_effect(&mut re, &group_values);

        assert_eq!(re.n_groups, 3);
        assert_eq!(re.group_ids, vec!["A", "B", "C"]);
        assert_eq!(re.group_indices, vec![0, 0, 1, 0, 2, 1, 2, 0, 1, 2]);
        assert_eq!(re.group_sizes, vec![4, 3, 3]); // A:4, B:3, C:3
    }
}
