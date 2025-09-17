//! Ultra-optimized distinct operation WASM exports - NO FALLBACKS

#[cfg(feature = "wasm")]
use hashbrown::HashMap;
#[cfg(feature = "wasm")]
use js_sys::Uint32Array;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Ultra-optimized distinct using direct typed arrays - exactly like test_ultra_optimized_distinct.rs
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn distinct_rows_generic_typed(column_data: Vec<Uint32Array>, view_index: &[u32]) -> Vec<u32> {
    let mut hash_tbl = HashMap::with_capacity(view_index.len());
    let mut result_indices = Vec::with_capacity(view_index.len());

    for &physical_idx in view_index.iter() {
        // Build key by collecting all column values into a Vec
        let mut key_values = Vec::with_capacity(column_data.len());
        for array in &column_data {
            key_values.push(array.get_index(physical_idx));
        }

        match hash_tbl.entry(key_values) {
            hashbrown::hash_map::Entry::Vacant(entry) => {
                entry.insert(());
                result_indices.push(physical_idx);
            }
            hashbrown::hash_map::Entry::Occupied(_) => {
                // Duplicate found
            }
        }
    }

    result_indices
}