//! Shared types for WASM exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Quantile type following R's implementation
#[derive(Debug, Clone, Copy)]
pub enum QuantileType {
    Type1 = 1, // Inverse of empirical distribution function
    Type2 = 2, // Similar to Type1 but with averaging at discontinuities
    Type3 = 3, // Nearest-even order statistic (SAS definition)
    Type4 = 4, // Linear interpolation of empirical distribution function
    Type5 = 5, // Piecewise linear function where knots are midpoints
    Type6 = 6, // Linear interpolation of expectations for order statistics
    Type7 = 7, // Linear interpolation of modes (R default, Excel)
    Type8 = 8, // Linear interpolation of approximate medians
    Type9 = 9, // Approximate unbiased estimate
}

impl Default for QuantileType {
    fn default() -> Self {
        QuantileType::Type7 // R default
    }
}

/// Optimized WASM join result using packed u32 arrays with sentinel values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct JoinIdxU32 {
    left: Vec<u32>,
    right: Vec<u32>,
}

/// Non-WASM version for internal use
#[cfg(not(feature = "wasm"))]
pub struct JoinIdxU32 {
    #[allow(dead_code)]
    left: Vec<u32>,
    #[allow(dead_code)]
    right: Vec<u32>,
}

impl JoinIdxU32 {
    pub fn new(left: Vec<u32>, right: Vec<u32>) -> Self {
        Self { left, right }
    }
}

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

/// NAPI-compatible join result returning left and right index arrays as Uint32Array
#[cfg(feature = "napi-rs")]
#[napi(object)]
pub struct NapiJoinIdxU32 {
    pub left: napi::bindgen_prelude::Uint32Array,
    pub right: napi::bindgen_prelude::Uint32Array,
}

#[cfg(feature = "napi-rs")]
impl NapiJoinIdxU32 {
    pub fn from_vecs(left: Vec<u32>, right: Vec<u32>) -> Self {
        Self {
            left: napi::bindgen_prelude::Uint32Array::new(left),
            right: napi::bindgen_prelude::Uint32Array::new(right),
        }
    }
}

/// NAPI join result with gathered f64 value columns (entire join done in Rust)
#[cfg(feature = "napi-rs")]
#[napi(object)]
pub struct NapiJoinGatherResult {
    /// Gathered left-side f64 columns (each is a Float64Array)
    pub left_cols: Vec<napi::bindgen_prelude::Float64Array>,
    /// Gathered right-side f64 columns (each is a Float64Array, NaN for null)
    pub right_cols: Vec<napi::bindgen_prelude::Float64Array>,
    /// Number of output rows
    pub n_rows: u32,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl JoinIdxU32 {
    /// Move out the left indices (no clone)
    #[wasm_bindgen(js_name = takeLeft)]
    pub fn take_left(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.left).into_boxed_slice()
    }

    /// Move out the right indices (no clone)  
    #[wasm_bindgen(js_name = takeRight)]
    pub fn take_right(&mut self) -> Box<[u32]> {
        std::mem::take(&mut self.right).into_boxed_slice()
    }
}
