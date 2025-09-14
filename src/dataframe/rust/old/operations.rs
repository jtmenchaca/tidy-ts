//! Optimized batch operations for common DataFrame transformations
//!
//! This module provides vectorized implementations of common operations
//! that are significantly faster than row-by-row processing in TypeScript.

use super::error::Result;

/// Column selection operations
pub mod select {
    use super::*;

    /// Batch select columns by index
    ///
    /// Takes source column indices and efficiently creates new column arrays.
    /// This avoids row-by-row reconstruction for simple column selection.
    pub fn batch_select_by_indices(
        row_count: usize,
        selected_indices: &[usize],
        output: &mut [usize],
    ) -> Result<()> {
        if output.len() != row_count * selected_indices.len() {
            return Err(format!(
                "Output size mismatch: expected {}, got {}",
                row_count * selected_indices.len(),
                output.len()
            )
            .into());
        }

        // Generate indices for selected columns
        for (col_idx, &selected_col) in selected_indices.iter().enumerate() {
            for row_idx in 0..row_count {
                output[col_idx * row_count + row_idx] = selected_col * row_count + row_idx;
            }
        }

        Ok(())
    }
}

/// Sorting operations
pub mod sort {
    use super::*;

    /// Batch sort indices by numeric column
    ///
    /// Creates a sorted index array without moving the actual data.
    /// This is much faster than full row sorting for single columns.
    pub fn batch_sort_numbers(
        values: &[f64],
        ascending: bool,
        indices: &mut [usize],
    ) -> Result<()> {
        if values.len() != indices.len() {
            return Err("Values and indices arrays must have same length".into());
        }

        // Initialize indices
        for (i, idx) in indices.iter_mut().enumerate() {
            *idx = i;
        }

        // Sort indices by values
        if ascending {
            indices.sort_by(|&a, &b| {
                values[a]
                    .partial_cmp(&values[b])
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
        } else {
            indices.sort_by(|&a, &b| {
                values[b]
                    .partial_cmp(&values[a])
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
        }

        Ok(())
    }

    /// Batch sort indices by string column
    pub fn batch_sort_strings(
        values: &[String],
        ascending: bool,
        indices: &mut [usize],
    ) -> Result<()> {
        if values.len() != indices.len() {
            return Err("Values and indices arrays must have same length".into());
        }

        // Initialize indices
        for (i, idx) in indices.iter_mut().enumerate() {
            *idx = i;
        }

        // Sort indices by values
        if ascending {
            indices.sort_by(|&a, &b| values[a].cmp(&values[b]));
        } else {
            indices.sort_by(|&a, &b| values[b].cmp(&values[a]));
        }

        Ok(())
    }
}

/// Mutation/transformation operations
pub mod mutate {
    use super::*;

    /// Batch arithmetic operations on numeric arrays
    #[derive(Debug, Clone, Copy)]
    pub enum ArithmeticOp {
        Add,
        Subtract,
        Multiply,
        Divide,
        Power,
        Modulo,
    }

    /// Apply arithmetic operation between column and scalar
    pub fn batch_arithmetic_scalar(
        values: &[f64],
        scalar: f64,
        op: ArithmeticOp,
        output: &mut [f64],
    ) -> Result<()> {
        if values.len() != output.len() {
            return Err("Input and output arrays must have same length".into());
        }

        match op {
            ArithmeticOp::Add => {
                for (i, &val) in values.iter().enumerate() {
                    output[i] = val + scalar;
                }
            }
            ArithmeticOp::Subtract => {
                for (i, &val) in values.iter().enumerate() {
                    output[i] = val - scalar;
                }
            }
            ArithmeticOp::Multiply => {
                for (i, &val) in values.iter().enumerate() {
                    output[i] = val * scalar;
                }
            }
            ArithmeticOp::Divide => {
                for (i, &val) in values.iter().enumerate() {
                    output[i] = val / scalar;
                }
            }
            ArithmeticOp::Power => {
                for (i, &val) in values.iter().enumerate() {
                    output[i] = val.powf(scalar);
                }
            }
            ArithmeticOp::Modulo => {
                for (i, &val) in values.iter().enumerate() {
                    output[i] = val % scalar;
                }
            }
        }

        Ok(())
    }

    /// Apply arithmetic operation between two columns
    pub fn batch_arithmetic_columns(
        left: &[f64],
        right: &[f64],
        op: ArithmeticOp,
        output: &mut [f64],
    ) -> Result<()> {
        if left.len() != right.len() || left.len() != output.len() {
            return Err("All arrays must have same length".into());
        }

        match op {
            ArithmeticOp::Add => {
                for (i, (&l, &r)) in left.iter().zip(right.iter()).enumerate() {
                    output[i] = l + r;
                }
            }
            ArithmeticOp::Subtract => {
                for (i, (&l, &r)) in left.iter().zip(right.iter()).enumerate() {
                    output[i] = l - r;
                }
            }
            ArithmeticOp::Multiply => {
                for (i, (&l, &r)) in left.iter().zip(right.iter()).enumerate() {
                    output[i] = l * r;
                }
            }
            ArithmeticOp::Divide => {
                for (i, (&l, &r)) in left.iter().zip(right.iter()).enumerate() {
                    output[i] = l / r;
                }
            }
            ArithmeticOp::Power => {
                for (i, (&l, &r)) in left.iter().zip(right.iter()).enumerate() {
                    output[i] = l.powf(r);
                }
            }
            ArithmeticOp::Modulo => {
                for (i, (&l, &r)) in left.iter().zip(right.iter()).enumerate() {
                    output[i] = l % r;
                }
            }
        }

        Ok(())
    }

    /// Batch string concatenation
    pub fn batch_string_concat(
        left: &[String],
        right: &[String],
        separator: &str,
        output: &mut [String],
    ) -> Result<()> {
        if left.len() != right.len() || left.len() != output.len() {
            return Err("All arrays must have same length".into());
        }

        for (i, (l, r)) in left.iter().zip(right.iter()).enumerate() {
            output[i] = format!("{}{}{}", l, separator, r);
        }

        Ok(())
    }
}

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
impl mutate::ArithmeticOp {
    fn from_u8(op: u8) -> std::result::Result<Self, JsValue> {
        match op {
            0 => Ok(Self::Add),
            1 => Ok(Self::Subtract),
            2 => Ok(Self::Multiply),
            3 => Ok(Self::Divide),
            4 => Ok(Self::Power),
            5 => Ok(Self::Modulo),
            _ => Err(JsValue::from_str("Invalid arithmetic operation")),
        }
    }
}

/// WASM export for batch arithmetic with scalar
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_arithmetic_scalar_wasm(
    values: &[f64],
    scalar: f64,
    operation: u8,
    output: &mut [f64],
) -> std::result::Result<(), JsValue> {
    let op = mutate::ArithmeticOp::from_u8(operation)?;

    mutate::batch_arithmetic_scalar(values, scalar, op, output)
        .map_err(|e| JsValue::from_str(&format!("Batch arithmetic error: {:?}", e)))
}

/// WASM export for batch arithmetic between columns
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_arithmetic_columns_wasm(
    left: &[f64],
    right: &[f64],
    operation: u8,
    output: &mut [f64],
) -> std::result::Result<(), JsValue> {
    let op = mutate::ArithmeticOp::from_u8(operation)?;

    mutate::batch_arithmetic_columns(left, right, op, output)
        .map_err(|e| JsValue::from_str(&format!("Batch arithmetic error: {:?}", e)))
}

/// WASM export for batch string concatenation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_string_concat_wasm(
    left: Vec<String>,
    right: Vec<String>,
    separator: &str,
) -> std::result::Result<Vec<String>, JsValue> {
    let mut output = vec![String::new(); left.len()];
    mutate::batch_string_concat(&left, &right, separator, &mut output)
        .map_err(|e| JsValue::from_str(&format!("Batch concat error: {:?}", e)))?;
    Ok(output)
}

/// Data type conversion operations
pub mod convert {
    use super::*;

    /// Batch convert strings to numbers
    pub fn batch_string_to_number(values: &[String], output: &mut [f64]) -> Result<()> {
        if values.len() != output.len() {
            return Err("Input and output arrays must have same length".into());
        }

        for (i, val) in values.iter().enumerate() {
            output[i] = val.parse().unwrap_or(f64::NAN);
        }

        Ok(())
    }

    /// Batch convert numbers to strings
    pub fn batch_number_to_string(values: &[f64], output: &mut [String]) -> Result<()> {
        if values.len() != output.len() {
            return Err("Input and output arrays must have same length".into());
        }

        for (i, &val) in values.iter().enumerate() {
            output[i] = if val.is_nan() {
                "NaN".to_string()
            } else {
                val.to_string()
            };
        }

        Ok(())
    }
}

/// WASM export for batch string to number conversion
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_string_to_number_wasm(
    values: Vec<String>,
    output: &mut [f64],
) -> std::result::Result<(), JsValue> {
    convert::batch_string_to_number(&values, output)
        .map_err(|e| JsValue::from_str(&format!("Batch conversion error: {:?}", e)))
}

/// WASM export for batch number to string conversion  
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn batch_number_to_string_wasm(values: &[f64]) -> std::result::Result<Vec<String>, JsValue> {
    let mut output = vec![String::new(); values.len()];
    convert::batch_number_to_string(values, &mut output)
        .map_err(|e| JsValue::from_str(&format!("Batch conversion error: {:?}", e)))?;
    Ok(output)
}
